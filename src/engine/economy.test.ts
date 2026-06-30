import { describe, it, expect } from 'vitest'
import {
  unitCost,
  totalCost,
  maxAffordable,
  appliedMilestones,
  prestigePointsFor,
  PRESTIGE_SCALE,
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
