// ============================================================
//  Space Salvage Shooter — campaign ENGINE (pure over GameState, unit-tested).
//  Owns everything except the canvas render: offer gating, the timed-buff + AI-
//  salvage tick, outcome bands, and BOUNDED reward application. The in-mission
//  simulation (ship/enemy/projectile positions) lives only in the React canvas and
//  is NEVER persisted — this engine only sees the final metrics of a finished run.
//
//  Harness-safe by construction: the greedy bot never launches a mission, so it
//  never advances a stage, never earns a buff/unlock, and the AI-salvage branch
//  (gated on aiPilotUnlocked) never fires. Idle pacing is byte-identical.
// ============================================================
import type { GameState, SpaceShooterState } from '../types/domain'
import {
  SPACE_SHOOTER_STAGE_BY_INDEX,
  SPACE_SHOOTER_TOTAL_STAGES,
} from '../content/spaceShooter'
import { automatedIncomePerSec } from './catchUp'
import { ownsSpace } from './economy'

// ----- Pacing (wall-clock cooldowns; cooldownUntil is a Date.now() epoch) -----
/** After PASSING a stage: how long before the NEXT stage's signal returns. */
export const SHOOTER_PASS_COOLDOWN_MS = 12 * 60_000
/** After FAILING: retry the SAME stage after this cooldown. */
export const SHOOTER_FAIL_COOLDOWN_MS = 4 * 60_000
/** After WALKING AWAY before launch: re-arm the same offer shortly (no progress). */
export const SHOOTER_ABORT_COOLDOWN_MS = 60_000

// ----- AI Salvage Pilot (Stage 5 reward): modest automatic salvage income -----
export const AI_SALVAGE_INTERVAL_MS = 5 * 60_000
export const AI_SALVAGE_INCOME_SECONDS = 30

export type Band = 'failed' | 'pass' | 'good' | 'great'

// Cash/buff scaling by outcome band. Failure grants nothing (never run-ending).
const BAND_MULT: Record<Band, number> = { failed: 0, pass: 1, good: 1.6, great: 2.4 }

/** Final metrics of a finished mission, reported by the canvas component. */
export interface MissionMetrics {
  survived: boolean // reached extraction with shields > 0
  enemiesDestroyed: number
  salvageCollected: number
  shieldsRemaining: number
  maxShields: number
  score: number
}

/** Summary of a resolved mission — drives the outcome screen + reward toasts. */
export interface MissionResult {
  band: Band
  stageIndex: number
  stageNumber: number
  advanced: boolean
  cashReward: number
  buffMult: number
  buffMs: number
  unlockedYard: boolean
  unlockedAiPilot: boolean
  newBest: boolean
  score: number
  campaignComplete: boolean
}

export function initialSpaceShooterState(): SpaceShooterState {
  return {
    // persisted campaign progress
    stageCompleted: 0,
    cooldownUntil: 0,
    aiPilotUnlocked: false,
    orbitalYardUnlocked: false,
    bestScores: [0, 0, 0, 0, 0],
    missionsPlayed: 0,
    // transient (fresh on load/prestige, like golden/eventCards)
    buffMult: 1,
    buffMsLeft: 0,
    aiSalvageCooldownMs: AI_SALVAGE_INTERVAL_MS,
  }
}

/** The next incomplete stage index (0..4), or -1 when the campaign is complete. */
export function nextStageIndex(state: GameState): number {
  const done = state.spaceShooter?.stageCompleted ?? 0
  return done >= SPACE_SHOOTER_TOTAL_STAGES ? -1 : done
}

/** Whether the campaign has been fully cleared (all 5 stages passed). */
export function campaignComplete(state: GameState): boolean {
  return (state.spaceShooter?.stageCompleted ?? 0) >= SPACE_SHOOTER_TOTAL_STAGES
}

/**
 * Is a manual salvage mission currently on offer? Requires: owning a Space
 * business, the campaign not finished, the AI pilot not yet taken over, and the
 * cooldown elapsed. `now` is injected (Date.now() at the call site) so this stays
 * pure/testable. Used by buildView (UI-only; the harness never reads buildView).
 */
export function spaceShooterOfferAvailable(state: GameState, now: number): boolean {
  const s = state.spaceShooter
  if (!s) return false
  if (s.aiPilotUnlocked) return false
  if (s.stageCompleted >= SPACE_SHOOTER_TOTAL_STAGES) return false
  if (!ownsSpace(state)) return false
  return now >= (s.cooldownUntil ?? 0)
}

/** Classify a finished mission into an outcome band (pure — unit tested). */
export function computeBand(m: MissionMetrics): Band {
  if (!m.survived) return 'failed'
  const shieldFrac = m.maxShields > 0 ? m.shieldsRemaining / m.maxShields : 0
  const activity = m.enemiesDestroyed + m.salvageCollected
  if (shieldFrac >= 0.66 && activity >= 12) return 'great'
  if (shieldFrac >= 0.33 || activity >= 6) return 'good'
  return 'pass'
}

/**
 * Advance the shooter's transient timers each idle tick (ms-countdown convention,
 * matching tickGolden/tickEventCards). Decrements the run-reward buff and, once the
 * AI pilot is unlocked, drips a small automatic salvage payout while Space is owned.
 */
export function tickSpaceShooter(state: GameState, dtMs: number): void {
  const s = state.spaceShooter
  if (!s) return
  if ((s.buffMsLeft ?? 0) > 0) {
    s.buffMsLeft = Math.max(0, s.buffMsLeft - dtMs)
    if (s.buffMsLeft === 0) s.buffMult = 1
  }
  if (s.aiPilotUnlocked && ownsSpace(state)) {
    s.aiSalvageCooldownMs = (s.aiSalvageCooldownMs ?? AI_SALVAGE_INTERVAL_MS) - dtMs
    if (s.aiSalvageCooldownMs <= 0) {
      s.aiSalvageCooldownMs = AI_SALVAGE_INTERVAL_MS
      const amt = automatedIncomePerSec(state) * AI_SALVAGE_INCOME_SECONDS
      if (Number.isFinite(amt) && amt > 0) {
        state.cash += amt
        state.lifetimeEarnings += amt
      }
    }
  }
}

/**
 * Resolve a finished mission: compute the band, record best score, and apply
 * BOUNDED rewards. A pass advances the campaign (only if this is the current next
 * stage — guards a stale double-submit) and starts the next cooldown; a failure
 * grants nothing and re-arms the SAME stage. Never deducts cash (no run-ending
 * penalty). `now` is injected for the wall-clock cooldown.
 */
export function resolveMission(
  state: GameState,
  stageIndex: number,
  metrics: MissionMetrics,
  now: number,
): MissionResult {
  const s = state.spaceShooter
  const stage = SPACE_SHOOTER_STAGE_BY_INDEX[stageIndex]
  const band = computeBand(metrics)
  s.missionsPlayed = (s.missionsPlayed ?? 0) + 1

  // Best-score bookkeeping (per stage).
  let newBest = false
  if (Array.isArray(s.bestScores) && stageIndex >= 0 && stageIndex < s.bestScores.length) {
    if (metrics.score > (s.bestScores[stageIndex] ?? 0)) {
      s.bestScores[stageIndex] = Math.max(0, Math.round(metrics.score))
      newBest = true
    }
  }

  const result: MissionResult = {
    band,
    stageIndex,
    stageNumber: stage?.number ?? stageIndex + 1,
    advanced: false,
    cashReward: 0,
    buffMult: 1,
    buffMs: 0,
    unlockedYard: false,
    unlockedAiPilot: false,
    newBest,
    score: metrics.score,
    campaignComplete: false,
  }

  if (band === 'failed') {
    s.cooldownUntil = now + SHOOTER_FAIL_COOLDOWN_MS
    return result
  }

  const mult = BAND_MULT[band]
  // Advance only when clearing the CURRENT next stage (stale/replayed submits no-op).
  const isNextStage = stageIndex === s.stageCompleted
  if (isNextStage) {
    s.stageCompleted = Math.min(SPACE_SHOOTER_TOTAL_STAGES, s.stageCompleted + 1)
    result.advanced = true
  }

  const reward = stage?.reward
  if (reward) {
    // Cash: seconds-of-idle-income × band — bounded + scale-appropriate (like event
    // cards / golden deals), so a payout stays meaningful at any point in the game.
    const perSec = automatedIncomePerSec(state)
    const cash = perSec * (reward.cashIncomeSeconds ?? 0) * mult
    if (Number.isFinite(cash) && cash > 0) {
      state.cash += cash
      state.lifetimeEarnings += cash
      result.cashReward = cash
    }
    // Temporary Space-only profit buff (Stage 2's signature reward). Great/good runs
    // get a stronger, longer buff.
    if (reward.buffMult && reward.buffMs) {
      const extraMult = band === 'great' ? 0.4 : band === 'good' ? 0.2 : 0
      const extraMs = band === 'great' ? 30_000 : band === 'good' ? 15_000 : 0
      s.buffMult = reward.buffMult + extraMult
      s.buffMsLeft = reward.buffMs + extraMs
      result.buffMult = s.buffMult
      result.buffMs = s.buffMsLeft
    }
    // Permanent unlocks fire only on the advancing pass (never on a would-be replay).
    if (isNextStage && reward.unlockYard) {
      s.orbitalYardUnlocked = true
      result.unlockedYard = true
    }
    if (isNextStage && reward.unlockAiPilot) {
      s.aiPilotUnlocked = true
      s.aiSalvageCooldownMs = AI_SALVAGE_INTERVAL_MS
      result.unlockedAiPilot = true
    }
  }

  s.cooldownUntil = now + SHOOTER_PASS_COOLDOWN_MS
  result.campaignComplete = s.stageCompleted >= SPACE_SHOOTER_TOTAL_STAGES
  return result
}

/**
 * Walk away before launch (or dismiss the signal): re-arm the SAME offer after a
 * short cooldown. No progress, no reward, no penalty — exactly the "walking away
 * does not progress the stage" requirement.
 */
export function abortMission(state: GameState, now: number): void {
  const s = state.spaceShooter
  if (!s) return
  s.cooldownUntil = now + SHOOTER_ABORT_COOLDOWN_MS
}
