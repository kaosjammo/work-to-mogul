import { describe, it, expect } from 'vitest'
import { initialGameState } from '../store/initialState'
import { buyUpgrade } from './upgrades'
import { prestigeReset, nextTokenLifetime, nextTokenProgress } from './prestige'
import { buyTalent } from './talents'
import { economyMultipliers, prestigePointsFor, PRESTIGE_SCALE, PRESTIGE_YIELD_EXP } from './economy'
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
    s.lifetimeEarnings = 0.5 * PRESTIGE_SCALE // < PRESTIGE_SCALE → 0 points
    expect(prestigePointsFor(s.lifetimeEarnings)).toBe(0)
    expect(prestigeReset(s)).toBe(false)
  })

  it('grants spendable tokens and wipes the run', () => {
    const s = initialGameState(0)
    s.lifetimeEarnings = 32 * PRESTIGE_SCALE // 32^0.2 = 2 tokens
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

  it('reports the lifetime needed for the next token + band progress', () => {
    const s = initialGameState(0)
    // The N-token band starts at lifetime N^(1/exp) × scale (the inverse of the yield
    // curve). Computed from the live exponent so this survives yield re-tunes.
    const bandStart = (n: number) => Math.pow(n, 1 / PRESTIGE_YIELD_EXP) * PRESTIGE_SCALE
    const start2 = bandStart(2)
    const start3 = bandStart(3)

    s.lifetimeEarnings = start2
    expect(prestigePointsFor(s.lifetimeEarnings)).toBe(2)
    expect(nextTokenLifetime(s)).toBeCloseTo(start3, -2) // next token (3) lands at 3^(1/exp)×scale
    expect(nextTokenProgress(s)).toBeCloseTo(0) // at the band start

    // Halfway through the 2→3 band.
    s.lifetimeEarnings = (start2 + start3) / 2
    expect(nextTokenProgress(s)).toBeCloseTo(0.5)

    // From a standing start, the first token is one scale-unit of lifetime away.
    s.lifetimeEarnings = 0
    expect(nextTokenLifetime(s)).toBeCloseTo(PRESTIGE_SCALE)
  })

  it('accumulates tokens across multiple ascensions and preserves talents', () => {
    const s = initialGameState(0)
    s.lifetimeEarnings = PRESTIGE_SCALE
    prestigeReset(s) // +1
    buyTalent(s, 'magnate') // spend the token on a talent
    // A lifetime in the 3-token band (3^(1/exp)×scale) banks 3 tokens on ascension.
    s.lifetimeEarnings = Math.pow(3, 1 / PRESTIGE_YIELD_EXP) * PRESTIGE_SCALE
    prestigeReset(s) // +3 → total 4
    expect(s.prestige.totalPoints).toBe(4)
    expect(s.prestige.talents.magnate).toBe(1) // talent survives the ascension
    expect(s.prestige.spentPoints).toBe(1)
  })
})
