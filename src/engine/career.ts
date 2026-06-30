// ============================================================
//  Work / Career — the early-game manual income source (pure over GameState).
//  Mirrors the manual-business cycle: tap to start a shift, it runs for the
//  shift duration, pays a wage on completion, then stops. Completed shifts
//  count toward promotions, which raise wages and shorten shifts.
// ============================================================
import type { CareerState, GameState } from '../types/domain'
import { CAREER_LEVELS, MAX_CAREER_LEVEL, careerLevelDef } from '../content/career'

export const SHIFT_START_EPSILON = 1

export function initialCareerState(): CareerState {
  return { level: 0, shiftProgressMs: 0, shiftsThisLevel: 0, totalShifts: 0 }
}

/** Begin a shift if one isn't already running (manual; no-op while in progress). */
export function startShift(state: GameState): void {
  if (state.career.shiftProgressMs <= 0) {
    state.career.shiftProgressMs = SHIFT_START_EPSILON
  }
}

/** Advance an in-progress shift; pay the wage and check promotion on completion. */
export function applyCareerTick(state: GameState, dtMs: number): void {
  const c = state.career
  if (c.shiftProgressMs <= 0) return // idle

  const def = careerLevelDef(c.level)
  c.shiftProgressMs += dtMs
  if (c.shiftProgressMs < def.shiftMs) return

  // One shift per tap: pay, count it, stop.
  const wage = def.wage
  if (Number.isFinite(wage) && wage > 0) {
    state.cash += wage
    state.lifetimeEarnings += wage
  }
  c.shiftProgressMs = 0
  c.shiftsThisLevel += 1
  c.totalShifts += 1

  maybePromote(c)
}

function maybePromote(c: CareerState): void {
  if (c.level >= MAX_CAREER_LEVEL) return
  const def = CAREER_LEVELS[c.level]
  if (def.shiftsToPromote != null && c.shiftsThisLevel >= def.shiftsToPromote) {
    c.level += 1
    c.shiftsThisLevel = 0
  }
}
