import { describe, it, expect } from 'vitest'
import { serialize, deserialize, tolerantLoad } from './serialize'
import { initialGameState } from '../store/initialState'
import { CONTRACTS, CONTRACT_BOARD_SIZE } from '../content/contracts'
import { SUPERPOSITION_CYCLE_MS } from '../engine/economy'
import type { GameState } from '../types/domain'

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

// ============================================================
//  Persistence POLICY — the trip-wire for the whole "field exists but never
//  restores" bug class (quantumPhaseMs, exhausted contracts, …). Every top-level
//  GameState field must be declared either PERSISTED (survives a reload) or
//  TRANSIENT (deliberately resets). Adding a new field without declaring its
//  policy fails this test loudly instead of silently resetting in production.
// ============================================================
describe('persistence policy', () => {
  const PERSISTED: ReadonlySet<keyof GameState> = new Set<keyof GameState>([
    'cash', 'lifetimeEarnings', 'lastWallClock', 'career', 'angelDeal', 'romance', 'automation',
    'financeCompoundMs', 'quantumPhaseMs', 'buyMode', 'activeTab', 'visitedTabs',
    'dailyClaimDay', 'dailyStreak', 'activeIndustryTab', 'industries', 'businesses',
    'employees', 'purchasedUnlocks', 'upgradesPurchased', 'repeatableRanks', 'milestonesReached',
    'achievementsUnlocked', 'prestigeMilestonesClaimed', 'contracts', 'spaceShooter',
    'foodFrenzy', 'prestige', 'onboardingStep', 'nextEmployeeSeq',
  ])
  const TRANSIENT: ReadonlySet<keyof GameState> = new Set<keyof GameState>([
    'golden', 'rushHour', 'logistics', 'eventCards', 'momentum', 'hirePool',
  ])

  it('every GameState field has a declared persistence policy', () => {
    for (const k of Object.keys(initialGameState(0)) as (keyof GameState)[]) {
      expect(
        PERSISTED.has(k) || TRANSIENT.has(k),
        `GameState.${k} has no persistence policy — decide whether it must survive a ` +
          `reload (add to PERSISTED + restore it in tolerantLoad) or reset (add to TRANSIENT)`,
      ).toBe(true)
    }
  })

  it('persisted scalar fields actually survive a round-trip', () => {
    const s = initialGameState(0)
    s.cash = 111
    s.lifetimeEarnings = 222
    s.financeCompoundMs = 333
    s.quantumPhaseMs = 44_400 // outside the collapse window — must NOT reset to 0 (= inside it)
    s.dailyClaimDay = 20_620
    s.dailyStreak = 6
    s.onboardingStep = 3
    s.nextEmployeeSeq = 42
    const r = deserialize(serialize(s, 100))!
    expect(r.cash).toBe(111)
    expect(r.lifetimeEarnings).toBe(222)
    expect(r.financeCompoundMs).toBe(333)
    expect(r.quantumPhaseMs).toBe(44_400)
    expect(r.dailyClaimDay).toBe(20_620)
    expect(r.dailyStreak).toBe(6)
    expect(r.onboardingStep).toBe(3)
    expect(r.nextEmployeeSeq).toBe(42)
  })

  it('quantum phase is clamped to the cycle on load', () => {
    const loaded = tolerantLoad({ quantumPhaseMs: SUPERPOSITION_CYCLE_MS * 5 } as never)
    expect(loaded.quantumPhaseMs).toBeLessThanOrEqual(SUPERPOSITION_CYCLE_MS)
  })

  it('transient buff systems reset to fresh state on load', () => {
    const s = initialGameState(0)
    s.golden.frenzyMsLeft = 999
    s.rushHour.surgeMsLeft = 999
    s.logistics.surgeMult = 2
    s.eventCards.profitMult = 9
    s.eventCards.profitMsLeft = 999
    const r = deserialize(serialize(s, 100))!
    expect(r.golden.frenzyMsLeft).toBe(0)
    expect(r.rushHour.surgeMsLeft).toBe(0)
    expect(r.logistics.surgeMult).toBe(1)
    expect(r.eventCards.profitMsLeft).toBe(0)
  })
})

describe('contracts board persistence', () => {
  it('an EXHAUSTED board stays exhausted on reload (no token resurrection)', () => {
    const s = initialGameState(0)
    s.contracts = { active: [], nextIndex: CONTRACTS.length } // whole pool claimed
    const r = deserialize(serialize(s, 100))!
    expect(r.contracts.active).toEqual([])
    expect(r.contracts.nextIndex).toBe(CONTRACTS.length)
  })

  it('a partially-worked board round-trips exactly', () => {
    const s = initialGameState(0)
    const board = CONTRACTS.slice(2, 2 + CONTRACT_BOARD_SIZE).map((c) => c.id)
    s.contracts = { active: board, nextIndex: 2 + CONTRACT_BOARD_SIZE }
    const r = deserialize(serialize(s, 100))!
    expect(r.contracts.active).toEqual(board)
    expect(r.contracts.nextIndex).toBe(2 + CONTRACT_BOARD_SIZE)
  })

  it('refills board slots lost to a content change from the pool (no duplicates)', () => {
    // Simulate a save whose board had ids that no longer exist in content.
    const survivors = CONTRACTS.slice(0, 2).map((c) => c.id)
    const loaded = tolerantLoad({
      contracts: { active: [...survivors, 'removed_a', 'removed_b'], nextIndex: 4 },
    } as never)
    expect(loaded.contracts.active.length).toBe(CONTRACT_BOARD_SIZE)
    expect(new Set(loaded.contracts.active).size).toBe(CONTRACT_BOARD_SIZE) // unique
    for (const id of survivors) expect(loaded.contracts.active).toContain(id)
  })
})

describe('Startup Combinator reward reconciliation', () => {
  it('a combinatorUnlocked save always loads with a BUYABLE combinator row (owned ≥ 1)', () => {
    // Saves from before the Combinator became a standalone business have the
    // angel-deal flag but a locked, 0-owned business row → the card rendered
    // but its Buy button was a dead tap (purchase() checks business.unlocked).
    const loaded = tolerantLoad({ angelDeal: { combinatorUnlocked: true } } as never)
    expect(loaded.businesses.startup_combinator.unlocked).toBe(true)
    expect(loaded.businesses.startup_combinator.owned).toBe(1) // the founding unit
  })

  it('keeps a higher owned count and never grants without the flag', () => {
    const rich = tolerantLoad({
      angelDeal: { combinatorUnlocked: true },
      businesses: { startup_combinator: { owned: 7 } },
    } as never)
    expect(rich.businesses.startup_combinator.owned).toBe(7) // not clobbered down
    const locked = tolerantLoad({ cash: 0 } as never)
    expect(locked.businesses.startup_combinator.unlocked).toBe(false)
    expect(locked.businesses.startup_combinator.owned).toBe(0)
  })

  it('ceilings an inflated Mogul Story re-offer cooldown so stories can never lock for days', () => {
    // A corrupt/inflated cooldownMs (seen in the wild at ~104 days) would otherwise
    // restore verbatim and silently suppress every story pitch. Clamp it to ≤ 1h.
    const loaded = tolerantLoad({ angelDeal: { cooldownMs: 8_999_940_000 } } as never)
    expect(loaded.angelDeal.cooldownMs).toBeLessThanOrEqual(60 * 60_000)
    // A legitimate mid-cooldown value is preserved unchanged.
    const ok = tolerantLoad({ angelDeal: { cooldownMs: 120_000 } } as never)
    expect(ok.angelDeal.cooldownMs).toBe(120_000)
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
