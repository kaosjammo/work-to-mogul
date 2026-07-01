// ============================================================
//  Logistics' signature mechanic — "Just-In-Time Dispatch". A DISTINCT active shape
//  from Food's Rush Hour: instead of an ephemeral tap-window you must catch, Logistics
//  accrues a cargo "load" while owned, and the player RELEASES it on their own timing
//  for a profit surge that SCALES with how full the load was — a bank-and-release
//  timing decision (dispatch small-and-often, or wait for a bigger shipment).
//
//  Logistics keeps its flat `just_in_time: speed ×2` baseline (its "lean/fast" identity,
//  per the reviewer's keep-the-baseline rule); this active layer is a modest, opt-in
//  PROFIT bonus on top. Pure over GameState; transient state (not persisted — fresh on
//  load/prestige), deterministic — NO RNG.
//
//  Harness-safe: the greedy bot never dispatches, so `surgeMsLeft` stays 0 and the
//  dispatch profit multiplier is always 1 — Logistics income is unchanged in the sim
//  (the load meter accrues but is inert until released), so first-run landmarks don't move.
// ============================================================
import type { GameState, LogisticsState } from '../types/domain'
import { INDUSTRIES } from '../content/industries'

export const LOGISTICS_INDUSTRY_ID = 'logistics'
export const DISPATCH_FILL_MS = 150_000 // ~2.5 min of Logistics runtime to a full cargo load
export const DISPATCH_MIN_FRACTION = 0.25 // can dispatch once the load is at least 25% full
export const DISPATCH_SURGE_MS = 30_000 // a released dispatch boosts Logistics profit for 30s
export const DISPATCH_MAX_BONUS = 0.8 // at a full load, +80% Logistics profit (scales with load)

export function initialLogisticsState(): LogisticsState {
  return { loadMs: 0, surgeMsLeft: 0, surgeMult: 1 }
}

/** Does the player own any Logistics business yet? (Gate for accruing cargo load.) */
export function ownsLogistics(state: GameState): boolean {
  const ids = INDUSTRIES[LOGISTICS_INDUSTRY_ID]?.businessIds ?? []
  for (const id of ids) if ((state.businesses[id]?.owned ?? 0) > 0) return true
  return false
}

/** Current cargo-load fraction (0..1). */
export function logisticsLoadFraction(state: GameState): number {
  return Math.min(1, Math.max(0, (state.logistics?.loadMs ?? 0) / DISPATCH_FILL_MS))
}

/** The profit multiplier a dispatch grants for a given load fraction (1 → 1+MAX_BONUS). */
export function dispatchMultAt(fraction: number): number {
  return 1 + DISPATCH_MAX_BONUS * Math.min(1, Math.max(0, fraction))
}

/** Whether a released dispatch surge is currently boosting Logistics profit. */
export function logisticsDispatchActive(state: GameState): boolean {
  return (state.logistics?.surgeMsLeft ?? 0) > 0
}

/** Whether the load is full enough to dispatch right now (and no surge already running). */
export function canDispatch(state: GameState): boolean {
  return !logisticsDispatchActive(state) && logisticsLoadFraction(state) >= DISPATCH_MIN_FRACTION
}

/** Profit multiplier Logistics businesses get right now (surgeMult during a surge, else 1). */
export function logisticsDispatchProfitMult(state: GameState): number {
  return logisticsDispatchActive(state) ? (state.logistics?.surgeMult ?? 1) : 1
}

/**
 * Advance the dispatch timers. A released surge runs on its own clock; cargo load only
 * accrues once the player actually owns Logistics, and pauses while a surge is running
 * (so you can't instantly re-dispatch). Deterministic, no RNG.
 */
export function tickLogistics(state: GameState, dtMs: number): void {
  const l = state.logistics
  if (!l) return
  if (l.surgeMsLeft > 0) {
    l.surgeMsLeft = Math.max(0, l.surgeMsLeft - dtMs)
    if (l.surgeMsLeft === 0) l.surgeMult = 1 // surge ended → back to no bonus
    return // load doesn't accrue while a surge is running
  }
  if (!ownsLogistics(state)) return // no Logistics yet → no cargo to load
  l.loadMs = Math.min(DISPATCH_FILL_MS, l.loadMs + dtMs)
}

/**
 * Release the accrued cargo → a profit surge scaling with the load fraction. Returns the
 * surge multiplier granted (> 1), or 0 when there isn't enough load to dispatch.
 */
export function claimDispatch(state: GameState): number {
  const l = state.logistics
  if (!l || !canDispatch(state)) return 0
  const mult = dispatchMultAt(logisticsLoadFraction(state))
  l.surgeMult = mult
  l.surgeMsLeft = DISPATCH_SURGE_MS
  l.loadMs = 0
  return mult
}
