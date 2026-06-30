// ============================================================
//  Work / Career — the manual income source (pure over GameState).
//  Three stages:
//   1. Bootstrap (Lv 0): tap a shift, earn a flat wage, buy the first business.
//   2. Salary Draw (Lv 0..max): each completed shift pays the GREATER of the flat
//      wage and a slice of the empire's current income, so tapping stays worth it
//      as you grow. Every Nth shift is a "Golden Shift" worth a multiple. Shifts
//      count toward promotions, which raise the wage floor and shorten shifts.
//   3. Senior Consultant (at max career level): the career "retires" — instead of
//      shifts, an optional consulting bonus accrues over time (capped) that the
//      player collects by tapping. A nice top-up when you're bored, never required.
// ============================================================
import type { CareerState, GameState } from '../types/domain'
import { CAREER_LEVELS, MAX_CAREER_LEVEL, careerLevelDef } from '../content/career'
import { automatedIncomePerSec } from './catchUp'

export const SHIFT_START_EPSILON = 1

// --- Salary Draw tuning ---
/** Fraction of total empire income a perfectly-tapped shift adds (per shift-second). */
export const SALARY_DRAW_FRACTION = 0.1
/** Every Nth completed shift pays a multiple (a slot-machine "Golden Shift"). */
export const GOLDEN_SHIFT_EVERY = 10
export const GOLDEN_SHIFT_MULT = 5

// --- Senior Consultant tuning ---
/** Fraction of empire income paid per second of accrued consulting time on collect. */
export const CONSULT_FRACTION = 0.1
/** Consulting bonus pool caps at this many seconds of accrued time. */
export const CONSULT_CAP_SECONDS = 180
export const CONSULT_CAP_MS = CONSULT_CAP_SECONDS * 1000

export function initialCareerState(): CareerState {
  return { level: 0, shiftProgressMs: 0, shiftsThisLevel: 0, totalShifts: 0, consultingMs: 0 }
}

/** True once the player has reached the top of the ladder and "retired" to consulting. */
export function isRetired(state: GameState): boolean {
  return state.career.level >= MAX_CAREER_LEVEL
}

/** The cash a single completed shift pays right now (flat wage floor vs salary draw). */
export function shiftPayout(state: GameState, passivePerSec: number): number {
  const def = careerLevelDef(state.career.level)
  const shiftSec = def.shiftMs / 1000
  return Math.max(def.wage, SALARY_DRAW_FRACTION * passivePerSec * shiftSec)
}

/** The consulting bonus claimable right now (0 until retired / with no idle income). */
export function consultingPayout(state: GameState, passivePerSec: number): number {
  if (!isRetired(state)) return 0
  const seconds = state.career.consultingMs / 1000
  const payout = CONSULT_FRACTION * passivePerSec * seconds
  return Number.isFinite(payout) && payout > 0 ? payout : 0
}

/** Begin a shift if one isn't already running (manual; no-op while in progress or retired). */
export function startShift(state: GameState): void {
  if (isRetired(state)) return
  if (state.career.shiftProgressMs <= 0) {
    state.career.shiftProgressMs = SHIFT_START_EPSILON
  }
}

/**
 * Advance the career each tick.
 *  - Retired: accrue the consulting bonus pool (capped); no shifts run.
 *  - Active: advance an in-progress shift, pay on completion (salary draw + golden),
 *    count it, and check for a promotion.
 */
export function applyCareerTick(state: GameState, dtMs: number): void {
  const c = state.career

  // Senior Consultant: top up the over-time consulting pool, capped. No shifts.
  if (isRetired(state)) {
    c.consultingMs = Math.min(CONSULT_CAP_MS, c.consultingMs + dtMs)
    return
  }

  if (c.shiftProgressMs <= 0) return // idle

  const def = careerLevelDef(c.level)
  c.shiftProgressMs += dtMs
  if (c.shiftProgressMs < def.shiftMs) return

  // One shift per tap: pay (salary draw, with a periodic golden bonus), count it, stop.
  let pay = shiftPayout(state, automatedIncomePerSec(state))
  c.shiftProgressMs = 0
  c.shiftsThisLevel += 1
  c.totalShifts += 1
  if (c.totalShifts % GOLDEN_SHIFT_EVERY === 0) pay *= GOLDEN_SHIFT_MULT
  if (Number.isFinite(pay) && pay > 0) {
    state.cash += pay
    state.lifetimeEarnings += pay
  }

  maybePromote(c)
}

/** Collect the accrued consulting bonus (Senior Consultant stage). Returns cash paid. */
export function claimConsulting(state: GameState): number {
  const payout = consultingPayout(state, automatedIncomePerSec(state))
  if (payout <= 0) return 0
  state.career.consultingMs = 0
  state.cash += payout
  state.lifetimeEarnings += payout
  return payout
}

function maybePromote(c: CareerState): void {
  if (c.level >= MAX_CAREER_LEVEL) return
  const def = CAREER_LEVELS[c.level]
  if (def.shiftsToPromote != null && c.shiftsThisLevel >= def.shiftsToPromote) {
    c.level += 1
    c.shiftsThisLevel = 0
  }
}
