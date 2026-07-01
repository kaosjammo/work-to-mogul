import { describe, it, expect } from 'vitest'
import { initialGameState } from '../store/initialState'
import { serialize, deserialize } from '../save/serialize'
import { ANGEL_DEAL, type Scores } from '../content/angelDeal'
import {
  initialScores,
  applyChoiceEffects,
  dealQuality,
  investedBand,
  avoidedBadDeal,
  payoutFor,
  tickAngelDeal,
  angelEligible,
  startAngelDeal,
  chooseAngelChoice,
  dismissAngelOutcome,
  activeStory,
  initialAngelDealState,
  mogulStoryBoostMult,
  storyEligible,
  eligibleStories,
  ownsCombinator,
  tickCombinatorExit,
  hiredRoles,
  ANGEL_FIRST_OFFER_MS,
  ANGEL_MIN_CASH,
  ANGEL_INVEST_FRACTION,
  EXIT_INTERVAL_MS,
} from './angelDeal'
import { COMBINATOR_ID } from '../content/businesses'
import { LEASE_SHOWDOWN, ENGINE_POACH, VIRAL_MOMENT, DOCK_DISPUTE } from '../content/mogulStories'

function scores(partial: Partial<Scores>): Scores {
  return { ...initialScores(), ...partial }
}

// A state that owns Finance + has enough cash to be eligible for a pitch.
function eligibleState() {
  const s = initialGameState(0)
  s.cash = 1e12
  s.businesses.apartments.owned = 1 // a Finance business
  s.businesses.apartments.unlocked = true
  return s
}

describe('Angel Deal — hidden scoring', () => {
  it('applies a choice’s score deltas', () => {
    const before = initialScores()
    const stage = ANGEL_DEAL.stages.pitch
    const hype = stage.choices.find((c) => c.id === 'pitch_hype')!
    const after = applyChoiceEffects(before, hype, new Set())
    expect(after.confidence).toBe(hype.effects.confidence)
    expect(after.dueDiligence).toBe(hype.effects.dueDiligence)
    expect(before.confidence).toBe(0) // pure — original untouched
  })

  it('amplifies a choice when the player has the matching employee role', () => {
    const stage = ANGEL_DEAL.stages.redflag
    const call = stage.choices.find((c) => c.id === 'rf_call')! // roleBoost: operator
    const plain = applyChoiceEffects(initialScores(), call, new Set())
    const boosted = applyChoiceEffects(initialScores(), call, new Set(['operator']))
    // dueDiligence is +3 base → boosted is strictly larger (same sign)
    expect(boosted.dueDiligence).toBeGreaterThan(plain.dueDiligence)
    // risk is -3 base → boosted is strictly MORE negative (stronger)
    expect(boosted.risk).toBeLessThan(plain.risk)
  })
})

describe('Angel Deal — outcome bands', () => {
  it('a careful, well-negotiated, low-risk deal is GREAT', () => {
    const s = scores({ dueDiligence: 8, valuationDiscipline: 5, leverage: 4, risk: 1 })
    expect(dealQuality(s)).toBeGreaterThanOrEqual(9)
    expect(investedBand(s)).toBe('great')
  })

  it('a decent middling deal is GOOD', () => {
    const s = scores({ dueDiligence: 3, valuationDiscipline: 2, leverage: 1, risk: 3 })
    expect(investedBand(s)).toBe('good')
  })

  it('a hyped, high-risk, no-diligence deal is BAD', () => {
    const s = scores({ confidence: 4, founderTrust: 4, risk: 9, dueDiligence: -2 })
    expect(investedBand(s)).toBe('bad')
  })

  it('walking away from a bad deal counts as disciplined', () => {
    const bad = scores({ confidence: 4, founderTrust: 4, risk: 9, dueDiligence: -2 })
    const fine = scores({ dueDiligence: 4, valuationDiscipline: 2, risk: 2 })
    expect(avoidedBadDeal(bad)).toBe(true)
    expect(avoidedBadDeal(fine)).toBe(false)
  })
})

describe('Angel Deal — payouts are bounded (never ruinous)', () => {
  it('bad outcome loses at most the investment fraction of cash', () => {
    const cash = 1e9
    const loss = payoutFor('bad', false, cash)
    expect(loss).toBeLessThan(0)
    expect(Math.abs(loss)).toBeLessThanOrEqual(cash * ANGEL_INVEST_FRACTION + 1e-6)
    expect(Math.abs(loss)).toBeLessThan(cash) // can never wipe the player out
  })

  it('great pays a multiple; neutral pays ~nothing (small discipline bonus only)', () => {
    const cash = 1e9
    expect(payoutFor('great', false, cash)).toBeGreaterThan(payoutFor('good', false, cash))
    expect(payoutFor('neutral', false, cash)).toBe(0)
    expect(payoutFor('neutral', true, cash)).toBeGreaterThan(0)
    expect(payoutFor('neutral', true, cash)).toBeLessThan(cash * 0.05)
  })
})

describe('Mogul Story seam — active story resolved by id (drives ANY registered story)', () => {
  it('defaults the session to the Angel story and resolves it from the registry', () => {
    const a = initialAngelDealState()
    expect(a.storyId).toBe(ANGEL_DEAL.id)
    expect(activeStory(a)).toBe(ANGEL_DEAL)
  })

  it('falls back to the Angel story if the id is unknown (corrupt/old save never crashes)', () => {
    const a = initialAngelDealState()
    a.storyId = 'no_such_story'
    expect(activeStory(a)).toBe(ANGEL_DEAL)
  })

  it('accepting a pitch opens the ACTIVE story’s first stage (via storyId, not a constant)', () => {
    const s = eligibleState()
    s.angelDeal.offered = true
    startAngelDeal(s)
    expect(s.angelDeal.stageId).toBe(activeStory(s.angelDeal).firstStage)
  })

  it('round-trips storyId through save, dropping an unknown id back to the default', () => {
    const s = eligibleState()
    const restored = deserialize(serialize(s, 1))!
    expect(restored.angelDeal.storyId).toBe(ANGEL_DEAL.id)

    const raw = JSON.parse(serialize(s, 1))
    raw.state.angelDeal.storyId = 'ghost_story'
    const dropped = deserialize(JSON.stringify(raw))!
    expect(dropped.angelDeal.storyId).toBe(ANGEL_DEAL.id)
  })
})

describe('Angel Deal — flow + resolution', () => {
  it('accepting a pitch opens the first stage with fresh scores', () => {
    const s = eligibleState()
    s.angelDeal.offered = true
    expect(startAngelDeal(s)).toBe(true)
    expect(s.angelDeal.active).toBe(true)
    expect(s.angelDeal.stageId).toBe(ANGEL_DEAL.firstStage)
    expect(s.angelDeal.offered).toBe(false)
  })

  it('choosing a non-terminal choice advances the stage', () => {
    const s = eligibleState()
    s.angelDeal.offered = true
    startAngelDeal(s)
    expect(chooseAngelChoice(s, 'pitch_probe', new Set())).toBe(true)
    expect(s.angelDeal.stageId).toBe('impression')
    expect(s.angelDeal.active).toBe(true)
  })

  it('investing resolves to an outcome band, applies the payout, and can UNLOCK the Combinator', () => {
    const s = eligibleState()
    s.angelDeal.active = true
    s.angelDeal.stageId = 'decision'
    // Force great-tier hidden scores so the invest choice lands GREAT.
    s.angelDeal.scores = scores({ dueDiligence: 8, valuationDiscipline: 5, leverage: 4, risk: 1 })
    const cashBefore = s.cash
    expect(chooseAngelChoice(s, 'dec_invest', new Set())).toBe(true)
    expect(s.angelDeal.outcome).toBe('great')
    expect(s.angelDeal.combinatorUnlocked).toBe(true)
    expect(s.cash).toBeGreaterThan(cashBefore) // great pays out
    expect(s.angelDeal.completedCount).toBe(1)
    // Great outcome FOUNDS the Startup Combinator business (owned + unlocked).
    expect(s.businesses[COMBINATOR_ID].owned).toBeGreaterThanOrEqual(1)
    expect(s.businesses[COMBINATOR_ID].unlocked).toBe(true)
    expect(ownsCombinator(s)).toBe(true)
  })

  it('a bad invest costs money but never ruins the run', () => {
    const s = eligibleState()
    s.angelDeal.active = true
    s.angelDeal.stageId = 'decision'
    s.angelDeal.scores = scores({ confidence: 4, founderTrust: 4, risk: 9, dueDiligence: -2 })
    const cashBefore = s.cash
    chooseAngelChoice(s, 'dec_invest', new Set())
    expect(s.angelDeal.outcome).toBe('bad')
    expect(s.cash).toBeLessThan(cashBefore)
    expect(s.cash).toBeGreaterThan(0) // bounded — still solvent
    expect(s.angelDeal.combinatorUnlocked).toBe(false)
    expect(s.angelDeal.boostMsLeft).toBeGreaterThan(0) // a temporary "bad press" debuff
  })

  it('walking away resolves NEUTRAL and never unlocks the Combinator', () => {
    const s = eligibleState()
    s.angelDeal.active = true
    s.angelDeal.stageId = 'decision'
    const cashBefore = s.cash
    chooseAngelChoice(s, 'dec_walk', new Set())
    expect(s.angelDeal.outcome).toBe('neutral')
    expect(s.angelDeal.combinatorUnlocked).toBe(false)
    expect(s.cash).toBe(cashBefore) // no penalty for discipline
  })
})

describe('Angel Deal — trigger + economy folds', () => {
  it('offers a pitch only when eligible + after the cooldown', () => {
    const s = eligibleState()
    expect(angelEligible(s)).toBe(true)
    expect(s.angelDeal.offered).toBe(false)
    tickAngelDeal(s, ANGEL_FIRST_OFFER_MS - 1000) // not quite
    expect(s.angelDeal.offered).toBe(false)
    tickAngelDeal(s, 5000) // now past the cooldown
    expect(s.angelDeal.offered).toBe(true)
  })

  it('never offers when ineligible (no Finance / too little cash)', () => {
    const s = initialGameState(0)
    s.cash = ANGEL_MIN_CASH * 10 // rich, but owns no Finance
    expect(angelEligible(s)).toBe(false)
    tickAngelDeal(s, ANGEL_FIRST_OFFER_MS * 3)
    expect(s.angelDeal.offered).toBe(false)
  })

  it('the timed boost fold is ×1 until a deal is played, and targets the boost industry', () => {
    const s = eligibleState()
    expect(mogulStoryBoostMult(s, 'finance')).toBe(1)
    s.angelDeal.boostMult = 1.4
    s.angelDeal.boostMsLeft = 5000
    s.angelDeal.boostIndustryId = 'finance'
    expect(mogulStoryBoostMult(s, 'finance')).toBeCloseTo(1.4)
    expect(mogulStoryBoostMult(s, 'food')).toBe(1) // only the boosted industry
    s.angelDeal.boostIndustryId = 'retail'
    expect(mogulStoryBoostMult(s, 'retail')).toBeCloseTo(1.4)
    expect(mogulStoryBoostMult(s, 'finance')).toBe(1)
  })

  it('hiredRoles reflects the roster', () => {
    const s = eligibleState()
    expect(hiredRoles(s).size).toBe(0)
    s.employees.e1 = { id: 'e1', templateId: 't', name: 'C', role: 'closer', rarity: 'common', level: 1, affinity: null, traits: [], specialisation: null, specialisation2: null }
    expect(hiredRoles(s).has('closer')).toBe(true)
  })
})

describe('Mogul Story #2 — The Lease (Retail): shared runtime, generic resolution', () => {
  function retailState() {
    const s = initialGameState(0)
    s.cash = 1e9
    s.businesses.corner_shop.owned = 1 // a Retail business
    s.businesses.corner_shop.unlocked = true
    return s
  }

  it('is eligible only when the player owns Retail + clears the cash floor', () => {
    expect(storyEligible(retailState(), LEASE_SHOWDOWN)).toBe(true)
    const noRetail = initialGameState(0)
    noRetail.cash = 1e9 // rich, but owns no Retail
    expect(storyEligible(noRetail, LEASE_SHOWDOWN)).toBe(false)
  })

  it('a Retail-only player is offered the lease (rotation picks an eligible story)', () => {
    const s = retailState()
    expect(eligibleStories(s).map((x) => x.id)).toEqual([LEASE_SHOWDOWN.id])
    tickAngelDeal(s, ANGEL_FIRST_OFFER_MS + 1)
    expect(s.angelDeal.offered).toBe(true)
    expect(s.angelDeal.storyId).toBe(LEASE_SHOWDOWN.id)
  })

  it('a great lease boosts RETAIL (not Finance) and never unlocks the Combinator', () => {
    const s = retailState()
    s.angelDeal.storyId = LEASE_SHOWDOWN.id
    s.angelDeal.active = true
    s.angelDeal.stageId = 'decision'
    s.angelDeal.scores = scores({ dueDiligence: 8, valuationDiscipline: 5, leverage: 4, risk: 1 })
    expect(chooseAngelChoice(s, 'dec_sign', new Set())).toBe(true)
    expect(s.angelDeal.outcome).toBe('great')
    expect(s.angelDeal.combinatorUnlocked).toBe(false) // Angel-only reward
    expect(s.angelDeal.boostIndustryId).toBe('retail')
    expect(mogulStoryBoostMult(s, 'retail')).toBeGreaterThan(1)
    expect(mogulStoryBoostMult(s, 'finance')).toBe(1)
  })

  it('walking away from the lease resolves neutral', () => {
    const s = retailState()
    s.angelDeal.storyId = LEASE_SHOWDOWN.id
    s.angelDeal.active = true
    s.angelDeal.stageId = 'decision'
    expect(chooseAngelChoice(s, 'dec_walk', new Set())).toBe(true)
    expect(s.angelDeal.outcome).toBe('neutral')
  })
})

describe('Mogul Story #3 — The Poach (Tech): another story, zero new resolution code', () => {
  function techState() {
    const s = initialGameState(0)
    s.cash = 1e9
    s.businesses.mobile_app.owned = 1 // a Tech business
    s.businesses.mobile_app.unlocked = true
    return s
  }

  it('is eligible only when the player owns Tech + clears the cash floor', () => {
    expect(storyEligible(techState(), ENGINE_POACH)).toBe(true)
    const noTech = initialGameState(0)
    noTech.cash = 1e9 // rich, but owns no Tech
    expect(storyEligible(noTech, ENGINE_POACH)).toBe(false)
  })

  it('a great retention boosts TECH only and never unlocks the Combinator', () => {
    const s = techState()
    s.angelDeal.storyId = ENGINE_POACH.id
    s.angelDeal.active = true
    s.angelDeal.stageId = 'decision'
    s.angelDeal.scores = scores({ dueDiligence: 8, valuationDiscipline: 5, leverage: 4, risk: 1 })
    expect(chooseAngelChoice(s, 'dec_commit', new Set())).toBe(true)
    expect(s.angelDeal.outcome).toBe('great')
    expect(s.angelDeal.combinatorUnlocked).toBe(false)
    expect(s.angelDeal.boostIndustryId).toBe('tech')
    expect(mogulStoryBoostMult(s, 'tech')).toBeGreaterThan(1)
    expect(mogulStoryBoostMult(s, 'retail')).toBe(1)
  })

  it('letting the engineer go resolves neutral', () => {
    const s = techState()
    s.angelDeal.storyId = ENGINE_POACH.id
    s.angelDeal.active = true
    s.angelDeal.stageId = 'decision'
    expect(chooseAngelChoice(s, 'dec_walk', new Set())).toBe(true)
    expect(s.angelDeal.outcome).toBe('neutral')
  })
})

describe('Mogul Story #4 — Gone Viral (Food): a crisis-opportunity on the shared runtime', () => {
  function foodState() {
    const s = initialGameState(0)
    s.cash = 1e9
    s.businesses.lemonade.owned = 1 // a Food business
    s.businesses.lemonade.unlocked = true
    return s
  }

  it('is eligible only when the player owns Food + clears the cash floor', () => {
    expect(storyEligible(foodState(), VIRAL_MOMENT)).toBe(true)
    const noFood = initialGameState(0)
    noFood.cash = 1e9
    noFood.businesses.lemonade.owned = 0 // owns no Food business
    expect(storyEligible(noFood, VIRAL_MOMENT)).toBe(false)
  })

  it('a graceful finish boosts FOOD only and never unlocks the Combinator', () => {
    const s = foodState()
    s.angelDeal.storyId = VIRAL_MOMENT.id
    s.angelDeal.active = true
    s.angelDeal.stageId = 'decision'
    s.angelDeal.scores = scores({ dueDiligence: 8, valuationDiscipline: 5, leverage: 4, risk: 1 })
    expect(chooseAngelChoice(s, 'dec_ride', new Set())).toBe(true)
    expect(s.angelDeal.outcome).toBe('great')
    expect(s.angelDeal.combinatorUnlocked).toBe(false)
    expect(s.angelDeal.boostIndustryId).toBe('food')
    expect(mogulStoryBoostMult(s, 'food')).toBeGreaterThan(1)
    expect(mogulStoryBoostMult(s, 'tech')).toBe(1)
  })

  it('letting it fade resolves neutral', () => {
    const s = foodState()
    s.angelDeal.storyId = VIRAL_MOMENT.id
    s.angelDeal.active = true
    s.angelDeal.stageId = 'decision'
    expect(chooseAngelChoice(s, 'dec_fade', new Set())).toBe(true)
    expect(s.angelDeal.outcome).toBe('neutral')
  })
})

describe('Mogul Story #5 — The Walkout (Logistics): a labour negotiation on the shared runtime', () => {
  function logisticsState() {
    const s = initialGameState(0)
    s.cash = 1e9
    s.businesses.courier.owned = 1 // a Logistics business
    s.businesses.courier.unlocked = true
    return s
  }

  it('is eligible only when the player owns Logistics + clears the cash floor', () => {
    expect(storyEligible(logisticsState(), DOCK_DISPUTE)).toBe(true)
    const noLogistics = initialGameState(0)
    noLogistics.cash = 1e9
    expect(storyEligible(noLogistics, DOCK_DISPUTE)).toBe(false)
  })

  it('a fair settlement boosts LOGISTICS only and never unlocks the Combinator', () => {
    const s = logisticsState()
    s.angelDeal.storyId = DOCK_DISPUTE.id
    s.angelDeal.active = true
    s.angelDeal.stageId = 'decision'
    s.angelDeal.scores = scores({ dueDiligence: 8, valuationDiscipline: 5, leverage: 4, risk: 1 })
    expect(chooseAngelChoice(s, 'dec_settle', new Set())).toBe(true)
    expect(s.angelDeal.outcome).toBe('great')
    expect(s.angelDeal.combinatorUnlocked).toBe(false)
    expect(s.angelDeal.boostIndustryId).toBe('logistics')
    expect(mogulStoryBoostMult(s, 'logistics')).toBeGreaterThan(1)
    expect(mogulStoryBoostMult(s, 'food')).toBe(1)
  })

  it('letting the crew walk resolves neutral', () => {
    const s = logisticsState()
    s.angelDeal.storyId = DOCK_DISPUTE.id
    s.angelDeal.active = true
    s.angelDeal.stageId = 'decision'
    expect(chooseAngelChoice(s, 'dec_walk', new Set())).toBe(true)
    expect(s.angelDeal.outcome).toBe('neutral')
  })
})

describe('Startup Combinator — exit payouts', () => {
  function ownedCombinatorState() {
    const s = eligibleState()
    s.angelDeal.combinatorUnlocked = true
    s.businesses[COMBINATOR_ID].owned = 1
    s.businesses[COMBINATOR_ID].unlocked = true
    s.angelDeal.exitCooldownMs = EXIT_INTERVAL_MS
    return s
  }

  it('fires a lump-sum exit only after the interval, then resets', () => {
    const s = ownedCombinatorState()
    const pps = 1000
    const cash0 = s.cash
    tickCombinatorExit(s, pps, EXIT_INTERVAL_MS - 1000) // not yet
    expect(s.cash).toBe(cash0)
    expect(s.angelDeal.exitCount).toBe(0)
    tickCombinatorExit(s, pps, 2000) // crosses the interval → exit fires
    expect(s.cash).toBeGreaterThan(cash0)
    expect(s.angelDeal.lastExitAmount).toBeGreaterThan(0)
    expect(s.angelDeal.exitCount).toBe(1)
    expect(s.angelDeal.exitCooldownMs).toBe(EXIT_INTERVAL_MS) // re-armed
  })

  it('never fires when the Combinator isn’t owned (harness-safe)', () => {
    const s = eligibleState()
    s.angelDeal.combinatorUnlocked = true // unlocked but not owned
    s.angelDeal.exitCooldownMs = 0
    const cash0 = s.cash
    tickCombinatorExit(s, 1000, EXIT_INTERVAL_MS * 3)
    expect(s.cash).toBe(cash0)
    expect(s.angelDeal.exitCount).toBe(0)
  })
})

describe('Angel Deal — save/load', () => {
  it('persists the Combinator unlock + completed count across a save round-trip', () => {
    const s = eligibleState()
    s.angelDeal.combinatorUnlocked = true
    s.angelDeal.completedCount = 2
    const loaded = deserialize(serialize(s, 1))!
    expect(loaded.angelDeal.combinatorUnlocked).toBe(true)
    expect(loaded.angelDeal.completedCount).toBe(2)
  })

  it('restores a valid in-progress session but safely cancels an unknown stage', () => {
    const s = eligibleState()
    s.angelDeal.active = true
    s.angelDeal.stageId = 'valuation'
    s.angelDeal.scores = scores({ leverage: 3 })
    const ok = deserialize(serialize(s, 1))!
    expect(ok.angelDeal.active).toBe(true)
    expect(ok.angelDeal.stageId).toBe('valuation')
    expect(ok.angelDeal.scores.leverage).toBe(3)

    s.angelDeal.stageId = 'a_stage_that_was_removed'
    const cancelled = deserialize(serialize(s, 1))!
    expect(cancelled.angelDeal.active).toBe(false)
    expect(cancelled.angelDeal.stageId).toBeNull()
  })

  it('dismissing the outcome clears the session and starts a re-offer cooldown', () => {
    const s = eligibleState()
    s.angelDeal.active = true
    s.angelDeal.outcome = 'good'
    dismissAngelOutcome(s)
    expect(s.angelDeal.active).toBe(false)
    expect(s.angelDeal.outcome).toBeNull()
    expect(s.angelDeal.cooldownMs).toBeGreaterThan(0)
  })
})
