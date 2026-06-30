import { describe, it, expect } from 'vitest'
import { initialGameState } from '../store/initialState'
import { buyUpgrade } from './upgrades'
import { prestigeReset } from './prestige'
import { buyTalent } from './talents'
import { economyMultipliers, prestigePointsFor } from './economy'
import { BUSINESSES } from '../content/businesses'
import { UPGRADES } from '../content/upgrades'

describe('upgrades', () => {
  it('buying applies the effect and deducts cash, once only', () => {
    const s = initialGameState(0)
    s.cash = UPGRADES.lemonade_2x.cost
    const beforeProfit = economyMultipliers(s, BUSINESSES.lemonade).profit

    expect(buyUpgrade(s, 'lemonade_2x')).toBe(true)
    expect(s.cash).toBe(0)
    expect(s.upgradesPurchased).toContain('lemonade_2x')
    expect(economyMultipliers(s, BUSINESSES.lemonade).profit).toBeCloseTo(beforeProfit * 2)

    // Cannot buy again, and broke buys fail.
    expect(buyUpgrade(s, 'lemonade_2x')).toBe(false)
    expect(buyUpgrade(s, 'global_speed_15')).toBe(false) // cash is 0
  })

  it('global and industry scopes only affect matching businesses', () => {
    const s = initialGameState(0)
    s.cash = UPGRADES.tech_profit_2x.cost
    buyUpgrade(s, 'tech_profit_2x') // industry: tech
    expect(economyMultipliers(s, BUSINESSES.mobile_app).profit).toBeCloseTo(2) // tech
    expect(economyMultipliers(s, BUSINESSES.lemonade).profit).toBeCloseTo(1) // food untouched
  })
})

describe('prestige', () => {
  it('refuses below the first token threshold', () => {
    const s = initialGameState(0)
    s.lifetimeEarnings = 500_000 // < $1M → 0 points
    expect(prestigePointsFor(s.lifetimeEarnings)).toBe(0)
    expect(prestigeReset(s)).toBe(false)
  })

  it('grants spendable tokens and wipes the run', () => {
    const s = initialGameState(0)
    s.lifetimeEarnings = 4_000_000 // sqrt(4) → 2 tokens
    s.cash = 123456
    s.career.level = 3
    s.businesses.lemonade.owned = 50
    s.upgradesPurchased.push('lemonade_2x')

    expect(prestigeReset(s)).toBe(true)
    expect(s.prestige.totalPoints).toBe(2)
    expect(s.prestige.spentPoints).toBe(0) // tokens are spendable, not auto-applied
    expect(s.prestige.resets).toBe(1)

    // Run state wiped (no Seed Capital talent → starts broke).
    expect(s.cash).toBe(0)
    expect(s.career.level).toBe(0)
    expect(s.businesses.lemonade.owned).toBe(0)
    expect(s.upgradesPurchased).toHaveLength(0)
    expect(s.lifetimeEarnings).toBe(0)
  })

  it('accumulates tokens across multiple ascensions and preserves talents', () => {
    const s = initialGameState(0)
    s.lifetimeEarnings = 1_000_000
    prestigeReset(s) // +1
    buyTalent(s, 'magnate') // spend the token on a talent
    s.lifetimeEarnings = 9_000_000
    prestigeReset(s) // +3 → total 4
    expect(s.prestige.totalPoints).toBe(4)
    expect(s.prestige.talents.magnate).toBe(1) // talent survives the ascension
    expect(s.prestige.spentPoints).toBe(1)
  })
})
