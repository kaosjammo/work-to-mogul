import { describe, it, expect } from 'vitest'
import { initialGameState } from '../store/initialState'
import {
  tickRushHour,
  claimRushHour,
  foodRushActive,
  foodRushSpeedMult,
  RUSH_SPAWN_INTERVAL_MS,
  RUSH_OFFER_WINDOW_MS,
  RUSH_SURGE_MS,
  RUSH_SPEED_MULT,
} from './rushHour'
import { economyMultipliers } from './economy'
import { BUSINESSES } from '../content/businesses'

// Drive ms of sim time through the deterministic tick (no RNG → reproducible).
function advance(s: ReturnType<typeof initialGameState>, ms: number, step = 1000) {
  for (let t = 0; t < ms; t += step) tickRushHour(s, step)
}

function withFood() {
  const s = initialGameState(0)
  s.businesses.lemonade.owned = 1 // Food owned → windows are meaningful
  s.businesses.lemonade.unlocked = true
  return s
}

describe('Food Rush Hour — the industry signature mechanic', () => {
  it('does not open a window until the player owns Food', () => {
    const s = initialGameState(0) // no businesses owned
    advance(s, RUSH_SPAWN_INTERVAL_MS * 2)
    expect(s.rushHour.offerMsLeft).toBe(0) // never opened
  })

  it('opens a tappable window on a deterministic cadence, then closes if ignored', () => {
    const s = withFood()
    advance(s, RUSH_SPAWN_INTERVAL_MS) // reach the cadence
    expect(s.rushHour.offerMsLeft).toBeGreaterThan(0) // window is open
    expect(s.rushHour.offerMsLeft).toBeLessThanOrEqual(RUSH_OFFER_WINDOW_MS)
    // Ignored → it closes after the offer window.
    advance(s, RUSH_OFFER_WINDOW_MS + 1000)
    expect(s.rushHour.offerMsLeft).toBe(0)
    expect(foodRushActive(s)).toBe(false) // ignoring never starts a surge
  })

  it('claiming an open window starts a Food speed surge', () => {
    const s = withFood()
    advance(s, RUSH_SPAWN_INTERVAL_MS)
    expect(claimRushHour(s)).toBe(true)
    expect(s.rushHour.offerMsLeft).toBe(0) // offer consumed
    expect(s.rushHour.surgeMsLeft).toBe(RUSH_SURGE_MS)
    expect(foodRushActive(s)).toBe(true)
    expect(foodRushSpeedMult(s)).toBe(RUSH_SPEED_MULT)
    // The surge expires on its own clock.
    advance(s, RUSH_SURGE_MS + 1000)
    expect(foodRushActive(s)).toBe(false)
    expect(foodRushSpeedMult(s)).toBe(1)
  })

  it('claiming with no open window is a no-op', () => {
    const s = withFood()
    expect(claimRushHour(s)).toBe(false)
    expect(s.rushHour.surgeMsLeft).toBe(0)
  })

  it('the surge multiplies FOOD speed only — other industries are untouched', () => {
    const s = withFood()
    const foodBefore = economyMultipliers(s, BUSINESSES.lemonade).speed
    const retailBefore = economyMultipliers(s, BUSINESSES.corner_shop).speed
    s.rushHour.surgeMsLeft = RUSH_SURGE_MS // force an active surge
    const foodAfter = economyMultipliers(s, BUSINESSES.lemonade).speed
    const retailAfter = economyMultipliers(s, BUSINESSES.corner_shop).speed
    expect(foodAfter).toBeCloseTo(foodBefore * RUSH_SPEED_MULT) // Food surges
    expect(retailAfter).toBeCloseTo(retailBefore) // Retail unaffected
  })
})
