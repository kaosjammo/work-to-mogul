import { describe, it, expect } from 'vitest'
import { checkAchievements, achievementProgress } from './achievements'
import { prestigeReset } from './prestige'
import { PRESTIGE_SCALE } from './economy'
import { hireEmployee, assignToFirstFreeSlot } from './employees/roster'
import { initialGameState } from '../store/initialState'
import { ACHIEVEMENTS, ACHIEVEMENT_REWARD } from '../content/achievements'
import { UPGRADES } from '../content/upgrades'
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

  it('banks each achievement reward as spendable tokens, exactly once', () => {
    const s = initialGameState(0)
    s.career.totalShifts = 1 // first_shift
    s.businesses.lemonade.owned = 1 // first_business
    const before = s.prestige.totalPoints
    const fresh = checkAchievements(s)
    const expected = fresh.reduce((sum, id) => sum + ACHIEVEMENT_REWARD[id], 0)
    expect(expected).toBeGreaterThan(0)
    expect(s.prestige.totalPoints).toBe(before + expected)
    // Re-checking the same satisfied conditions grants nothing more.
    checkAchievements(s)
    expect(s.prestige.totalPoints).toBe(before + expected)
  })

  it('reports clamped progress for countable goals, null for event goals', () => {
    const s = initialGameState(0)
    s.businesses.lemonade.owned = 50 // toward hundred_units (100)
    expect(achievementProgress(s, 'hundred_units')).toBeCloseTo(0.5)
    s.businesses.lemonade.owned = 200 // overshoot → clamped to 1
    expect(achievementProgress(s, 'hundred_units')).toBe(1)
    s.prestige.resets = 1
    expect(achievementProgress(s, 'ascend_three')).toBeCloseTo(1 / 3)
    // Event/one-shot goals have no meaningful bar.
    expect(achievementProgress(s, 'first_automation')).toBeNull()
    expect(achievementProgress(s, 'reach_space')).toBeNull()
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
    s.lifetimeEarnings = 4 * PRESTIGE_SCALE // enough to ascend
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
    s.cash = 1e12
    s.career.totalShifts = 999
    s.career.level = 5
    s.lifetimeEarnings = 1e18 // covers millionaire → quintillionaire
    s.prestige.resets = 10 // covers first/3/10 ascensions
    s.prestige.spentPoints = 10 // talented
    s.upgradesPurchased = Object.keys(UPGRADES) // fully_upgraded
    // Own ≥1 in all 7 industries' first business; lemonade maxed for the
    // unit-count + specialist goals; Mars Colony for the capstone goal.
    const firstBiz = ['lemonade', 'corner_shop', 'mobile_app', 'apartments', 'courier', 'solar_farm', 'satellite', 'quantum_computer']
    for (const id of firstBiz) {
      s.businesses[id].owned = id === 'lemonade' ? 1000 : 1
      s.businesses[id].unlocked = true
    }
    s.businesses.mars_colony.owned = 1
    s.businesses.mars_colony.unlocked = true
    s.businesses.multiverse.owned = 1 // capstone — multiverse_mogul
    s.businesses.multiverse.unlocked = true
    // 25 staff incl. an operator that automates lemonade; one epic, one maxed level.
    const op = hireEmployee(s, 'mickey_gears')!
    assignToFirstFreeSlot(s, op, 'lemonade')
    for (let i = 0; i < 24; i++) hireEmployee(s, 'flash_ortega')
    const emps = Object.values(s.employees)
    emps[0].rarity = 'epic' // epic_hire
    emps[1].level = 10 // maxed_employee

    checkAchievements(s)
    expect(s.achievementsUnlocked.length).toBe(ACHIEVEMENTS.length)
  })
})
