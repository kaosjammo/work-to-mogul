// ============================================================
//  Prestige / "Ascend" reset (placeholder economy, pure over GameState).
//  Wipes the current run (cash, career, businesses, employees, upgrades,
//  milestones) and keeps only the permanent prestige multiplier.
// ============================================================
import type { GameState } from '../types/domain'
import { prestigePointsFor, PRESTIGE_SCALE } from './economy'
import { initialGameState } from '../store/initialState'
import { startCash, tokenYieldMult } from './talents'
import { checkPrestigeMilestones } from './prestigeMilestones'

/** Empire Tokens that would be banked by ascending now (incl. Prestige Scholar). */
export function prestigePending(state: GameState): number {
  const base = prestigePointsFor(state.lifetimeEarnings)
  return Math.floor(base * tokenYieldMult(state))
}

/**
 * Lifetime earnings at which `prestigePending` next increases — the start of the
 * next sqrt "band". `prestigePending` is constant within a band (base is integer),
 * so the next gain always lands at this boundary. Lets the UI answer the core
 * prestige decision: "ascend now, or hold out for one more token?".
 */
export function nextTokenLifetime(state: GameState): number {
  const base = prestigePointsFor(state.lifetimeEarnings)
  return (base + 1) * (base + 1) * PRESTIGE_SCALE
}

/** Progress (0..1) through the current band toward the next token. */
export function nextTokenProgress(state: GameState): number {
  const base = prestigePointsFor(state.lifetimeEarnings)
  const bandStart = base * base * PRESTIGE_SCALE
  const bandEnd = (base + 1) * (base + 1) * PRESTIGE_SCALE
  if (bandEnd <= bandStart) return 0
  return Math.min(1, Math.max(0, (state.lifetimeEarnings - bandStart) / (bandEnd - bandStart)))
}

/** Perform a prestige reset if at least 1 point would be earned. */
export function prestigeReset(state: GameState): boolean {
  const gained = prestigePending(state)
  if (gained < 1) return false

  const totalPoints = state.prestige.totalPoints + gained
  const spentPoints = state.prestige.spentPoints ?? 0
  const talents = { ...(state.prestige.talents ?? {}) }
  const resets = state.prestige.resets + 1
  // Meta-progression survives an ascension.
  const achievements = [...state.achievementsUnlocked]
  const prestigeMilestones = [...(state.prestigeMilestonesClaimed ?? [])]
  const contracts = state.contracts
    ? { active: [...state.contracts.active], nextIndex: state.contracts.nextIndex }
    : undefined

  // Replace all run state with a fresh game, preserving the engineState object
  // reference (the loop holds it) by assigning fresh fields onto it.
  const fresh = initialGameState(state.lastWallClock)
  Object.assign(state, fresh)
  state.prestige = {
    totalPoints,
    spentPoints,
    talents,
    multiplier: 1, // deprecated; profit now comes from talents
    resets,
  }
  state.achievementsUnlocked = achievements
  state.prestigeMilestonesClaimed = prestigeMilestones
  if (contracts) state.contracts = contracts // the missions board persists too
  // Reaching an ascension-count milestone banks bonus tokens (one-time).
  checkPrestigeMilestones(state)
  // Seed Capital talent grants a starting bankroll for the new empire.
  state.cash = startCash(state)
  return true
}
