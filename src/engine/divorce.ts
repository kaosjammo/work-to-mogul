// ============================================================
//  Divorce — the settlement negotiation + its consequences (pure over GameState).
//  A marriage can end two ways: the PLAYER initiates an amicable divorce (item 2 —
//  negotiate it well and Quinn, already mega-rich, waves her claim; botch it and she
//  takes half of everything), or Quinn CATCHES the player cheating and initiates a
//  punitive one (item 3 — a guaranteed 50% loss that also bites the ascension tokens).
//  Both run the shared "Divorce Settlement" Mogul Story and share `halveAssets`.
//
//  Harness-safe by construction: every path is PLAYER-triggered — the greedy sim bot
//  never marries, so it never divorces, `halveAssets` never runs, and income stays
//  byte-identical in the sim.
// ============================================================
import type { GameState } from '../types/domain'
import type { OutcomeBand } from './angelDeal'
import { BUSINESSES } from '../content/businesses'
import { reconcileSlots } from './employees/composition'
import { ROMANCE_EPISODE_IDS } from './romance'

/** The player-triggered settlement story id (registered in content/mogulStories). */
export const DIVORCE_STORY_ID = 'divorce_settlement'
export function isDivorceStory(id: string): boolean {
  return id === DIVORCE_STORY_ID
}

/**
 * Halve the player's estate — the cost of a bad settlement. Businesses, cash, one-shot
 * upgrades, and the roster are all cut in half; slots are reconciled so no orphaned
 * assignments survive. With `includePrestige` (the cheating divorce) the ascension
 * tokens are halved and the talent build is wiped too (the tokens stay re-spendable).
 * Milestone bonuses fall out for free — the economy re-derives them from the (now lower)
 * owned counts each tick.
 */
export function halveAssets(state: GameState, opts: { includePrestige?: boolean } = {}): void {
  // Businesses — halve every owned count (floor).
  for (const b of Object.values(state.businesses)) {
    b.owned = Math.floor(b.owned / 2)
  }
  // Cash.
  state.cash = Math.max(0, Math.floor(state.cash / 2))
  // One-shot upgrades — keep every other id (loses ~half).
  state.upgradesPurchased = state.upgradesPurchased.filter((_, i) => i % 2 === 0)
  // Roster — remove the first half of the employees (deterministic, no RNG).
  const empIds = Object.keys(state.employees)
  const removeCount = Math.floor(empIds.length / 2)
  for (let i = 0; i < removeCount; i++) delete state.employees[empIds[i]]
  const survivors = new Set(Object.keys(state.employees))
  // Null any assignment to a removed employee, then reconcile each business's slots
  // against the (possibly lower) owned count + surviving roster.
  for (const [id, bs] of Object.entries(state.businesses)) {
    for (let i = 0; i < bs.assigned.length; i++) {
      if (bs.assigned[i] && !survivors.has(bs.assigned[i]!)) bs.assigned[i] = null
    }
    const def = BUSINESSES[id]
    if (def) reconcileSlots(bs, def, survivors)
  }
  // The cheating divorce also bites the meta-progression.
  if (opts.includePrestige && state.prestige) {
    state.prestige.totalPoints = Math.max(0, Math.floor(state.prestige.totalPoints / 2))
    state.prestige.talents = {} // the talent build is gone…
    state.prestige.spentPoints = 0 // …but the remaining (halved) tokens are re-spendable
  }
}

/** End the marriage: married → false, sink stopped, arc parked past its last episode so
 *  the Quinn arc never re-offers. `divorced` marks the history. */
function endMarriage(state: GameState): void {
  const r = state.romance
  if (!r) return
  r.married = false
  r.divorced = true
  r.marriageLevel = 0
  r.stage = ROMANCE_EPISODE_IDS.length // beyond every episode index → no re-offer
}

/**
 * Apply a resolved Divorce Settlement (the invest/commit branch only). A well-run
 * negotiation (great/good) is a clean split — Quinn keeps her empire, you keep yours,
 * nobody loses an asset. A botched one (bad) costs you HALF of everything. `cheating`
 * escalates a bad-or-not outcome to the guaranteed punitive split incl. ascension tokens.
 * Walking away from the table is handled upstream as a reconciliation (marriage intact).
 */
export function applyDivorceOutcome(state: GameState, band: OutcomeBand, cheating = false): void {
  const r = state.romance
  if (!r || !r.married) return
  if (cheating) {
    // Quinn initiated it — the marriage ends no matter how the table went, and a poor
    // negotiation still halves everything (best case is keeping your ascension tokens).
    endMarriage(state)
    if (band === 'bad' || band === 'neutral') halveAssets(state, { includePrestige: true })
    else halveAssets(state, { includePrestige: false }) // even a great defence loses the estate split
    return
  }
  // Player-initiated amicable divorce.
  endMarriage(state)
  if (band === 'bad') halveAssets(state, { includePrestige: false })
}
