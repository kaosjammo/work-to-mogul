import { describe, it, expect } from 'vitest'
import { computeEmployeeEffects, moraleEquilibrium } from './employees/composition'
import { applyTick } from './simulate'
import { hireEmployee, assignToFirstFreeSlot } from './employees/roster'
import { BUSINESSES } from '../content/businesses'
import { initialGameState } from '../store/initialState'
import type { GameState } from '../types/domain'

function setup(): GameState {
  const s = initialGameState(0)
  s.cash = 1e12
  s.businesses.lemonade.owned = 50
  s.businesses.lemonade.unlocked = true
  return s
}

describe('morale', () => {
  it('moraleScalar is neutral at 60 and ranges 0.7..1.2', () => {
    const s = setup()
    s.businesses.lemonade.morale = 60
    expect(computeEmployeeEffects(s, BUSINESSES.lemonade, s.businesses.lemonade).moraleScalar).toBeCloseTo(1.0)
    s.businesses.lemonade.morale = 100
    expect(computeEmployeeEffects(s, BUSINESSES.lemonade, s.businesses.lemonade).moraleScalar).toBeCloseTo(1.2)
    s.businesses.lemonade.morale = 0
    expect(computeEmployeeEffects(s, BUSINESSES.lemonade, s.businesses.lemonade).moraleScalar).toBeCloseTo(0.7)
  })

  it('an HR employee raises the morale equilibrium above the 60 baseline', () => {
    const s = setup()
    expect(moraleEquilibrium(s, BUSINESSES.lemonade, s.businesses.lemonade)).toBe(60)
    const id = hireEmployee(s, 'sunny_brooks')! // hr, common, food affinity
    s.employees[id].traits = [] // isolate HR role from its 'charismatic' trait
    assignToFirstFreeSlot(s, id, 'lemonade')
    // 12 base × food affinity 1.25 = 15 → equilibrium 75
    expect(moraleEquilibrium(s, BUSINESSES.lemonade, s.businesses.lemonade)).toBeCloseTo(75)
  })

  it('morale drifts toward equilibrium over time when HR is assigned', () => {
    const s = setup()
    const id = hireEmployee(s, 'sunny_brooks')!
    s.employees[id].traits = [] // isolate HR role (equilibrium → 75) from 'charismatic'
    assignToFirstFreeSlot(s, id, 'lemonade')
    s.businesses.lemonade.morale = 60
    for (let i = 0; i < 600; i++) applyTick(s, 100, () => 0.99) // ~60s, no crit
    expect(s.businesses.lemonade.morale).toBeGreaterThan(70)
    expect(s.businesses.lemonade.morale).toBeLessThanOrEqual(75.01)
  })
})
