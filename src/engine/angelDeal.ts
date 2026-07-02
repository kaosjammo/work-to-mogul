// ============================================================
//  Angel Investment Deal — engine (pure over GameState). The first Opportunity
//  Mini-Game: a multi-stage visual-novel negotiation with HIDDEN scoring and an
//  outcome band (great / good / neutral / bad).
//
//  Harness-safe by construction: the whole mini-game is PLAYER-triggered — the
//  greedy sim bot never opens or resolves it, so `combinatorUnlocked` stays false
//  and every timed boost stays inert → Finance/Tech income is byte-identical in the
//  sim, and the economy folds below are all ×1 for the bot.
// ============================================================
import type { GameState, IndustryId } from '../types/domain'
import type { AngelDealState } from '../types/domain'
import { ANGEL_DEAL, SCORE_KEYS, type Scores, type RoleBoost, type DealChoice } from '../content/angelDeal'
import { getMogulStory, MOGUL_STORIES, LAUNCH, type MogulStory } from '../content/mogulStories'
import { INDUSTRIES } from '../content/industries'
import { COMBINATOR_ID } from '../content/businesses'
import { isRomanceStory, romanceEligible, applyRomanceOutcome, ROMANCE_NEXT_DATE_MS } from './romance'
import { isEaStory, eaEligible, applyEaOutcome, EA_EPISODE_IDS } from './execAssistant'

/** Arc episodes (romance + EA) — rare, one-time, non-repeatable content. */
function isArcStory(id: string): boolean {
  return isRomanceStory(id) || isEaStory(id)
}

export type OutcomeBand = 'great' | 'good' | 'neutral' | 'bad'

export const FINANCE_INDUSTRY_ID = 'finance'

// Startup Combinator "exit" payouts — a periodic lump = N seconds of the Combinator's
// income, on a deterministic, occasionally-MASSIVE sequence (no RNG → harness-safe; the
// bot never owns the Combinator anyway). 900s = a ~15-min jackpot.
export const EXIT_INTERVAL_MS = 120_000
const EXIT_SECONDS = [75, 180, 45, 420, 120, 900, 60, 240]

// ── Tuning ───────────────────────────────────────────────────────────────────
export const ANGEL_FIRST_OFFER_MS = 3 * 60_000 // ~3 min of eligible time before the first pitch
export const ANGEL_REOFFER_MS = 14 * 60_000 // cooldown between pitches — stories are a highlight, so surface them more often
export const ANGEL_MIN_CASH = 1_000_000 // "enough to plausibly invest" — a modest floor (Finance is already mid-late)
export const ANGEL_INVEST_FRACTION = 0.12 // the cheque = 12% of current cash (bounded, never ruinous)

// Post-deal timed industry effects.
export const GOOD_BOOST_MULT = 1.4
export const GOOD_BOOST_MS = 90_000
export const BAD_DEBUFF_MULT = 0.75
export const BAD_DEBUFF_MS = 60_000

// Space finale ("Meridian-1" launch) — a GREAT "fly" is a historic success whose halo lifts
// the WHOLE empire, not just Space: a bigger, longer boost applied to EVERY industry via the
// `EMPIRE_WIDE` sentinel on boostIndustryId. The story's bespoke reward (mirrors the way
// Angel's great founds the Combinator) — the one non-single-industry outcome in the system.
export const EMPIRE_WIDE = '*'
export const LAUNCH_HALO_MULT = 1.5
export const LAUNCH_HALO_MS = 120_000

export function initialScores(): Scores {
  return { confidence: 0, leverage: 0, dueDiligence: 0, founderTrust: 0, risk: 0, valuationDiscipline: 0 }
}

export function initialAngelDealState(): AngelDealState {
  return {
    storyId: ANGEL_DEAL.id,
    combinatorUnlocked: false,
    completedCount: 0,
    cooldownMs: ANGEL_FIRST_OFFER_MS,
    offered: false,
    active: false,
    stageId: null,
    scores: initialScores(),
    outcome: null,
    disciplined: false,
    payout: 0,
    boostMult: 1,
    boostMsLeft: 0,
    boostIndustryId: FINANCE_INDUSTRY_ID,
    nextIsDate: false,
    exitCooldownMs: EXIT_INTERVAL_MS,
    exitCount: 0,
    lastExitAmount: 0,
  }
}

/**
 * The Mogul Story this session is running (looked up from the registry by `storyId`).
 * Stage navigation + the modal + the view all resolve the story through this — so the
 * shared runtime drives ANY registered story, not the hardcoded Angel constant. Falls
 * back to the Angel story if the id is somehow unknown (old/corrupt save).
 */
export function activeStory(a: AngelDealState) {
  return getMogulStory(a.storyId) ?? ANGEL_DEAL
}

/** Does the player own the Startup Combinator business (great-outcome reward)? */
export function ownsCombinator(state: GameState): boolean {
  return (state.businesses[COMBINATOR_ID]?.owned ?? 0) > 0
}

/**
 * Advance the Combinator's "exit" timer. When it fires, pay a lump = N seconds of the
 * Combinator's current income (comboPps, passed in by the caller to avoid an import cycle
 * with resolveBusiness), on the deterministic EXIT_SECONDS sequence. Only runs once the
 * Combinator is owned (great outcome) → the sim bot, which never owns it, is unaffected.
 */
export function tickCombinatorExit(state: GameState, comboPps: number, dtMs: number): void {
  const a = state.angelDeal
  if (!a || !a.combinatorUnlocked || !ownsCombinator(state) || comboPps <= 0) return
  a.exitCooldownMs -= dtMs
  if (a.exitCooldownMs > 0) return
  const secs = EXIT_SECONDS[a.exitCount % EXIT_SECONDS.length]
  const payout = comboPps * secs
  if (Number.isFinite(payout) && payout > 0) {
    state.cash += payout
    state.lifetimeEarnings += payout
    a.lastExitAmount = payout
    a.exitCount += 1
  }
  a.exitCooldownMs = EXIT_INTERVAL_MS
}

/** Employee roles the player has at least one of — used to lightly amplify matching choices. */
export function hiredRoles(state: GameState): Set<RoleBoost> {
  const set = new Set<RoleBoost>()
  for (const id in state.employees) {
    const r = state.employees[id]?.role as RoleBoost
    if (r === 'closer' || r === 'buyer' || r === 'operator' || r === 'runner') set.add(r)
  }
  return set
}

/**
 * Apply a choice's hidden-score effects. If the choice has a roleBoost the player
 * satisfies (≥1 employee of that role), its effects are amplified ~50% (rounded, min +1
 * on the sign) — a light nudge, never required.
 */
export function applyChoiceEffects(scores: Scores, choice: DealChoice, boosted: Set<RoleBoost>): Scores {
  const amplify = !!choice.roleBoost && boosted.has(choice.roleBoost)
  const next: Scores = { ...scores }
  for (const k of SCORE_KEYS) {
    const base = choice.effects[k] ?? 0
    if (base === 0) continue
    const delta = amplify ? base + Math.sign(base) * Math.max(1, Math.round(Math.abs(base) * 0.5)) : base
    next[k] = next[k] + delta
  }
  return next
}

/** A composite "how good is this deal" read on the hidden scores (never shown raw). */
export function dealQuality(s: Scores): number {
  return (
    s.dueDiligence +
    s.valuationDiscipline +
    s.leverage +
    Math.round(s.confidence / 2) +
    Math.round(s.founderTrust / 2) -
    s.risk
  )
}

/** The band the deal WOULD land in if invested at these scores. */
export function investedBand(s: Scores): Exclude<OutcomeBand, 'neutral'> {
  const q = dealQuality(s)
  if (q >= 9 && s.risk <= 2 && s.dueDiligence >= 6) return 'great'
  if (q >= 3 && s.risk <= 6) return 'good'
  return 'bad'
}

/** True when walking away dodged a CLEARLY bad deal (negative quality or high risk) —
 *  a mediocre/early exit is just plain neutral, not "disciplined". */
export function avoidedBadDeal(s: Scores): boolean {
  return dealQuality(s) < 0 || s.risk >= 6
}

// ── Trigger (in simulate tick) ───────────────────────────────────────────────
function ownsIndustry(state: GameState, industryId: string): boolean {
  const ids = INDUSTRIES[industryId as IndustryId]?.businessIds ?? []
  for (const id of ids) if ((state.businesses[id]?.owned ?? 0) > 0) return true
  return false
}

/** A story can be pitched once the player owns its industry + clears a modest cash floor. */
export function storyEligible(state: GameState, story: MogulStory): boolean {
  return ownsIndustry(state, story.industryId) && state.cash >= ANGEL_MIN_CASH
}

/** Registered stories eligible to be pitched right now, in registry order.
 *  Romance episodes gate on RELATIONSHIP progress (bespoke), not an industry. */
export function eligibleStories(state: GameState): MogulStory[] {
  return MOGUL_STORIES.filter((s) =>
    isRomanceStory(s.id)
      ? romanceEligible(state, s)
      : isEaStory(s.id)
        ? eaEligible(state, s)
        : storyEligible(state, s),
  )
}

/** Back-compat helper: is the Angel story specifically eligible? */
export function angelEligible(state: GameState): boolean {
  return storyEligible(state, ANGEL_DEAL)
}

/**
 * The EA arc opens on the FIRST Investment Fund unlock: surface episode 1 immediately,
 * bypassing the pitch cooldown, so the story "pops" right when the Fund unlocks. Latches
 * via `invest.arcStarted` so it fires exactly once. Sets flags only → bot-inert.
 * Returns true if it opened the offer (the caller then returns).
 */
function maybeOpenEaArc(state: GameState): boolean {
  const a = state.angelDeal
  const inv = state.automation?.invest
  if (!a || !inv || inv.arcStarted || inv.unlocked) return false
  if (!ownsIndustry(state, FINANCE_INDUSTRY_ID)) return false // Finance owned…
  if (!state.businesses['fund']?.unlocked) return false // …and specifically the Fund is unlocked
  inv.arcStarted = true
  a.storyId = EA_EPISODE_IDS[0]
  a.offered = true
  return true
}

/**
 * Advance the pitch cooldown + the post-deal timed effect. When the cooldown elapses and
 * at least one story is eligible, one is "offered" (a floating prompt appears), rotating
 * deterministically across whatever's eligible so pitches vary. No RNG. Bot-inert: it only
 * flips flags / decays a boost that's ×1 for the bot (which never accepts a pitch).
 */
export function tickAngelDeal(state: GameState, dtMs: number): void {
  const a = state.angelDeal
  if (!a) return
  if (a.boostMsLeft > 0) {
    a.boostMsLeft = Math.max(0, a.boostMsLeft - dtMs)
    if (a.boostMsLeft === 0) a.boostMult = 1
  }
  if (a.active || a.offered) return // a pitch is in flight / waiting
  // The EA arc opens the moment the Investment Fund is first unlocked — surface episode
  // 1 immediately (bypassing the pitch cooldown) so it "pops" right on the unlock.
  if (maybeOpenEaArc(state)) return
  const eligible = eligibleStories(state)
  if (eligible.length === 0) return
  if (a.cooldownMs > 0) {
    a.cooldownMs = Math.max(0, a.cooldownMs - dtMs)
    if (a.cooldownMs > 0) return // still cooling down
  }
  // An arc episode that went well reserved this (shortened) slot for the NEXT episode —
  // momentum must surface the SAME arc the player was just in, not a business pitch and not
  // the OTHER arc. `a.storyId` still holds the just-completed episode here (dismissAngelOutcome
  // doesn't clear it), so match its arc first; fall back to any arc episode, then any pitch.
  const sameArc = isEaStory(a.storyId) ? isEaStory : isRomanceStory
  const nextDate = a.nextIsDate
    ? (eligible.find((s) => sameArc(s.id)) ?? eligible.find((s) => isArcStory(s.id)))
    : undefined
  a.nextIsDate = false
  // Arc episodes (romance + EA) are RARE, one-time, non-repeatable content. In a strict
  // round-robin they were 1-of-~7 eligible pitches, so a Finance player almost never saw
  // them (~once every 90 min). PREFER any eligible arc episode over the repeatable business
  // pitches so the arcs actually surface; business pitches resume between/after episodes.
  const arcEpisodes = eligible.filter((s) => isArcStory(s.id))
  const preferred =
    nextDate ?? (arcEpisodes.length > 0 ? arcEpisodes[a.completedCount % arcEpisodes.length] : undefined)
  a.storyId = (preferred ?? eligible[a.completedCount % eligible.length]).id
  a.offered = true // cooldown elapsed → a pitch is waiting
}

/** Accept the pitch: open the mini-game at its first stage with fresh hidden scores. */
export function startAngelDeal(state: GameState): boolean {
  const a = state.angelDeal
  if (!a || !a.offered || a.active) return false
  a.offered = false
  a.active = true
  a.stageId = activeStory(a).firstStage
  a.scores = initialScores()
  a.outcome = null
  a.disciplined = false
  a.payout = 0
  return true
}

/** Decline the offered pitch outright (before it starts) — resets to cooldown. */
export function declineAngelDeal(state: GameState): void {
  const a = state.angelDeal
  if (!a) return
  a.offered = false
  a.active = false
  a.stageId = null
  a.cooldownMs = ANGEL_REOFFER_MS
}

// ── Resolution + rewards ─────────────────────────────────────────────────────
function investmentAmount(cash: number): number {
  return Math.max(0, Math.min(cash, cash * ANGEL_INVEST_FRACTION))
}

/** Net cash delta for a resolved band (positive = gain, negative = loss). Bounded. */
export function payoutFor(band: OutcomeBand, disciplined: boolean, cash: number): number {
  const inv = investmentAmount(cash)
  switch (band) {
    case 'great':
      return inv * 3
    case 'good':
      return inv * 0.75
    case 'bad':
      return -inv
    case 'neutral':
      return disciplined ? inv * 0.03 : 0
  }
}

/** Apply a resolved band to the run: cash delta, story-specific unlocks, timed industry boost. */
function applyOutcome(state: GameState, band: OutcomeBand, disciplined: boolean): number {
  const a = state.angelDeal
  const story = activeStory(a)
  const payout = payoutFor(band, disciplined, state.cash)
  state.cash = Math.max(0, state.cash + payout)
  if (payout > 0) state.lifetimeEarnings += payout
  if (band === 'great' && a.storyId === ANGEL_DEAL.id) {
    a.combinatorUnlocked = true
    // Found the Startup Combinator: a standalone business you now own (buy more later),
    // paying steady income + periodic "exit" jackpots. (Angel-only reward.)
    const b = state.businesses[COMBINATOR_ID]
    if (b) {
      b.unlocked = true
      b.owned = Math.max(1, b.owned)
    }
    a.exitCooldownMs = EXIT_INTERVAL_MS
  } else if (band === 'great' && a.storyId === LAUNCH.id) {
    // Space finale: a flawless launch lifts the whole empire — a bigger, longer boost on
    // EVERY industry (the launch halo), not just Space. The system's one cross-industry reward.
    a.boostMult = LAUNCH_HALO_MULT
    a.boostMsLeft = LAUNCH_HALO_MS
    a.boostIndustryId = EMPIRE_WIDE
  } else if (band === 'great' || band === 'good') {
    // A strong finish → a timed profit boost on THIS story's industry.
    a.boostMult = GOOD_BOOST_MULT
    a.boostMsLeft = GOOD_BOOST_MS
    a.boostIndustryId = story.industryId
  } else if (band === 'bad') {
    a.boostMult = BAD_DEBUFF_MULT
    a.boostMsLeft = BAD_DEBUFF_MS
    a.boostIndustryId = story.industryId
  }
  return payout
}

/**
 * Pick the active choice on the current stage. Applies its hidden-score effects, then
 * either advances to the next stage or RESOLVES the deal (invest → outcome band; walk
 * away → neutral, with a discipline bonus if a bad deal was dodged). Returns true if a
 * valid choice was taken. Idempotent-safe against unknown ids.
 */
export function chooseAngelChoice(state: GameState, choiceId: string, boosted: Set<RoleBoost>): boolean {
  const a = state.angelDeal
  if (!a || !a.active || !a.stageId) return false
  const story = activeStory(a)
  const stage = story.stages[a.stageId]
  if (!stage) return false
  const choice = stage.choices.find((c) => c.id === choiceId)
  if (!choice) return false

  a.scores = applyChoiceEffects(a.scores, choice, boosted)

  if (choice.next === 'invest') {
    const band = investedBand(a.scores)
    a.outcome = band
    a.disciplined = false
    if (isRomanceStory(a.storyId)) {
      // Romance: no cash swing, no industry boost — the reward IS the relationship
      // (stage progression / marriage), applied by the romance module.
      a.payout = 0
      applyRomanceOutcome(state, a.storyId, band)
    } else if (isEaStory(a.storyId)) {
      // EA arc: no cash swing either — the reward is the courtship (arc progress
      // toward the poach), applied by the exec-assistant module.
      a.payout = 0
      applyEaOutcome(state, a.storyId, band)
    } else {
      a.payout = applyOutcome(state, band, false)
    }
    a.completedCount += 1
    return true
  }
  if (choice.next === 'walkaway') {
    if (isArcStory(a.storyId)) {
      // Walking away from a person (a date or a recruit) is always a clean, quiet
      // neutral — no "discipline bonus" cash for dodging someone, no penalty either.
      a.outcome = 'neutral'
      a.disciplined = false
      a.payout = 0
    } else {
      const disciplined = avoidedBadDeal(a.scores)
      a.outcome = 'neutral'
      a.disciplined = disciplined
      a.payout = applyOutcome(state, 'neutral', disciplined)
    }
    a.completedCount += 1
    return true
  }
  if (story.stages[choice.next]) {
    a.stageId = choice.next
    return true
  }
  return false
}

/** Close the outcome screen — clears the session and starts the re-offer cooldown.
 *  A date that went WELL keeps the momentum: the next EPISODE offers sooner (the
 *  shortened slot is reserved for the romance via `nextIsDate`; it never applies
 *  after the proposal — there is no next date once you're married). */
export function dismissAngelOutcome(state: GameState): void {
  const a = state.angelDeal
  if (!a) return
  // An arc episode that went WELL keeps the momentum: the next episode offers sooner.
  // Covers both the romance (until married) and the EA courtship (until poached).
  const arcWentWell =
    (a.outcome === 'great' || a.outcome === 'good') &&
    ((isRomanceStory(a.storyId) && !state.romance?.married) ||
      (isEaStory(a.storyId) && !state.automation?.invest?.unlocked))
  a.active = false
  a.offered = false
  a.stageId = null
  a.outcome = null
  a.scores = initialScores()
  a.nextIsDate = arcWentWell
  a.cooldownMs = arcWentWell ? ROMANCE_NEXT_DATE_MS : ANGEL_REOFFER_MS
}

// ── Economy folds (imported by engine/economy.ts) ────────────────────────────
/** Timed post-story profit boost (good/great) or debuff (bad); 1 when none is active.
 *  Targets the resolved story's industry — or EVERY industry when the boost is empire-wide
 *  (the Space finale's launch halo, `boostIndustryId === EMPIRE_WIDE`). */
export function mogulStoryBoostMult(state: GameState, industryId: IndustryId): number {
  const a = state.angelDeal
  if (!a || a.boostMsLeft <= 0) return 1
  if (a.boostIndustryId === EMPIRE_WIDE || a.boostIndustryId === industryId) return a.boostMult
  return 1
}
