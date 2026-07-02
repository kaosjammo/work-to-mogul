import { describe, it, expect } from 'vitest'
import { initialGameState } from '../store/initialState'
import { serialize, deserialize } from '../save/serialize'
import { prestigeReset } from './prestige'
import { applyTick } from './simulate'
import type { GameState } from '../types/domain'
import {
  initialAutomationState,
  automationEligible,
  reinvestWithin,
  autoStaffOnce,
  updateInvestConfig,
  updateStaffConfig,
  unlockChiefOfStaff,
  chiefUnlockCost,
} from './automation'

/** A state that owns a couple of unlocked Food businesses + cash to deploy. */
function seededState(): GameState {
  const s = initialGameState(0)
  s.businesses.lemonade.owned = 1
  s.businesses.lemonade.unlocked = true
  s.businesses.food_truck.owned = 1
  s.businesses.food_truck.unlocked = true
  s.cash = 1e9
  return s
}

describe('Automation — eligibility + defaults (OFF by default → harness-safe)', () => {
  it('fresh state has both managers OFF with sane defaults', () => {
    const a = initialAutomationState()
    expect(a.invest.enabled).toBe(false)
    expect(a.staff.enabled).toBe(false)
    expect(a.invest.reservePct).toBe(25)
    expect(a.staff.budgetPct).toBe(20)
  })

  it('is eligible only once the player owns a business', () => {
    expect(automationEligible(initialGameState(0))).toBe(false)
    expect(automationEligible(seededState())).toBe(true)
  })
})

describe('Executive Assistant — reinvestWithin', () => {
  it('buys within the budget and never overspends it', () => {
    const s = seededState()
    const budget = 1000
    const before = s.cash
    const { units, spent } = reinvestWithin(s, budget, s.automation.invest)
    expect(units).toBeGreaterThan(0)
    expect(spent).toBeLessThanOrEqual(budget)
    expect(s.cash).toBeCloseTo(before - spent)
    expect(s.cash).toBeGreaterThanOrEqual(before - budget) // reserve preserved
  })

  it('does nothing with a zero/negative budget', () => {
    const s = seededState()
    expect(reinvestWithin(s, 0, s.automation.invest).units).toBe(0)
    expect(reinvestWithin(s, -5, s.automation.invest).units).toBe(0)
  })

  it('focus strategy only buys within the chosen industry', () => {
    const s = seededState()
    s.businesses.corner_shop.owned = 1
    s.businesses.corner_shop.unlocked = true // a Retail business
    const foodBefore = s.businesses.lemonade.owned + s.businesses.food_truck.owned
    const retailBefore = s.businesses.corner_shop.owned
    updateInvestConfig(s, { strategy: 'focus', focusIndustry: 'retail' })
    reinvestWithin(s, 1e8, s.automation.invest)
    expect(s.businesses.lemonade.owned + s.businesses.food_truck.owned).toBe(foodBefore) // Food untouched
    expect(s.businesses.corner_shop.owned).toBeGreaterThan(retailBefore) // Retail grew
  })

  it('cheapest strategy prefers the lower-priced unit', () => {
    const s = seededState()
    updateInvestConfig(s, { strategy: 'cheapest' })
    // Lemonade (base 4) is far cheaper than Food Truck (base 60) at equal owned → it
    // should absorb more of a tiny budget.
    const lem0 = s.businesses.lemonade.owned
    const truck0 = s.businesses.food_truck.owned
    reinvestWithin(s, 500, s.automation.invest)
    expect(s.businesses.lemonade.owned - lem0).toBeGreaterThan(s.businesses.food_truck.owned - truck0)
  })
})

describe('Chief of Staff — autoStaffOnce', () => {
  it('hires an operator into an empty slot and assigns it', () => {
    const s = seededState()
    expect(Object.keys(s.employees)).toHaveLength(0)
    const { hires, spent } = autoStaffOnce(s, 1e6, s.automation.staff)
    expect(hires).toBeGreaterThan(0)
    expect(spent).toBeGreaterThan(0)
    const emps = Object.values(s.employees)
    expect(emps.some((e) => e.role === 'operator')).toBe(true) // automation-first hiring
    // at least one business now has a staffed slot
    const anyAssigned = Object.values(s.businesses).some((b) => b.assigned.some((x) => x))
    expect(anyAssigned).toBe(true)
  })

  it('respects the budget (a tiny budget hires little or nothing)', () => {
    const s = seededState()
    const { spent } = autoStaffOnce(s, 10, s.automation.staff) // below any hire cost
    expect(spent).toBeLessThanOrEqual(10)
  })

  it('levels existing staff cheapest-first within budget when hire is off', () => {
    const s = seededState()
    // Seed one hired employee, no auto-hire, generous level budget.
    autoStaffOnce(s, 1e6, { ...s.automation.staff, level: false })
    const emp = Object.values(s.employees)[0]
    const lvl0 = emp.level
    autoStaffOnce(s, 1e9, { ...s.automation.staff, hire: false, assign: false, level: true })
    expect(Object.values(s.employees)[0].level).toBeGreaterThan(lvl0)
  })
})

describe('tickAutomation — cadence + HARNESS byte-identity', () => {
  it('does nothing while disabled (income byte-identical over many ticks)', () => {
    const off = seededState()
    const control = seededState()
    const rng = () => 0.5
    for (let i = 0; i < 100; i++) {
      applyTick(off, 100, rng) // automation OFF (default)
      applyTick(control, 100, rng)
    }
    expect(off.cash).toBe(control.cash)
    expect(off.businesses.lemonade.owned).toBe(control.businesses.lemonade.owned)
    expect(Object.keys(off.employees)).toHaveLength(0)
  })

  it('an enabled EA reinvests on its interval and diverges from an idle empire', () => {
    const auto = seededState()
    const idle = seededState()
    auto.automation.invest.unlocked = true // the EA must be poached first
    updateInvestConfig(auto, { enabled: true, reservePct: 20, intervalSec: 5 })
    const rng = () => 0.5
    for (let i = 0; i < 100; i++) {
      applyTick(auto, 100, rng)
      applyTick(idle, 100, rng)
    }
    const autoOwned = auto.businesses.lemonade.owned + auto.businesses.food_truck.owned
    const idleOwned = idle.businesses.lemonade.owned + idle.businesses.food_truck.owned
    expect(autoOwned).toBeGreaterThan(idleOwned) // the EA bought units the idle empire didn't
    expect(auto.automation.invest.lifetimeSpent).toBeGreaterThan(0)
  })

  it('an enabled Chief of Staff hires over time', () => {
    const s = seededState()
    s.automation.staff.unlocked = true // the Chief must be hired first
    updateStaffConfig(s, { enabled: true, intervalSec: 3 })
    const rng = () => 0.5
    for (let i = 0; i < 100; i++) applyTick(s, 100, rng)
    expect(Object.keys(s.employees).length).toBeGreaterThan(0)
    expect(s.automation.staff.lifetimeHires).toBeGreaterThan(0)
  })

  it('a Chief cannot be enabled until it is hired (unlocked)', () => {
    const s = seededState()
    updateStaffConfig(s, { enabled: true }) // not hired yet
    expect(s.automation.staff.enabled).toBe(false)
    const rng = () => 0.5
    for (let i = 0; i < 100; i++) applyTick(s, 100, rng)
    expect(Object.keys(s.employees)).toHaveLength(0) // never ran
  })
})

describe('Chief of Staff — the one-time hire (unlock)', () => {
  it('hiring deducts the cost and turns the Chief on', () => {
    const s = seededState()
    expect(s.automation.staff.unlocked).toBe(false)
    const cost = chiefUnlockCost(s)
    expect(cost).toBeGreaterThanOrEqual(1_000_000) // at least the floor
    const before = s.cash
    expect(unlockChiefOfStaff(s)).toBe(true)
    expect(s.automation.staff.unlocked).toBe(true)
    expect(s.automation.staff.enabled).toBe(true)
    expect(s.cash).toBeCloseTo(before - cost)
    expect(unlockChiefOfStaff(s)).toBe(false) // already hired → no double-charge
  })

  it('refuses the hire with insufficient cash', () => {
    const s = seededState()
    s.cash = 5 // below the $1M floor
    expect(unlockChiefOfStaff(s)).toBe(false)
    expect(s.automation.staff.unlocked).toBe(false)
  })
})

describe('Automation config setters clamp to safe ranges', () => {
  it('clamps invest config', () => {
    const s = seededState()
    updateInvestConfig(s, { reservePct: 999, intervalSec: 1, strategy: 'cheapest' })
    expect(s.automation.invest.reservePct).toBe(90)
    expect(s.automation.invest.intervalSec).toBe(3)
    expect(s.automation.invest.strategy).toBe('cheapest')
    updateInvestConfig(s, { reservePct: -50, intervalSec: 9999 })
    expect(s.automation.invest.reservePct).toBe(0)
    expect(s.automation.invest.intervalSec).toBe(60)
  })

  it('clamps staff config + toggles', () => {
    const s = seededState()
    updateStaffConfig(s, { budgetPct: 200, hire: false })
    expect(s.automation.staff.budgetPct).toBe(90)
    expect(s.automation.staff.hire).toBe(false)
  })
})

describe('Automation — save + prestige', () => {
  it('config + stats round-trip through save (clamped) and reset the cooldown', () => {
    const s = seededState()
    s.automation.invest.unlocked = true
    updateInvestConfig(s, { enabled: true, reservePct: 40, strategy: 'focus', focusIndustry: 'tech', intervalSec: 12 })
    s.automation.staff.unlocked = true
    updateStaffConfig(s, { enabled: true, budgetPct: 35, level: false })
    s.automation.invest.lifetimeSpent = 12345
    s.automation.staff.lifetimeHires = 9
    const back = deserialize(serialize(s, 1))!
    expect(back.automation.invest.enabled).toBe(true)
    expect(back.automation.invest.reservePct).toBe(40)
    expect(back.automation.invest.strategy).toBe('focus')
    expect(back.automation.invest.focusIndustry).toBe('tech')
    expect(back.automation.invest.lifetimeSpent).toBe(12345)
    expect(back.automation.staff.unlocked).toBe(true) // the hire persists
    expect(back.automation.staff.enabled).toBe(true)
    expect(back.automation.staff.budgetPct).toBe(35)
    expect(back.automation.staff.level).toBe(false)
    expect(back.automation.staff.lifetimeHires).toBe(9)

    // A corrupt strategy/percent is repaired.
    const raw = JSON.parse(serialize(s, 1))
    raw.state.automation.invest.strategy = 'nonsense'
    raw.state.automation.invest.reservePct = 999
    const fixed = deserialize(JSON.stringify(raw))!
    expect(fixed.automation.invest.strategy).toBe('roi')
    expect(fixed.automation.invest.reservePct).toBe(90)
  })

  it('grandfathers a pre-hire save that already had the Chief enabled', () => {
    const s = seededState()
    const raw = JSON.parse(serialize(s, 1))
    raw.state.automation.staff.enabled = true
    delete raw.state.automation.staff.unlocked // old save: no unlocked field
    const back = deserialize(JSON.stringify(raw))!
    expect(back.automation.staff.unlocked).toBe(true) // enabled ⟹ counts as hired
    expect(back.automation.staff.enabled).toBe(true)
  })

  it('config persists through prestige (a set-and-forget convenience)', () => {
    const s = seededState()
    s.lifetimeEarnings = 1e15
    s.automation.invest.unlocked = true
    updateInvestConfig(s, { enabled: true, reservePct: 33 })
    s.automation.staff.unlocked = true
    updateStaffConfig(s, { enabled: true, budgetPct: 15 })
    s.automation.invest.lifetimeSpent = 999
    expect(prestigeReset(s)).toBe(true)
    expect(s.automation.invest.enabled).toBe(true)
    expect(s.automation.invest.reservePct).toBe(33)
    expect(s.automation.invest.lifetimeSpent).toBe(999)
    expect(s.automation.staff.unlocked).toBe(true) // the hire is permanent meta-progression
    expect(s.automation.staff.enabled).toBe(true)
    expect(s.automation.staff.budgetPct).toBe(15)
  })
})
