import { describe, it, expect } from 'vitest'
import { applyOfflineEarnings, OFFLINE_CAP_MS } from './catchUp'
import { resolveBusiness } from './resolveBusiness'
import { hireEmployee, assignToFirstFreeSlot } from './employees/roster'
import { BUSINESSES } from '../content/businesses'
import { initialGameState } from '../store/initialState'
import type { GameState } from '../types/domain'

function withAutomatedLemonade(): GameState {
  const s = initialGameState(0)
  s.cash = 1e9
  s.businesses.lemonade.owned = 10
  s.businesses.lemonade.unlocked = true
  const op = hireEmployee(s, 'mickey_gears')! // operator → automation
  assignToFirstFreeSlot(s, op, 'lemonade')
  s.cash = 0 // reset so offline earnings are isolated
  return s
}

describe('offline catch-up', () => {
  it('credits automated businesses at their per-second rate', () => {
    const s = withAutomatedLemonade()
    s.lastWallClock = 0
    const pps = resolveBusiness(s, BUSINESSES.lemonade).pps
    const res = applyOfflineEarnings(s, 60_000) // 60s away
    expect(res.elapsedMs).toBe(60_000)
    expect(res.earned).toBeCloseTo(pps * 60, 2)
    expect(s.cash).toBeCloseTo(pps * 60, 2)
    expect(s.lastWallClock).toBe(60_000)
  })

  it('pays nothing for non-automated businesses', () => {
    const s = initialGameState(0)
    s.businesses.lemonade.owned = 10
    s.businesses.lemonade.unlocked = true // no operator → manual
    s.lastWallClock = 0
    const res = applyOfflineEarnings(s, 60_000)
    expect(res.earned).toBe(0)
    expect(s.cash).toBe(0)
  })

  it('caps elapsed time at the offline cap', () => {
    const s = withAutomatedLemonade()
    s.lastWallClock = 0
    const huge = OFFLINE_CAP_MS * 10
    const res = applyOfflineEarnings(s, huge)
    expect(res.elapsedMs).toBe(OFFLINE_CAP_MS)
    // anchor still advances to the real now so we don't re-credit next time
    expect(s.lastWallClock).toBe(huge)
  })

  it('reports nothing for a sub-second gap', () => {
    const s = withAutomatedLemonade()
    s.lastWallClock = 0
    const res = applyOfflineEarnings(s, 200)
    expect(res.elapsedMs).toBe(0)
    expect(res.earned).toBe(0)
  })
})
