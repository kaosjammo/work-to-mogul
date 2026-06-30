import { describe, it, expect } from 'vitest'
import { autoAssignBest } from './autoAssign'
import { hireEmployee } from './roster'
import { resolveBusiness } from '../resolveBusiness'
import { BUSINESSES } from '../../content/businesses'
import { initialGameState } from '../../store/initialState'
import type { GameState } from '../../types/domain'

function setup(): GameState {
  const s = initialGameState(0)
  s.cash = 1e12
  s.businesses.lemonade.owned = 50 // owned + unlocked, 2 slots
  s.businesses.lemonade.unlocked = true
  return s
}

describe('autoAssignBest', () => {
  it('places an Operator to automate an owned business (idle income > 0)', () => {
    const s = setup()
    hireEmployee(s, 'mickey_gears') // operator
    expect(resolveBusiness(s, BUSINESSES.lemonade).isAutomated).toBe(false)

    const placed = autoAssignBest(s)
    expect(placed).toBeGreaterThan(0)
    expect(resolveBusiness(s, BUSINESSES.lemonade).isAutomated).toBe(true)
  })

  it('does not place staff on businesses you do not own', () => {
    const s = initialGameState(0) // nothing owned
    s.cash = 1e12
    hireEmployee(s, 'mickey_gears')
    expect(autoAssignBest(s)).toBe(0)
  })

  it('returns 0 when there is no one to place', () => {
    const s = setup()
    expect(autoAssignBest(s)).toBe(0)
  })

  it('fills additional slots after automating (pass 2 parks the rest)', () => {
    const s = setup()
    hireEmployee(s, 'mickey_gears') // operator
    hireEmployee(s, 'maxine_hustle') // closer
    const placed = autoAssignBest(s)
    expect(placed).toBe(2)
    const assignedCount = s.businesses.lemonade.assigned.filter(Boolean).length
    expect(assignedCount).toBe(2)
  })
})
