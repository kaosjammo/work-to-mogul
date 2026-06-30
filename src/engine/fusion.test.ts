import { describe, it, expect } from 'vitest'
import type { EmployeeInstance } from '../types/domain'
import { initialGameState } from '../store/initialState'
import { fuseEmployees, canFuse, nextRarity } from './employees/roster'
import { effectMagnitude } from './employees/composition'
import { BUSINESSES } from '../content/businesses'

function emp(id: string, over: Partial<EmployeeInstance> = {}): EmployeeInstance {
  return {
    id, templateId: 'flash_ortega', name: 'Flash', role: 'runner',
    rarity: 'common', level: 1, affinity: null, traits: [], specialisation: null, ...over,
  }
}

describe('fusion', () => {
  it('nextRarity walks the ladder and stops at epic', () => {
    expect(nextRarity('common')).toBe('uncommon')
    expect(nextRarity('rare')).toBe('epic')
    expect(nextRarity('epic')).toBeNull()
  })

  it('canFuse requires distinct, same-template, same-rarity, sub-epic', () => {
    const a = emp('a')
    expect(canFuse(a, emp('b'))).toBe(true)
    expect(canFuse(a, a)).toBe(false) // same id
    expect(canFuse(a, emp('c', { rarity: 'uncommon' }))).toBe(false) // different rarity
    expect(canFuse(a, emp('d', { templateId: 'other' }))).toBe(false) // different archetype
    expect(canFuse(emp('e', { rarity: 'epic' }), emp('f', { rarity: 'epic' }))).toBe(false) // already top
  })

  it('fuses two commons into one uncommon, keeping the higher level and stronger effect', () => {
    const s = initialGameState(0)
    s.employees.a = emp('a', { level: 3 })
    s.employees.b = emp('b', { level: 7 })
    const before = effectMagnitude(s.employees.a, 'cycleSpeed', BUSINESSES.lemonade)
    const result = fuseEmployees(s, 'a', 'b')
    expect(result).toBe('uncommon')
    expect(s.employees.a.rarity).toBe('uncommon')
    expect(s.employees.a.level).toBe(7)
    expect(s.employees.b).toBeUndefined() // consumed
    expect(effectMagnitude(s.employees.a, 'cycleSpeed', BUSINESSES.lemonade)).toBeGreaterThan(before)
  })

  it('clears the consumed employee from any slot it occupied', () => {
    const s = initialGameState(0)
    s.businesses.lemonade.owned = 1
    s.employees.a = emp('a')
    s.employees.b = emp('b')
    s.businesses.lemonade.assigned = ['b']
    fuseEmployees(s, 'a', 'b')
    expect(s.businesses.lemonade.assigned).not.toContain('b')
  })

  it('refuses to fuse an invalid pair (nothing consumed)', () => {
    const s = initialGameState(0)
    s.employees.a = emp('a')
    s.employees.b = emp('b', { rarity: 'uncommon' })
    expect(fuseEmployees(s, 'a', 'b')).toBeNull()
    expect(s.employees.b).toBeDefined()
  })
})
