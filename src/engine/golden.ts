// ============================================================
//  Golden Deals — the active-play layer. Periodically (only once there's idle
//  income to fast-forward) a tappable "Golden Deal" appears for a short window.
//  Tapping grants a TIME WARP: instant cash equal to several minutes of idle
//  income (reuses the offline accrual math). Tick-driven, pure over GameState.
// ============================================================
import type { GameState, GoldenState } from '../types/domain'
import { automatedIncomePerSec } from './catchUp'
import { offlineMult, goldenValueMult, goldenFreqMult } from './talents'
import { founderGoldenMult } from './founderPerks'

export const GOLDEN_SPAWN_INTERVAL_MS = 240_000 // ~4 min between deals (rarer → each one matters more)
export const GOLDEN_OFFER_WINDOW_MS = 12_000 // 12s to tap before it's gone
export const GOLDEN_WARP_SECONDS = 900 // reward = 15 min of idle income
export const GOLDEN_MEGA_EVERY = 5 // every Nth deal is a MEGA jackpot (deterministic)
export const GOLDEN_MEGA_MULT = 5 // a MEGA is worth this many normal Time Warps
export const GOLDEN_FRENZY_MS = 20_000 // a claimed deal also grants a 20s "Profit Rush"

export function initialGoldenState(): GoldenState {
  return { offerMsLeft: 0, cooldownMs: GOLDEN_SPAWN_INTERVAL_MS, offerMega: false, spawnCount: 0, frenzyMsLeft: 0 }
}

/** Whether a claimed deal's temporary Profit Rush is currently active. */
export function profitFrenzyActive(state: GameState): boolean {
  return (state.golden?.frenzyMsLeft ?? 0) > 0
}

/** Cash a *normal* Time Warp would grant right now (idle income × warp window). */
export function timeWarpValue(state: GameState): number {
  return (
    automatedIncomePerSec(state) *
    GOLDEN_WARP_SECONDS *
    offlineMult(state) *
    goldenValueMult(state) *
    founderGoldenMult(state)
  )
}

/** Cash the CURRENT offer would grant (MEGA offers pay GOLDEN_MEGA_MULT× a normal one). */
export function goldenOfferValue(state: GameState): number {
  return timeWarpValue(state) * (state.golden?.offerMega ? GOLDEN_MEGA_MULT : 1)
}

/**
 * Advance the golden-deal timers. A deal only counts down / spawns once the
 * empire has idle income worth fast-forwarding (so the reward is meaningful and
 * deals don't appear in the manual early game).
 */
export function tickGolden(state: GameState, dtMs: number): void {
  const g = state.golden
  if (!g) return
  // The Profit Rush counts down on its own clock, independent of offers/income.
  if (g.frenzyMsLeft > 0) g.frenzyMsLeft = Math.max(0, g.frenzyMsLeft - dtMs)
  if (g.offerMsLeft > 0) {
    g.offerMsLeft = Math.max(0, g.offerMsLeft - dtMs) // expires unclaimed if it hits 0
    return
  }
  if (automatedIncomePerSec(state) <= 0) return // nothing to warp yet
  g.cooldownMs -= dtMs
  if (g.cooldownMs <= 0) {
    g.spawnCount = (g.spawnCount ?? 0) + 1
    g.offerMega = g.spawnCount % GOLDEN_MEGA_EVERY === 0 // every Nth deal is a jackpot
    g.offerMsLeft = GOLDEN_OFFER_WINDOW_MS
    g.cooldownMs = GOLDEN_SPAWN_INTERVAL_MS / goldenFreqMult(state)
  }
}

/**
 * Claim the active golden deal: bank the Time Warp cash AND kick off a short
 * "Profit Rush" (all-business profit multiplier). Clears the offer, resets the
 * cooldown. Returns the cash earned (0 if no active offer).
 */
export function claimGoldenDeal(state: GameState): number {
  const g = state.golden
  if (!g || g.offerMsLeft <= 0) return 0
  const earned = goldenOfferValue(state) // MEGA offers pay more
  g.offerMsLeft = 0
  g.offerMega = false
  g.cooldownMs = GOLDEN_SPAWN_INTERVAL_MS / goldenFreqMult(state)
  g.frenzyMsLeft = GOLDEN_FRENZY_MS // start the Profit Rush
  if (earned > 0 && Number.isFinite(earned)) {
    state.cash += earned
    state.lifetimeEarnings += earned
  }
  return earned
}
