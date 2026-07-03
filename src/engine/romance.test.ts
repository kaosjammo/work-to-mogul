import { describe, it, expect } from 'vitest'
import { initialGameState } from '../store/initialState'
import { serialize, deserialize } from '../save/serialize'
import { prestigeReset } from './prestige'
import { applyTick } from './simulate'
import { getMogulStory } from '../content/mogulStories'
import type { GameState } from '../types/domain'
import {
  ROMANCE_EPISODE_IDS,
  ROMANCE_MIN_CASH,
  ROMANCE_NEXT_DATE_MS,
  MARRIAGE_MAX_LEVEL,
  MARRIAGE_COST_FLOOR,
  initialRomanceState,
  isRomanceStory,
  romanceEligible,
  applyRomanceOutcome,
  marriageDrainFraction,
  marriageLevelUpCost,
  buyMarriageLevel,
  applyMarriageUpkeep,
  grantWeddingGift,
  bookHoneymoon,
  honeymoonCost,
  honeymoonPending,
} from './romance'
import {
  eligibleStories,
  chooseAngelChoice,
  dismissAngelOutcome,
  tickAngelDeal,
  mogulStoryBoostMult,
  ANGEL_REOFFER_MS,
} from './angelDeal'

function richState(): GameState {
  const s = initialGameState(0)
  s.cash = 1e9
  return s
}

// Great-tier hidden scores: q=17 >= 9, risk 1 <= 2, dueDiligence 8 >= 6 — with
// wide margin so any commit-choice effects can't change the band.
const GREAT_SCORES = { confidence: 0, leverage: 4, dueDiligence: 8, founderTrust: 0, risk: 1, valuationDiscipline: 5 }
// Good-tier: q=6 >= 3, risk 3 <= 6, dueDiligence 3 (< 6 so it can never bump to great).
const GOOD_SCORES = { confidence: 0, leverage: 1, dueDiligence: 3, founderTrust: 0, risk: 3, valuationDiscipline: 2 }
// Bad-tier: risk 8 > 6 and q deeply negative.
const BAD_SCORES = { confidence: 0, leverage: 0, dueDiligence: 0, founderTrust: 0, risk: 8, valuationDiscipline: 0 }

/** Put the session at an episode's FINAL stage (content-agnostic). */
function atFinalStage(s: GameState, storyId: string) {
  const story = getMogulStory(storyId)!
  const lastId = story.order[story.order.length - 1]
  s.angelDeal.storyId = storyId
  s.angelDeal.active = true
  s.angelDeal.stageId = lastId
  s.angelDeal.outcome = null
  return story.stages[lastId]
}

describe('Romance arc — episodic eligibility (bespoke, relationship-gated)', () => {
  it('only the CURRENT episode is eligible, in arc order', () => {
    const s = richState()
    const ids = eligibleStories(s).map((x) => x.id)
    expect(ids).toContain(ROMANCE_EPISODE_IDS[0])
    expect(ids).not.toContain(ROMANCE_EPISODE_IDS[1])
    s.romance.stage = 2
    const ids2 = eligibleStories(s).map((x) => x.id)
    expect(ids2).toContain(ROMANCE_EPISODE_IDS[2])
    expect(ids2).not.toContain(ROMANCE_EPISODE_IDS[0])
  })

  it('needs the cash floor, and never offers after marriage', () => {
    const s = richState()
    const spark = getMogulStory(ROMANCE_EPISODE_IDS[0])!
    expect(romanceEligible(s, spark)).toBe(true)
    s.cash = ROMANCE_MIN_CASH - 1
    expect(romanceEligible(s, spark)).toBe(false)
    s.cash = 1e9
    s.romance.married = true
    s.romance.stage = ROMANCE_EPISODE_IDS.length
    expect(eligibleStories(s).some((x) => isRomanceStory(x.id))).toBe(false)
  })
})

describe('Romance arc — progression + marriage through the shared runtime', () => {
  it('a GREAT date advances the relationship with zero cash swing and no industry boost', () => {
    const s = richState()
    const stage = atFinalStage(s, ROMANCE_EPISODE_IDS[0])
    s.angelDeal.scores = { ...GREAT_SCORES }
    const commit = stage.choices.find((c) => c.next === 'invest')!
    const cashBefore = s.cash
    expect(chooseAngelChoice(s, commit.id, new Set())).toBe(true)
    expect(s.angelDeal.outcome).toBe('great')
    expect(s.angelDeal.payout).toBe(0)
    expect(s.cash).toBe(cashBefore)
    expect(s.romance.stage).toBe(1)
    expect(s.angelDeal.boostMsLeft).toBe(0) // no timed industry boost from a date
    expect(mogulStoryBoostMult(s, 'food')).toBe(1)
    expect(s.angelDeal.combinatorUnlocked).toBe(false)
  })

  it('a GOOD date also advances; BAD does not (but never regresses)', () => {
    const s = richState()
    const stage = atFinalStage(s, ROMANCE_EPISODE_IDS[0])
    s.angelDeal.scores = { ...GOOD_SCORES }
    const commit = stage.choices.find((c) => c.next === 'invest')!
    chooseAngelChoice(s, commit.id, new Set())
    expect(s.angelDeal.outcome).toBe('good')
    expect(s.romance.stage).toBe(1)

    const s2 = richState()
    const stage2 = atFinalStage(s2, ROMANCE_EPISODE_IDS[0])
    s2.angelDeal.scores = { ...BAD_SCORES }
    chooseAngelChoice(s2, stage2.choices.find((c) => c.next === 'invest')!.id, new Set())
    expect(s2.angelDeal.outcome).toBe('bad')
    expect(s2.romance.stage).toBe(0) // no progress, retry later
  })

  it('walking away from a date is a clean neutral — no discipline cash, no progress', () => {
    const s = richState()
    const stage = atFinalStage(s, ROMANCE_EPISODE_IDS[0])
    s.angelDeal.scores = { ...BAD_SCORES } // would be "disciplined" in a deal
    const walk = stage.choices.find((c) => c.walkAway)!
    const cashBefore = s.cash
    expect(chooseAngelChoice(s, walk.id, new Set())).toBe(true)
    expect(s.angelDeal.outcome).toBe('neutral')
    expect(s.angelDeal.disciplined).toBe(false)
    expect(s.angelDeal.payout).toBe(0)
    expect(s.cash).toBe(cashBefore)
    expect(s.romance.stage).toBe(0)
  })

  it('the proposal landing (great OR good) means MARRIED, sink unlocked at level 0', () => {
    const s = richState()
    s.romance.stage = ROMANCE_EPISODE_IDS.length - 1
    const stage = atFinalStage(s, ROMANCE_EPISODE_IDS[ROMANCE_EPISODE_IDS.length - 1])
    s.angelDeal.scores = { ...GOOD_SCORES }
    chooseAngelChoice(s, stage.choices.find((c) => c.next === 'invest')!.id, new Set())
    expect(s.romance.married).toBe(true)
    expect(s.romance.marriageLevel).toBe(0)
  })

  it('a stale/replayed episode resolve no-ops the progression', () => {
    const s = richState()
    s.romance.stage = 3 // already past episode 1
    applyRomanceOutcome(s, ROMANCE_EPISODE_IDS[0], 'great')
    expect(s.romance.stage).toBe(3)
  })

  it('a successful date shortens the next offer; a walked date uses the normal cadence', () => {
    const s = richState()
    s.angelDeal.storyId = ROMANCE_EPISODE_IDS[0]
    s.angelDeal.outcome = 'good'
    dismissAngelOutcome(s)
    expect(s.angelDeal.cooldownMs).toBe(ROMANCE_NEXT_DATE_MS)
    expect(s.angelDeal.nextIsDate).toBe(true)

    s.angelDeal.storyId = ROMANCE_EPISODE_IDS[0]
    s.angelDeal.outcome = 'neutral'
    dismissAngelOutcome(s)
    expect(s.angelDeal.cooldownMs).toBe(ANGEL_REOFFER_MS)
    expect(s.angelDeal.nextIsDate).toBe(false)
  })

  it('the shortened slot actually surfaces the NEXT DATE, even when a deal is also eligible', () => {
    // Finance owner: the Angel deal is eligible too. After a good date, the 15-min
    // slot must offer the next episode, not rotate to a business pitch.
    const s = richState()
    s.businesses.apartments.owned = 1
    s.businesses.apartments.unlocked = true
    s.romance.stage = 1
    s.angelDeal.storyId = ROMANCE_EPISODE_IDS[0]
    s.angelDeal.outcome = 'good'
    // eligible = [angel, love_first_date]; an even count would rotate to the ANGEL
    // pick without the reserved-slot flag.
    s.angelDeal.completedCount = 2
    dismissAngelOutcome(s)
    tickAngelDeal(s, ROMANCE_NEXT_DATE_MS + 1)
    expect(s.angelDeal.offered).toBe(true)
    expect(s.angelDeal.storyId).toBe(ROMANCE_EPISODE_IDS[1])
    expect(s.angelDeal.nextIsDate).toBe(false) // consumed
  })

  it('the proposal landing does NOT shorten the cooldown (there is no next date)', () => {
    const s = richState()
    s.romance.married = true
    s.romance.stage = ROMANCE_EPISODE_IDS.length
    s.angelDeal.storyId = ROMANCE_EPISODE_IDS[ROMANCE_EPISODE_IDS.length - 1]
    s.angelDeal.outcome = 'great'
    dismissAngelOutcome(s)
    expect(s.angelDeal.cooldownMs).toBe(ANGEL_REOFFER_MS)
    expect(s.angelDeal.nextIsDate).toBe(false)
  })
})

describe('Wedding payoff — the honeymoon gift', () => {
  it('grants a one-time windfall scaled to idle income (0 without any)', () => {
    const s = richState()
    expect(grantWeddingGift(s)).toBe(0) // no automated income yet → no gift

    s.businesses.lemonade.owned = 20
    s.businesses.lemonade.unlocked = true
    s.employees.op = {
      id: 'op', templateId: 'mickey_gears', name: 'Op', role: 'operator',
      rarity: 'common', level: 1, affinity: null, traits: [], specialisation: null,
    }
    s.businesses.lemonade.assigned = ['op']
    const before = s.cash
    const gift = grantWeddingGift(s)
    expect(gift).toBeGreaterThan(0)
    expect(s.cash).toBeCloseTo(before + gift)
  })
})

describe('Honeymoon — the post-wedding "save up and go" purchase', () => {
  it('is only bookable when married + affordable, and clears the pending flag', () => {
    const s = richState()
    // Not married → no honeymoon at all.
    expect(honeymoonPending(s)).toBe(false)
    expect(bookHoneymoon(s)).toBeNull()

    // Marry.
    s.romance.married = true
    s.romance.stage = ROMANCE_EPISODE_IDS.length
    expect(honeymoonPending(s)).toBe(true) // married, not yet taken → the dot shows
    const cost = honeymoonCost(s)
    expect(cost).toBeGreaterThan(0)

    // Can't afford → no-op.
    s.cash = cost - 1
    expect(bookHoneymoon(s)).toBeNull()
    expect(s.romance.honeymoonTaken).toBe(false)

    // Afford → book (deducts, sets the flag, clears pending).
    s.cash = cost + 10
    expect(bookHoneymoon(s)).toBe(cost)
    expect(s.romance.honeymoonTaken).toBe(true)
    expect(s.cash).toBeCloseTo(10)
    expect(honeymoonPending(s)).toBe(false)

    // Idempotent — can't book a second honeymoon.
    expect(bookHoneymoon(s)).toBeNull()
  })
})

describe('Marriage — the levelable money sink', () => {
  function married(level = 0): GameState {
    const s = richState()
    s.romance.married = true
    s.romance.stage = ROMANCE_EPISODE_IDS.length
    s.romance.honeymoonTaken = true // the sink is locked until the honeymoon is booked
    s.romance.marriageLevel = level
    return s
  }

  it('drains nothing at level 0, and 1% of income per level after', () => {
    expect(marriageDrainFraction(married(0))).toBe(0)
    expect(marriageDrainFraction(married(1))).toBeCloseTo(0.01)
    expect(marriageDrainFraction(married(10))).toBeCloseTo(0.1)
    expect(marriageDrainFraction(married(MARRIAGE_MAX_LEVEL))).toBeCloseTo(0.2)
    expect(marriageDrainFraction(richState())).toBe(0) // unmarried
  })

  it('a level can never be bought at the floor by zeroing income (post-prestige exploit)', () => {
    // Right after an ascension the businesses are wiped but the marriage persists —
    // pricing must fall back to a share of CASH, not collapse to the $25k floor.
    const s = married(0)
    s.cash = 1e9 // rich player, zero automated income
    const cost = marriageLevelUpCost(s)
    expect(cost).toBeGreaterThanOrEqual(1e9 * 0.1)
    const res = buyMarriageLevel(s)!
    expect(res.cost).toBeGreaterThanOrEqual(1e8) // not $25k
  })

  it('level-ups cost real money, are refused when broke, and cap at MAX', () => {
    const s = married(0)
    const cost = marriageLevelUpCost(s)
    expect(cost).toBeGreaterThanOrEqual(MARRIAGE_COST_FLOOR)
    const res = buyMarriageLevel(s)!
    expect(res.level).toBe(1)
    expect(res.title.length).toBeGreaterThan(0)
    expect(s.cash).toBeCloseTo(1e9 - res.cost)
    expect(s.romance.totalSpent).toBeCloseTo(res.cost)

    const broke = married(0)
    broke.cash = 1
    expect(buyMarriageLevel(broke)).toBeNull()

    const maxed = married(MARRIAGE_MAX_LEVEL)
    expect(marriageLevelUpCost(maxed)).toBe(0)
    expect(buyMarriageLevel(maxed)).toBeNull()
    expect(buyMarriageLevel(richState())).toBeNull() // unmarried

    // The lifestyle sink is LOCKED until the honeymoon is booked (level 1 isn't "The
    // Honeymoon" any more — that's its own one-time purchase).
    const preHoneymoon = married(0)
    preHoneymoon.romance.honeymoonTaken = false
    expect(marriageLevelUpCost(preHoneymoon)).toBe(0)
    expect(buyMarriageLevel(preHoneymoon)).toBeNull()
  })

  it('the upkeep takes its share of earned cash, floors at 0, and never touches lifetime', () => {
    const s = married(10)
    s.cash = 1000
    const lifetime = s.lifetimeEarnings
    applyMarriageUpkeep(s, 500) // 10% of 500 = 50
    expect(s.cash).toBeCloseTo(950)
    expect(s.romance.totalSpent).toBeCloseTo(50)
    expect(s.lifetimeEarnings).toBe(lifetime)
    applyMarriageUpkeep(s, -5) // nonsense input is ignored
    expect(s.cash).toBeCloseTo(950)
  })

  it('in a live tick, a married empire earns exactly its drain less than an unmarried one', () => {
    const mk = () => {
      const s = initialGameState(0)
      const b = s.businesses.startup_combinator // autoRun → automated income, no staff needed
      b.owned = 1
      b.unlocked = true
      return s
    }
    const single = mk()
    const wed = mk()
    wed.romance.married = true
    wed.romance.stage = ROMANCE_EPISODE_IDS.length
    wed.romance.marriageLevel = 10 // 10% upkeep
    const rng = () => 0.5
    for (let i = 0; i < 210; i++) {
      applyTick(single, 100, rng)
      applyTick(wed, 100, rng)
    }
    expect(single.cash).toBeGreaterThan(0)
    expect(wed.cash / single.cash).toBeCloseTo(0.9, 5)
    expect(wed.lifetimeEarnings).toBe(single.lifetimeEarnings) // earned, then spent
    expect(wed.romance.totalSpent).toBeCloseTo(single.cash * 0.1, -3)
  })
})

describe('Romance — save + prestige are marriage-safe', () => {
  it('round-trips through save; corrupt combos are repaired on load', () => {
    const s = richState()
    s.romance = { stage: ROMANCE_EPISODE_IDS.length, married: true, marriageLevel: 7, totalSpent: 123456, honeymoonTaken: true, divorced: false }
    const back = deserialize(serialize(s, 1))!
    expect(back.romance).toEqual(s.romance)

    // married implies a complete arc; a sink can only exist inside a marriage.
    const raw = JSON.parse(serialize(s, 1))
    raw.state.romance = { stage: 1, married: true, marriageLevel: 99, totalSpent: -5 }
    const fixed = deserialize(JSON.stringify(raw))!
    expect(fixed.romance.stage).toBe(ROMANCE_EPISODE_IDS.length)
    expect(fixed.romance.marriageLevel).toBe(MARRIAGE_MAX_LEVEL)
    expect(fixed.romance.totalSpent).toBe(0)

    raw.state.romance = { stage: 2, married: false, marriageLevel: 5, totalSpent: 10 }
    const fixed2 = deserialize(JSON.stringify(raw))!
    expect(fixed2.romance.married).toBe(false)
    expect(fixed2.romance.marriageLevel).toBe(0) // no marriage → no sink
    expect(fixed2.romance.stage).toBe(2)

    // {stage: length, married: false} would dead-end the arc forever (no episode left,
    // never married) — unmarried clamps to "ready for the proposal" at most.
    raw.state.romance = { stage: ROMANCE_EPISODE_IDS.length, married: false, marriageLevel: 0, totalSpent: 0 }
    const fixed3 = deserialize(JSON.stringify(raw))!
    expect(fixed3.romance.stage).toBe(ROMANCE_EPISODE_IDS.length - 1)
  })

  it('an ascension is not a divorce — romance persists through prestige', () => {
    const s = richState()
    s.lifetimeEarnings = 1e15
    s.romance = { stage: 4, married: true, marriageLevel: 3, totalSpent: 999, honeymoonTaken: true, divorced: false }
    expect(prestigeReset(s)).toBe(true)
    expect(s.romance).toEqual({ stage: 4, married: true, marriageLevel: 3, totalSpent: 999, honeymoonTaken: true, divorced: false })
  })

  it('the story Log is a keepsake — it survives an ascension', () => {
    const s = richState()
    s.lifetimeEarnings = 1e15
    s.storyLog = ['angel_fridgemind', 'love_proposal']
    expect(prestigeReset(s)).toBe(true)
    expect(s.storyLog).toEqual(['angel_fridgemind', 'love_proposal'])
  })

  it('fresh state starts unattached', () => {
    expect(initialRomanceState()).toEqual({
      stage: 0, married: false, marriageLevel: 0, totalSpent: 0, honeymoonTaken: false, divorced: false,
    })
  })
})
