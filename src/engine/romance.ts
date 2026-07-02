// ============================================================
//  Romance — the love-story Mogul arc (pure over GameState). Four episodic
//  stories (meet-cute → first date → getaway → proposal) told through the shared
//  Mogul Story runtime, gated on RELATIONSHIP PROGRESS instead of an industry.
//  A successful episode advances the relationship; the proposal landing means
//  marriage — which unlocks the game's one deliberate MONEY SINK: each marriage
//  level drains a growing share of business income per second ("lifestyle
//  upkeep"). Leveling is always the player's choice; the drain never applies
//  offline and can never push cash negative.
//
//  Harness-safe by construction: every entry point is PLAYER-triggered — the
//  greedy sim bot never accepts a date, so `married` stays false, the upkeep
//  branch never fires, and idle income stays byte-identical in the sim.
//
//  Meta-progression: RomanceState persists through prestige (an ascension is
//  not a divorce) — see prestigeReset.
// ============================================================
import type { GameState, RomanceState } from '../types/domain'
import type { MogulStory } from '../content/mogulStories/types'
import type { OutcomeBand } from './angelDeal'
import { automatedIncomePerSec } from './catchUp'

/** The love interest — one character across the whole arc (fictional). */
export const PARTNER_NAME = 'Quinn Harlow'

/** The arc's episode story ids, in relationship order. Episode k is offered only
 *  when `romance.stage === k`; a great/good finish advances the stage. */
export const ROMANCE_EPISODE_IDS = [
  'love_spark',
  'love_first_date',
  'love_getaway',
  'love_proposal',
] as const

const ROMANCE_ID_SET = new Set<string>(ROMANCE_EPISODE_IDS)

/** Modest cash floor before romance offers start (mid-game beat, like the deals). */
export const ROMANCE_MIN_CASH = 1_000_000

/** After a successful date, the next episode offers sooner than the usual story
 *  cadence — momentum matters in a courtship. */
export const ROMANCE_NEXT_DATE_MS = 6 * 60_000

// ── Marriage money-sink tuning ────────────────────────────────────────────────
export const MARRIAGE_MAX_LEVEL = 20
/** Each level drains this share of business income per second (level × 1%). */
export const MARRIAGE_DRAIN_PER_LEVEL = 0.01
/** Level-up price: this many seconds of idle income × the target level. */
export const MARRIAGE_COST_INCOME_SECONDS = 600
export const MARRIAGE_COST_FLOOR = 25_000

/** Flavour name per marriage level (index 1..MAX — level 0 = sink not started). */
export const MARRIAGE_TITLES = [
  '', // level 0 — unused
  'The Honeymoon',
  'Joint Accounts',
  'The Apartment Upgrade',
  'The Dog (Rescue, Obviously)',
  'The House',
  'The Renovation',
  'The Second Renovation',
  'The Garden Wing',
  'The Anniversary Grand Tour',
  'The Lake House',
  'The Boat',
  'The Bigger Boat',
  'The Vineyard',
  'The Gala Circuit',
  'The Private Chef',
  'The Island (Small)',
  'The Island (Actual)',
  'The Observatory',
  'The Family Office',
  'The Dynasty',
]

export function initialRomanceState(): RomanceState {
  return { stage: 0, married: false, marriageLevel: 0, totalSpent: 0 }
}

/** Is this story id one of the romance episodes? */
export function isRomanceStory(storyId: string): boolean {
  return ROMANCE_ID_SET.has(storyId)
}

/** The episode's position in the arc (0..3), or -1 for non-romance stories. */
export function romanceEpisodeIndex(storyId: string): number {
  return (ROMANCE_EPISODE_IDS as readonly string[]).indexOf(storyId)
}

/**
 * Bespoke eligibility for romance episodes (replaces the generic owns-industry
 * gate): only the CURRENT episode in the arc offers, never after marriage, and
 * only once there's a life outside work to fund (cash floor).
 */
export function romanceEligible(state: GameState, story: MogulStory): boolean {
  const r = state.romance
  if (!r || r.married) return false
  if (state.cash < ROMANCE_MIN_CASH) return false
  return romanceEpisodeIndex(story.id) === r.stage
}

/**
 * Apply a resolved romance episode. A great/good finish advances the
 * relationship (only from the episode's own position — stale/replayed resolves
 * no-op); completing the final episode (the proposal) means MARRIAGE, which
 * unlocks the money-sink at level 0 (the drain starts only when the player
 * chooses the first level). Bad/neutral never regress — you can always try
 * again after the cooldown.
 */
export function applyRomanceOutcome(state: GameState, storyId: string, band: OutcomeBand): void {
  const r = state.romance
  const idx = romanceEpisodeIndex(storyId)
  if (!r || idx < 0) return
  if (band !== 'great' && band !== 'good') return
  if (r.stage !== idx) return
  r.stage = idx + 1
  if (r.stage >= ROMANCE_EPISODE_IDS.length) {
    r.married = true
    r.marriageLevel = 0 // the sink is UNLOCKED, not started — leveling is a choice
  }
}

// ── The marriage money-sink ──────────────────────────────────────────────────

/** Share of business income drained per second at the current marriage level. */
export function marriageDrainFraction(state: GameState): number {
  const r = state.romance
  if (!r || !r.married || r.marriageLevel <= 0) return 0
  return Math.min(MARRIAGE_MAX_LEVEL, r.marriageLevel) * MARRIAGE_DRAIN_PER_LEVEL
}

/** A level always costs at least this share of current cash — the spouse's lifestyle
 *  scales with the visible fortune, and it keeps the lump price meaningful even right
 *  after a prestige (income 0, marriage preserved) or with automation unassigned. */
export const MARRIAGE_COST_CASH_FRACTION = 0.1

/** Price of the NEXT marriage level (0 when maxed / not married). Priced off the
 *  larger of income and current cash so the sink can't be bought at the floor by
 *  timing purchases around an ascension or an unassigned roster. */
export function marriageLevelUpCost(state: GameState): number {
  const r = state.romance
  if (!r || !r.married || r.marriageLevel >= MARRIAGE_MAX_LEVEL) return 0
  const target = r.marriageLevel + 1
  const perSec = automatedIncomePerSec(state)
  return Math.max(
    MARRIAGE_COST_FLOOR,
    perSec * MARRIAGE_COST_INCOME_SECONDS * target,
    state.cash * MARRIAGE_COST_CASH_FRACTION,
  )
}

/** Buy the next marriage level (player action). Returns the result, or null. */
export function buyMarriageLevel(
  state: GameState,
): { level: number; cost: number; title: string } | null {
  const r = state.romance
  if (!r || !r.married || r.marriageLevel >= MARRIAGE_MAX_LEVEL) return null
  const cost = marriageLevelUpCost(state)
  if (!(cost > 0) || state.cash < cost) return null
  state.cash -= cost
  r.marriageLevel += 1
  r.totalSpent += cost
  return { level: r.marriageLevel, cost, title: MARRIAGE_TITLES[r.marriageLevel] ?? '' }
}

/**
 * The per-tick drain: takes the marriage's share of the business income earned
 * THIS tick (called from applyTick with the tick's business payout total).
 * Proportional to income → always meaningful, never ruinous; cash floors at 0
 * and lifetimeEarnings is untouched (earned, then spent). Married-only → the
 * sim bot never reaches this branch.
 */
export function applyMarriageUpkeep(state: GameState, earnedThisTick: number): void {
  const frac = marriageDrainFraction(state)
  if (frac <= 0) return
  if (!Number.isFinite(earnedThisTick) || earnedThisTick <= 0) return
  const drain = earnedThisTick * frac
  state.cash = Math.max(0, state.cash - drain)
  state.romance.totalSpent += drain
}
