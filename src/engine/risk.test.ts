import { describe, it, expect } from 'vitest'
import { applyTick } from './simulate'
import { auditReduction, computeEmployeeEffects } from './employees/composition'
import { hireEmployee, assignToFirstFreeSlot } from './employees/roster'
import { BUSINESSES } from '../content/businesses'
import { initialGameState } from '../store/initialState'
import type { GameState } from '../types/domain'

function financeSetup(): GameState {
  const s = initialGameState(0)
  s.cash = 1e15
  s.businesses.apartments.owned = 5 // Finance, riskEnabled
  s.businesses.apartments.unlocked = true
  return s
}

const noCrit = () => 0.99

describe('risk', () => {
  it('only risk-enabled businesses accrue risk', () => {
    const s = initialGameState(0)
    s.businesses.lemonade.owned = 10
    s.businesses.lemonade.unlocked = true
    for (let i = 0; i < 100; i++) applyTick(s, 100, noCrit)
    expect(s.businesses.lemonade.risk).toBe(0) // Food never accrues
  })

  it('a Finance business builds risk and eventually fires a dampening event', () => {
    const s = financeSetup()
    // ~95s of ticks should cross the 100 threshold (90s accrual).
    let firedAtLeastOnce = false
    for (let i = 0; i < 1000; i++) {
      applyTick(s, 100, noCrit)
      if (s.businesses.apartments.riskEventMsLeft > 0) firedAtLeastOnce = true
    }
    expect(firedAtLeastOnce).toBe(true)
  })

  it('riskPenalty halves output while an event is active', () => {
    const s = financeSetup()
    s.businesses.apartments.riskEventMsLeft = 5000
    const eff = computeEmployeeEffects(s, BUSINESSES.apartments, s.businesses.apartments)
    expect(eff.riskPenalty).toBe(0.5)
  })

  it('an Auditor reduces risk accrual', () => {
    const withAuditor = financeSetup()
    const id = hireEmployee(withAuditor, 'nada_hawk')! // auditor, finance affinity
    assignToFirstFreeSlot(withAuditor, id, 'apartments')
    expect(auditReduction(withAuditor, BUSINESSES.apartments, withAuditor.businesses.apartments)).toBeGreaterThan(0)

    const plain = financeSetup()
    for (let i = 0; i < 200; i++) {
      applyTick(withAuditor, 100, noCrit)
      applyTick(plain, 100, noCrit)
    }
    expect(withAuditor.businesses.apartments.risk).toBeLessThan(plain.businesses.apartments.risk)
  })
})
