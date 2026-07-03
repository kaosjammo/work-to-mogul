// ============================================================
//  The Affair — the temptation arc + the cheating cascade (pure over GameState).
//  ONLY after the honeymoon is booked, a new woman — Elodie Fontaine, young, warm,
//  traditional, playful, and openly adoring — drifts into the player's orbit. Over a
//  5-episode arc she becomes a real temptation. The mechanic is "repeated smaller
//  temptations": each episode you can keep it innocent (stay faithful) or CROSS A LINE
//  (a betrayal). Cross the line twice — or cross it at the finale — and Quinn FINDS OUT.
//  Getting caught chains straight into a punitive divorce (halves EVERYTHING, ascension
//  tokens included) and, if you poached her, a negotiation to keep Reyna as your EA.
//  Resist to the end and you recommit to Quinn — no loss, and the affair closes for good.
//
//  Nothing physical is ever depicted; the betrayal is one of trust and choice.
//
//  Harness-safe by construction: gated on `honeymoonTaken` (the sim bot never marries,
//  let alone honeymoons), and every step is a PLAYER choice — so none of it fires in the
//  greedy sim and idle income stays byte-identical.
// ============================================================
import type { GameState, AffairState } from '../types/domain'
import type { MogulStory } from '../content/mogulStories/types'
import type { OutcomeBand } from './angelDeal'
import { applyDivorceOutcome } from './divorce'

/** The other woman — one character across the whole arc (fictional). */
export const AFFAIR_PARTNER_NAME = 'Elodie Fontaine'

/** The temptation arc's episode ids, in order (offered one at a time on `affair.stage`). */
export const AFFAIR_EPISODE_IDS = [
  'affair_meet',
  'affair_spark',
  'affair_secret',
  'affair_pull',
  'affair_choice',
] as const

/** The forced-fallout stories (auto-launched when caught — never offered randomly). */
export const AFFAIR_CAUGHT_ID = 'affair_caught' // Quinn's confrontation → the cheating divorce
export const AFFAIR_REYNA_ID = 'affair_reyna' // keep your EA in the wreckage (a losable negotiation)

/** Cross a line this many times (or once at the finale) and Quinn catches on. */
export const AFFAIR_CATCH_SUSPICION = 2

const EP_SET = new Set<string>(AFFAIR_EPISODE_IDS)

export function initialAffairState(): AffairState {
  return { stage: 0, suspicion: 0, cheated: false, reckoned: false, reynaSettled: false, ended: false }
}

export function affairEpisodeIndex(id: string): number {
  return (AFFAIR_EPISODE_IDS as readonly string[]).indexOf(id)
}
export function isAffairEpisode(id: string): boolean {
  return EP_SET.has(id)
}
export function isAffairFalloutStory(id: string): boolean {
  return id === AFFAIR_CAUGHT_ID || id === AFFAIR_REYNA_ID
}
export function isAnyAffairStory(id: string): boolean {
  return isAffairEpisode(id) || isAffairFalloutStory(id)
}

/**
 * Bespoke eligibility for the temptation episodes: only after the honeymoon is booked,
 * only while married (and not already caught / not concluded), and only the CURRENT
 * episode in the arc. The fallout stories are NEVER eligible here — they are forced.
 */
export function affairEligible(state: GameState, story: MogulStory): boolean {
  const a = state.affair
  const r = state.romance
  if (!a || !r) return false
  if (!r.married || r.divorced) return false
  if (!r.honeymoonTaken) return false // the arc only opens after the honeymoon
  if (a.cheated || a.ended) return false
  return affairEpisodeIndex(story.id) === a.stage
}

/**
 * Resolve any affair-family story choice. `band` is the invested outcome, or 'neutral'
 * for a walk-away. Dispatches to the dating episodes, the caught-cheating divorce, or the
 * Reyna retention. Reached only on a PLAYER resolve → harness-inert.
 */
export function resolveAffairChoice(state: GameState, storyId: string, band: OutcomeBand): void {
  if (isAffairEpisode(storyId)) applyAffairEpisode(state, storyId, band)
  else if (storyId === AFFAIR_CAUGHT_ID) applyCaught(state, band)
  else if (storyId === AFFAIR_REYNA_ID) applyReyna(state, band)
}

/**
 * A temptation episode. Choices that CROSS A LINE load `risk` (→ a 'bad' band); staying
 * innocent reads great/good; a walk-away ('neutral') ends the affair faithfully.
 *   - walk away → recommit to Quinn, the affair closes (no loss).
 *   - cross the line → +1 suspicion; at the finale, or once suspicion hits the threshold,
 *     you're CAUGHT (`cheated` — the reckoning chains next).
 *   - stay innocent but keep seeing her → advance; at the finale that's choosing Quinn.
 */
function applyAffairEpisode(state: GameState, storyId: string, band: OutcomeBand): void {
  const a = state.affair
  const idx = affairEpisodeIndex(storyId)
  if (!a || idx < 0 || a.stage !== idx || a.cheated || a.ended) return
  const isFinale = idx === AFFAIR_EPISODE_IDS.length - 1

  if (band === 'neutral') {
    // Walked away from the temptation — you chose the marriage. The affair is over.
    a.ended = true
    return
  }

  a.stage = idx + 1
  const crossedLine = band === 'bad' // the indulgent choices load risk → a 'bad' read
  if (crossedLine) {
    a.suspicion += 1
    if (isFinale || a.suspicion >= AFFAIR_CATCH_SUSPICION) a.cheated = true
  } else if (isFinale) {
    // Reached the end without ever crossing a line, and chose Quinn at the last — faithful.
    a.ended = true
  }
}

/** Quinn's confrontation resolves into a CHEATING divorce (halves everything; a poor
 *  showing also loses the ascension tokens). There is no reconciling this one. */
function applyCaught(state: GameState, band: OutcomeBand): void {
  const a = state.affair
  if (!a) return
  applyDivorceOutcome(state, band, true) // cheating = true → punitive, incl. prestige on bad/neutral
  a.reckoned = true
  a.ended = true
}

/** After the divorce, the fallout reaches your EA. Handle it well (great/good) and Reyna
 *  stays; botch it (bad/neutral) and she walks — the EA unlock is lost. Only fires if you
 *  actually poached her. */
function applyReyna(state: GameState, band: OutcomeBand): void {
  const a = state.affair
  if (!a) return
  a.reynaSettled = true
  const kept = band === 'great' || band === 'good'
  const inv = state.automation?.invest
  if (!kept && inv) {
    // Reyna leaves with the wreckage — the EA is un-poached (re-winnable via the arc again).
    inv.unlocked = false
    inv.enabled = false
    inv.arcStage = 0
    inv.arcStarted = false
  }
}

/**
 * The next story that MUST fire (bypassing the offer rotation), or null. Drives the
 * cheating cascade: a caught betrayal → Quinn's confrontation → (if you have an EA) the
 * Reyna retention. Called from dismissAngelOutcome so each beat chains off the last.
 */
export function nextForcedAffairStory(state: GameState): string | null {
  const a = state.affair
  if (!a) return null
  if (a.cheated && !a.reckoned) return AFFAIR_CAUGHT_ID
  if (a.reckoned && !a.reynaSettled && state.automation?.invest?.unlocked) return AFFAIR_REYNA_ID
  return null
}
