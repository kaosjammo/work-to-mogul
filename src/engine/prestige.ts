// ============================================================
//  Prestige / "Ascend" reset (placeholder economy, pure over GameState).
//  Wipes the current run (cash, career, businesses, employees, upgrades,
//  milestones) and keeps only the permanent prestige multiplier.
// ============================================================
import type { GameState } from '../types/domain'
import { prestigePointsFor } from './economy'
import { initialGameState } from '../store/initialState'
import { startCash, tokenYieldMult } from './talents'
import { checkPrestigeMilestones } from './prestigeMilestones'

/** Empire Tokens that would be banked by ascending now (incl. Prestige Scholar). */
export function prestigePending(state: GameState): number {
  const base = prestigePointsFor(state.lifetimeEarnings)
  return Math.floor(base * tokenYieldMult(state))
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
