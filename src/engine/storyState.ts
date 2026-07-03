// ============================================================
//  Story State — the unified visual-novel-style tracking layer (pure over GameState).
//  One `StoryRecord` per Mogul Story captures what the flat `storyLog` never could:
//  seen-vs-completed, play count, last + best outcome band, the last stage reached, and
//  the CHOICE IDS taken (VN "flags" for future callbacks / branching), plus a monotonic
//  completion `seq` for recency ordering in the Log.
//
//  This is a HISTORY/tracking layer — it does NOT own arc gating. The arc authorities
//  (romance.stage / affair.stage / automation.invest.arcStage) still drive eligibility;
//  Story State records what happened for the Log + any future content that reacts to it.
//
//  Harness-safe: every writer is reached only on a PLAYER story resolve — the greedy sim
//  bot never opens or resolves a story, so `stories` stays {} and income is byte-identical.
// ============================================================
import type { GameState, StoryRecord, AngelOutcomeBand } from '../types/domain'

const BAND_RANK: Record<AngelOutcomeBand, number> = { bad: 0, neutral: 1, good: 2, great: 3 }

export function freshStoryRecord(): StoryRecord {
  return { status: 'seen', plays: 0, lastBand: null, bestBand: null, lastStage: null, flags: [], seq: 0 }
}

function ensure(state: GameState, id: string): StoryRecord {
  if (!state.stories) state.stories = {}
  let r = state.stories[id]
  if (!r) {
    r = freshStoryRecord()
    state.stories[id] = r
  }
  return r
}

/** Next completion order number — max existing +1 (pure; no clock, so the harness stays
 *  deterministic and the migration can rebuild a stable order). */
function nextSeq(state: GameState): number {
  let m = 0
  const s = state.stories
  if (s) for (const k in s) if (s[k].seq > m) m = s[k].seq
  return m + 1
}

// ── writers (all player-triggered) ───────────────────────────────────────────

/** A story session opened (offered/accepted/force-started) — mark it seen + opening stage. */
export function noteStorySeen(state: GameState, id: string, stageId: string | null): void {
  const r = ensure(state, id)
  if (stageId) r.lastStage = stageId
}

/** Advanced to a new stage — VN "where you are" tracking (resume hint). */
export function noteStoryStage(state: GameState, id: string, stageId: string): void {
  ensure(state, id).lastStage = stageId
}

/** A choice was taken — record its id as a VN flag (deduped) for later callbacks/branching. */
export function noteStoryChoice(state: GameState, id: string, choiceId: string): void {
  const r = ensure(state, id)
  if (choiceId && !r.flags.includes(choiceId)) r.flags.push(choiceId)
}

/** The story resolved to a band — completion + best/last outcome + play count + order. */
export function noteStoryOutcome(state: GameState, id: string, band: AngelOutcomeBand): void {
  const r = ensure(state, id)
  r.status = 'completed'
  r.plays += 1
  r.lastBand = band
  if (r.bestBand == null || BAND_RANK[band] > BAND_RANK[r.bestBand]) r.bestBand = band
  r.seq = nextSeq(state)
}

// ── queries ──────────────────────────────────────────────────────────────────

export function storyRecord(state: GameState, id: string): StoryRecord | undefined {
  return state.stories?.[id]
}
export function storySeen(state: GameState, id: string): boolean {
  return !!state.stories?.[id]
}
export function storyCompleted(state: GameState, id: string): boolean {
  return state.stories?.[id]?.status === 'completed'
}
export function storyBestBand(state: GameState, id: string): AngelOutcomeBand | null {
  return state.stories?.[id]?.bestBand ?? null
}
/** VN flag check: did the player ever take this choice in this story? (future branching). */
export function storyHasFlag(state: GameState, id: string, choiceId: string): boolean {
  return !!state.stories?.[id]?.flags.includes(choiceId)
}
/** Completed story ids, most-recently-completed FIRST (for the Log). */
export function completedStoryIds(state: GameState): string[] {
  const s = state.stories ?? {}
  return Object.keys(s)
    .filter((id) => s[id].status === 'completed')
    .sort((a, b) => s[b].seq - s[a].seq)
}
