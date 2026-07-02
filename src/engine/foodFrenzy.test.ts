import { describe, it, expect } from 'vitest'
import { initialGameState } from '../store/initialState'
import { serialize, deserialize } from '../save/serialize'
import { prestigeReset } from './prestige'
import { automatedIncomePerSec } from './catchUp'
import { foodFrenzyProfitMult, GOLDEN_SPATULA_FOOD_PROFIT, economyMultipliers } from './economy'
import { BUSINESSES } from '../content/businesses'
import type { GameState } from '../types/domain'
import { FOOD_FRENZY_TIERS, FOOD_FRENZY_TOTAL_TIERS } from '../content/foodFrenzy'
import {
  initialFoodFrenzyState,
  foodFrenzyOfferAvailable,
  nextFrenzyTier,
  computeFrenzyBand,
  resolveFrenzyRun,
  abortFrenzy,
  snoozeFrenzy,
  tickFoodFrenzy,
  FRENZY_CLEAR_COOLDOWN_MS,
  FRENZY_FAIL_COOLDOWN_MS,
  FRENZY_ABORT_COOLDOWN_MS,
  FRENZY_SNOOZE_MS,
  type FrenzyMetrics,
} from './foodFrenzy'

// A state that owns the Food Truck (the whole game is about it).
function truckState(): GameState {
  const s = initialGameState(0)
  s.businesses.food_truck.owned = 1
  s.businesses.food_truck.unlocked = true
  return s
}

function metrics(p: Partial<FrenzyMetrics> = {}): FrenzyMetrics {
  return {
    survived: true,
    fansFed: 10,
    tipsCollected: 10,
    composureRemaining: 2,
    maxComposure: 5,
    level: 3,
    score: 1000,
    ...p,
  }
}

const T0 = FOOD_FRENZY_TIERS[0]
const GREAT = metrics({ fansFed: T0.greatFans, composureRemaining: 4 }) // 0.8 composure
const GOOD = metrics({ fansFed: T0.goodFans, composureRemaining: 1 })
const PASS = metrics({ fansFed: 3, composureRemaining: 1 }) // low fed, low composure
const FAIL = metrics({ survived: false, composureRemaining: 0 })

describe('Lunch Rush — offer gating + the opportunity rotation', () => {
  it('needs the Food Truck, and the cooldown to have elapsed', () => {
    const noTruck = initialGameState(0)
    expect(foodFrenzyOfferAvailable(noTruck, 0)).toBe(false)

    const s = truckState()
    expect(foodFrenzyOfferAvailable(s, 0)).toBe(true)
    s.foodFrenzy.cooldownUntil = 10_000
    expect(foodFrenzyOfferAvailable(s, 5_000)).toBe(false)
    expect(foodFrenzyOfferAvailable(s, 10_001)).toBe(true)
  })

  it('yields to a pending/active Mogul Story (priority: story > rush)', () => {
    const s = truckState()
    s.angelDeal.offered = true
    expect(foodFrenzyOfferAvailable(s, 1)).toBe(false)
    s.angelDeal.offered = false
    s.angelDeal.active = true
    expect(foodFrenzyOfferAvailable(s, 1)).toBe(false)
    s.angelDeal.active = false
    expect(foodFrenzyOfferAvailable(s, 1)).toBe(true)
  })

  it('yields to an available Salvage Signal (priority: salvage > rush)', () => {
    const s = truckState()
    // Give the player Space so the salvage signal can be available.
    s.businesses.satellite.owned = 1
    s.businesses.satellite.unlocked = true
    s.spaceShooter.cooldownUntil = 0 // salvage due now
    expect(foodFrenzyOfferAvailable(s, 1)).toBe(false) // salvage holds the slot
    s.spaceShooter.cooldownUntil = 999_999 // salvage cooling down
    expect(foodFrenzyOfferAvailable(s, 1)).toBe(true) // rush takes the slot
  })

  it('"Not now" snoozes long and never shortens an existing cooldown', () => {
    const s = truckState()
    snoozeFrenzy(s, 50_000)
    expect(s.foodFrenzy.cooldownUntil).toBe(50_000 + FRENZY_SNOOZE_MS)
    s.foodFrenzy.cooldownUntil = 50_000 + FRENZY_SNOOZE_MS * 2
    snoozeFrenzy(s, 50_000)
    expect(s.foodFrenzy.cooldownUntil).toBe(50_000 + FRENZY_SNOOZE_MS * 2)
    expect(FRENZY_SNOOZE_MS).toBeGreaterThanOrEqual(30 * 60_000)
    expect(FRENZY_ABORT_COOLDOWN_MS).toBeGreaterThanOrEqual(10 * 60_000)
  })
})

describe('Lunch Rush — bands + resolution', () => {
  it('classifies outcome bands from run metrics', () => {
    expect(computeFrenzyBand(T0, FAIL)).toBe('failed')
    expect(computeFrenzyBand(T0, GREAT)).toBe('great')
    expect(computeFrenzyBand(T0, GOOD)).toBe('good')
    expect(computeFrenzyBand(T0, PASS)).toBe('pass')
  })

  it('clearing the current tier advances, pays cash (with a floor), and buffs Food', () => {
    const s = truckState() // no automation → income 0 → the FLOOR pays
    expect(automatedIncomePerSec(s)).toBe(0)
    const r = resolveFrenzyRun(s, 0, PASS, 1_000)
    expect(r.cleared).toBe(true)
    expect(s.foodFrenzy.tiersCleared).toBe(1)
    expect(r.cashReward).toBeCloseTo(T0.cashFloor * 1, 3) // floor × pass band
    expect(s.cash).toBeCloseTo(T0.cashFloor)
    expect(s.foodFrenzy.buffMult).toBeCloseTo(T0.buffMult)
    expect(s.foodFrenzy.buffMsLeft).toBe(T0.buffMs)
    expect(s.foodFrenzy.cooldownUntil).toBe(1_000 + FRENZY_CLEAR_COOLDOWN_MS)
    expect(nextFrenzyTier(s).index).toBe(1)
  })

  it('a great run pays more and records a best score', () => {
    const a = truckState()
    const b = truckState()
    const rp = resolveFrenzyRun(a, 0, { ...PASS, score: 500 }, 0)
    const rg = resolveFrenzyRun(b, 0, { ...GREAT, score: 9000 }, 0)
    expect(rg.cashReward).toBeGreaterThan(rp.cashReward)
    expect(b.foodFrenzy.bestScores[0]).toBe(9000)
    expect(rg.newBest).toBe(true)
    expect(rg.buffMult).toBeGreaterThan(rp.buffMult) // great band buffs harder
  })

  it('failing pays nothing, never advances, and re-arms quickly', () => {
    const s = truckState()
    const r = resolveFrenzyRun(s, 0, FAIL, 2_000)
    expect(r.band).toBe('failed')
    expect(r.cashReward).toBe(0)
    expect(s.cash).toBe(0)
    expect(s.foodFrenzy.tiersCleared).toBe(0)
    expect(s.foodFrenzy.cooldownUntil).toBe(2_000 + FRENZY_FAIL_COOLDOWN_MS)
  })

  it('clearing Festival Night unlocks the Golden Spatula exactly once', () => {
    const s = truckState()
    s.foodFrenzy.tiersCleared = 2
    const r = resolveFrenzyRun(s, 2, GREAT, 0)
    expect(r.cleared).toBe(true)
    expect(r.unlockedSpatula).toBe(true)
    expect(r.allTiersCleared).toBe(true)
    expect(s.foodFrenzy.goldenSpatula).toBe(true)
    // A replay still pays run rewards but never re-unlocks or re-advances.
    const r2 = resolveFrenzyRun(s, 2, GREAT, 10)
    expect(r2.cleared).toBe(false)
    expect(r2.unlockedSpatula).toBe(false)
    expect(s.foodFrenzy.tiersCleared).toBe(FOOD_FRENZY_TOTAL_TIERS)
  })

  it('a stale/replayed submit of an already-cleared tier never re-advances', () => {
    const s = truckState()
    resolveFrenzyRun(s, 0, PASS, 0)
    const r = resolveFrenzyRun(s, 0, GREAT, 1)
    expect(r.cleared).toBe(false)
    expect(s.foodFrenzy.tiersCleared).toBe(1)
  })

  it('walking away re-arms the same tier with no progress', () => {
    const s = truckState()
    abortFrenzy(s, 3_000)
    expect(s.foodFrenzy.tiersCleared).toBe(0)
    expect(s.foodFrenzy.cooldownUntil).toBe(3_000 + FRENZY_ABORT_COOLDOWN_MS)
  })
})

describe('Lunch Rush — economy fold + buff lifecycle (harness-inert)', () => {
  it('the Food fold is ×1 until the player earns anything', () => {
    const s = truckState()
    expect(foodFrenzyProfitMult(s)).toBe(1)
    const food = BUSINESSES.lemonade
    const before = economyMultipliers(s, food).profit
    resolveFrenzyRun(s, 0, PASS, 0)
    expect(foodFrenzyProfitMult(s)).toBeCloseTo(T0.buffMult)
    expect(economyMultipliers(s, food).profit).toBeCloseTo(before * T0.buffMult)
    // …and only Food: a Tech business is untouched.
    const tech = BUSINESSES.mobile_app
    const t = truckState()
    const techBefore = economyMultipliers(t, tech).profit
    resolveFrenzyRun(t, 0, PASS, 0)
    expect(economyMultipliers(t, tech).profit).toBeCloseTo(techBefore)
  })

  it('the buff decays on the tick; the Spatula is permanent and folds in steady', () => {
    const s = truckState()
    resolveFrenzyRun(s, 0, PASS, 0)
    tickFoodFrenzy(s, T0.buffMs + 1)
    expect(s.foodFrenzy.buffMsLeft).toBe(0)
    expect(foodFrenzyProfitMult(s)).toBe(1)
    s.foodFrenzy.goldenSpatula = true
    expect(foodFrenzyProfitMult(s)).toBeCloseTo(GOLDEN_SPATULA_FOOD_PROFIT)
    expect(foodFrenzyProfitMult(s, true)).toBeCloseTo(GOLDEN_SPATULA_FOOD_PROFIT) // steady keeps perks
  })

  it('fresh state starts with nothing (bot-inert baseline)', () => {
    expect(initialFoodFrenzyState()).toEqual({
      tiersCleared: 0,
      cooldownUntil: 0,
      goldenSpatula: false,
      bestScores: [0, 0, 0],
      runsPlayed: 0,
      buffMult: 1,
      buffMsLeft: 0,
    })
  })
})

describe('Lunch Rush — save + prestige', () => {
  it('campaign progress round-trips; the transient buff resets; corrupt combos repair', () => {
    const s = truckState()
    s.foodFrenzy = {
      tiersCleared: 2,
      cooldownUntil: 123,
      goldenSpatula: false,
      bestScores: [500, 900, 0],
      runsPlayed: 7,
      buffMult: 1.6,
      buffMsLeft: 30_000,
    }
    const back = deserialize(serialize(s, 1))!
    expect(back.foodFrenzy.tiersCleared).toBe(2)
    expect(back.foodFrenzy.bestScores).toEqual([500, 900, 0])
    expect(back.foodFrenzy.runsPlayed).toBe(7)
    expect(back.foodFrenzy.buffMsLeft).toBe(0) // transient — never persists
    expect(back.foodFrenzy.buffMult).toBe(1)

    // The Spatula is exactly "campaign complete" — both directions repair.
    const raw = JSON.parse(serialize(s, 1))
    raw.state.foodFrenzy = { tiersCleared: 1, goldenSpatula: true, bestScores: [], runsPlayed: 0, cooldownUntil: 0 }
    const fixed = deserialize(JSON.stringify(raw))!
    expect(fixed.foodFrenzy.goldenSpatula).toBe(false)
    raw.state.foodFrenzy = { tiersCleared: 3, goldenSpatula: false, bestScores: [], runsPlayed: 0, cooldownUntil: 0 }
    const fixed2 = deserialize(JSON.stringify(raw))!
    expect(fixed2.foodFrenzy.goldenSpatula).toBe(true)
  })

  it('the campaign (and Spatula) persists through prestige; the buff resets', () => {
    const s = truckState()
    s.lifetimeEarnings = 1e15
    s.foodFrenzy.tiersCleared = 3
    s.foodFrenzy.goldenSpatula = true
    s.foodFrenzy.bestScores = [1, 2, 3]
    s.foodFrenzy.buffMult = 1.7
    s.foodFrenzy.buffMsLeft = 10_000
    expect(prestigeReset(s)).toBe(true)
    expect(s.foodFrenzy.tiersCleared).toBe(3)
    expect(s.foodFrenzy.goldenSpatula).toBe(true)
    expect(s.foodFrenzy.bestScores).toEqual([1, 2, 3])
    expect(s.foodFrenzy.buffMsLeft).toBe(0) // transient reset with the fresh run
  })
})
