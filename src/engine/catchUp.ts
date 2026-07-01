// ============================================================
//  Offline / away catch-up (rule #3). DISTINCT from the game loop's
//  250ms anti-spiral clamp: this credits closed-form earnings for time the
//  tab was hidden/closed, using the wall-clock anchor. Only AUTOMATED
//  businesses earn while away (non-automated need manual taps); Work does not
//  (it's manual). Capped so a long absence can't mint absurd sums.
//
//  Two fairness rules keep this exploit-free:
//   1. The whole span is priced at the STEADY rate (transient buffs excluded —
//      see EconomyFoldOptions). Otherwise "claim a 20s ×2 frenzy → close the
//      tab → return in 2h" would price two hours at the frenzy rate.
//   2. Timed buffs EXPIRE by the elapsed wall time (the tick that normally
//      decrements them is paused while hidden). Otherwise a buff would freeze
//      mid-flight and still be running — already fully paid out — on return.
// ============================================================
import type { GameState } from '../types/domain'
import { BUSINESSES } from '../content/businesses'
import { resolveBusiness } from './resolveBusiness'
import {
  type EconomyFoldOptions,
  ownsFinance,
  FINANCE_COMPOUND_RAMP_MS,
  ownsQuantum,
  SUPERPOSITION_CYCLE_MS,
} from './economy'
import { offlineMult } from './talents'
import { founderOfflineMult } from './founderPerks'

export const OFFLINE_CAP_MS = 2 * 60 * 60 * 1000 // 2 hours
const MIN_REPORTABLE_MS = 1000

export interface OfflineResult {
  elapsedMs: number
  earned: number
}

/**
 * Credit offline earnings for elapsed wall-clock time and advance the anchor.
 * Mutates state (cash, lifetimeEarnings, lastWallClock, timed-buff countdowns).
 * `now` is injected so the function stays deterministic/testable.
 */
export function applyOfflineEarnings(state: GameState, now: number): OfflineResult {
  const raw = now - state.lastWallClock
  const elapsed = Math.max(0, Math.min(raw, OFFLINE_CAP_MS))
  state.lastWallClock = now
  if (elapsed < MIN_REPORTABLE_MS) return { elapsedMs: 0, earned: 0 }

  const seconds = elapsed / 1000
  const earned =
    automatedIncomePerSec(state) * seconds * offlineMult(state) * founderOfflineMult(state) // Idle Mastery talent + Homebody perk

  if (earned > 0 && Number.isFinite(earned)) {
    state.cash += earned
    state.lifetimeEarnings += earned
  }

  // Run the wall clock over every timed transient — buffs the tick would have
  // expired while we were away must not survive into (or double-pay) the return.
  expireTransientsOffline(state, elapsed)

  return { elapsedMs: elapsed, earned }
}

/**
 * Advance/expire timed transient state by `elapsedMs` of away time, mirroring what
 * applyTick would have done. Offers expire unclaimed; buffs/debuffs run out; the
 * slow persistent industry clocks (Finance compound, Quantum phase) advance too.
 */
export function expireTransientsOffline(state: GameState, elapsedMs: number): void {
  if (elapsedMs <= 0) return
  const tick = (ms: number | undefined) => Math.max(0, (ms ?? 0) - elapsedMs)

  const g = state.golden
  if (g) {
    g.frenzyMsLeft = tick(g.frenzyMsLeft)
    if (g.offerMsLeft > 0) {
      g.offerMsLeft = tick(g.offerMsLeft) // expires unclaimed
      if (g.offerMsLeft === 0) g.offerMega = false
    }
  }
  const r = state.rushHour
  if (r) {
    r.surgeMsLeft = tick(r.surgeMsLeft)
    r.offerMsLeft = tick(r.offerMsLeft)
  }
  const l = state.logistics
  if (l) {
    l.surgeMsLeft = tick(l.surgeMsLeft)
    if (l.surgeMsLeft === 0) l.surgeMult = 1
  }
  const e = state.eventCards
  if (e) {
    e.profitMsLeft = tick(e.profitMsLeft)
    e.speedMsLeft = tick(e.speedMsLeft)
    if (e.offerMsLeft > 0) {
      e.offerMsLeft = tick(e.offerMsLeft)
      if (e.offerMsLeft === 0) e.offerCardId = null // auto-declined while away
    }
  }
  const a = state.angelDeal
  if (a && (a.boostMsLeft ?? 0) > 0) {
    a.boostMsLeft = tick(a.boostMsLeft)
    if (a.boostMsLeft === 0) a.boostMult = 1 // a persisted Mogul boost/debuff runs out
  }
  const ss = state.spaceShooter
  if (ss) ss.buffMsLeft = tick(ss.buffMsLeft)
  // Mid-flight risk events resolve while away (they'd have counted down anyway).
  for (const id in state.businesses) {
    const bs = state.businesses[id]
    if (bs.riskEventMsLeft > 0) bs.riskEventMsLeft = tick(bs.riskEventMsLeft)
  }
  // Slow persistent clocks keep pace with wall time, exactly as the tick would.
  if (ownsFinance(state)) {
    state.financeCompoundMs = Math.min(
      FINANCE_COMPOUND_RAMP_MS,
      (state.financeCompoundMs ?? 0) + elapsedMs,
    )
  }
  if (ownsQuantum(state)) {
    state.quantumPhaseMs = ((state.quantumPhaseMs ?? 0) + elapsedMs) % SUPERPOSITION_CYCLE_MS
  }
}

/**
 * Closed-form idle income per second from AUTOMATED businesses only (crit applied
 * as expected value). Shared by offline catch-up, "N seconds of income" rewards
 * (daily bonus, Time Warp, event cards, career pay, salvage) and the HUD.
 *
 * Defaults to the STEADY rate (transient buffs excluded, oscillators at their
 * mean) because every reward caller multiplies this over minutes–hours; pass
 * `{ steady: false }` to read the live instantaneous rate (HUD display).
 */
export function automatedIncomePerSec(
  state: GameState,
  opts: EconomyFoldOptions = { steady: true },
): number {
  let perSec = 0
  for (const id in state.businesses) {
    const bs = state.businesses[id]
    if (!bs.unlocked || bs.owned <= 0) continue
    const r = resolveBusiness(state, BUSINESSES[id], opts)
    if (!r.isAutomated) continue // only automated businesses earn while idle
    const critFactor = 1 + r.critChance * (r.critMult - 1)
    perSec += r.pps * critFactor
  }
  return perSec
}
