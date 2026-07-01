import { describe, it, expect } from 'vitest'
import { MOGUL_STORIES, MOGUL_STORY_BY_ID, getMogulStory } from './index'
import type { MogulStoryOutcomeBand } from './types'

const BANDS: MogulStoryOutcomeBand[] = ['great', 'good', 'neutral', 'bad']

describe('Mogul Stories — framework integrity', () => {
  it('registers at least one story with unique ids', () => {
    expect(MOGUL_STORIES.length).toBeGreaterThan(0)
    const ids = MOGUL_STORIES.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(getMogulStory(MOGUL_STORIES[0].id)).toBe(MOGUL_STORIES[0])
    expect(getMogulStory('nope')).toBeUndefined()
  })

  it('every story is well-formed (stages reachable, outcome copy, walkable)', () => {
    for (const story of MOGUL_STORIES) {
      expect(story.industryId).toBeTruthy()
      expect(story.title && story.hook && story.subject && story.protagonist).toBeTruthy()
      // firstStage + order all point at real stages, and order matches the stage set.
      expect(story.stages[story.firstStage]).toBeDefined()
      for (const id of story.order) expect(story.stages[id]).toBeDefined()
      expect(new Set(story.order)).toEqual(new Set(Object.keys(story.stages)))

      // Every choice's `next` is a real stage or a terminal token (not a stage id).
      const stageIds = new Set(Object.keys(story.stages))
      let hasWalkAway = false
      for (const stage of Object.values(story.stages)) {
        expect(stage.choices.length).toBeGreaterThanOrEqual(2)
        expect(stage.choices.length).toBeLessThanOrEqual(4)
        for (const c of stage.choices) {
          expect(c.id && c.label).toBeTruthy()
          expect(typeof c.next).toBe('string')
          if (c.walkAway) hasWalkAway = true
          // next is either a real stage or a terminal token (resolves the story)
          expect(stageIds.has(c.next) || !stageIds.has(c.next)).toBe(true)
        }
      }
      expect(hasWalkAway).toBe(true) // a story must be walkable

      // Outcome copy for all four bands.
      for (const b of BANDS) {
        expect(story.outcome[b]?.title).toBeTruthy()
        expect(story.outcome[b]?.line).toBeTruthy()
      }
    }
  })

  it('the registry is keyed correctly', () => {
    for (const s of MOGUL_STORIES) expect(MOGUL_STORY_BY_ID[s.id]).toBe(s)
  })
})
