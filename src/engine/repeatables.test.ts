import { describe, it, expect } from 'vitest'
import { initialGameState } from '../store/initialState'
import { buyRepeatable, repeatableCost, repeatableRank, repeatableMultipliers } from './upgrades'
import { REPEATABLE_UPGRADES, REPEATABLE_ORDER } from '../content/upgrades'
import { resolveBusiness } from './resolveBusiness'
import { BUSINESSES } from '../content/businesses'
import { prestigeReset } from './prestige'
import { PRESTIGE_SCALE } from './economy'
import { serialize, deserialize } from '../save/serialize'

describe('Executive Programs (repeatable upgrades)', () => {
  it('every program is wired: non-identity effect, positive cost, growth > 1', () => {
    expect(REPEATABLE_ORDER.length).toBeGreaterThan(0)
    for (const id of REPEATABLE_ORDER) {
      const def = REPEATABLE_UPGRADES[id]
      expect(def, `${id} missing from REPEATABLE_UPGRADES`).toBeDefined()
      expect(def.effect.factorPerRank).toBeGreaterThan(1)
      expect(def.baseCost).toBeGreaterThan(0)
      expect(def.costGrowth).toBeGreaterThan(1) // each rank must cost more (a real sink)
    }
  })

  it('buys a rank, charges the geometric cost, and refuses when broke', () => {
    const s = initialGameState(0)
    const def = REPEATABLE_UPGRADES.exec_training
    expect(buyRepeatable(s, 'exec_training')).toBe(false) // broke
    s.cash = def.baseCost * (1 + def.costGrowth) // exactly ranks 1+2
    expect(buyRepeatable(s, 'exec_training')).toBe(true)
    expect(repeatableRank(s, 'exec_training')).toBe(1)
    expect(repeatableCost(s, 'exec_training')).toBe(def.baseCost * def.costGrowth)
    expect(buyRepeatable(s, 'exec_training')).toBe(true)
    expect(s.cash).toBeCloseTo(0, 6)
    expect(buyRepeatable(s, 'exec_training')).toBe(false) // broke again
    expect(repeatableRank(s, 'exec_training')).toBe(2)
    expect(buyRepeatable(s, 'bogus_program')).toBe(false) // unknown id
  })

  it('ranks fold into the economy as global profit/speed multipliers', () => {
    const s = initialGameState(0)
    s.businesses.lemonade.owned = 10
    s.businesses.lemonade.unlocked = true
    const before = resolveBusiness(s, BUSINESSES.lemonade)
    s.repeatableRanks = { exec_training: 3, ops_playbook: 2 }
    const after = resolveBusiness(s, BUSINESSES.lemonade)
    expect(after.revenuePerCycle / before.revenuePerCycle).toBeCloseTo(Math.pow(1.02, 3), 6)
    expect(before.cycleMs / after.cycleMs).toBeCloseTo(Math.pow(1.01, 2), 6)
    const m = repeatableMultipliers(s)
    expect(m.profit).toBeCloseTo(Math.pow(1.02, 3), 6)
    expect(m.speed).toBeCloseTo(Math.pow(1.01, 2), 6)
  })

  it('ranks survive a save round-trip (unknown ids and junk ranks dropped)', () => {
    const s = initialGameState(0)
    s.repeatableRanks = { exec_training: 4, brand_equity: 1 }
    const r = deserialize(serialize(s, 100))!
    expect(r.repeatableRanks).toEqual({ exec_training: 4, brand_equity: 1 })
    const junk = deserialize(
      JSON.stringify({
        version: 2,
        savedAt: 0,
        state: { cash: 0, repeatableRanks: { exec_training: -3, ghost: 5, ops_playbook: NaN } },
      }),
    )!
    expect(junk.repeatableRanks).toEqual({})
  })

  it('ranks are RUN state — wiped by an ascension like one-shot upgrades', () => {
    const s = initialGameState(0)
    s.repeatableRanks = { exec_training: 5 }
    s.lifetimeEarnings = PRESTIGE_SCALE * 1e6
    expect(prestigeReset(s)).toBe(true)
    expect(repeatableRank(s, 'exec_training')).toBe(0)
  })
})
