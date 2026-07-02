import { describe, it, expect } from 'vitest'
import type { GameState } from '../types/domain'
import { initialGameState } from '../store/initialState'
import {
  initialMomentumState,
  momentumActive,
  momentumMult,
  bumpMomentum,
  tickMomentum,
  MOMENTUM_MAX,
  MOMENTUM_STEP,
  MOMENTUM_WINDOW_MS,
} from './momentum'
import { tickGolden, claimGoldenDeal, GOLDEN_SPAWN_INTERVAL_MS } from './golden'
import { tickRushHour, claimRushHour, RUSH_SPAWN_INTERVAL_MS, RUSH_SURGE_MS } from './rushHour'
import { resolveEventCard } from './eventCards'
import { EVENT_CARDS } from '../content/eventCards'
import { expireTransientsOffline } from './catchUp'
import { applyTick } from './simulate'

/** Owns an AUTOMATED Food business → idle income (golden/cards) + Food (rush). */
function seeded(): GameState {
  const s = initialGameState(0)
  s.businesses.lemonade.owned = 20
  s.businesses.lemonade.unlocked = true
  s.employees.op = {
    id: 'op', templateId: 'x', name: 'Op', role: 'operator',
    rarity: 'common', level: 1, affinity: null, traits: [], specialisation: null,
  }
  s.businesses.lemonade.assigned = ['op']
  return s
}

describe('Momentum — the Hot Streak combo', () => {
  it('starts empty and inert', () => {
    const m = initialMomentumState()
    expect(m.streak).toBe(0)
    expect(m.decayMsLeft).toBe(0)
    expect(momentumMult(seeded())).toBe(1)
    expect(momentumActive(seeded())).toBe(false)
  })

  it('momentumMult rises per level and caps at MOMENTUM_MAX', () => {
    const s = seeded()
    s.momentum.streak = 1
    expect(momentumMult(s)).toBeCloseTo(1 + MOMENTUM_STEP)
    s.momentum.streak = 3
    expect(momentumMult(s)).toBeCloseTo(1 + MOMENTUM_STEP * 3)
    s.momentum.streak = 999 // past the cap
    expect(momentumMult(s)).toBeCloseTo(1 + MOMENTUM_STEP * MOMENTUM_MAX)
  })

  it('bumpMomentum climbs (capped) and arms the decay window', () => {
    const s = seeded()
    expect(bumpMomentum(s)).toBe(1)
    expect(s.momentum.decayMsLeft).toBe(MOMENTUM_WINDOW_MS)
    for (let i = 0; i < 20; i++) bumpMomentum(s)
    expect(s.momentum.streak).toBe(MOMENTUM_MAX) // never exceeds the cap
  })

  it('decays ONE level per window lapse, then clears and goes inert', () => {
    const s = seeded()
    bumpMomentum(s)
    bumpMomentum(s) // streak 2
    tickMomentum(s, MOMENTUM_WINDOW_MS) // one lapse → drop a level
    expect(s.momentum.streak).toBe(1)
    tickMomentum(s, MOMENTUM_WINDOW_MS) // → 0
    expect(s.momentum.streak).toBe(0)
    expect(s.momentum.decayMsLeft).toBe(0)
    // Fully decayed → a no-op (this is the sim-bot's steady state).
    tickMomentum(s, MOMENTUM_WINDOW_MS * 5)
    expect(s.momentum.streak).toBe(0)
  })

  it('a brief gap (shorter than the window) keeps the streak', () => {
    const s = seeded()
    bumpMomentum(s) // streak 1, window armed
    tickMomentum(s, MOMENTUM_WINDOW_MS - 1000)
    expect(s.momentum.streak).toBe(1) // still hot
  })
})

describe('Momentum — amplifies the tap-event rewards', () => {
  it('golden payout scales by the streak multiplier (first claim ×1, chained higher)', () => {
    const s = seeded()
    tickGolden(s, GOLDEN_SPAWN_INTERVAL_MS) // spawn at streak 0
    const base = claimGoldenDeal(s) // ×1
    expect(base).toBeGreaterThan(0)
    expect(s.momentum.streak).toBe(1) // the claim fed the streak

    s.momentum.streak = MOMENTUM_MAX // force a full streak
    tickGolden(s, GOLDEN_SPAWN_INTERVAL_MS) // spawn again (same, non-mega)
    const boosted = claimGoldenDeal(s)
    expect(boosted).toBeCloseTo(base * (1 + MOMENTUM_STEP * MOMENTUM_MAX), 0)
  })

  it('rush surge length scales with the streak', () => {
    const s = seeded()
    tickRushHour(s, RUSH_SPAWN_INTERVAL_MS) // open a window
    s.momentum.streak = MOMENTUM_MAX
    expect(claimRushHour(s)).toBe(true)
    expect(s.rushHour.surgeMsLeft).toBeCloseTo(RUSH_SURGE_MS * (1 + MOMENTUM_STEP * MOMENTUM_MAX))
  })

  it('resolving an event card feeds the streak (engagement builds the combo)', () => {
    const s = seeded()
    s.eventCards.offerCardId = EVENT_CARDS[0].id
    s.eventCards.offerMsLeft = 90_000
    expect(s.momentum.streak).toBe(0)
    resolveEventCard(s, 'a')
    expect(s.momentum.streak).toBe(1)
  })
})

describe('Momentum — HARNESS byte-inertness', () => {
  it('never builds a streak through applyTick when nothing is claimed', () => {
    const s = seeded()
    const rng = () => 0.5
    for (let i = 0; i < 200; i++) applyTick(s, 100, rng)
    expect(s.momentum.streak).toBe(0) // bot never claims → no combo
    expect(s.momentum.decayMsLeft).toBe(0)
  })

  it('a long absence clears the streak', () => {
    const s = seeded()
    bumpMomentum(s)
    bumpMomentum(s) // streak 2
    expireTransientsOffline(s, MOMENTUM_WINDOW_MS + 1000)
    expect(s.momentum.streak).toBe(0)
    expect(s.momentum.decayMsLeft).toBe(0)
  })
})
