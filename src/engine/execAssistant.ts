// ============================================================
//  Executive Assistant — the "poach a rival's right hand" arc (pure over GameState).
//  Three episodic Mogul Stories: you keep crossing paths with Reyna Vaughn, the razor-
//  sharp EA who runs a rival CEO's entire operation. Court all three successfully and
//  she's ready to jump — POACH her and she becomes YOUR Executive Assistant: she
//  auto-reinvests (hire/level/assign/upgrades) AND taps "Work Shift" for you — starting
//  each shift, or collecting the Board Advisor payout once retired. Gated on
//  RELATIONSHIP PROGRESS (arcStage), like the romance arc.
//
//  Harness-safe by construction: every entry point is PLAYER-triggered — the greedy
//  sim bot never resolves a story or poaches, so `unlocked` stays false and the EA
//  tick is inert → idle income stays byte-identical.
//
//  Meta-progression: the EA config (incl. `unlocked`) lives on `automation.invest`,
//  which persists through prestige — a poached EA carries into the new empire.
// ============================================================
import type { GameState } from '../types/domain'
import type { MogulStory } from '../content/mogulStories/types'
import type { OutcomeBand } from './angelDeal'
import { startShift, claimConsulting, isRetired, CONSULT_CAP_MS } from './career'

/** The EA character + the rival CEO she works for (all fictional). */
export const EA_PARTNER_NAME = 'Reyna Vaughn'
export const EA_RIVAL_NAME = 'Gideon Frost'
/** The arc's home: it opens when the Investment Fund is first unlocked. */
export const FUND_BUSINESS_ID = 'fund'

/** The 3 EA episode story ids, in courtship order. Episode k offers only when
 *  `automation.invest.arcStage === k`; a great/good finish advances the stage. */
export const EA_EPISODE_IDS = ['ea_summit', 'ea_warroom', 'ea_offer'] as const
const EA_ID_SET = new Set<string>(EA_EPISODE_IDS)

/** Is this story id one of the EA arc episodes? */
export function isEaStory(storyId: string): boolean {
  return EA_ID_SET.has(storyId)
}

/** The episode's position in the arc (0..2), or -1 for non-EA stories. */
export function eaEpisodeIndex(storyId: string): number {
  return (EA_EPISODE_IDS as readonly string[]).indexOf(storyId)
}

/** Has the player unlocked the Investment Fund (the arc's trigger context)? */
export function ownsFundUnlock(state: GameState): boolean {
  return !!state.businesses[FUND_BUSINESS_ID]?.unlocked
}

/**
 * Bespoke eligibility for EA episodes: only the CURRENT episode in the arc offers,
 * only once the Investment Fund is unlocked, and never after the EA is poached.
 * (Episode 1 is force-surfaced on Fund unlock; episodes 2 & 3 come through the normal
 * arc-preferred rotation.)
 */
export function eaEligible(state: GameState, story: MogulStory): boolean {
  const inv = state.automation?.invest
  if (!inv || inv.unlocked) return false
  if (!ownsFundUnlock(state)) return false
  return eaEpisodeIndex(story.id) === inv.arcStage
}

/**
 * Apply a resolved EA episode. A great/good finish advances the courtship (from the
 * episode's own position only — stale/replayed resolves no-op). No cash swing and no
 * industry boost — the reward is the RELATIONSHIP (progress toward the poach), exactly
 * like the romance arc. Bad/neutral never regress; you can try the episode again.
 */
export function applyEaOutcome(state: GameState, storyId: string, band: OutcomeBand): void {
  const inv = state.automation?.invest
  const idx = eaEpisodeIndex(storyId)
  if (!inv || idx < 0) return
  if (band !== 'great' && band !== 'good') return
  if (inv.arcStage !== idx) return
  inv.arcStage = idx + 1
}

/** Courted all 3 episodes and not yet poached → the Poach offer is live. */
export function canPoachEa(state: GameState): boolean {
  const inv = state.automation?.invest
  return !!inv && !inv.unlocked && inv.arcStage >= EA_EPISODE_IDS.length
}

/**
 * Poach the EA (player action from the main-screen widget): they become YOUR
 * Executive Assistant — auto-reinvest is unlocked + turned on. Free; the three
 * successful episodes were the price. Player-only → the sim bot never poaches, so
 * `unlocked` stays false and the automation/advisor ticks stay inert.
 */
export function poachEa(state: GameState): boolean {
  const inv = state.automation?.invest
  if (!inv || inv.unlocked || !canPoachEa(state)) return false
  inv.unlocked = true
  inv.enabled = true
  inv.cooldownMs = Math.min(inv.cooldownMs, 1000) // act promptly on the new empire's cash
  return true
}

// ── Auto-work: the EA clicks "Work Shift" for you ────────────────────────────
//  Once poached + auto-work is on, the EA keeps the career going hands-free: it
//  auto-starts the next Work Shift the moment one completes, and — after you retire
//  to Senior Consultant — collects the consulting bonus when its pool is full.
//  Runs every tick (shifts are short). Inert unless poached + enabled + toggle on →
//  the sim bot (never poached) is byte-identical.
export function autoWorkCareer(state: GameState): void {
  const inv = state.automation?.invest
  if (!inv || !inv.unlocked || !inv.enabled || !inv.autoWork) return
  if (isRetired(state)) {
    if (state.career.consultingMs >= CONSULT_CAP_MS) claimConsulting(state)
  } else {
    startShift(state) // begins a shift if idle; a no-op while one is running
  }
}
