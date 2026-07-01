// ============================================================
//  Daily return hook (D7) — a once-per-real-day claimable bonus. The reward is ~2h
//  of the empire's current idle income (reuses the offline-catch-up value math, so it
//  auto-scales across prestige tiers instead of being a fixed late-game pittance).
//  Pure over GameState; the claim takes an explicit `now` so it's unit-testable
//  without real time.
//
//  Harness-safe: it's player-triggered (a claim tap) and the sim/bot never advances
//  wall-clock, so it's inert in harness/progressionLoop — same class as Golden Deals.
// ============================================================
import type { GameState } from '../types/domain'
import { automatedIncomePerSec } from './catchUp'
import { milestoneAt, type DailyMilestone } from '../content/dailyMilestones'

export const DAILY_INCOME_SECONDS = 2 * 3600 // reward ≈ 2h of current idle income

/** Local-day index for a timestamp (two times on the same local day share an index). */
export function localDayIndex(now: number): number {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0) // local midnight
  return Math.round(d.getTime() / 86_400_000)
}

/** The cash a claim would grant right now (flat: 2h of idle income; streak mult is a fast-follow). */
export function dailyReward(state: GameState): number {
  return automatedIncomePerSec(state) * DAILY_INCOME_SECONDS
}

/**
 * Claimable when a new local day has begun AND the empire has idle income (so the
 * reward is meaningful — mirrors Golden Deals only appearing once there's income).
 */
export function canClaimDaily(state: GameState, now: number): boolean {
  if (automatedIncomePerSec(state) <= 0) return false
  return localDayIndex(now) > (state.dailyClaimDay ?? -1)
}

export interface DailyClaimResult {
  cash: number // total cash granted (the daily bonus + any cash-type milestone)
  milestone: DailyMilestone | null // a streak milestone reached this claim, for the celebration
}

/**
 * Claim today's bonus. Grants the reward, advances the streak (consecutive day → +1,
 * a gap → reset to 1), stamps `dailyClaimDay` so it can't be claimed again today, and
 * grants a streak MILESTONE reward if the new streak reaches one. Returns the cash
 * granted + the milestone hit (both zero/null if not currently claimable).
 */
export function claimDaily(state: GameState, now: number): DailyClaimResult {
  if (!canClaimDaily(state, now)) return { cash: 0, milestone: null }
  const today = localDayIndex(now)
  let cash = dailyReward(state)
  state.dailyStreak = state.dailyClaimDay === today - 1 ? (state.dailyStreak ?? 0) + 1 : 1
  state.dailyClaimDay = today
  // A milestone fires exactly when the streak reaches its day (advance-by-1 guarantees
  // each day is hit once; re-earns on a fresh streak-run after a break).
  const milestone = milestoneAt(state.dailyStreak)
  if (milestone) {
    if (milestone.reward.kind === 'cash') cash += dailyReward(state) * milestone.reward.dailyMult
    else if (milestone.reward.kind === 'tokens') {
      state.prestige.totalPoints = (state.prestige.totalPoints ?? 0) + milestone.reward.amount
    }
  }
  if (cash > 0 && Number.isFinite(cash)) {
    state.cash += cash
    state.lifetimeEarnings += cash
  }
  return { cash, milestone }
}
