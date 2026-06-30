import { describe, it, expect } from 'vitest'
import type { EmployeeInstance, RoleId } from '../types/domain'
import { initialGameState } from '../store/initialState'
import { computeEmployeeEffects, industryFocus } from './employees/composition'
import { resolveBusiness } from './resolveBusiness'
import { BUSINESSES } from '../content/businesses'

function emp(id: string, role: RoleId): EmployeeInstance {
  return { id, templateId: 't', name: id, role, rarity: 'common', level: 1, affinity: null, traits: [], specialisation: null }
}

describe('industry focus', () => {
  it('rewards on-theme staffing and ignores off-theme', () => {
    // food prefers cycleSpeed + morale → runner/hr on-theme; buyer is not.
    expect(industryFocus(BUSINESSES.lemonade, { runner: 1 }).bonus).toBeGreaterThan(1)
    expect(industryFocus(BUSINESSES.lemonade, { buyer: 1 }).bonus).toBe(1)
    const mixed = industryFocus(BUSINESSES.lemonade, { runner: 1, buyer: 1 })
    expect(mixed.onTheme).toBe(1)
    expect(mixed.assigned).toBe(2)
    expect(mixed.bonus).toBeCloseTo(1 + 0.15 * 0.5) // half on-theme → half the cap
  })

  it('raises business revenue when staffed on-theme', () => {
    const s = initialGameState(0)
    s.businesses.lemonade.owned = 10
    s.businesses.lemonade.unlocked = true
    const baseline = resolveBusiness(s, BUSINESSES.lemonade).revenuePerCycle
    s.employees.r1 = emp('r1', 'runner')
    s.businesses.lemonade.assigned = ['r1']
    expect(computeEmployeeEffects(s, BUSINESSES.lemonade, s.businesses.lemonade).focusBonus).toBeGreaterThan(1)
    expect(resolveBusiness(s, BUSINESSES.lemonade).revenuePerCycle).toBeGreaterThan(baseline)
  })
})

describe('new synergies', () => {
  it('lean ops (buyer + auditor) makes expansion cheaper', () => {
    const s = initialGameState(0)
    s.businesses.lemonade.owned = 1
    s.employees.b1 = emp('b1', 'buyer')
    s.employees.a1 = emp('a1', 'auditor')

    s.businesses.lemonade.assigned = ['b1']
    const noSyn = computeEmployeeEffects(s, BUSINESSES.lemonade, s.businesses.lemonade).buyCostMult

    s.businesses.lemonade.assigned = ['b1', 'a1']
    const eff = computeEmployeeEffects(s, BUSINESSES.lemonade, s.businesses.lemonade)
    expect(eff.activeSynergies).toContain('lean_ops')
    expect(eff.buyCostMult).toBeLessThan(noSyn)
  })

  it('dream team (4+ distinct roles) adds a profit bonus', () => {
    const s = initialGameState(0)
    s.businesses.lemonade.owned = 300
    s.businesses.lemonade.assigned = ['o', 'r', 'c', 'b']
    s.employees.o = emp('o', 'operator')
    s.employees.r = emp('r', 'runner')
    s.employees.c = emp('c', 'closer')
    s.employees.b = emp('b', 'buyer')
    const eff = computeEmployeeEffects(s, BUSINESSES.lemonade, s.businesses.lemonade)
    expect(eff.activeSynergies).toContain('dream_team')
    expect(eff.profitAdd).toBeGreaterThanOrEqual(0.4)
  })
})
