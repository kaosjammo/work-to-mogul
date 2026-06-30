import { describe, it, expect } from 'vitest'
import { checkAchievements } from './achievements'
import { prestigeReset } from './prestige'
import { hireEmployee, assignToFirstFreeSlot } from './employees/roster'
import { initialGameState } from '../store/initialState'
import { ACHIEVEMENTS } from '../content/achievements'
import type { GameState } from '../types/domain'

describe('achievements', () => {
  it('unlocks nothing on a fresh state', () => {
    const s = initialGameState(0)
    expect(checkAchievements(s)).toEqual([])
    expect(s.achievementsUnlocked).toEqual([])
  })

  it('unlocks first_shift + first_business + millionaire as conditions are met', () => {
    const s = initialGameState(0)
    s.career.totalShifts = 1
    s.businesses.lemonade.owned = 1
    s.lifetimeEarnings = 1_000_000
    const fresh = checkAchievements(s)
    expect(fresh).toContain('first_shift')
    expect(fresh).toContain('first_business')
    expect(fresh).toContain('millionaire')
  })

  it('is idempotent — already-unlocked are not returned again', () => {
    const s = initialGameState(0)
    s.career.totalShifts = 5
    checkAchievements(s)
    expect(checkAchievements(s)).toEqual([])
  })

  it('unlocks first_automation when an operator automates a business', () => {
    const s: GameState = initialGameState(0)
    s.cash = 1e9
    s.businesses.lemonade.owned = 1
    s.businesses.lemonade.unlocked = true
    const id = hireEmployee(s, 'mickey_gears')! // operator
    assignToFirstFreeSlot(s, id, 'lemonade')
    const fresh = checkAchievements(s)
    expect(fresh).toContain('first_hire')
    expect(fresh).toContain('first_automation')
  })

  it('persists achievements through an ascension', () => {
    const s = initialGameState(0)
    s.career.totalShifts = 1
    s.lifetimeEarnings = 4_000_000
    checkAchievements(s) // unlocks first_shift, millionaire
    const before = [...s.achievementsUnlocked]
    expect(before.length).toBeGreaterThan(0)

    expect(prestigeReset(s)).toBe(true)
    // run state wiped, but achievements kept
    expect(s.businesses.lemonade.owned).toBe(0)
    for (const id of before) expect(s.achievementsUnlocked).toContain(id)
  })

  it('every achievement is reachable — a maxed state unlocks them all', () => {
    const s = initialGameState(0)
    s.cash = 1e9
    s.career.totalShifts = 999
    s.career.level = 5
    s.lifetimeEarnings = 1e9
    s.prestige.resets = 1
    // Own ≥1 in all 7 industries' first business (lemonade also at 500).
    const firstBiz = ['lemonade', 'corner_shop', 'mobile_app', 'apartments', 'courier', 'solar_farm', 'satellite']
    for (const id of firstBiz) {
      s.businesses[id].owned = id === 'lemonade' ? 500 : 1
      s.businesses[id].unlocked = true
    }
    // 10 staff incl. an operator that automates lemonade.
    const op = hireEmployee(s, 'mickey_gears')!
    assignToFirstFreeSlot(s, op, 'lemonade')
    for (let i = 0; i < 9; i++) hireEmployee(s, 'flash_ortega')

    checkAchievements(s)
    expect(s.achievementsUnlocked.length).toBe(ACHIEVEMENTS.length)
  })
})
