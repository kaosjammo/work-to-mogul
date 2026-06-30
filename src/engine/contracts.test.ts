import { describe, it, expect } from 'vitest'
import type { EmployeeInstance } from '../types/domain'
import { initialGameState } from '../store/initialState'
import { initialContractsState, claimContract, contractMetric, isContractComplete } from './contracts'
import { CONTRACTS, CONTRACT_BY_ID, CONTRACT_BOARD_SIZE } from '../content/contracts'
import { prestigeReset } from './prestige'

function anyEmp(): EmployeeInstance {
  return { id: 'e1', templateId: 't', name: 'E', role: 'runner', rarity: 'common', level: 1, affinity: null, traits: [], specialisation: null }
}

describe('contracts', () => {
  it('the initial board deals the first N contracts', () => {
    const c = initialContractsState()
    expect(c.active).toEqual(CONTRACTS.slice(0, CONTRACT_BOARD_SIZE).map((x) => x.id))
    expect(c.nextIndex).toBe(CONTRACT_BOARD_SIZE)
  })

  it('computes metrics from state', () => {
    const s = initialGameState(0)
    s.businesses.lemonade.owned = 7
    expect(contractMetric(s, 'totalOwned')).toBe(7)
    s.employees.e1 = anyEmp()
    expect(contractMetric(s, 'employees')).toBe(1)
    s.lifetimeEarnings = 2e6
    expect(contractMetric(s, 'lifetime')).toBe(2e6)
  })

  it('claims a completed contract: grants tokens and rotates the next in', () => {
    const s = initialGameState(0)
    s.businesses.lemonade.owned = 5 // own_5 (target 5) is the first contract
    expect(s.contracts.active).toContain('own_5')
    expect(isContractComplete(s, CONTRACT_BY_ID.own_5)).toBe(true)
    const before = s.prestige.totalPoints

    const granted = claimContract(s, 'own_5')
    expect(granted).toBe(CONTRACT_BY_ID.own_5.rewardTokens)
    expect(s.prestige.totalPoints).toBe(before + granted)
    expect(s.contracts.active).not.toContain('own_5')
    expect(s.contracts.active).toHaveLength(CONTRACT_BOARD_SIZE) // refilled from the pool
    expect(s.contracts.nextIndex).toBe(CONTRACT_BOARD_SIZE + 1)
  })

  it('refuses to claim an incomplete or off-board contract', () => {
    const s = initialGameState(0)
    expect(claimContract(s, 'own_50')).toBe(0) // not on the board
    expect(claimContract(s, 'own_5')).toBe(0) // on the board but 0 owned
  })

  it('the board survives an ascension', () => {
    const s = initialGameState(0)
    s.businesses.lemonade.owned = 5
    claimContract(s, 'own_5')
    const boardBefore = [...s.contracts.active]
    const nextBefore = s.contracts.nextIndex
    s.lifetimeEarnings = 1_000_000
    prestigeReset(s)
    expect(s.contracts.active).toEqual(boardBefore)
    expect(s.contracts.nextIndex).toBe(nextBefore)
  })
})
