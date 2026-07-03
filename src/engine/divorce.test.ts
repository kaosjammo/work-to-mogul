import { describe, it, expect } from 'vitest'
import { initialGameState } from '../store/initialState'
import type { GameState, EmployeeInstance } from '../types/domain'
import { halveAssets, applyDivorceOutcome, isDivorceStory, DIVORCE_STORY_ID } from './divorce'
import { ROMANCE_EPISODE_IDS } from './romance'
import { startStorySession, chooseAngelChoice } from './angelDeal'
import { getMogulStory } from '../content/mogulStories'

function emp(id: string): EmployeeInstance {
  return {
    id, templateId: 'flash_ortega', name: id, role: 'runner', rarity: 'common',
    level: 1, affinity: null, traits: [], specialisation: null,
  }
}

function married(): GameState {
  const s = initialGameState(0)
  s.romance.married = true
  s.romance.stage = ROMANCE_EPISODE_IDS.length
  return s
}

// A bad-band scoreset (risk high) for the settlement negotiation.
const BAD = { confidence: 0, leverage: 0, dueDiligence: 0, founderTrust: 0, risk: 8, valuationDiscipline: 0 }

describe('Divorce — the settlement id + eligibility', () => {
  it('recognises the divorce story id', () => {
    expect(isDivorceStory(DIVORCE_STORY_ID)).toBe(true)
    expect(isDivorceStory('angel_fridgemind')).toBe(false)
    expect(getMogulStory(DIVORCE_STORY_ID)).toBeDefined()
  })
})

describe('Divorce — halveAssets', () => {
  it('cuts businesses, cash, one-shot upgrades, and the roster in half', () => {
    const s = married()
    s.cash = 1000
    s.businesses.lemonade.owned = 40
    s.businesses.lemonade.unlocked = true
    s.upgradesPurchased = ['a', 'b', 'c', 'd']
    s.employees = { e1: emp('e1'), e2: emp('e2'), e3: emp('e3'), e4: emp('e4') }

    halveAssets(s)

    expect(s.cash).toBe(500)
    expect(s.businesses.lemonade.owned).toBe(20)
    expect(s.upgradesPurchased.length).toBe(2) // kept every other id
    expect(Object.keys(s.employees).length).toBe(2) // half the roster gone
  })

  it('nulls assignments to removed staff (no orphaned slots survive)', () => {
    const s = married()
    s.businesses.lemonade.owned = 40
    s.employees = { e1: emp('e1'), e2: emp('e2') }
    s.businesses.lemonade.assigned = ['e1', 'e2']
    halveAssets(s)
    // Whichever employees remain, no assignment points at a deleted id.
    const valid = new Set(Object.keys(s.employees))
    for (const bs of Object.values(s.businesses)) {
      for (const a of bs.assigned) expect(a == null || valid.has(a)).toBe(true)
    }
  })

  it('only the cheating divorce bites the ascension tokens', () => {
    const base = married()
    base.prestige.totalPoints = 10
    base.prestige.talents = { magnate: 2 }
    base.prestige.spentPoints = 5

    const noPrestige = married()
    noPrestige.prestige = { ...base.prestige, talents: { magnate: 2 } }
    halveAssets(noPrestige) // default: assets only
    expect(noPrestige.prestige.totalPoints).toBe(10) // untouched
    expect(noPrestige.prestige.talents).toEqual({ magnate: 2 })

    halveAssets(base, { includePrestige: true })
    expect(base.prestige.totalPoints).toBe(5) // halved
    expect(base.prestige.talents).toEqual({}) // talent build wiped
    expect(base.prestige.spentPoints).toBe(0) // tokens re-spendable
  })
})

describe('Divorce — applyDivorceOutcome', () => {
  it('a great/good settlement ends the marriage with NO asset loss', () => {
    const s = married()
    s.cash = 1000
    s.businesses.lemonade.owned = 40
    applyDivorceOutcome(s, 'good')
    expect(s.romance.married).toBe(false)
    expect(s.romance.divorced).toBe(true)
    expect(s.romance.marriageLevel).toBe(0)
    expect(s.cash).toBe(1000) // nothing taken
    expect(s.businesses.lemonade.owned).toBe(40)
  })

  it('a bad settlement ends the marriage AND halves the estate', () => {
    const s = married()
    s.cash = 1000
    s.businesses.lemonade.owned = 40
    applyDivorceOutcome(s, 'bad')
    expect(s.romance.married).toBe(false)
    expect(s.romance.divorced).toBe(true)
    expect(s.cash).toBe(500)
    expect(s.businesses.lemonade.owned).toBe(20)
  })

  it('does nothing if not married (guard)', () => {
    const s = initialGameState(0)
    s.cash = 1000
    applyDivorceOutcome(s, 'bad')
    expect(s.cash).toBe(1000)
    expect(s.romance.married).toBe(false)
  })
})

describe('Divorce — through the shared story runtime', () => {
  it('a bad-scored settlement halves the estate; walking away reconciles', () => {
    const story = getMogulStory(DIVORCE_STORY_ID)!
    const finalId = story.order[story.order.length - 1]

    // Bad negotiation → married ends, estate halved.
    const s = married()
    s.cash = 1000
    s.businesses.lemonade.owned = 40
    expect(startStorySession(s, DIVORCE_STORY_ID)).toBe(true)
    expect(s.angelDeal.storyId).toBe(DIVORCE_STORY_ID)
    s.angelDeal.stageId = finalId
    s.angelDeal.scores = { ...BAD }
    const invest = story.stages[finalId].choices.find((c) => c.next === 'invest')!
    chooseAngelChoice(s, invest.id, new Set())
    expect(s.romance.married).toBe(false)
    expect(s.cash).toBe(500)

    // Walking away from the table → RECONCILE (marriage intact, nothing lost).
    const s2 = married()
    s2.cash = 1000
    s2.businesses.lemonade.owned = 40
    startStorySession(s2, DIVORCE_STORY_ID)
    s2.angelDeal.stageId = finalId
    const walk = story.stages[finalId].choices.find((c) => c.walkAway)!
    chooseAngelChoice(s2, walk.id, new Set())
    expect(s2.romance.married).toBe(true) // reconciled
    expect(s2.cash).toBe(1000)
    expect(s2.businesses.lemonade.owned).toBe(40)
  })
})
