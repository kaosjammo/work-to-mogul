import { describe, it, expect } from 'vitest'
import { initialGameState } from '../store/initialState'
import { serialize, deserialize } from '../save/serialize'
import { ANGEL_DEAL } from '../content/mogulStories'
import { ROMANCE_EPISODE_IDS } from './romance'
import { AFFAIR_EPISODE_IDS } from './affair'
import { EA_EPISODE_IDS } from './execAssistant'
import type { GameState } from '../types/domain'
import {
  freshStoryRecord,
  noteStorySeen,
  noteStoryStage,
  noteStoryChoice,
  noteStoryOutcome,
  storyRecord,
  storySeen,
  storyCompleted,
  storyBestBand,
  storyHasFlag,
  completedStoryIds,
} from './storyState'

function state(): GameState {
  return initialGameState(0)
}

describe('storyState — VN-style per-story tracking', () => {
  it('freshStoryRecord is an unlived "seen" shell', () => {
    expect(freshStoryRecord()).toEqual({
      status: 'seen', plays: 0, lastBand: null, bestBand: null, lastStage: null, flags: [], seq: 0,
    })
  })

  it('noteStorySeen marks a story seen (not completed) + remembers its opening stage', () => {
    const s = state()
    expect(storySeen(s, 'angel_fridgemind')).toBe(false)
    noteStorySeen(s, 'angel_fridgemind', 'pitch')
    expect(storySeen(s, 'angel_fridgemind')).toBe(true)
    expect(storyCompleted(s, 'angel_fridgemind')).toBe(false)
    expect(storyRecord(s, 'angel_fridgemind')?.lastStage).toBe('pitch')
  })

  it('noteStoryStage advances the resume-point', () => {
    const s = state()
    noteStorySeen(s, 'angel_fridgemind', 'pitch')
    noteStoryStage(s, 'angel_fridgemind', 'decision')
    expect(storyRecord(s, 'angel_fridgemind')?.lastStage).toBe('decision')
  })

  it('noteStoryChoice records choice-ids as flags, deduped', () => {
    const s = state()
    noteStoryChoice(s, 'angel_fridgemind', 'dec_invest')
    noteStoryChoice(s, 'angel_fridgemind', 'dec_invest') // dup
    noteStoryChoice(s, 'angel_fridgemind', 'imp_charm')
    expect(storyRecord(s, 'angel_fridgemind')?.flags).toEqual(['dec_invest', 'imp_charm'])
    expect(storyHasFlag(s, 'angel_fridgemind', 'dec_invest')).toBe(true)
    expect(storyHasFlag(s, 'angel_fridgemind', 'never')).toBe(false)
  })

  it('noteStoryOutcome completes, counts plays, tracks last band + keeps the BEST band', () => {
    const s = state()
    noteStoryOutcome(s, 'angel_fridgemind', 'good')
    let r = storyRecord(s, 'angel_fridgemind')!
    expect(r.status).toBe('completed')
    expect(r.plays).toBe(1)
    expect(r.lastBand).toBe('good')
    expect(r.bestBand).toBe('good')

    // A better replay upgrades bestBand; lastBand tracks the latest; plays increments.
    noteStoryOutcome(s, 'angel_fridgemind', 'great')
    r = storyRecord(s, 'angel_fridgemind')!
    expect(r.plays).toBe(2)
    expect(r.lastBand).toBe('great')
    expect(r.bestBand).toBe('great')

    // A worse replay does NOT downgrade bestBand.
    noteStoryOutcome(s, 'angel_fridgemind', 'bad')
    r = storyRecord(s, 'angel_fridgemind')!
    expect(r.plays).toBe(3)
    expect(r.lastBand).toBe('bad')
    expect(r.bestBand).toBe('great')
    expect(storyBestBand(s, 'angel_fridgemind')).toBe('great')
  })

  it('completedStoryIds lists only completed stories, most-recent completion first', () => {
    const s = state()
    noteStorySeen(s, 'love_spark', 'meet') // seen but not completed → excluded
    noteStoryOutcome(s, 'angel_fridgemind', 'good') // seq 1
    noteStoryOutcome(s, 'love_first_date', 'good') // seq 2
    noteStoryOutcome(s, 'ea_summit', 'neutral') // seq 3
    expect(completedStoryIds(s)).toEqual(['ea_summit', 'love_first_date', 'angel_fridgemind'])
    // A replay of an older story re-dates it to the front.
    noteStoryOutcome(s, 'angel_fridgemind', 'great') // seq 4
    expect(completedStoryIds(s)[0]).toBe('angel_fridgemind')
  })
})

describe('storyState — harness-inert', () => {
  it('a fresh game has an empty story map (the greedy bot never writes to it)', () => {
    expect(state().stories).toEqual({})
  })
})

// ============================================================
//  The v2 → v3 save migration: the flat storyLog + every arc's scattered progress
//  is reconstructed into the unified `stories` map on load.
// ============================================================
describe('save migration v2 → v3 (storyLog → StoryState)', () => {
  /** A synthetic pre-v3 save envelope: only the fields the migration reads. */
  function v2Envelope(partial: Record<string, unknown>): string {
    return JSON.stringify({ version: 2, savedAt: 0, state: { cash: 0, ...partial } })
  }

  it('back-fills completed records from the flat storyLog, dropping unregistered ids', () => {
    const raw = v2Envelope({ storyLog: ['angel_fridgemind', 'love_spark', 'ghost_tale'] })
    const s = deserialize(raw, 0)!
    expect(s.stories.angel_fridgemind?.status).toBe('completed')
    expect(s.stories.love_spark?.status).toBe('completed')
    expect(s.stories.ghost_tale).toBeUndefined() // not a registered story → pruned
  })

  it('a married save back-fills the whole romance arc, proposal at least "good"', () => {
    const raw = v2Envelope({
      romance: { stage: 4, married: true, marriageLevel: 2, totalSpent: 500, honeymoonTaken: true, divorced: false },
    })
    const s = deserialize(raw, 0)!
    for (const id of ROMANCE_EPISODE_IDS) {
      expect(s.stories[id]?.status, `${id} should be completed`).toBe('completed')
    }
    // The accepted proposal is the arc's happy beat.
    expect(s.stories.love_proposal?.bestBand).toBe('good')
  })

  it('an in-progress affair back-fills only the episodes reached', () => {
    const raw = v2Envelope({ affair: { stage: 2, cheated: false, reckoned: false } })
    const s = deserialize(raw, 0)!
    expect(s.stories[AFFAIR_EPISODE_IDS[0]]?.status).toBe('completed') // affair_meet
    expect(s.stories[AFFAIR_EPISODE_IDS[1]]?.status).toBe('completed') // affair_spark
    expect(s.stories[AFFAIR_EPISODE_IDS[2]]).toBeUndefined() // affair_secret not yet reached
  })

  it('an unlocked EA back-fills the full recruitment arc', () => {
    const raw = v2Envelope({ automation: { invest: { unlocked: true } } })
    const s = deserialize(raw, 0)!
    for (const id of EA_EPISODE_IDS) {
      expect(s.stories[id]?.status, `${id} should be completed`).toBe('completed')
    }
  })

  it('a combinator unlock marks the Angel story as a GREAT outcome — even if also in storyLog', () => {
    const raw = v2Envelope({
      storyLog: [ANGEL_DEAL.id], // present with unknown band…
      angelDeal: { combinatorUnlocked: true }, // …upgraded to great by the unlock
    })
    const s = deserialize(raw, 0)!
    expect(s.stories[ANGEL_DEAL.id]?.status).toBe('completed')
    expect(s.stories[ANGEL_DEAL.id]?.bestBand).toBe('great')
  })

  it('a v3 save is left untouched (no double-migration) and round-trips', () => {
    const s0 = initialGameState(0)
    s0.stories = {
      angel_fridgemind: { status: 'completed', plays: 3, lastBand: 'bad', bestBand: 'great', lastStage: 'close', flags: ['dec_invest'], seq: 1 },
    }
    const r = deserialize(serialize(s0, 0), 0)!
    expect(r.stories.angel_fridgemind).toMatchObject({ plays: 3, bestBand: 'great', flags: ['dec_invest'] })
  })
})
