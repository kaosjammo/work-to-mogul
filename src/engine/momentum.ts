// ============================================================
//  Momentum — the "Hot Streak" combo layer. The three tap events (Golden Deal,
//  Rush Hour, Event Card) are now rarer, so each one should matter MORE. Claiming
//  any of them bumps a shared streak; the streak multiplies the NEXT claimed
//  reward (golden cash, rush-surge length), then decays one level at a time if you
//  stop engaging. This turns three isolated pop-ups into one escalating chain:
//  catch them back-to-back and they pay off progressively harder.
//
//  Pure over GameState; transient (not persisted — fresh on load/prestige).
//  Harness-safe by construction: the greedy sim bot never CLAIMS an event, so
//  `bumpMomentum` is never called, `streak` stays 0, `momentumMult` is exactly 1,
//  and `tickMomentum` early-returns — idle income stays byte-identical in the sim.
// ============================================================
import type { GameState, MomentumState } from '../types/domain'

/** Streak caps here; each level adds STEP to the reward multiplier. */
export const MOMENTUM_MAX = 5
export const MOMENTUM_STEP = 0.2 // ×1.2, ×1.4 … up to ×2.0 at a full streak
/** A claim holds the streak for this long; a lapse drops it one level (not to 0),
 *  so a brief gap costs a little, not everything. Comfortably longer than the
 *  shortest tap-event spacing (Golden, ~4 min) so an engaged player can climb. */
export const MOMENTUM_WINDOW_MS = 240_000

export function initialMomentumState(): MomentumState {
  return { streak: 0, decayMsLeft: 0 }
}

/** Is a hot streak currently running? */
export function momentumActive(state: GameState): boolean {
  return (state.momentum?.streak ?? 0) > 0
}

/**
 * The reward multiplier the CURRENT streak grants (1 at streak 0). Read this
 * BEFORE bumping so a claim is rewarded for the streak it was chained onto, not
 * the one it just created — the first claim of a chain pays ×1, the next ×1.2, etc.
 */
export function momentumMult(state: GameState): number {
  const streak = Math.max(0, Math.min(MOMENTUM_MAX, state.momentum?.streak ?? 0))
  return 1 + MOMENTUM_STEP * streak
}

/**
 * Register a tap-event claim: climb one streak level (capped) and refresh the
 * decay window. Returns the new streak (for the claim's celebration/HUD). Called
 * only from the player-triggered claim paths → never fires for the sim bot.
 */
export function bumpMomentum(state: GameState): number {
  const m = state.momentum
  if (!m) return 0
  m.streak = Math.min(MOMENTUM_MAX, m.streak + 1)
  m.decayMsLeft = MOMENTUM_WINDOW_MS
  return m.streak
}

/**
 * Advance the decay clock. Inert while there's no streak (the bot's case → a true
 * no-op, so income is untouched). On a lapse the streak eases down one level and
 * re-arms, so it fades rather than snapping to zero.
 */
export function tickMomentum(state: GameState, dtMs: number): void {
  const m = state.momentum
  if (!m || m.streak <= 0) return
  m.decayMsLeft -= dtMs
  if (m.decayMsLeft <= 0) {
    m.streak = Math.max(0, m.streak - 1)
    m.decayMsLeft = m.streak > 0 ? MOMENTUM_WINDOW_MS : 0
  }
}
