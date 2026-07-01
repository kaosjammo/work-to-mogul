import { describe, it, expect } from 'vitest'
import {
  unitCost,
  totalCost,
  maxAffordable,
  appliedMilestones,
  prestigePointsFor,
  PRESTIGE_SCALE,
  lateGameDampen,
  economyMultipliers,
  financeCompoundMult,
  FINANCE_COMPOUND_RAMP_MS,
  quantumCollapsing,
  quantumSuperpositionMult,
  SUPERPOSITION_CYCLE_MS,
  SUPERPOSITION_COLLAPSE_MS,
  SUPERPOSITION_COLLAPSE_MULT,
  SIGNATURE_PERKS,
} from './economy'
import { resolveBusiness } from './resolveBusiness'
import { BUSINESSES } from '../content/businesses'
import { initialGameState } from '../store/initialState'

const lemonade = BUSINESSES.lemonade
const skyscraper = BUSINESSES.skyscraper // Finance-scale (baseCost 3.5e11)

describe('cost formulas', () => {
  it('unitCost grows geometrically', () => {
    expect(unitCost(lemonade, 0)).toBeCloseTo(4)
    expect(unitCost(lemonade, 1)).toBeCloseTo(4 * lemonade.growthRate)
  })

  it('totalCost equals the sum of unit costs', () => {
    let manual = 0
    for (let i = 0; i < 10; i++) manual += unitCost(lemonade, i)
    expect(totalCost(lemonade, 0, 10)).toBeCloseTo(manual, 4)
  })

  it('totalCost from an offset matches the shifted series', () => {
    let manual = 0
    for (let i = 5; i < 5 + 7; i++) manual += unitCost(lemonade, i)
    expect(totalCost(lemonade, 5, 7)).toBeCloseTo(manual, 4)
  })
})

describe('maxAffordable never overspends (rule #11)', () => {
  function assertNeverOverspends(def: typeof lemonade, owned: number, cash: number) {
    const q = maxAffordable(def, owned, cash)
    if (q > 0) expect(totalCost(def, owned, q)).toBeLessThanOrEqual(cash + 1e-6)
    // buying one more must exceed cash
    expect(totalCost(def, owned, q + 1)).toBeGreaterThan(cash + 1e-6)
  }

  it('holds for Lemonade scale', () => {
    assertNeverOverspends(lemonade, 0, 4)
    assertNeverOverspends(lemonade, 0, 253) // ~25 units
    assertNeverOverspends(lemonade, 12, 10_000)
  })

  it('holds at Finance scale', () => {
    assertNeverOverspends(skyscraper, 0, 3.5e11)
    assertNeverOverspends(skyscraper, 0, 1e15)
    assertNeverOverspends(skyscraper, 10, 5e13)
  })

  it('returns 0 when cash cannot afford the next unit', () => {
    expect(maxAffordable(lemonade, 0, 3)).toBe(0)
  })

  it('counts with the discounted price when a cost reduction applies', () => {
    // purchase() charges totalCost × costMult, so Buy Max must count with the same
    // discount — at 50% off, the same cash affords strictly more units.
    const cash = 10_000
    const full = maxAffordable(lemonade, 0, cash)
    const discounted = maxAffordable(lemonade, 0, cash, 0.5)
    expect(discounted).toBeGreaterThan(full)
    // and it still never overspends at the discounted price
    expect(totalCost(lemonade, 0, discounted) * 0.5).toBeLessThanOrEqual(cash + 1e-6)
    expect(totalCost(lemonade, 0, discounted + 1) * 0.5).toBeGreaterThan(cash + 1e-6)
  })
})

describe('milestones (derived from owned)', () => {
  it('applies the speed×2 milestone at 25 owned', () => {
    const below = appliedMilestones(lemonade, 24)
    const at = appliedMilestones(lemonade, 25)
    expect(at.speed).toBeGreaterThan(below.speed)
    expect(at.speed).toBeCloseTo(2)
  })

  it('stacks profit milestones at 100 (×2 then ×3)', () => {
    const at = appliedMilestones(lemonade, 100)
    expect(at.profit).toBeCloseTo(2 * 3) // 50:×2, 100:×3
  })
})

describe('resolveBusiness folds × owned (rule #1)', () => {
  it('revenue is zero at 0 owned and scales linearly', () => {
    const s = initialGameState(0)
    const r0 = resolveBusiness(s, lemonade)
    expect(r0.revenuePerCycle).toBe(0)

    s.businesses.lemonade.owned = 1
    const r1 = resolveBusiness(s, lemonade)
    expect(r1.revenuePerCycle).toBeCloseTo(lemonade.baseRevenue)

    s.businesses.lemonade.owned = 10
    const r10 = resolveBusiness(s, lemonade)
    expect(r10.revenuePerCycle).toBeCloseTo(lemonade.baseRevenue * 10)
  })

  it('milestone speed shortens the cycle', () => {
    const s = initialGameState(0)
    s.businesses.lemonade.owned = 25
    const r = resolveBusiness(s, lemonade)
    expect(r.cycleMs).toBeCloseTo(lemonade.baseCycleMs / 2)
  })
})

describe('late-game pacing dampener', () => {
  it('leaves the early tiers untouched and compounds a slowdown on the higher ones', () => {
    // Early industries (food/retail/tech) are never dampened — the early game is the
    // sacred "first run" pacing the harness landmarks lock.
    expect(lateGameDampen('food')).toBe(1)
    expect(lateGameDampen('retail')).toBe(1)
    expect(lateGameDampen('tech')).toBe(1)
    // Mid-late tiers get an increasing (compounding, ≤1) profit cut.
    expect(lateGameDampen('finance')).toBeLessThan(1)
    expect(lateGameDampen('space')).toBeLessThan(lateGameDampen('finance'))
    expect(lateGameDampen('space')).toBeGreaterThan(0) // never zeroes income
  })

  it('folds into a late-tier business profit but not an early one', () => {
    const s = initialGameState(0)
    const foodProfit = economyMultipliers(s, BUSINESSES.lemonade).profit // food → ×1 dampen
    const lateProfit = economyMultipliers(s, BUSINESSES.skyscraper).profit // finance → dampened
    // Skyscraper's profit multiplier carries the dampen factor; lemonade's does not.
    expect(foodProfit).toBeCloseTo(1) // no milestones/talents/dampen on a fresh food business
    expect(lateProfit).toBeCloseTo(lateGameDampen('finance'))
  })
})

describe('Finance Compound Interest — the passive-dynamic signature', () => {
  it('ramps profit 1.0 → cap over the runtime, capped', () => {
    const s = initialGameState(0)
    expect(financeCompoundMult(s)).toBe(1) // fresh run → no compound yet
    s.financeCompoundMs = FINANCE_COMPOUND_RAMP_MS / 2
    expect(financeCompoundMult(s)).toBeCloseTo(1.5) // halfway → halfway to the ×2 cap
    s.financeCompoundMs = FINANCE_COMPOUND_RAMP_MS
    expect(financeCompoundMult(s)).toBeCloseTo(2) // full → the cap
    s.financeCompoundMs = FINANCE_COMPOUND_RAMP_MS * 10
    expect(financeCompoundMult(s)).toBeCloseTo(2) // never exceeds the cap
  })

  it('folds into FINANCE profit only, and REPLACES the old flat perk (no double-count)', () => {
    const s = initialGameState(0)
    const financeBefore = economyMultipliers(s, BUSINESSES.apartments).profit // Finance biz
    const foodBefore = economyMultipliers(s, lemonade).profit
    s.financeCompoundMs = FINANCE_COMPOUND_RAMP_MS // full compound → ×2
    expect(economyMultipliers(s, BUSINESSES.apartments).profit).toBeCloseTo(financeBefore * 2)
    expect(economyMultipliers(s, lemonade).profit).toBeCloseTo(foodBefore) // Food unaffected
  })
})

describe('Quantum Superposition — the deterministic collapse signature', () => {
  it('collapses to ×MULT inside the window, ×1 outside (deterministic, no RNG)', () => {
    const s = initialGameState(0)
    s.quantumPhaseMs = 0 // start of cycle → collapsing
    expect(quantumCollapsing(s)).toBe(true)
    expect(quantumSuperpositionMult(s)).toBe(SUPERPOSITION_COLLAPSE_MULT)
    s.quantumPhaseMs = SUPERPOSITION_COLLAPSE_MS + 1000 // past the window → stable
    expect(quantumCollapsing(s)).toBe(false)
    expect(quantumSuperpositionMult(s)).toBe(1)
  })

  it('folds into QUANTUM profit only — Space keeps its own moonshot', () => {
    const s = initialGameState(0)
    s.quantumPhaseMs = SUPERPOSITION_COLLAPSE_MS + 1000 // stable
    const quantumStable = economyMultipliers(s, BUSINESSES.quantum_computer).profit
    const spaceStable = economyMultipliers(s, BUSINESSES.satellite).profit
    s.quantumPhaseMs = 0 // collapse
    expect(economyMultipliers(s, BUSINESSES.quantum_computer).profit).toBeCloseTo(
      quantumStable * SUPERPOSITION_COLLAPSE_MULT,
    )
    expect(economyMultipliers(s, BUSINESSES.satellite).profit).toBeCloseTo(spaceStable) // Space untouched
  })

  it('mean over a cycle ≈ its SIGNATURE_PERKS value (no creep vs the old moonshot)', () => {
    const collapseFrac = SUPERPOSITION_COLLAPSE_MS / SUPERPOSITION_CYCLE_MS
    const mean = (1 - collapseFrac) * 1 + collapseFrac * SUPERPOSITION_COLLAPSE_MULT
    expect(mean).toBeCloseTo(SIGNATURE_PERKS.superposition.profit ?? 0)
  })
})

describe('prestige', () => {
  it('grants ~1 point at the prestige scale and scales gently (fourth-root)', () => {
    // Yield exponent is 0.26 (the slope re-tune lifted it from 0.2): tokens stay
    // scarce but accumulate fast enough that the talent tree is a journey, not a crawl.
    expect(prestigePointsFor(PRESTIGE_SCALE)).toBe(1)
    expect(prestigePointsFor(100 * PRESTIGE_SCALE)).toBe(3) // 100^0.26 ≈ 3.31
    expect(prestigePointsFor(1e4 * PRESTIGE_SCALE)).toBe(10) // 1e4^0.26 ≈ 10.97
    expect(prestigePointsFor(0)).toBe(0)
  })
})
