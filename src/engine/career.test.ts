import { describe, it, expect } from 'vitest'
import { startShift, applyCareerTick, initialCareerState } from './career'
import { purchase } from './buy'
import { CAREER_LEVELS } from '../content/career'
import { INDUSTRY_ORDER } from '../content/industries'
import { BUSINESSES } from '../content/businesses'
import { initialGameState } from '../store/initialState'
import type { GameState } from '../types/domain'

function completeShift(s: GameState): void {
  startShift(s)
  applyCareerTick(s, CAREER_LEVELS[s.career.level].shiftMs + 1)
}

describe('work shift cycle + payout', () => {
  it('starts idle and a partial tick does not pay', () => {
    const s = initialGameState(0)
    expect(s.career.shiftProgressMs).toBe(0)
    startShift(s)
    expect(s.career.shiftProgressMs).toBeGreaterThan(0)
    applyCareerTick(s, 100) // far less than a full shift
    expect(s.cash).toBe(0)
    expect(s.career.shiftProgressMs).toBeGreaterThan(0)
  })

  it('pays the level wage on completion and counts the shift', () => {
    const s = initialGameState(0)
    completeShift(s)
    expect(s.cash).toBe(CAREER_LEVELS[0].wage)
    expect(s.career.shiftsThisLevel).toBe(1)
    expect(s.career.totalShifts).toBe(1)
    expect(s.career.shiftProgressMs).toBe(0) // stops after one shift (manual)
  })

  it('starting a shift while one is running is a no-op', () => {
    const s = initialGameState(0)
    startShift(s)
    const p = s.career.shiftProgressMs
    applyCareerTick(s, 100)
    startShift(s) // should not reset progress
    expect(s.career.shiftProgressMs).toBeGreaterThan(p)
  })
})

describe('promotions', () => {
  it('promotes after the required shifts and raises the wage', () => {
    const s = initialGameState(0)
    const toPromote = CAREER_LEVELS[0].shiftsToPromote!
    for (let i = 0; i < toPromote; i++) completeShift(s)
    expect(s.career.level).toBe(1)
    expect(s.career.shiftsThisLevel).toBe(0)

    const before = s.cash
    completeShift(s)
    expect(s.cash - before).toBe(CAREER_LEVELS[1].wage)
    expect(CAREER_LEVELS[1].wage).toBeGreaterThan(CAREER_LEVELS[0].wage)
  })

  it('does not promote past the top of the ladder', () => {
    const s = initialGameState(0)
    s.career = { ...initialCareerState(), level: CAREER_LEVELS.length - 1 }
    for (let i = 0; i < 50; i++) completeShift(s)
    expect(s.career.level).toBe(CAREER_LEVELS.length - 1)
  })
})

describe('open-industry access (pivot)', () => {
  it('starts broke with every industry visible/unlocked', () => {
    const s = initialGameState(0)
    expect(s.cash).toBe(0)
    for (const id of INDUSTRY_ORDER) expect(s.industries[id].unlocked).toBe(true)
  })

  it('first business of each industry is gated only by affordability', () => {
    const s = initialGameState(0)
    // Retail's first business needs only its own cost — no separate industry unlock.
    expect(purchase(s, 'corner_shop', 1)).toBe(false) // broke
    s.cash = BUSINESSES.corner_shop.baseCost
    expect(purchase(s, 'corner_shop', 1)).toBe(true)
    expect(s.businesses.corner_shop.owned).toBe(1)
    expect(s.purchasedUnlocks).toHaveLength(0) // no industry-unlock payment recorded
  })
})
