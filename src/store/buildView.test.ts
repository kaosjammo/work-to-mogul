import { describe, it, expect } from 'vitest'
import { buildView, REVEAL_UPGRADES_LIFETIME } from './buildView'
import { initialGameState } from './initialState'
import { PRESTIGE_SCALE } from '../engine/economy'

describe('onboarding staged tab reveal', () => {
  it('a fresh player sees only the Business tab', () => {
    const v = buildView(initialGameState(0))
    expect(v.revealedTabs).toEqual({
      employees: false,
      upgrades: false,
      prestige: false,
      stats: false,
    })
  })

  it('reveals Staff once any business is owned', () => {
    const s = initialGameState(0)
    s.businesses.lemonade.owned = 1
    expect(buildView(s).revealedTabs.employees).toBe(true)
  })

  it('reveals Upgrades once lifetime earnings reach the threshold', () => {
    const s = initialGameState(0)
    s.lifetimeEarnings = REVEAL_UPGRADES_LIFETIME
    expect(buildView(s).revealedTabs.upgrades).toBe(true)
  })

  it('reveals Ascend once prestige is unlocked (at the prestige scale)', () => {
    const s = initialGameState(0)
    s.lifetimeEarnings = PRESTIGE_SCALE // PRESTIGE_UNLOCK_LIFETIME
    expect(buildView(s).revealedTabs.prestige).toBe(true)
  })

  it('veterans (have ascended) see every tab immediately, even on a fresh run', () => {
    const s = initialGameState(0) // cash 0, nothing owned
    s.prestige.resets = 1
    expect(buildView(s).revealedTabs).toEqual({
      employees: true,
      upgrades: true,
      prestige: true,
      stats: true,
    })
  })
})

describe('best-buy ROI cue + stats', () => {
  it('marks an owned, affordable business as the best buy', () => {
    const s = initialGameState(0)
    s.cash = 1_000_000
    s.businesses.lemonade.owned = 5
    s.businesses.lemonade.unlocked = true
    expect(buildView(s).businesses.lemonade.isBestBuy).toBe(true)
  })

  it('does not mark a business whose next unit is unaffordable', () => {
    const s = initialGameState(0)
    s.cash = 0
    s.businesses.lemonade.owned = 5
    s.businesses.lemonade.unlocked = true
    expect(buildView(s).businesses.lemonade.isBestBuy).toBe(false)
  })

  it('exposes empire stats aggregates', () => {
    const s = initialGameState(0)
    s.businesses.lemonade.owned = 3
    s.businesses.lemonade.unlocked = true
    const stats = buildView(s).stats
    expect(stats.totalOwned).toBe(3)
    expect(stats.businessesUnlocked).toBeGreaterThanOrEqual(1)
    expect(stats.industriesEntered).toBe(1)
  })
})
