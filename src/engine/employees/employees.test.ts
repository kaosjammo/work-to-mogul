import { describe, it, expect } from 'vitest'
import { initialGameState } from '../../store/initialState'
import { computeEmployeeEffects, effectMagnitude } from './composition'
import { hireEmployee, assignToFirstFreeSlot, assignEmployee, unassignEmployee, levelUpEmployee, levelUpCost } from './roster'
import { resolveBusiness } from '../resolveBusiness'
import { BUSINESSES } from '../../content/businesses'
import { MAX_EMPLOYEE_LEVEL } from '../../content/roles'
import type { GameState } from '../../types/domain'

function setup(): GameState {
  const s = initialGameState(0)
  s.cash = 1e9
  s.businesses.lemonade.owned = 1
  s.businesses.lemonade.unlocked = true
  return s
}

describe('hiring', () => {
  it('deducts cash and adds an employee', () => {
    const s = setup()
    const before = s.cash
    const id = hireEmployee(s, 'flash_ortega')
    expect(id).not.toBeNull()
    expect(Object.keys(s.employees)).toHaveLength(1)
    expect(s.cash).toBe(before - 25)
  })

  it('refuses when broke', () => {
    const s = initialGameState(0) // cash 0
    expect(hireEmployee(s, 'flash_ortega')).toBeNull()
  })
})

describe('role effects via resolveBusiness', () => {
  it('an Operator automates the business', () => {
    const s = setup()
    expect(resolveBusiness(s, BUSINESSES.lemonade).isAutomated).toBe(false)
    const id = hireEmployee(s, 'mickey_gears')!
    assignToFirstFreeSlot(s, id, 'lemonade')
    expect(resolveBusiness(s, BUSINESSES.lemonade).isAutomated).toBe(true)
  })

  it('a Closer raises revenue per cycle', () => {
    const s = setup()
    const before = resolveBusiness(s, BUSINESSES.lemonade).revenuePerCycle
    const id = hireEmployee(s, 'maxine_hustle')!
    assignToFirstFreeSlot(s, id, 'lemonade')
    const after = resolveBusiness(s, BUSINESSES.lemonade).revenuePerCycle
    expect(after).toBeGreaterThan(before)
  })

  it('a Runner shortens the cycle', () => {
    const s = setup()
    const before = resolveBusiness(s, BUSINESSES.lemonade).cycleMs
    const id = hireEmployee(s, 'flash_ortega')!
    assignToFirstFreeSlot(s, id, 'lemonade')
    expect(resolveBusiness(s, BUSINESSES.lemonade).cycleMs).toBeLessThan(before)
  })

  it('a Buyer reduces buy cost, soft-capped at 60% off', () => {
    const s = setup()
    const id = hireEmployee(s, 'thrifty_tom')!
    assignToFirstFreeSlot(s, id, 'lemonade')
    const mult = resolveBusiness(s, BUSINESSES.lemonade).buyCostMult
    expect(mult).toBeLessThan(1)
    expect(mult).toBeGreaterThanOrEqual(0.4)
  })
})

describe('level-up', () => {
  it('costs cash, raises the level, and increases effect magnitude', () => {
    const s = setup()
    const id = hireEmployee(s, 'flash_ortega')! // runner
    s.cash = 1e9
    const before = effectMagnitude(s.employees[id], 'cycleSpeed', BUSINESSES.lemonade)
    const cost = levelUpCost(s.employees[id])
    const cashBefore = s.cash

    expect(levelUpEmployee(s, id)).toBe(true)
    expect(s.employees[id].level).toBe(2)
    expect(s.cash).toBe(cashBefore - cost)
    expect(effectMagnitude(s.employees[id], 'cycleSpeed', BUSINESSES.lemonade)).toBeGreaterThan(before)
  })

  it('refuses when broke and caps at the max level', () => {
    const s = setup()
    const id = hireEmployee(s, 'flash_ortega')!
    s.cash = 0
    expect(levelUpEmployee(s, id)).toBe(false)

    s.cash = 1e12
    s.employees[id].level = MAX_EMPLOYEE_LEVEL
    expect(levelUpEmployee(s, id)).toBe(false)
    expect(s.employees[id].level).toBe(MAX_EMPLOYEE_LEVEL)
  })
})

describe('industry affinity', () => {
  it('boosts a matching-industry employee by 1.25×', () => {
    const s = setup()
    const id = hireEmployee(s, 'flash_ortega')! // food affinity
    const e = s.employees[id]
    const onFood = effectMagnitude(e, 'cycleSpeed', BUSINESSES.lemonade) // food
    const offFood = effectMagnitude(e, 'cycleSpeed', BUSINESSES.corner_shop) // retail
    expect(onFood / offFood).toBeCloseTo(1.25, 5)
  })
})

describe('assignment authority + moving', () => {
  it('moving an employee frees the old slot', () => {
    const s = setup()
    s.businesses.food_truck.owned = 1
    s.businesses.food_truck.unlocked = true
    const id = hireEmployee(s, 'mickey_gears')!
    assignToFirstFreeSlot(s, id, 'lemonade')
    expect(s.businesses.lemonade.assigned).toContain(id)

    assignEmployee(s, id, 'food_truck', 0)
    expect(s.businesses.lemonade.assigned).not.toContain(id)
    expect(s.businesses.food_truck.assigned).toContain(id)
  })

  it('unassign benches the employee everywhere', () => {
    const s = setup()
    const id = hireEmployee(s, 'flash_ortega')!
    assignToFirstFreeSlot(s, id, 'lemonade')
    unassignEmployee(s, id)
    expect(s.businesses.lemonade.assigned.every((x) => x !== id)).toBe(true)
    expect(computeEmployeeEffects(s, BUSINESSES.lemonade, s.businesses.lemonade).speedAdd).toBe(0)
  })
})
