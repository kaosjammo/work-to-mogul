import { describe, it, expect } from 'vitest'
import { payoutWithCrit } from './simulate'
import { computeEmployeeEffects } from './employees/composition'
import { hireEmployee, assignToFirstFreeSlot } from './employees/roster'
import { BUSINESSES } from '../content/businesses'
import { initialGameState } from '../store/initialState'

describe('payoutWithCrit', () => {
  const rngNever = () => 0.99 // never below critChance
  const rngAlways = () => 0.0 // always crit

  it('no crit chance pays the flat amount', () => {
    expect(payoutWithCrit(100, 5, 0, 3, rngNever)).toBe(500)
  })

  it('rolls per cycle for small batches', () => {
    expect(payoutWithCrit(100, 4, 0.5, 3, rngNever)).toBe(400) // none crit
    expect(payoutWithCrit(100, 4, 0.5, 3, rngAlways)).toBe(1200) // all crit ×3
  })

  it('uses expected value for large batches', () => {
    // 1000 cycles, 25% crit, ×3 → EV factor = 1 + 0.25*2 = 1.5
    expect(payoutWithCrit(10, 1000, 0.25, 3, rngNever)).toBeCloseTo(10 * 1000 * 1.5)
  })
})

describe('crit composition (gambler role)', () => {
  it('a Gambler grants crit chance (capped) and raises crit multiplier', () => {
    const s = initialGameState(0)
    s.cash = 1e12
    s.businesses.lemonade.owned = 1
    s.businesses.lemonade.unlocked = true
    const base = computeEmployeeEffects(s, BUSINESSES.lemonade, s.businesses.lemonade)
    expect(base.critChance).toBe(0)
    expect(base.critMult).toBe(2)

    const id = hireEmployee(s, 'lady_luck')! // gambler, rare, tech affinity (no affinity on food)
    s.employees[id].traits = [] // isolate the gambler role from its 'lucky' trait
    assignToFirstFreeSlot(s, id, 'lemonade')
    const eff = computeEmployeeEffects(s, BUSINESSES.lemonade, s.businesses.lemonade)
    // rare = ×2.25 → critChance 0.08*2.25 = 0.18, critMult 2 + 1.5*2.25 = 5.375
    expect(eff.critChance).toBeCloseTo(0.18, 5)
    expect(eff.critMult).toBeCloseTo(5.375, 5)
  })

  it('caps crit chance at 0.75 with many gamblers', () => {
    const s = initialGameState(0)
    s.cash = 1e12
    s.businesses.lemonade.owned = 300 // unlock all 4 slots
    s.businesses.lemonade.unlocked = true
    for (let i = 0; i < 4; i++) {
      const id = hireEmployee(s, 'lady_luck')!
      assignToFirstFreeSlot(s, id, 'lemonade')
    }
    const eff = computeEmployeeEffects(s, BUSINESSES.lemonade, s.businesses.lemonade)
    expect(eff.critChance).toBeLessThanOrEqual(0.75)
  })
})
