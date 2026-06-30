import { describe, it, expect } from 'vitest'
import type { EmployeeInstance } from '../types/domain'
import { initialGameState } from '../store/initialState'
import { chooseSpecialisation } from './employees/roster'
import { computeEmployeeEffects, effectMagnitude } from './employees/composition'
import { BUSINESSES } from '../content/businesses'
import { tolerantLoad } from '../save/serialize'

function closer(level = 5): EmployeeInstance {
  return {
    id: 'c1', templateId: 'marco', name: 'Marco', role: 'closer',
    rarity: 'common', level, affinity: null, traits: [], specialisation: null,
  }
}

describe('L5 specialisations', () => {
  it('requires level 5 and a role-matching spec; is re-choosable', () => {
    const s = initialGameState(0)
    s.employees.c1 = closer(4)
    expect(chooseSpecialisation(s, 'c1', 'rainmaker')).toBe(false) // level too low
    s.employees.c1.level = 5
    expect(chooseSpecialisation(s, 'c1', 'sprint_lead')).toBe(false) // runner spec on a closer
    expect(chooseSpecialisation(s, 'c1', 'rainmaker')).toBe(true)
    expect(s.employees.c1.specialisation).toBe('rainmaker')
    expect(chooseSpecialisation(s, 'c1', 'upseller')).toBe(true) // can change freely
    expect(s.employees.c1.specialisation).toBe('upseller')
  })

  it('rainmaker amplifies the closer profit channel', () => {
    const s = initialGameState(0)
    s.employees.c1 = closer(5)
    const def = BUSINESSES.lemonade
    const before = effectMagnitude(s.employees.c1, 'profitMult', def)
    chooseSpecialisation(s, 'c1', 'rainmaker')
    expect(effectMagnitude(s.employees.c1, 'profitMult', def)).toBeGreaterThan(before)
  })

  it('upseller branches the closer into a new crit-chance channel', () => {
    const s = initialGameState(0)
    s.employees.c1 = closer(5)
    s.businesses.lemonade.owned = 1
    s.businesses.lemonade.assigned = ['c1']
    const def = BUSINESSES.lemonade
    expect(computeEmployeeEffects(s, def, s.businesses.lemonade).critChance).toBe(0)
    chooseSpecialisation(s, 'c1', 'upseller')
    expect(computeEmployeeEffects(s, def, s.businesses.lemonade).critChance).toBeGreaterThan(0)
  })

  it('save load drops a specialisation that does not match the role', () => {
    const loaded = tolerantLoad({
      cash: 0,
      employees: {
        c1: { id: 'c1', templateId: 'x', name: 'X', role: 'closer', rarity: 'common', level: 5, affinity: null, traits: [], specialisation: 'sprint_lead' },
        c2: { id: 'c2', templateId: 'x', name: 'Y', role: 'closer', rarity: 'common', level: 5, affinity: null, traits: [], specialisation: 'rainmaker' },
      },
    } as never)
    expect(loaded.employees.c1.specialisation).toBeNull() // runner spec on a closer → dropped
    expect(loaded.employees.c2.specialisation).toBe('rainmaker') // valid → kept
  })
})

describe('Mastery (level-10) second specialisation slot', () => {
  it('slot 2 requires the level cap, a role match, and a spec different from slot 1', () => {
    const s = initialGameState(0)
    s.employees.c1 = closer(5)
    chooseSpecialisation(s, 'c1', 'rainmaker') // slot 1
    expect(chooseSpecialisation(s, 'c1', 'kingpin', 2)).toBe(false) // level < 10
    s.employees.c1.level = 10
    expect(chooseSpecialisation(s, 'c1', 'sprint_lead', 2)).toBe(false) // wrong role
    expect(chooseSpecialisation(s, 'c1', 'rainmaker', 2)).toBe(false) // duplicates slot 1
    expect(chooseSpecialisation(s, 'c1', 'kingpin', 2)).toBe(true) // the Mastery capstone
    expect(s.employees.c1.specialisation2).toBe('kingpin')
  })

  it('both slots stack their channel deltas (a real two-pick build)', () => {
    const s = initialGameState(0)
    s.employees.c1 = closer(10)
    const def = BUSINESSES.lemonade
    const base = effectMagnitude(s.employees.c1, 'profitMult', def)
    chooseSpecialisation(s, 'c1', 'rainmaker') // +profit
    const oneSpec = effectMagnitude(s.employees.c1, 'profitMult', def)
    chooseSpecialisation(s, 'c1', 'kingpin', 2) // +more profit (Mastery)
    const twoSpec = effectMagnitude(s.employees.c1, 'profitMult', def)
    expect(oneSpec).toBeGreaterThan(base)
    expect(twoSpec).toBeGreaterThan(oneSpec) // the second pick adds on top
  })

  it('re-picking slot 1 to the slot-2 spec frees slot 2 (no duplicate build)', () => {
    const s = initialGameState(0)
    s.employees.c1 = closer(10)
    chooseSpecialisation(s, 'c1', 'rainmaker')
    chooseSpecialisation(s, 'c1', 'upseller', 2)
    expect(s.employees.c1.specialisation2).toBe('upseller')
    chooseSpecialisation(s, 'c1', 'upseller') // slot 1 now takes upseller → slot 2 clears
    expect(s.employees.c1.specialisation).toBe('upseller')
    expect(s.employees.c1.specialisation2).toBeNull()
  })

  it('save load keeps a valid slot-2 spec but drops a duplicate or role-mismatch', () => {
    const loaded = tolerantLoad({
      cash: 0,
      employees: {
        a: { id: 'a', templateId: 'x', name: 'A', role: 'closer', rarity: 'common', level: 10, affinity: null, traits: [], specialisation: 'rainmaker', specialisation2: 'kingpin' },
        b: { id: 'b', templateId: 'x', name: 'B', role: 'closer', rarity: 'common', level: 10, affinity: null, traits: [], specialisation: 'rainmaker', specialisation2: 'rainmaker' },
        c: { id: 'c', templateId: 'x', name: 'C', role: 'closer', rarity: 'common', level: 10, affinity: null, traits: [], specialisation: 'rainmaker', specialisation2: 'sprint_lead' },
      },
    } as never)
    expect(loaded.employees.a.specialisation2).toBe('kingpin') // valid → kept
    expect(loaded.employees.b.specialisation2).toBeNull() // duplicate of slot 1 → dropped
    expect(loaded.employees.c.specialisation2).toBeNull() // runner spec on a closer → dropped
  })
})
