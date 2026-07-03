import { describe, it, expect } from 'vitest'
import { initialGameState } from '../store/initialState'
import type { GameState } from '../types/domain'
import {
  AFFAIR_EPISODE_IDS,
  AFFAIR_CAUGHT_ID,
  AFFAIR_REYNA_ID,
  AFFAIR_CATCH_SUSPICION,
  affairEligible,
  resolveAffairChoice,
  nextForcedAffairStory,
  isAffairEpisode,
  isAnyAffairStory,
} from './affair'
import { getMogulStory } from '../content/mogulStories'
import { ROMANCE_EPISODE_IDS } from './romance'
import { startStorySession, chooseAngelChoice } from './angelDeal'

/** A married player who has booked the honeymoon — the gate for the affair. */
function honeymooned(): GameState {
  const s = initialGameState(0)
  s.romance.married = true
  s.romance.stage = ROMANCE_EPISODE_IDS.length
  s.romance.honeymoonTaken = true
  return s
}

const FINAL = AFFAIR_EPISODE_IDS.length - 1

describe('Affair — story-id predicates', () => {
  it('classifies episodes vs the whole affair family', () => {
    expect(isAffairEpisode(AFFAIR_EPISODE_IDS[0])).toBe(true)
    expect(isAffairEpisode(AFFAIR_CAUGHT_ID)).toBe(false) // fallout, not a dating episode
    expect(isAnyAffairStory(AFFAIR_CAUGHT_ID)).toBe(true)
    expect(isAnyAffairStory(AFFAIR_REYNA_ID)).toBe(true)
    expect(isAnyAffairStory('angel_fridgemind')).toBe(false)
  })
})

describe('Affair — eligibility (post-honeymoon only)', () => {
  it('offers only after the honeymoon, while married, one episode at a time', () => {
    const s = honeymooned()
    const ep0 = getMogulStory(AFFAIR_EPISODE_IDS[0])!
    const ep1 = getMogulStory(AFFAIR_EPISODE_IDS[1])!
    expect(affairEligible(s, ep0)).toBe(true)

    // Not honeymooned → the arc doesn't open.
    s.romance.honeymoonTaken = false
    expect(affairEligible(s, ep0)).toBe(false)
    s.romance.honeymoonTaken = true

    // Only the CURRENT stage's episode is eligible.
    expect(affairEligible(s, ep1)).toBe(false)
    s.affair.stage = 1
    expect(affairEligible(s, ep1)).toBe(true)
    expect(affairEligible(s, ep0)).toBe(false)

    // Once caught / ended → nothing eligible.
    s.affair.cheated = true
    expect(affairEligible(s, ep1)).toBe(false)
  })
})

describe('Affair — the temptation mechanic', () => {
  it('walking away ends the affair faithfully', () => {
    const s = honeymooned()
    resolveAffairChoice(s, AFFAIR_EPISODE_IDS[0], 'neutral')
    expect(s.affair.ended).toBe(true)
    expect(s.affair.cheated).toBe(false)
  })

  it('staying innocent advances without suspicion; one slip raises it but stays under the threshold', () => {
    const s = honeymooned()
    resolveAffairChoice(s, AFFAIR_EPISODE_IDS[0], 'good') // kept it innocent
    expect(s.affair.stage).toBe(1)
    expect(s.affair.suspicion).toBe(0)
    expect(s.affair.cheated).toBe(false)

    resolveAffairChoice(s, AFFAIR_EPISODE_IDS[1], 'bad') // crossed a line once
    expect(s.affair.stage).toBe(2)
    expect(s.affair.suspicion).toBe(1)
    expect(s.affair.cheated).toBe(false) // one slip < threshold
  })

  it('crossing a line twice hits the threshold → caught', () => {
    const s = honeymooned()
    resolveAffairChoice(s, AFFAIR_EPISODE_IDS[0], 'bad')
    resolveAffairChoice(s, AFFAIR_EPISODE_IDS[1], 'bad')
    expect(s.affair.suspicion).toBe(AFFAIR_CATCH_SUSPICION)
    expect(s.affair.cheated).toBe(true)
  })

  it('crossing the line at the finale is caught immediately; a faithful finale ends it clean', () => {
    const caught = honeymooned()
    caught.affair.stage = FINAL
    resolveAffairChoice(caught, AFFAIR_EPISODE_IDS[FINAL], 'bad')
    expect(caught.affair.cheated).toBe(true)

    const faithful = honeymooned()
    faithful.affair.stage = FINAL
    resolveAffairChoice(faithful, AFFAIR_EPISODE_IDS[FINAL], 'good')
    expect(faithful.affair.ended).toBe(true)
    expect(faithful.affair.cheated).toBe(false)
  })
})

describe('Affair — deterministic through the runtime (the choice decides, not the accrued band)', () => {
  const story = getMogulStory(AFFAIR_EPISODE_IDS[FINAL])!
  const finalId = story.order[story.order.length - 1]

  it('the cross-the-line choice cheats even behind a faithful-looking score', () => {
    const s = honeymooned()
    s.affair.stage = FINAL
    startStorySession(s, AFFAIR_EPISODE_IDS[FINAL])
    s.angelDeal.stageId = finalId
    // A score that would read 'good'/faithful if the band alone decided it.
    s.angelDeal.scores = { confidence: 0, leverage: 4, dueDiligence: 8, founderTrust: 2, risk: 0, valuationDiscipline: 5 }
    const cross = story.stages[finalId].choices.find((c) => !c.walkAway && (c.effects.risk ?? 0) > 0)!
    chooseAngelChoice(s, cross.id, new Set())
    expect(s.affair.cheated).toBe(true) // the committed choice, not the band, decided it
  })

  it('the faithful choice stays faithful even behind an indulgent score', () => {
    const s = honeymooned()
    s.affair.stage = FINAL
    startStorySession(s, AFFAIR_EPISODE_IDS[FINAL])
    s.angelDeal.stageId = finalId
    // A score that would read 'bad' if the band alone decided it.
    s.angelDeal.scores = { confidence: 2, leverage: 0, dueDiligence: 0, founderTrust: -4, risk: 8, valuationDiscipline: 0 }
    const faithful = story.stages[finalId].choices.find((c) => !c.walkAway && (c.effects.risk ?? 0) <= 0)!
    chooseAngelChoice(s, faithful.id, new Set())
    expect(s.affair.ended).toBe(true)
    expect(s.affair.cheated).toBe(false)
  })
})

describe('Affair — the cheating cascade', () => {
  it('caught → the punitive divorce → (with an EA) the Reyna negotiation → done', () => {
    const s = honeymooned()
    s.affair.cheated = true
    expect(nextForcedAffairStory(s)).toBe(AFFAIR_CAUGHT_ID)

    // A botched reckoning ('bad') ends the marriage and halves EVERYTHING incl. ascension.
    s.businesses.lemonade.owned = 40
    s.cash = 1000
    s.prestige.totalPoints = 10
    resolveAffairChoice(s, AFFAIR_CAUGHT_ID, 'bad')
    expect(s.romance.married).toBe(false)
    expect(s.affair.reckoned).toBe(true)
    expect(s.businesses.lemonade.owned).toBe(20)
    expect(s.cash).toBe(500)
    expect(s.prestige.totalPoints).toBe(5) // cheating + bad → tokens halved

    // No EA poached → the chain ends after the divorce.
    expect(nextForcedAffairStory(s)).toBe(null)

    // With an EA, the retention fires next; botching it loses the EA.
    s.automation.invest.unlocked = true
    expect(nextForcedAffairStory(s)).toBe(AFFAIR_REYNA_ID)
    resolveAffairChoice(s, AFFAIR_REYNA_ID, 'bad')
    expect(s.automation.invest.unlocked).toBe(false)
    expect(s.affair.reynaSettled).toBe(true)
    expect(nextForcedAffairStory(s)).toBe(null)
  })

  it('a contrite reckoning keeps the ascension tokens; a good Reyna keeps the EA', () => {
    const s = honeymooned()
    s.affair.cheated = true
    s.prestige.totalPoints = 10
    resolveAffairChoice(s, AFFAIR_CAUGHT_ID, 'good') // contrite → estate halved but tokens kept
    expect(s.prestige.totalPoints).toBe(10)
    expect(s.romance.married).toBe(false)

    s.automation.invest.unlocked = true
    resolveAffairChoice(s, AFFAIR_REYNA_ID, 'good') // handled well → Reyna stays
    expect(s.automation.invest.unlocked).toBe(true)
  })
})
