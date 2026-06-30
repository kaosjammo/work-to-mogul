// ============================================================
//  Golden Deals — the active-play layer. Periodically (only once there's idle
//  income to fast-forward) a tappable "Golden Deal" appears for a short window.
//  Tapping grants a TIME WARP: instant cash equal to several minutes of idle
//  income (reuses the offline accrual math). Tick-driven, pure over GameState.
// ============================================================
import type { GameState, GoldenState } from '../types/domain'
import { automatedIncomePerSec } from './catchUp'
import { offlineMult, goldenValueMult } from './talents'

export const GOLDEN_SPAWN_INTERVAL_MS = 120_000 // ~2 min between deals
export const GOLDEN_OFFER_WINDOW_MS = 12_000 // 12s to tap before it's gone
export const GOLDEN_WARP_SECONDS = 900 // reward = 15 min of idle income

export function initialGoldenState(): GoldenState {
  return { offerMsLeft: 0, cooldownMs: GOLDEN_SPAWN_INTERVAL_MS }
}

/** Cash a Time Warp would grant right now (idle income × warp window). */
export function timeWarpValue(state: GameState): number {
  return automatedIncomePerSec(state) * GOLDEN_WARP_SECONDS * offlineMult(state) * goldenValueMult(state)
}

/**
 * Advance the golden-deal timers. A deal only counts down / spawns once the
 * empire has idle income worth fast-forwarding (so the reward is meaningful and
 * deals don't appear in the manual early game).
 */
export function tickGolden(state: GameState, dtMs: number): void {
  const g = state.golden
  if (!g) return
  if (g.offerMsLeft > 0) {
    g.offerMsLeft = Math.max(0, g.offerMsLeft - dtMs) // expires unclaimed if it hits 0
    return
  }
  if (automatedIncomePerSec(state) <= 0) return // nothing to warp yet
  g.cooldownMs -= dtMs
  if (g.cooldownMs <= 0) {
    g.offerMsLeft = GOLDEN_OFFER_WINDOW_MS
    g.cooldownMs = GOLDEN_SPAWN_INTERVAL_MS
  }
}

/**
 * Claim the active golden deal (a Time Warp). Credits the cash, clears the
 * offer, resets the cooldown. Returns the cash earned (0 if no active offer).
 */
export function claimGoldenDeal(state: GameState): number {
  const g = state.golden
  if (!g || g.offerMsLeft <= 0) return 0
  const earned = timeWarpValue(state)
  g.offerMsLeft = 0
  g.cooldownMs = GOLDEN_SPAWN_INTERVAL_MS
  if (earned > 0 && Number.isFinite(earned)) {
    state.cash += earned
    state.lifetimeEarnings += earned
  }
  return earned
}
