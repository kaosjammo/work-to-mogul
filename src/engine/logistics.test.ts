import { describe, it, expect } from 'vitest'
import { initialGameState } from '../store/initialState'
import {
  tickLogistics,
  claimDispatch,
  canDispatch,
  logisticsDispatchActive,
  logisticsDispatchProfitMult,
  logisticsLoadFraction,
  dispatchMultAt,
  DISPATCH_FILL_MS,
  DISPATCH_MIN_FRACTION,
  DISPATCH_SURGE_MS,
  DISPATCH_MAX_BONUS,
} from './logistics'
import { economyMultipliers } from './economy'
import { BUSINESSES } from '../content/businesses'

// Drive ms of sim time through the deterministic tick (no RNG → reproducible).
function advance(s: ReturnType<typeof initialGameState>, ms: number, step = 1000) {
  for (let t = 0; t < ms; t += step) tickLogistics(s, step)
}

function withLogistics() {
  const s = initialGameState(0)
  s.businesses.courier.owned = 1 // Logistics owned → cargo can load
  s.businesses.courier.unlocked = true
  return s
}

describe('Logistics Just-In-Time Dispatch — the industry signature mechanic', () => {
  it('does not accrue cargo load until the player owns Logistics', () => {
    const s = initialGameState(0) // nothing owned
    advance(s, DISPATCH_FILL_MS * 2)
    expect(s.logistics.loadMs).toBe(0)
    expect(canDispatch(s)).toBe(false)
  })

  it('accrues load over time, capping at a full load', () => {
    const s = withLogistics()
    advance(s, DISPATCH_FILL_MS / 2)
    expect(logisticsLoadFraction(s)).toBeCloseTo(0.5, 2)
    // Runs well past full — the load caps at 1.0, never overflows.
    advance(s, DISPATCH_FILL_MS * 2)
    expect(logisticsLoadFraction(s)).toBe(1)
    expect(s.logistics.loadMs).toBe(DISPATCH_FILL_MS)
  })

  it('cannot dispatch below the minimum load, then can once it fills enough', () => {
    const s = withLogistics()
    advance(s, DISPATCH_FILL_MS * DISPATCH_MIN_FRACTION * 0.5) // half the threshold
    expect(canDispatch(s)).toBe(false)
    advance(s, DISPATCH_FILL_MS) // now well past the threshold
    expect(canDispatch(s)).toBe(true)
  })

  it('dispatching grants a profit surge scaling with the load, then resets the load', () => {
    const s = withLogistics()
    advance(s, DISPATCH_FILL_MS) // full load
    const mult = claimDispatch(s)
    expect(mult).toBeCloseTo(1 + DISPATCH_MAX_BONUS) // full load → max bonus
    expect(logisticsDispatchActive(s)).toBe(true)
    expect(s.logistics.surgeMsLeft).toBe(DISPATCH_SURGE_MS)
    expect(s.logistics.loadMs).toBe(0) // cargo released
    // The surge expires on its own clock, back to no bonus.
    advance(s, DISPATCH_SURGE_MS + 1000)
    expect(logisticsDispatchActive(s)).toBe(false)
    expect(logisticsDispatchProfitMult(s)).toBe(1)
  })

  it('a partial-load dispatch grants a proportionally smaller surge', () => {
    const s = withLogistics()
    advance(s, DISPATCH_FILL_MS / 2) // ~50% load
    const mult = claimDispatch(s)
    expect(mult).toBeCloseTo(dispatchMultAt(0.5)) // ≈ 1 + 0.5*MAX_BONUS
    expect(mult).toBeLessThan(1 + DISPATCH_MAX_BONUS) // smaller than a full release
  })

  it('dispatching with too little load is a no-op', () => {
    const s = withLogistics()
    expect(claimDispatch(s)).toBe(0) // no load yet
    expect(s.logistics.surgeMsLeft).toBe(0)
  })

  it('the surge multiplies LOGISTICS profit only — other industries are untouched', () => {
    const s = withLogistics()
    const logiBefore = economyMultipliers(s, BUSINESSES.courier).profit
    const foodBefore = economyMultipliers(s, BUSINESSES.lemonade).profit
    s.logistics.surgeMsLeft = DISPATCH_SURGE_MS // force an active surge
    s.logistics.surgeMult = 1 + DISPATCH_MAX_BONUS
    const logiAfter = economyMultipliers(s, BUSINESSES.courier).profit
    const foodAfter = economyMultipliers(s, BUSINESSES.lemonade).profit
    expect(logiAfter).toBeCloseTo(logiBefore * (1 + DISPATCH_MAX_BONUS)) // Logistics surges
    expect(foodAfter).toBeCloseTo(foodBefore) // Food unaffected
  })

  it('is harness-inert: accruing load without dispatching never changes profit', () => {
    const s = withLogistics()
    const before = economyMultipliers(s, BUSINESSES.courier).profit
    advance(s, DISPATCH_FILL_MS * 3) // load fills and caps, but is never released
    expect(logisticsDispatchProfitMult(s)).toBe(1) // no surge → no bonus
    expect(economyMultipliers(s, BUSINESSES.courier).profit).toBeCloseTo(before)
  })
})
