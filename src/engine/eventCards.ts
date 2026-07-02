// ============================================================
//  Business event cards — the active-decision engine. A card surfaces on a
//  DETERMINISTIC cadence (golden.ts tick-counter pattern; the deck rotates by a
//  nextIndex like the contract board — no RNG), offers a 2-option trade-off, and on
//  resolve applies BOUNDED, TRANSIENT effects (one-off cash, or a short timed profit/
//  speed multiplier that folds in like the Golden Deal frenzy). Nothing touches the
//  base curve. Pure over GameState.
//
//  Harness-safe: the greedy bot never resolves a card, so no effect ever activates
//  and pacing is unchanged (the spawn timer alone doesn't move income).
// ============================================================
import type { EventCardsState, GameState } from '../types/domain'
import { EVENT_CARDS, EVENT_CARD_BY_ID, type CardOption } from '../content/eventCards'
import { automatedIncomePerSec } from './catchUp'

export const CARD_SPAWN_INTERVAL_MS = 540_000 // ~9 min between cards (rarest of the tap events)
export const CARD_OFFER_WINDOW_MS = 90_000 // 90s to decide before it auto-declines

export function initialEventCardsState(): EventCardsState {
  return {
    cooldownMs: CARD_SPAWN_INTERVAL_MS,
    offerMsLeft: 0,
    offerCardId: null,
    nextIndex: 0,
    profitMult: 1,
    profitMsLeft: 0,
    speedMult: 1,
    speedMsLeft: 0,
  }
}

/** Timed all-business profit multiplier from a resolved card (1 when none active). */
export function eventProfitMult(state: GameState): number {
  const e = state.eventCards
  return e && e.profitMsLeft > 0 ? e.profitMult : 1
}

/** Timed all-business speed multiplier from a resolved card (1 when none active). */
export function eventSpeedMult(state: GameState): number {
  const e = state.eventCards
  return e && e.speedMsLeft > 0 ? e.speedMult : 1
}

/**
 * Advance the event-card timers. A card only counts down / spawns once the empire
 * has idle income (so a cash trade-off is meaningful), mirroring Golden Deals.
 */
export function tickEventCards(state: GameState, dtMs: number): void {
  const e = state.eventCards
  if (!e) return
  // Active timed effects run on their own clocks.
  if (e.profitMsLeft > 0) e.profitMsLeft = Math.max(0, e.profitMsLeft - dtMs)
  if (e.speedMsLeft > 0) e.speedMsLeft = Math.max(0, e.speedMsLeft - dtMs)
  if (e.offerMsLeft > 0) {
    e.offerMsLeft = Math.max(0, e.offerMsLeft - dtMs)
    if (e.offerMsLeft === 0) declineEventCard(state) // ignored → auto-declines
    return
  }
  if (automatedIncomePerSec(state) <= 0) return // nothing worth deciding over yet
  e.cooldownMs -= dtMs
  if (e.cooldownMs <= 0) {
    const card = EVENT_CARDS[e.nextIndex % EVENT_CARDS.length]
    e.offerCardId = card.id
    e.offerMsLeft = CARD_OFFER_WINDOW_MS
    e.nextIndex = (e.nextIndex ?? 0) + 1
    e.cooldownMs = CARD_SPAWN_INTERVAL_MS
  }
}

/** Apply a single card option's bounded effects. */
function applyOption(state: GameState, opt: CardOption): void {
  const e = state.eventCards
  if (!e) return
  for (const eff of opt.effects) {
    if (eff.kind === 'cash') {
      const amt = automatedIncomePerSec(state) * eff.incomeSeconds
      if (Number.isFinite(amt) && amt !== 0) {
        state.cash = Math.max(0, state.cash + amt)
        if (amt > 0) state.lifetimeEarnings += amt
      }
    } else if (eff.kind === 'profit') {
      e.profitMult = eff.mult
      e.profitMsLeft = eff.durationMs
    } else if (eff.kind === 'speed') {
      e.speedMult = eff.mult
      e.speedMsLeft = eff.durationMs
    }
  }
}

/**
 * Resolve the active card by picking option 'a' or 'b'. Applies the option's effects,
 * clears the offer, resets the cooldown. Returns the chosen option (or null if none).
 */
export function resolveEventCard(state: GameState, choice: 'a' | 'b'): CardOption | null {
  const e = state.eventCards
  if (!e || !e.offerCardId || e.offerMsLeft <= 0) return null
  const card = EVENT_CARD_BY_ID[e.offerCardId]
  if (!card) return null
  const opt = choice === 'a' ? card.a : card.b
  applyOption(state, opt)
  e.offerCardId = null
  e.offerMsLeft = 0
  e.cooldownMs = CARD_SPAWN_INTERVAL_MS
  return opt
}

/** Dismiss the active card with no effect (also used on auto-expiry). */
export function declineEventCard(state: GameState): void {
  const e = state.eventCards
  if (!e) return
  e.offerCardId = null
  e.offerMsLeft = 0
  e.cooldownMs = CARD_SPAWN_INTERVAL_MS
}
