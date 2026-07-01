import { describe, it, expect } from 'vitest'
import { serialize, deserialize, tolerantLoad } from './serialize'
import { initialGameState } from '../store/initialState'

describe('save round-trip', () => {
  it('preserves career and business state across serialize/deserialize', () => {
    const s = initialGameState(0)
    s.cash = 1234
    s.lifetimeEarnings = 9999
    s.career = { level: 2, shiftProgressMs: 0, shiftsThisLevel: 5, totalShifts: 40, consultingMs: 0 }
    s.businesses.lemonade.owned = 30
    s.businesses.lemonade.unlocked = true

    const restored = deserialize(serialize(s, 100))
    expect(restored).not.toBeNull()
    expect(restored!.cash).toBe(1234)
    expect(restored!.lifetimeEarnings).toBe(9999)
    expect(restored!.career.level).toBe(2)
    expect(restored!.career.shiftsThisLevel).toBe(5)
    expect(restored!.career.totalShifts).toBe(40)
    expect(restored!.businesses.lemonade.owned).toBe(30)
  })
})

describe('tolerant load', () => {
  it('fills missing fields (e.g. a save with no career)', () => {
    const loaded = tolerantLoad({ cash: 500 } as never)
    expect(loaded.cash).toBe(500)
    expect(loaded.career.level).toBe(0) // defaulted
    expect(loaded.businesses.lemonade.owned).toBe(0)
  })

  it('defaults visitedTabs to all tabs on an old save (no false "new" pulse for veterans)', () => {
    const loaded = tolerantLoad({ cash: 0 } as never) // pre-feature save, no field
    expect(loaded.visitedTabs).toEqual(['business', 'employees', 'upgrades', 'prestige', 'stats'])
  })

  it('round-trips visitedTabs and drops unknown tab ids', () => {
    const loaded = tolerantLoad({ cash: 0, visitedTabs: ['business', 'employees', 'bogus'] } as never)
    expect(loaded.visitedTabs).toEqual(['business', 'employees'])
  })

  it('normalizes old saves: every industry ends up unlocked', () => {
    const loaded = tolerantLoad({
      cash: 0,
      industries: { retail: { unlocked: false }, tech: { unlocked: false } },
    } as never)
    expect(loaded.industries.retail.unlocked).toBe(true)
    expect(loaded.industries.tech.unlocked).toBe(true)
  })

  it('drops references to businesses that no longer exist', () => {
    const loaded = tolerantLoad({
      cash: 0,
      businesses: { ghost_business: { owned: 5, unlocked: true, cycleProgressMs: 0, assigned: [], morale: 60, risk: 0 } },
    } as never)
    expect((loaded.businesses as Record<string, unknown>).ghost_business).toBeUndefined()
  })

  it('adds businesses/industries introduced after the save was written', () => {
    // An "old" save that only knew about Lemonade: newer content (Quantum
    // Frontier, Dyson Sphere, …) must appear with defaults, not be missing.
    const loaded = tolerantLoad({
      cash: 0,
      businesses: {
        lemonade: { owned: 12, unlocked: true, cycleProgressMs: 0, assigned: [null], morale: 60, risk: 0, riskEventMsLeft: 0 },
      },
    } as never)
    expect(loaded.businesses.lemonade.owned).toBe(12) // preserved
    for (const id of ['dyson', 'quantum_computer', 'multiverse']) {
      expect(loaded.businesses[id], `${id} should be added`).toBeDefined()
      expect(loaded.businesses[id].owned).toBe(0)
    }
    expect(loaded.industries.quantum?.unlocked).toBe(true)
  })

  it('sanitizes invalid numbers', () => {
    const loaded = tolerantLoad({ cash: Infinity, lifetimeEarnings: NaN } as never)
    expect(Number.isFinite(loaded.cash)).toBe(true)
    expect(Number.isFinite(loaded.lifetimeEarnings)).toBe(true)
  })

  it('returns null on garbage input', () => {
    expect(deserialize('not json')).toBeNull()
    expect(deserialize('{"version":1}')).toBeNull() // no state
  })

  it('back-grants achievement token rewards when upgrading a v1 save (once)', () => {
    // A v1 save predates achievement token rewards: the migration banks the
    // rewards for what was already unlocked so the player isn't shortchanged.
    const env = JSON.stringify({
      version: 1,
      savedAt: 0,
      state: {
        cash: 0,
        achievementsUnlocked: ['first_shift', 'first_business'], // 1 + 1 = +2
        prestige: { totalPoints: 2, spentPoints: 0, talents: {}, multiplier: 1, resets: 0 },
      },
    })
    const loaded = deserialize(env, 0)!
    expect(loaded.prestige.totalPoints).toBe(4) // 2 saved + 2 back-granted

    // Re-saving (now v2) and reloading does NOT grant again.
    const again = deserialize(serialize(loaded, 0), 0)!
    expect(again.prestige.totalPoints).toBe(4)
  })
})

describe('full-state round-trip', () => {
  it('preserves employees, achievements, prestige, milestones, and risk', () => {
    const s = initialGameState(0)
    s.cash = 5000
    s.businesses.lemonade.owned = 30
    s.businesses.lemonade.unlocked = true
    s.businesses.apartments.owned = 2
    s.businesses.apartments.unlocked = true
    s.businesses.apartments.risk = 73
    s.businesses.apartments.riskEventMsLeft = 12000
    s.employees.e1 = {
      id: 'e1', templateId: 'flash_ortega', name: 'Flash Ortega', role: 'runner',
      rarity: 'rare', level: 6, affinity: 'food', traits: ['workaholic'], specialisation: null,
    }
    s.businesses.lemonade.assigned = ['e1']
    s.achievementsUnlocked = ['first_business', 'millionaire']
    s.milestonesReached = ['lemonade_25']
    s.prestige = { totalPoints: 8, spentPoints: 4, talents: { magnate: 2, efficiency: 1 }, multiplier: 1, resets: 2 }
    s.financeCompoundMs = 1_800_000 // 30 min of Finance compound accrued

    const r = deserialize(serialize(s, 100))!
    expect(r.financeCompoundMs).toBe(1_800_000) // the compound buildup survives a refresh
    expect(r.businesses.lemonade.owned).toBe(30)
    expect(r.businesses.apartments.risk).toBe(73)
    expect(r.businesses.apartments.riskEventMsLeft).toBe(12000)
    expect(r.employees.e1).toMatchObject({ role: 'runner', rarity: 'rare', level: 6, affinity: 'food', traits: ['workaholic'] })
    expect(r.businesses.lemonade.assigned).toContain('e1')
    expect(r.achievementsUnlocked).toEqual(['first_business', 'millionaire'])
    expect(r.milestonesReached).toEqual(['lemonade_25'])
    expect(r.prestige.totalPoints).toBe(8)
    expect(r.prestige.resets).toBe(2)
    expect(r.prestige.talents).toEqual({ magnate: 2, efficiency: 1 })
    expect(r.prestige.spentPoints).toBe(4) // recomputed: magnate(1+2)+efficiency(1) = 4
  })

  it('sanitizes the talent tree on load (drops unknown ids, clamps ranks)', () => {
    const loaded = tolerantLoad({
      cash: 0,
      prestige: { totalPoints: 99, talents: { magnate: 99, bogus_talent: 3, efficiency: -2 } },
    } as never)
    expect(loaded.prestige.talents.magnate).toBe(5) // clamped to maxRank
    expect((loaded.prestige.talents as Record<string, number>).bogus_talent).toBeUndefined()
    expect((loaded.prestige.talents as Record<string, number>).efficiency).toBeUndefined() // rank <= 0 dropped
  })
})

describe('employee validation on load', () => {
  it('drops employees with an unknown role and clamps/filters the rest', () => {
    const loaded = tolerantLoad({
      cash: 0,
      employees: {
        good: { id: 'good', templateId: 't', name: 'G', role: 'closer', rarity: 'epic', level: 99, affinity: 'food', traits: ['frugal', 'bogus'], specialisation: null },
        bad: { id: 'bad', templateId: 't', name: 'B', role: 'wizard', rarity: 'common', level: 1, affinity: null, traits: [], specialisation: null },
        weird: { id: 'weird', templateId: 't', name: 'W', role: 'buyer', rarity: 'mythic', level: -3, affinity: 'atlantis', traits: 'nope', specialisation: null },
      },
    } as never)
    expect(loaded.employees.bad).toBeUndefined() // unknown role dropped
    expect(loaded.employees.good.level).toBe(10) // clamped to MAX
    expect(loaded.employees.good.traits).toEqual(['frugal']) // bogus trait filtered
    expect(loaded.employees.weird.rarity).toBe('common') // invalid rarity → common
    expect(loaded.employees.weird.level).toBe(1) // clamped up
    expect(loaded.employees.weird.affinity).toBeNull() // invalid industry → null
    expect(Array.isArray(loaded.employees.weird.traits)).toBe(true)
  })
})
