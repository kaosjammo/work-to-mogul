// ============================================================
//  Lunch Rush — campaign ENGINE (pure over GameState, unit-tested). Owns the
//  offer gating (with the opportunity ROTATION rules), the outcome bands, and
//  BOUNDED reward application. The in-run swarm simulation (fans/hotdogs/tips)
//  lives only in the React canvas and is NEVER persisted — this engine only
//  sees the final metrics of a finished run.
//
//  Harness-safe by construction: the greedy bot never plays a rush, so it never
//  clears a tier, never earns a buff, and the Golden Spatula stays locked.
//  Idle pacing is byte-identical.
// ============================================================
import type { FoodFrenzyState, GameState } from '../types/domain'
import { FOOD_FRENZY_TIERS, FOOD_FRENZY_TOTAL_TIERS, type FrenzyTierDef } from '../content/foodFrenzy'
import { automatedIncomePerSec } from './catchUp'
import { spaceShooterOfferAvailable } from './spaceShooter'

// ----- Pacing (wall-clock cooldowns; cooldownUntil is a Date.now() epoch) -----
/** After CLEARING a tier: how long before the next rush signal returns. */
export const FRENZY_CLEAR_COOLDOWN_MS = 15 * 60_000
/** After getting mobbed (failing): retry after this cooldown. */
export const FRENZY_FAIL_COOLDOWN_MS = 4 * 60_000
/** After walking away before starting: re-arm later (no progress). */
export const FRENZY_ABORT_COOLDOWN_MS = 10 * 60_000
/** "Not now" on the floating chip: a long snooze (matches the story cadence). */
export const FRENZY_SNOOZE_MS = 30 * 60_000

export type FrenzyBand = 'failed' | 'pass' | 'good' | 'great'

// Cash/buff scaling by outcome band. Failure grants nothing (never run-ending).
const BAND_MULT: Record<FrenzyBand, number> = { failed: 0, pass: 1, good: 1.5, great: 2.2 }

/** Final metrics of a finished run, reported by the canvas component. */
export interface FrenzyMetrics {
  survived: boolean // reached closing time with composure > 0
  fansFed: number
  tipsCollected: number
  composureRemaining: number
  maxComposure: number
  level: number // level-ups reached (VS-style)
  score: number
}

/** Summary of a resolved run — drives the outcome screen + reward toasts. */
export interface FrenzyResult {
  band: FrenzyBand
  tierIndex: number
  tierName: string
  cleared: boolean // this run cleared a NEW tier (advanced the campaign)
  cashReward: number
  buffMult: number
  buffMs: number
  unlockedSpatula: boolean
  newBest: boolean
  score: number
  allTiersCleared: boolean
}

export function initialFoodFrenzyState(): FoodFrenzyState {
  return {
    // persisted campaign progress
    tiersCleared: 0,
    cooldownUntil: 0,
    goldenSpatula: false,
    bestScores: [0, 0, 0],
    runsPlayed: 0,
    // transient (fresh on load/prestige, like the shooter's buff)
    buffMult: 1,
    buffMsLeft: 0,
  }
}

/** The tier the next signal targets: the first uncleared one, or the top tier
 *  again once everything is cleared (Lunch Rush stays replayable for buffs). */
export function nextFrenzyTier(state: GameState): FrenzyTierDef {
  const cleared = state.foodFrenzy?.tiersCleared ?? 0
  return FOOD_FRENZY_TIERS[Math.min(cleared, FOOD_FRENZY_TOTAL_TIERS - 1)]
}

/** Does the player own the food truck the whole mini-game is about? */
export function ownsFoodTruck(state: GameState): boolean {
  return (state.businesses.food_truck?.owned ?? 0) > 0
}

/**
 * Is a rush currently on offer? Requires owning the Food Truck and the cooldown
 * elapsed. ROTATION: yields to a pending/active Mogul Story AND to an available
 * Salvage Signal (priority: story > salvage > rush) — so at most one opportunity
 * chip holds the floor, and the two mini-game chips can share a screen slot.
 * `now` is injected (Date.now() at the call site). UI-only; the harness never
 * reads buildView.
 */
export function foodFrenzyOfferAvailable(state: GameState, now: number): boolean {
  const f = state.foodFrenzy
  if (!f) return false
  if (!ownsFoodTruck(state)) return false
  if (state.angelDeal?.offered || state.angelDeal?.active) return false
  if (spaceShooterOfferAvailable(state, now)) return false
  return now >= (f.cooldownUntil ?? 0)
}

/** Classify a finished run into an outcome band (pure — unit tested). */
export function computeFrenzyBand(tier: FrenzyTierDef, m: FrenzyMetrics): FrenzyBand {
  if (!m.survived) return 'failed'
  const composureFrac = m.maxComposure > 0 ? m.composureRemaining / m.maxComposure : 0
  if (m.fansFed >= tier.greatFans && composureFrac >= 0.6) return 'great'
  if (m.fansFed >= tier.goodFans || composureFrac >= 0.4) return 'good'
  return 'pass'
}

/** Advance the transient buff timer each idle tick (ms-countdown convention). */
export function tickFoodFrenzy(state: GameState, dtMs: number): void {
  const f = state.foodFrenzy
  if (!f) return
  if ((f.buffMsLeft ?? 0) > 0) {
    f.buffMsLeft = Math.max(0, f.buffMsLeft - dtMs)
    if (f.buffMsLeft === 0) f.buffMult = 1
  }
}

/**
 * Resolve a finished run: compute the band, record the best score, and apply
 * BOUNDED rewards. Surviving CLEARS the tier when it's the current next one
 * (stale/replayed submits no-op the progress, like the shooter); clearing
 * Festival Night unlocks the permanent Golden Spatula. Failure grants nothing
 * and re-arms the same tier. Never deducts cash.
 */
export function resolveFrenzyRun(
  state: GameState,
  tierIndex: number,
  m: FrenzyMetrics,
  now: number,
): FrenzyResult {
  const f = state.foodFrenzy
  const tier = FOOD_FRENZY_TIERS[tierIndex]
  const band = computeFrenzyBand(tier, m)
  f.runsPlayed = (f.runsPlayed ?? 0) + 1

  let newBest = false
  if (Array.isArray(f.bestScores) && tierIndex >= 0 && tierIndex < f.bestScores.length) {
    if (m.score > (f.bestScores[tierIndex] ?? 0)) {
      f.bestScores[tierIndex] = Math.max(0, Math.round(m.score))
      newBest = true
    }
  }

  const result: FrenzyResult = {
    band,
    tierIndex,
    tierName: tier?.name ?? 'Lunch Rush',
    cleared: false,
    cashReward: 0,
    buffMult: 1,
    buffMs: 0,
    unlockedSpatula: false,
    newBest,
    score: m.score,
    allTiersCleared: false,
  }

  if (band === 'failed') {
    f.cooldownUntil = now + FRENZY_FAIL_COOLDOWN_MS
    return result
  }

  const mult = BAND_MULT[band]
  // Advance only when clearing the CURRENT next tier (replays of cleared tiers
  // still pay the run rewards, but never re-advance or re-unlock).
  const isNextTier = tierIndex === f.tiersCleared
  if (isNextTier) {
    f.tiersCleared = Math.min(FOOD_FRENZY_TOTAL_TIERS, f.tiersCleared + 1)
    result.cleared = true
    if (tierIndex === FOOD_FRENZY_TOTAL_TIERS - 1 && !f.goldenSpatula) {
      f.goldenSpatula = true
      result.unlockedSpatula = true
    }
  }

  // Cash: seconds-of-idle-income × band, with a flat floor so a pre-automation
  // early-game player (the Food Truck unlocks minutes in) still gets a real prize.
  const perSec = automatedIncomePerSec(state)
  const cash = Math.max(perSec * tier.cashIncomeSeconds, tier.cashFloor) * mult
  if (Number.isFinite(cash) && cash > 0) {
    state.cash += cash
    state.lifetimeEarnings += cash
    result.cashReward = cash
  }

  // Food-only timed profit buff — stronger/longer on better bands.
  const extraMult = band === 'great' ? 0.3 : band === 'good' ? 0.15 : 0
  const extraMs = band === 'great' ? 30_000 : band === 'good' ? 15_000 : 0
  f.buffMult = tier.buffMult + extraMult
  f.buffMsLeft = tier.buffMs + extraMs
  result.buffMult = f.buffMult
  result.buffMs = f.buffMsLeft

  f.cooldownUntil = now + FRENZY_CLEAR_COOLDOWN_MS
  result.allTiersCleared = f.tiersCleared >= FOOD_FRENZY_TOTAL_TIERS
  return result
}

/** Walk away before starting (or bail mid-run): re-arm later, no progress, no penalty. */
export function abortFrenzy(state: GameState, now: number): void {
  const f = state.foodFrenzy
  if (!f) return
  f.cooldownUntil = now + FRENZY_ABORT_COOLDOWN_MS
}

/** "Not now" on the floating chip: a long snooze that never shortens a cooldown. */
export function snoozeFrenzy(state: GameState, now: number): void {
  const f = state.foodFrenzy
  if (!f) return
  f.cooldownUntil = Math.max(f.cooldownUntil ?? 0, now + FRENZY_SNOOZE_MS)
}

// NOTE: the economy fold (foodFrenzyProfitMult + GOLDEN_SPATULA_FOOD_PROFIT)
// lives in engine/economy.ts — matching the salvage fold — so the economy stays
// free of import cycles (this module imports spaceShooter, which imports economy).
