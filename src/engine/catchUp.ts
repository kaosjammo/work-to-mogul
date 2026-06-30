// ============================================================
//  Offline / away catch-up (rule #3). DISTINCT from the game loop's
//  250ms anti-spiral clamp: this credits closed-form earnings for time the
//  tab was hidden/closed, using the wall-clock anchor. Only AUTOMATED
//  businesses earn while away (non-automated need manual taps); Work does not
//  (it's manual). Capped so a long absence can't mint absurd sums.
// ============================================================
import type { GameState } from '../types/domain'
import { BUSINESSES } from '../content/businesses'
import { resolveBusiness } from './resolveBusiness'
import { offlineMult } from './talents'

export const OFFLINE_CAP_MS = 2 * 60 * 60 * 1000 // 2 hours
const MIN_REPORTABLE_MS = 1000

export interface OfflineResult {
  elapsedMs: number
  earned: number
}

/**
 * Credit offline earnings for elapsed wall-clock time and advance the anchor.
 * Mutates state (cash, lifetimeEarnings, lastWallClock). `now` is injected so
 * the function stays deterministic/testable.
 */
export function applyOfflineEarnings(state: GameState, now: number): OfflineResult {
  const raw = now - state.lastWallClock
  const elapsed = Math.max(0, Math.min(raw, OFFLINE_CAP_MS))
  state.lastWallClock = now
  if (elapsed < MIN_REPORTABLE_MS) return { elapsedMs: 0, earned: 0 }

  const seconds = elapsed / 1000
  const earned = automatedIncomePerSec(state) * seconds * offlineMult(state) // Idle Mastery talent

  if (earned > 0 && Number.isFinite(earned)) {
    state.cash += earned
    state.lifetimeEarnings += earned
  }
  return { elapsedMs: elapsed, earned }
}

/**
 * Closed-form idle income per second from AUTOMATED businesses only (crit applied
 * as expected value). Shared by offline catch-up and the Time-Warp golden deal.
 */
export function automatedIncomePerSec(state: GameState): number {
  let perSec = 0
  for (const id in state.businesses) {
    const bs = state.businesses[id]
    if (!bs.unlocked || bs.owned <= 0) continue
    const r = resolveBusiness(state, BUSINESSES[id])
    if (!r.isAutomated) continue // only automated businesses earn while idle
    const critFactor = 1 + r.critChance * (r.critMult - 1)
    perSec += r.pps * critFactor
  }
  return perSec
}
