// ============================================================
//  Prestige / "Ascend" reset (placeholder economy, pure over GameState).
//  Wipes the current run (cash, career, businesses, employees, upgrades,
//  milestones) and keeps only the permanent prestige multiplier.
// ============================================================
import type { GameState } from '../types/domain'
import { prestigePointsFor, PRESTIGE_SCALE, PRESTIGE_YIELD_EXP } from './economy'
import { initialGameState } from '../store/initialState'
import { startCash, tokenYieldMult } from './talents'
import { checkPrestigeMilestones } from './prestigeMilestones'

/** Empire Tokens that would be banked by ascending now (incl. Prestige Scholar). */
export function prestigePending(state: GameState): number {
  const base = prestigePointsFor(state.lifetimeEarnings)
  return Math.floor(base * tokenYieldMult(state))
}

// Lifetime that yields exactly `base` prestige points: invert floor((L/scale)^exp),
// i.e. L = base^(1/exp) × scale. (1/0.2 = 5, a fifth-power band boundary.)
function lifetimeForBase(base: number): number {
  return Math.pow(base, 1 / PRESTIGE_YIELD_EXP) * PRESTIGE_SCALE
}

/**
 * Lifetime earnings at which `prestigePending` next increases — the start of the
 * next yield "band". `prestigePending` is constant within a band (base is integer),
 * so the next gain always lands at this boundary. Lets the UI answer the core
 * prestige decision: "ascend now, or hold out for one more token?".
 */
export function nextTokenLifetime(state: GameState): number {
  const base = prestigePointsFor(state.lifetimeEarnings)
  return lifetimeForBase(base + 1)
}

/** Progress (0..1) through the current band toward the next token. */
export function nextTokenProgress(state: GameState): number {
  const base = prestigePointsFor(state.lifetimeEarnings)
  const bandStart = lifetimeForBase(base)
  const bandEnd = lifetimeForBase(base + 1)
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
  const founderPerk = state.prestige.founderPerk ?? null // chosen style persists across runs
  // Meta-progression survives an ascension.
  const achievements = [...state.achievementsUnlocked]
  // The daily-return hook is wall-clock meta, not run state: ascending must not
  // re-open today's claim or wipe a multi-day streak.
  const dailyClaimDay = state.dailyClaimDay
  const dailyStreak = state.dailyStreak
  const prestigeMilestones = [...(state.prestigeMilestonesClaimed ?? [])]
  const contracts = state.contracts
    ? { active: [...state.contracts.active], nextIndex: state.contracts.nextIndex }
    : undefined
  // The Space Salvage campaign is meta-progression (permanent unlocks like the AI
  // pilot) — its PROGRESS survives ascension; the transient run-reward buff resets
  // with the fresh state (initialGameState seeds a clean buff/AI-salvage timer).
  const salvageCampaign = state.spaceShooter
    ? {
        stageCompleted: state.spaceShooter.stageCompleted,
        cooldownUntil: state.spaceShooter.cooldownUntil,
        aiPilotUnlocked: state.spaceShooter.aiPilotUnlocked,
        orbitalYardUnlocked: state.spaceShooter.orbitalYardUnlocked,
        bestScores: [...(state.spaceShooter.bestScores ?? [])],
        missionsPlayed: state.spaceShooter.missionsPlayed,
      }
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
    founderPerk,
  }
  state.achievementsUnlocked = achievements
  state.prestigeMilestonesClaimed = prestigeMilestones
  state.dailyClaimDay = dailyClaimDay
  state.dailyStreak = dailyStreak
  if (contracts) state.contracts = contracts // the missions board persists too
  if (salvageCampaign) state.spaceShooter = { ...state.spaceShooter, ...salvageCampaign }
  // Reaching an ascension-count milestone banks bonus tokens (one-time).
  checkPrestigeMilestones(state)
  // Seed Capital talent grants a starting bankroll for the new empire.
  state.cash = startCash(state)
  return true
}
