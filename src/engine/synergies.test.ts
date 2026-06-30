import { describe, it, expect } from 'vitest'
import { computeEmployeeEffects } from './employees/composition'
import { BUSINESSES } from '../content/businesses'
import { initialGameState } from '../store/initialState'
import type { EmployeeInstance, GameState, RoleId } from '../types/domain'

let seq = 1
function place(s: GameState, role: RoleId): void {
  const id = `t${seq++}`
  const e: EmployeeInstance = {
    id,
    templateId: 't',
    name: role,
    role,
    rarity: 'common',
    level: 1,
    affinity: null,
    traits: [],
    specialisation: null,
  }
  s.employees[id] = e
  const arr = s.businesses.lemonade.assigned
  const free = arr.indexOf(null)
  if (free >= 0) arr[free] = id
  else arr.push(id)
}

function setup(roles: RoleId[]): GameState {
  const s = initialGameState(0)
  s.businesses.lemonade.owned = 300 // 4 slots
  s.businesses.lemonade.unlocked = true
  s.businesses.lemonade.assigned = [null, null, null, null]
  for (const r of roles) place(s, r)
  return s
}

describe('named synergies', () => {
  it('Pit Crew (Operator + Runner) speeds up cycles', () => {
    const s = setup(['operator', 'runner'])
    const eff = computeEmployeeEffects(s, BUSINESSES.lemonade, s.businesses.lemonade)
    expect(eff.activeSynergies).toContain('pit_crew')
    // runner base speed 0.25 → factor 1.25, ×1.15 synergy → speedAdd = 1.25*1.15 - 1
    expect(eff.speedAdd).toBeCloseTo(1.25 * 1.15 - 1, 5)
  })

  it('Sales Floor (2+ Closers) adds profit', () => {
    const s = setup(['closer', 'closer'])
    const eff = computeEmployeeEffects(s, BUSINESSES.lemonade, s.businesses.lemonade)
    expect(eff.activeSynergies).toContain('sales_floor')
    // two common closers: 0.5 + 0.5 = 1.0, + 0.25 synergy = 1.25
    expect(eff.profitAdd).toBeCloseTo(1.25, 5)
  })

  it('High Roller (Gambler + Closer) boosts crit multiplier', () => {
    const s = setup(['gambler', 'closer'])
    const eff = computeEmployeeEffects(s, BUSINESSES.lemonade, s.businesses.lemonade)
    expect(eff.activeSynergies).toContain('high_roller')
    // base 2 + gambler critMult 1.5 + synergy 2 = 5.5
    expect(eff.critMult).toBeCloseTo(5.5, 5)
  })

  it('Great Workplace (HR + a team of 3+) adds profit', () => {
    const s = setup(['hr', 'closer', 'runner'])
    const eff = computeEmployeeEffects(s, BUSINESSES.lemonade, s.businesses.lemonade)
    expect(eff.activeSynergies).toContain('great_workplace')
  })

  it('Great Workplace needs HR present AND 3+ total staff', () => {
    const noHr = setup(['closer', 'runner', 'buyer']) // 3 staff, no HR
    expect(
      computeEmployeeEffects(noHr, BUSINESSES.lemonade, noHr.businesses.lemonade).activeSynergies,
    ).not.toContain('great_workplace')
    const tooFew = setup(['hr', 'closer']) // HR but only 2 total
    expect(
      computeEmployeeEffects(tooFew, BUSINESSES.lemonade, tooFew.businesses.lemonade).activeSynergies,
    ).not.toContain('great_workplace')
  })

  it('no synergy with a single role', () => {
    const s = setup(['runner'])
    const eff = computeEmployeeEffects(s, BUSINESSES.lemonade, s.businesses.lemonade)
    expect(eff.activeSynergies).toEqual([])
  })
})
