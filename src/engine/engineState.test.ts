import { describe, it, expect } from 'vitest'
import { getEngineState, setEngineState, resetEngineState } from './engineState'
import { initialGameState } from '../store/initialState'

describe('engine state reset', () => {
  it('resetEngineState returns a fresh game (used by hard reset)', () => {
    // Mutate the live state to look like a played game.
    const s = getEngineState()
    s.cash = 999_999
    s.lifetimeEarnings = 5e9
    s.businesses.lemonade.owned = 250
    s.career.level = 4
    s.achievementsUnlocked.push('millionaire', 'billionaire')
    s.prestige.resets = 3

    resetEngineState()

    const fresh = getEngineState()
    expect(fresh.cash).toBe(0)
    expect(fresh.lifetimeEarnings).toBe(0)
    expect(fresh.businesses.lemonade.owned).toBe(0)
    expect(fresh.career.level).toBe(0)
    expect(fresh.achievementsUnlocked).toEqual([])
    expect(fresh.prestige.resets).toBe(0)
    // industries remain visible (open-industries model)
    expect(fresh.industries.food.unlocked).toBe(true)

    // restore a clean baseline so other suites are unaffected
    setEngineState(initialGameState(0))
  })
})
