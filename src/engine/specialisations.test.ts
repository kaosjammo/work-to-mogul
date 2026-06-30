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
