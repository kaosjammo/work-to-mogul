import { describe, it, expect } from 'vitest'
import { effectMagnitude, moraleEquilibrium } from './employees/composition'
import { BUSINESSES } from '../content/businesses'
import type { EmployeeInstance } from '../types/domain'

function emp(partial: Partial<EmployeeInstance>): EmployeeInstance {
  return {
    id: 'e',
    templateId: 't',
    name: 'E',
    role: 'runner',
    rarity: 'common',
    level: 1,
    affinity: null,
    traits: [],
    specialisation: null,
    ...partial,
  }
}

describe('employee traits', () => {
  it('Workaholic adds cycle speed on top of the role base', () => {
    const plain = effectMagnitude(emp({ role: 'runner' }), 'cycleSpeed', BUSINESSES.lemonade)
    const worka = effectMagnitude(emp({ role: 'runner', traits: ['workaholic'] }), 'cycleSpeed', BUSINESSES.lemonade)
    expect(worka).toBeGreaterThan(plain)
    // base 0.25 + 0.1 = 0.35 (common, no affinity)
    expect(worka).toBeCloseTo(0.35, 5)
  })

  it('Frugal grants cost reduction even on a non-buyer', () => {
    const closer = effectMagnitude(emp({ role: 'closer', traits: ['frugal'] }), 'costReduction', BUSINESSES.lemonade)
    expect(closer).toBeCloseTo(0.15, 5)
  })

  it('Lucky grants crit chance on a non-gambler', () => {
    const runner = effectMagnitude(emp({ role: 'runner', traits: ['lucky'] }), 'critChance', BUSINESSES.lemonade)
    expect(runner).toBeCloseTo(0.05, 5)
  })

  it('Charismatic raises the morale equilibrium it contributes', () => {
    const state = { employees: { e1: emp({ id: 'e1', role: 'closer', traits: ['charismatic'] }) } } as never
    const bs = { assigned: ['e1'], morale: 60, risk: 0, riskEventMsLeft: 0, owned: 1, unlocked: true, cycleProgressMs: 0 }
    // 60 baseline + 8 charismatic contribution
    expect(moraleEquilibrium(state, BUSINESSES.lemonade, bs as never)).toBeCloseTo(68, 5)
  })
})
