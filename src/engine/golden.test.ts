import { describe, it, expect } from 'vitest'
import type { GameState } from '../types/domain'
import { initialGameState } from '../store/initialState'
import {
  tickGolden,
  claimGoldenDeal,
  timeWarpValue,
  goldenOfferValue,
  profitFrenzyActive,
  GOLDEN_SPAWN_INTERVAL_MS,
  GOLDEN_OFFER_WINDOW_MS,
  GOLDEN_WARP_SECONDS,
  GOLDEN_MEGA_EVERY,
  GOLDEN_MEGA_MULT,
  GOLDEN_FRENZY_MS,
} from './golden'
import { automatedIncomePerSec } from './catchUp'
import { economyMultipliers, PROFIT_FRENZY_MULT } from './economy'
import { BUSINESSES } from '../content/businesses'

function automate(s: GameState): void {
  s.businesses.lemonade.owned = 20
  s.businesses.lemonade.unlocked = true
  s.employees.op = {
    id: 'op', templateId: 'mickey_gears', name: 'Op', role: 'operator',
    rarity: 'common', level: 1, affinity: null, traits: [], specialisation: null,
  }
  s.businesses.lemonade.assigned = ['op']
}

describe('golden deals', () => {
  it('does not spawn before there is idle income', () => {
    const s = initialGameState(0)
    tickGolden(s, GOLDEN_SPAWN_INTERVAL_MS + 1000)
    expect(s.golden.offerMsLeft).toBe(0)
  })

  it('spawns after the cooldown once income flows, then expires unclaimed', () => {
    const s = initialGameState(0)
    automate(s)
    expect(automatedIncomePerSec(s)).toBeGreaterThan(0)
    tickGolden(s, GOLDEN_SPAWN_INTERVAL_MS) // cooldown elapses → spawn
    expect(s.golden.offerMsLeft).toBe(GOLDEN_OFFER_WINDOW_MS)
    tickGolden(s, GOLDEN_OFFER_WINDOW_MS + 100) // window passes
    expect(s.golden.offerMsLeft).toBe(0)
  })

  it('claiming grants a time-warp of idle income and resets the cooldown', () => {
    const s = initialGameState(0)
    automate(s)
    tickGolden(s, GOLDEN_SPAWN_INTERVAL_MS)
    const expected = timeWarpValue(s)
    expect(expected).toBeCloseTo(automatedIncomePerSec(s) * GOLDEN_WARP_SECONDS, 0)
    const before = s.cash
    const earned = claimGoldenDeal(s)
    expect(earned).toBeCloseTo(expected, 0)
    expect(s.cash).toBeCloseTo(before + earned, 0)
    expect(s.golden.offerMsLeft).toBe(0)
    expect(s.golden.cooldownMs).toBe(GOLDEN_SPAWN_INTERVAL_MS)
  })

  it('claiming with no active deal earns nothing', () => {
    const s = initialGameState(0)
    automate(s)
    expect(claimGoldenDeal(s)).toBe(0)
  })

  it('claiming starts a Profit Rush that doubles profit, then expires', () => {
    const s = initialGameState(0)
    automate(s)
    const baseProfit = economyMultipliers(s, BUSINESSES.lemonade).profit
    tickGolden(s, GOLDEN_SPAWN_INTERVAL_MS) // spawn
    claimGoldenDeal(s) // bank + start the rush
    expect(profitFrenzyActive(s)).toBe(true)
    expect(s.golden.frenzyMsLeft).toBe(GOLDEN_FRENZY_MS)
    expect(economyMultipliers(s, BUSINESSES.lemonade).profit).toBeCloseTo(baseProfit * PROFIT_FRENZY_MULT)

    // It counts down independently and ends, restoring normal profit.
    tickGolden(s, GOLDEN_FRENZY_MS)
    expect(profitFrenzyActive(s)).toBe(false)
    expect(economyMultipliers(s, BUSINESSES.lemonade).profit).toBeCloseTo(baseProfit)
  })

  it('makes every Nth deal a MEGA jackpot worth more', () => {
    const s = initialGameState(0)
    automate(s)
    const base = timeWarpValue(s)
    let megaSeen = false
    let megaValue = 0
    // Spawn + claim repeatedly; the GOLDEN_MEGA_EVERY-th spawn must be a MEGA.
    for (let i = 1; i <= GOLDEN_MEGA_EVERY; i++) {
      tickGolden(s, GOLDEN_SPAWN_INTERVAL_MS) // cooldown elapses → spawn
      const isNth = i % GOLDEN_MEGA_EVERY === 0
      expect(s.golden.offerMega).toBe(isNth)
      if (s.golden.offerMega) {
        megaSeen = true
        megaValue = goldenOfferValue(s)
      }
      claimGoldenDeal(s) // resets the cooldown for the next spawn
    }
    expect(megaSeen).toBe(true)
    expect(megaValue).toBeCloseTo(base * GOLDEN_MEGA_MULT, 0)
  })
})
