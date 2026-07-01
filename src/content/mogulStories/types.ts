// ============================================================
//  Mogul Stories — the reusable vocabulary.
//
//  Mogul Stories are rare, optional, industry-specific mini visual novels hidden in
//  the game. They vary in length (short 5–7 / standard ~10 / major 15–20+ stages) and
//  each story defines its OWN hidden score variables, tone, pacing, outcome logic, and
//  rewards. This file is only the shared shape every story conforms to — the runtime
//  (offer/cooldown/stage-nav/scoring) and each story's own outcome/reward logic live
//  elsewhere so stories keep full creative freedom. Angel Investment is the reference.
// ============================================================

/** Hidden deal/scene variables — a story names its own (e.g. risk, trust, leverage).
 *  Never shown to the player as raw numbers; surface flavour hints instead. */
export type MogulStoryScores = Record<string, number>

/** The four standard outcome bands. A story may only use a subset. */
export type MogulStoryOutcomeBand = 'great' | 'good' | 'neutral' | 'bad'

/** An employee role that, if the player has ≥1 hired, amplifies a choice's effect. */
export type MogulStoryRoleBoost = 'closer' | 'buyer' | 'operator' | 'runner'

/** Rough length band (drives no logic — a hint for authors + docs). */
export type MogulStoryLength = 'short' | 'standard' | 'major'

export interface MogulStoryChoice {
  id: string
  label: string
  /** A short consequence line shown after choosing (the beat before the next stage). */
  result?: string
  /** Partial deltas applied to the hidden scores. */
  effects: MogulStoryScores
  /** Next stage id, or a story-defined terminal token (anything not a stage id resolves). */
  next: string
  /** Marks the always-available "Walk Away" choice for a stage. */
  walkAway?: boolean
  /** If the player has ≥1 employee of this role, this choice's effects are amplified. */
  roleBoost?: MogulStoryRoleBoost
}

export interface MogulStoryStage {
  id: string
  /** Short label, e.g. "The Pitch" (shown as the progress chip). */
  title: string
  /** Who's speaking — 'protagonist' resolves to the story's `protagonist` name. */
  speaker: 'protagonist' | 'you' | 'narrator'
  /** The narrative, revealed with a typewriter effect. */
  text: string
  choices: MogulStoryChoice[]
}

/** Per-band result copy shown on the outcome screen (keeps the modal data-driven). */
export interface MogulStoryOutcomeCopy {
  title: string
  line: string
}

/** A single Mogul Story — pure content + presentation. Outcome→band logic and reward
 *  side-effects are the story's own (registered separately) so nothing is hardcoded here. */
export interface MogulStory {
  id: string
  industryId: string // which industry this story belongs to (trigger context)
  title: string // e.g. "Angel Investment"
  hook: string // one-line teaser for the floating offer + subtitle
  subject: string // the story's subject (a startup / rival / supplier / relic …)
  protagonist: string // the NPC's name (founder / CEO / critic / captain …)
  length: MogulStoryLength
  firstStage: string
  order: string[] // stage ids, for the "Stage N of M" progress
  stages: Record<string, MogulStoryStage>
  outcome: Record<MogulStoryOutcomeBand, MogulStoryOutcomeCopy> // per-band result copy
}
