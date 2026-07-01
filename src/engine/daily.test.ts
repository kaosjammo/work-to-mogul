import { describe, it, expect } from 'vitest'
import { initialGameState } from '../store/initialState'
import { localDayIndex, canClaimDaily, claimDaily, dailyReward, DAILY_INCOME_SECONDS } from './daily'
import { automatedIncomePerSec } from './catchUp'
import type { GameState } from '../types/domain'

// A state with idle income (an operator-automated business) so the daily has a real reward.
function automated(): GameState {
  const s = initialGameState(0)
  s.businesses.lemonade.owned = 30
  s.businesses.lemonade.unlocked = true
  s.employees.op = {
    id: 'op', templateId: 'mickey_gears', name: 'Op', role: 'operator',
    rarity: 'common', level: 1, affinity: null, traits: [], specialisation: null,
  }
  s.businesses.lemonade.assigned = ['op']
  return s
}

// Noon on consecutive local days — unambiguously different day-buckets, timezone-robust.
const noon = (dayOffset: number) => new Date(2026, 0, 1 + dayOffset, 12, 0, 0).getTime()

describe('Daily return hook (D7)', () => {
  it('buckets timestamps by local day', () => {
    expect(localDayIndex(noon(0))).toBe(localDayIndex(new Date(2026, 0, 1, 23, 30).getTime())) // same day
    expect(localDayIndex(noon(1)) - localDayIndex(noon(0))).toBe(1) // next day
  })

  it('is not claimable without idle income', () => {
    const s = initialGameState(0) // no automation
    expect(canClaimDaily(s, noon(0))).toBe(false)
  })

  it('is claimable once per new local day, and grants ~2h of idle income', () => {
    const s = automated()
    expect(canClaimDaily(s, noon(0))).toBe(true) // fresh (dailyClaimDay = -1)
    const expected = automatedIncomePerSec(s) * DAILY_INCOME_SECONDS
    expect(dailyReward(s)).toBeCloseTo(expected)
    const cashBefore = s.cash
    const { cash } = claimDaily(s, noon(0))
    expect(cash).toBeCloseTo(expected)
    expect(s.cash).toBeCloseTo(cashBefore + expected)
    expect(canClaimDaily(s, noon(0))).toBe(false) // same day → not claimable again
    expect(claimDaily(s, noon(0)).cash).toBe(0) // no retroactive double-claim
  })

  it('advances the streak on consecutive days and resets it after a gap', () => {
    const s = automated()
    claimDaily(s, noon(0))
    expect(s.dailyStreak).toBe(1)
    claimDaily(s, noon(1)) // next day
    expect(s.dailyStreak).toBe(2)
    claimDaily(s, noon(2))
    expect(s.dailyStreak).toBe(3)
    claimDaily(s, noon(5)) // skipped days 3 & 4 → streak breaks
    expect(s.dailyStreak).toBe(1)
  })

  it('fires a streak MILESTONE at its day — cash at Day 3, Empire Tokens at Day 7', () => {
    const s = automated()
    // Day 3: a cash milestone on top of the normal daily.
    const r0 = claimDaily(s, noon(0)) // day 1
    expect(r0.milestone).toBeNull()
    claimDaily(s, noon(1)) // day 2
    const r3 = claimDaily(s, noon(2)) // day 3 → cash milestone
    expect(r3.milestone?.day).toBe(3)
    expect(r3.cash).toBeGreaterThan(dailyReward(s)) // daily + the cash milestone bonus

    // Continue to Day 7 → an Empire-Token milestone (no cash, tokens instead).
    const tokensBefore = s.prestige.totalPoints
    let last
    for (let d = 3; d < 7; d++) last = claimDaily(s, noon(d)) // days 4,5,6,7
    expect(s.dailyStreak).toBe(7)
    expect(last?.milestone?.day).toBe(7)
    expect(s.prestige.totalPoints).toBe(tokensBefore + 3) // +3 tokens granted
  })
})
