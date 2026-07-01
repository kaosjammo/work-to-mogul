import { describe, it, expect } from 'vitest'
import { initialGameState } from '../store/initialState'
import { serialize, deserialize } from '../save/serialize'
import { prestigeReset } from './prestige'
import { automatedIncomePerSec } from './catchUp'
import type { GameState } from '../types/domain'
import {
  initialSpaceShooterState,
  spaceShooterOfferAvailable,
  computeBand,
  resolveMission,
  abortMission,
  tickSpaceShooter,
  nextStageIndex,
  campaignComplete,
  SHOOTER_PASS_COOLDOWN_MS,
  SHOOTER_FAIL_COOLDOWN_MS,
  SHOOTER_ABORT_COOLDOWN_MS,
  AI_SALVAGE_INTERVAL_MS,
  AI_SALVAGE_INCOME_SECONDS,
  type MissionMetrics,
} from './spaceShooter'

// A state that owns an automated Space business, so ownsSpace() is true and reward
// cash (scaled off idle income) is non-zero.
function spaceState(): GameState {
  const s = initialGameState(0)
  const b = s.businesses.satellite
  b.owned = 30
  b.unlocked = true
  s.employees.op = {
    id: 'op', templateId: 'mickey_gears', name: 'Op', role: 'operator',
    rarity: 'common', level: 1, affinity: null, traits: [], specialisation: null,
  }
  b.assigned = ['op']
  return s
}

function metrics(p: Partial<MissionMetrics> = {}): MissionMetrics {
  return {
    survived: true,
    enemiesDestroyed: 0,
    salvageCollected: 0,
    shieldsRemaining: 1,
    maxShields: 4,
    score: 1000,
    ...p,
  }
}

const GREAT = metrics({ survived: true, shieldsRemaining: 3, maxShields: 3, enemiesDestroyed: 8, salvageCollected: 5 })
const PASS = metrics({ survived: true, shieldsRemaining: 1, maxShields: 4, enemiesDestroyed: 1, salvageCollected: 1 })
const FAIL = metrics({ survived: false, shieldsRemaining: 0, maxShields: 3, enemiesDestroyed: 2 })

describe('Space Salvage Shooter — campaign progression', () => {
  it('starts a fresh campaign at stage 0 with nothing unlocked', () => {
    const ss = initialSpaceShooterState()
    expect(ss.stageCompleted).toBe(0)
    expect(ss.aiPilotUnlocked).toBe(false)
    expect(ss.orbitalYardUnlocked).toBe(false)
    expect(ss.bestScores).toEqual([0, 0, 0, 0, 0])
    expect(nextStageIndex(initialGameState(0))).toBe(0)
  })

  it('offer is gated on owning Space, the cooldown, and the AI-pilot takeover', () => {
    const noSpace = initialGameState(0)
    expect(spaceShooterOfferAvailable(noSpace, 0)).toBe(false) // no Space business

    const s = spaceState()
    expect(spaceShooterOfferAvailable(s, 0)).toBe(true) // owns Space, cooldown 0
    s.spaceShooter.cooldownUntil = 10_000
    expect(spaceShooterOfferAvailable(s, 5_000)).toBe(false) // still cooling down
    expect(spaceShooterOfferAvailable(s, 10_001)).toBe(true) // cooldown elapsed

    s.spaceShooter.cooldownUntil = 0
    s.spaceShooter.aiPilotUnlocked = true
    expect(spaceShooterOfferAvailable(s, 20_000)).toBe(false) // pilot took over
  })

  it('classifies outcome bands from mission metrics', () => {
    expect(computeBand(FAIL)).toBe('failed')
    expect(computeBand(GREAT)).toBe('great')
    expect(computeBand(metrics({ shieldsRemaining: 1, maxShields: 3, enemiesDestroyed: 0, salvageCollected: 0 }))).toBe('good') // 0.33 shields
    expect(computeBand(metrics({ shieldsRemaining: 1, maxShields: 4, enemiesDestroyed: 1, salvageCollected: 1 }))).toBe('pass') // low shields, low activity
  })

  it('passing the next stage advances the campaign, pays cash, and sets the pass cooldown', () => {
    const s = spaceState()
    const perSec = automatedIncomePerSec(s)
    expect(perSec).toBeGreaterThan(0)
    const r = resolveMission(s, 0, PASS, 1_000)
    expect(r.advanced).toBe(true)
    expect(s.spaceShooter.stageCompleted).toBe(1)
    expect(r.cashReward).toBeCloseTo(perSec * 45 * 1, 3) // stage 1 base 45s × pass band 1.0
    expect(s.spaceShooter.cooldownUntil).toBe(1_000 + SHOOTER_PASS_COOLDOWN_MS)
    expect(spaceShooterOfferAvailable(s, 1_000)).toBe(false) // now cooling down
  })

  it('a great run pays more than a pass (band multiplier) and records a best score', () => {
    const passS = spaceState()
    const greatS = spaceState()
    const perSec = automatedIncomePerSec(passS)
    const rp = resolveMission(passS, 0, metrics({ ...PASS, score: 500 }), 0)
    const rg = resolveMission(greatS, 0, metrics({ ...GREAT, score: 9000 }), 0)
    expect(rg.cashReward).toBeGreaterThan(rp.cashReward)
    expect(rg.cashReward).toBeCloseTo(perSec * 45 * 2.4, 2) // great band = ×2.4
    expect(greatS.spaceShooter.bestScores[0]).toBe(9000)
    expect(rg.newBest).toBe(true)
  })

  it('failing does NOT advance the stage and lets the player retry after a cooldown', () => {
    const s = spaceState()
    const cashBefore = s.cash
    const r = resolveMission(s, 0, FAIL, 2_000)
    expect(r.band).toBe('failed')
    expect(r.advanced).toBe(false)
    expect(s.spaceShooter.stageCompleted).toBe(0) // no progress
    expect(s.cash).toBe(cashBefore) // no reward, and never a penalty
    expect(s.spaceShooter.cooldownUntil).toBe(2_000 + SHOOTER_FAIL_COOLDOWN_MS)
    expect(spaceShooterOfferAvailable(s, 2_000 + SHOOTER_FAIL_COOLDOWN_MS)).toBe(true) // retry unlocks
  })

  it('walking away before launch re-arms the same stage with no progress', () => {
    const s = spaceState()
    abortMission(s, 3_000)
    expect(s.spaceShooter.stageCompleted).toBe(0)
    expect(s.spaceShooter.cooldownUntil).toBe(3_000 + SHOOTER_ABORT_COOLDOWN_MS)
  })

  it('Stage 2 grants a temporary Space profit buff', () => {
    const s = spaceState()
    s.spaceShooter.stageCompleted = 1 // next stage is index 1 (Stage 2)
    const r = resolveMission(s, 1, GREAT, 0)
    expect(r.buffMult).toBeGreaterThan(1)
    expect(s.spaceShooter.buffMsLeft).toBeGreaterThan(0)
    expect(s.spaceShooter.buffMult).toBeCloseTo(1.5 + 0.4, 5) // base 1.5 + great bonus 0.4
  })

  it('Stage 4 unlocks the Orbital Salvage Yard', () => {
    const s = spaceState()
    s.spaceShooter.stageCompleted = 3
    const r = resolveMission(s, 3, PASS, 0)
    expect(r.unlockedYard).toBe(true)
    expect(s.spaceShooter.orbitalYardUnlocked).toBe(true)
  })

  it('Stage 5 unlocks the AI Salvage Pilot and completes the campaign; no more offers', () => {
    const s = spaceState()
    s.spaceShooter.stageCompleted = 4 // next stage is index 4 (Stage 5)
    const r = resolveMission(s, 4, GREAT, 0)
    expect(r.unlockedAiPilot).toBe(true)
    expect(r.campaignComplete).toBe(true)
    expect(s.spaceShooter.aiPilotUnlocked).toBe(true)
    expect(campaignComplete(s)).toBe(true)
    expect(nextStageIndex(s)).toBe(-1)
    expect(spaceShooterOfferAvailable(s, 10 ** 15)).toBe(false) // manual stages stop
  })

  it('reward cash is always finite and non-negative', () => {
    const s = spaceState()
    const r = resolveMission(s, 0, GREAT, 0)
    expect(Number.isFinite(r.cashReward)).toBe(true)
    expect(r.cashReward).toBeGreaterThanOrEqual(0)
    expect(Number.isFinite(s.cash)).toBe(true)
  })
})

describe('Space Salvage Shooter — tick (buff countdown + AI salvage)', () => {
  it('counts the run-reward buff down and clears it when it expires', () => {
    const s = spaceState()
    s.spaceShooter.buffMult = 1.5
    s.spaceShooter.buffMsLeft = 1000
    tickSpaceShooter(s, 600)
    expect(s.spaceShooter.buffMsLeft).toBe(400)
    tickSpaceShooter(s, 600)
    expect(s.spaceShooter.buffMsLeft).toBe(0)
    expect(s.spaceShooter.buffMult).toBe(1) // reset on expiry
  })

  it('the AI Salvage Pilot drips automatic cash on its interval once unlocked', () => {
    const s = spaceState()
    s.spaceShooter.aiPilotUnlocked = true
    s.spaceShooter.aiSalvageCooldownMs = 1000
    const perSec = automatedIncomePerSec(s)
    const cashBefore = s.cash
    tickSpaceShooter(s, 1000)
    expect(s.cash - cashBefore).toBeCloseTo(perSec * AI_SALVAGE_INCOME_SECONDS, 2)
    expect(s.spaceShooter.aiSalvageCooldownMs).toBe(AI_SALVAGE_INTERVAL_MS) // rearmed
  })

  it('the AI pilot does nothing until it is unlocked (harness-safe)', () => {
    const s = spaceState()
    s.spaceShooter.aiSalvageCooldownMs = 10
    const cashBefore = s.cash
    tickSpaceShooter(s, 5000)
    expect(s.cash).toBe(cashBefore)
  })
})

describe('Space Salvage Shooter — persistence', () => {
  it('round-trips campaign progress through serialize/deserialize', () => {
    const s = spaceState()
    s.spaceShooter.stageCompleted = 3
    s.spaceShooter.aiPilotUnlocked = false
    s.spaceShooter.orbitalYardUnlocked = true
    s.spaceShooter.cooldownUntil = 5_000
    s.spaceShooter.bestScores = [10, 20, 30, 0, 0]
    s.spaceShooter.missionsPlayed = 7
    const loaded = deserialize(serialize(s, 1234), 6_000)!
    expect(loaded.spaceShooter.stageCompleted).toBe(3)
    expect(loaded.spaceShooter.orbitalYardUnlocked).toBe(true)
    expect(loaded.spaceShooter.cooldownUntil).toBe(5_000)
    expect(loaded.spaceShooter.bestScores).toEqual([10, 20, 30, 0, 0])
    expect(loaded.spaceShooter.missionsPlayed).toBe(7)
  })

  it('does NOT persist the transient buff (fresh on load, like other buffs)', () => {
    const s = spaceState()
    s.spaceShooter.buffMult = 1.8
    s.spaceShooter.buffMsLeft = 40_000
    const loaded = deserialize(serialize(s, 1), 2)!
    expect(loaded.spaceShooter.buffMsLeft).toBe(0)
    expect(loaded.spaceShooter.buffMult).toBe(1)
  })

  it('an old save with no spaceShooter field loads clean defaults', () => {
    const env = { version: 2, savedAt: 1, state: { cash: 5, lifetimeEarnings: 5 } }
    const loaded = deserialize(JSON.stringify(env), 0)!
    expect(loaded.spaceShooter.stageCompleted).toBe(0)
    expect(loaded.spaceShooter.aiPilotUnlocked).toBe(false)
    expect(loaded.spaceShooter.bestScores).toEqual([0, 0, 0, 0, 0])
  })

  it('clamps a corrupt cooldownUntil so the offer can never be locked forever', () => {
    const s = spaceState()
    s.spaceShooter.cooldownUntil = Number.MAX_SAFE_INTEGER
    const now = 1_000_000
    const loaded = deserialize(serialize(s, 1), now)!
    expect(loaded.spaceShooter.cooldownUntil).toBeLessThanOrEqual(now + 24 * 60 * 60 * 1000)
  })

  it('campaign meta-progression survives an ascension (prestige)', () => {
    const s = spaceState()
    s.lifetimeEarnings = 1e16 // enough to earn prestige tokens
    s.spaceShooter.stageCompleted = 5
    s.spaceShooter.aiPilotUnlocked = true
    s.spaceShooter.orbitalYardUnlocked = true
    s.spaceShooter.bestScores = [1, 2, 3, 4, 5]
    s.spaceShooter.buffMsLeft = 30_000 // transient — should reset
    const ok = prestigeReset(s)
    expect(ok).toBe(true)
    expect(s.spaceShooter.stageCompleted).toBe(5) // survived ascension
    expect(s.spaceShooter.aiPilotUnlocked).toBe(true)
    expect(s.spaceShooter.orbitalYardUnlocked).toBe(true)
    expect(s.spaceShooter.bestScores).toEqual([1, 2, 3, 4, 5])
    expect(s.spaceShooter.buffMsLeft).toBe(0) // transient buff wiped with the run
  })
})
