// ============================================================
//  Food's signature mechanic — "Rush Hour". A short, tappable speed-surge window
//  opens on a DETERMINISTIC cadence (the same tick-counter pattern as golden.ts —
//  NO RNG, so the harness/balance sims stay stable). Tapping it kicks off a brief
//  ×N speed surge across the Food industry: an active-play rhythm unique to Food.
//  Pure over GameState; transient state (not persisted — fresh on load/prestige).
//
//  Harness-safe: the greedy bot never claims, so `surgeMsLeft` stays 0 and Food
//  speed is unchanged in the sim — the "sacred first-run" landmarks don't move.
// ============================================================
import type { GameState, RushHourState } from '../types/domain'
import { INDUSTRIES } from '../content/industries'
import { momentumMult, bumpMomentum } from './momentum'

export const FOOD_INDUSTRY_ID = 'food'
export const RUSH_SPAWN_INTERVAL_MS = 360_000 // ~6 min between Rush Hour windows (rarer → less naggy)
export const RUSH_OFFER_WINDOW_MS = 12_000 // 12s to tap the window before it closes
export const RUSH_SURGE_MS = 25_000 // a claimed window boosts Food for 25s
export const RUSH_SPEED_MULT = 3 // Food businesses run ×3 speed during the surge

export function initialRushHourState(): RushHourState {
  return { offerMsLeft: 0, cooldownMs: RUSH_SPAWN_INTERVAL_MS, surgeMsLeft: 0 }
}

/** Whether a claimed Rush Hour surge is currently boosting Food. */
export function foodRushActive(state: GameState): boolean {
  return (state.rushHour?.surgeMsLeft ?? 0) > 0
}

/** Speed multiplier Food businesses get right now (×RUSH during a surge, else 1). */
export function foodRushSpeedMult(state: GameState): number {
  return foodRushActive(state) ? RUSH_SPEED_MULT : 1
}

/** Does the player own any Food business yet? A window is only meaningful then. */
function ownsFood(state: GameState): boolean {
  const ids = INDUSTRIES[FOOD_INDUSTRY_ID]?.businessIds ?? []
  for (const id of ids) if ((state.businesses[id]?.owned ?? 0) > 0) return true
  return false
}

/**
 * Advance the Rush Hour timers. The surge runs on its own clock; a window only
 * counts down toward opening once the player actually owns Food. Mirrors the
 * golden-deal cadence so it shares the same proven, deterministic shape.
 */
export function tickRushHour(state: GameState, dtMs: number): void {
  const r = state.rushHour
  if (!r) return
  if (r.surgeMsLeft > 0) r.surgeMsLeft = Math.max(0, r.surgeMsLeft - dtMs)
  if (r.offerMsLeft > 0) {
    r.offerMsLeft = Math.max(0, r.offerMsLeft - dtMs) // closes unclaimed if it hits 0
    return
  }
  if (!ownsFood(state)) return // no Food yet → no rush hour
  r.cooldownMs -= dtMs
  if (r.cooldownMs <= 0) {
    r.offerMsLeft = RUSH_OFFER_WINDOW_MS
    r.cooldownMs = RUSH_SPAWN_INTERVAL_MS
  }
}

/** Claim the open Rush Hour window → start the Food speed surge. Returns true if claimed. */
export function claimRushHour(state: GameState): boolean {
  const r = state.rushHour
  if (!r || r.offerMsLeft <= 0) return false
  r.offerMsLeft = 0
  r.surgeMsLeft = RUSH_SURGE_MS * momentumMult(state) // Hot Streak lengthens the surge
  r.cooldownMs = RUSH_SPAWN_INTERVAL_MS
  bumpMomentum(state) // this claim feeds the streak for the next one
  return true
}
