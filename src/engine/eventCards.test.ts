import { describe, it, expect } from 'vitest'
import { initialGameState } from '../store/initialState'
import {
  tickEventCards,
  resolveEventCard,
  declineEventCard,
  eventProfitMult,
  eventSpeedMult,
  CARD_SPAWN_INTERVAL_MS,
  CARD_OFFER_WINDOW_MS,
} from './eventCards'
import { EVENT_CARDS } from '../content/eventCards'
import type { GameState } from '../types/domain'

// A state with idle income (an operator-automated business) so cards spawn + cash effects bite.
function automated(): GameState {
  const s = initialGameState(0)
  s.businesses.lemonade.owned = 30
  s.businesses.lemonade.unlocked = true
  s.employees.op = {
    id: 'op', templateId: 'mickey_gears', name: 'Op', role: 'operator',
    rarity: 'common', level: 1, affinity: null, traits: [], specialisation: null,
  }
  s.businesses.lemonade.assigned = ['op']
  return s
}

function advance(s: GameState, ms: number, step = 1000) {
  for (let t = 0; t < ms; t += step) tickEventCards(s, step)
}

describe('Business event cards — the active-decision layer', () => {
  it('does not surface a card until there is idle income', () => {
    const s = initialGameState(0) // no automated income
    advance(s, CARD_SPAWN_INTERVAL_MS * 2)
    expect(s.eventCards.offerCardId).toBeNull()
  })

  it('surfaces a card on a deterministic cadence and rotates the deck by index', () => {
    const s = automated()
    advance(s, CARD_SPAWN_INTERVAL_MS)
    expect(s.eventCards.offerCardId).toBe(EVENT_CARDS[0].id) // first card, deterministic
    resolveEventCard(s, 'b')
    advance(s, CARD_SPAWN_INTERVAL_MS)
    expect(s.eventCards.offerCardId).toBe(EVENT_CARDS[1].id) // deck advanced by index, not RNG
  })

  it('an ignored card auto-declines after the offer window (no lingering block)', () => {
    const s = automated()
    advance(s, CARD_SPAWN_INTERVAL_MS)
    expect(s.eventCards.offerCardId).not.toBeNull()
    advance(s, CARD_OFFER_WINDOW_MS + 1000)
    expect(s.eventCards.offerCardId).toBeNull()
  })

  it('resolving applies the option effects (cash + a timed buff) and clears the offer', () => {
    const s = automated()
    advance(s, CARD_SPAWN_INTERVAL_MS) // Supply Glut (index 0)
    const cashBefore = s.cash
    const opt = resolveEventCard(s, 'b') // Sell the surplus: +40s income, -30% speed 60s
    expect(opt).not.toBeNull()
    expect(s.cash).toBeGreaterThan(cashBefore) // one-off cash gain
    expect(eventSpeedMult(s)).toBeCloseTo(0.7) // timed speed debuff active
    expect(s.eventCards.offerCardId).toBeNull()
    // The timed effect expires deterministically.
    advance(s, 61_000)
    expect(eventSpeedMult(s)).toBe(1)
  })

  it('a profit-buff option folds a timed multiplier and then expires', () => {
    const s = automated()
    advance(s, CARD_SPAWN_INTERVAL_MS)
    resolveEventCard(s, 'a') // Stockpile: -cash, +60% profit for 60s
    expect(eventProfitMult(s)).toBeCloseTo(1.6)
    advance(s, 61_000)
    expect(eventProfitMult(s)).toBe(1)
  })

  it('declining clears the card with no effect (harness-safe: the bot never resolves)', () => {
    const s = automated()
    advance(s, CARD_SPAWN_INTERVAL_MS)
    declineEventCard(s)
    expect(s.eventCards.offerCardId).toBeNull()
    expect(eventProfitMult(s)).toBe(1)
    expect(eventSpeedMult(s)).toBe(1)
  })
})
