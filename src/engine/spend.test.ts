import { describe, it, expect } from 'vitest'
import { initialGameState } from '../store/initialState'
import { spendCashBestValue, buyAllAffordableUpgrades } from './spend'
import { UPGRADES } from '../content/upgrades'

describe('spendCashBestValue', () => {
  it('buys units and spends cash', () => {
    const s = initialGameState(0)
    s.cash = 1e6
    const before = s.cash
    const { units, spent } = spendCashBestValue(s, 200)
    expect(units).toBeGreaterThan(0)
    expect(spent).toBeGreaterThan(0)
    expect(spent).toBeLessThanOrEqual(before)
    // Every purchase added exactly one owned unit.
    const totalOwned = Object.values(s.businesses).reduce((n, b) => n + b.owned, 0)
    expect(totalOwned).toBe(units)
    expect(s.cash).toBeCloseTo(before - spent, 2)
  })

  it('respects the buy cap', () => {
    const s = initialGameState(0)
    s.cash = 1e12
    const { units } = spendCashBestValue(s, 5)
    expect(units).toBeLessThanOrEqual(5)
  })

  it('is a no-op with no cash', () => {
    const s = initialGameState(0)
    s.cash = 0
    expect(spendCashBestValue(s)).toEqual({ units: 0, spent: 0 })
  })
})

describe('buyAllAffordableUpgrades', () => {
  it('buys every affordable upgrade and is idempotent', () => {
    const s = initialGameState(0)
    s.cash = 1e30
    const { count, spent } = buyAllAffordableUpgrades(s)
    expect(count).toBe(Object.keys(UPGRADES).length)
    expect(s.upgradesPurchased.length).toBe(count)
    expect(spent).toBeGreaterThan(0)
    // Nothing left to buy.
    expect(buyAllAffordableUpgrades(s).count).toBe(0)
  })

  it('buys only what cash allows', () => {
    const s = initialGameState(0)
    const cheapest = Math.min(...Object.values(UPGRADES).map((u) => u.cost))
    s.cash = cheapest
    const { count } = buyAllAffordableUpgrades(s)
    expect(count).toBeGreaterThanOrEqual(1)
    expect(count).toBeLessThan(Object.keys(UPGRADES).length)
  })
})
