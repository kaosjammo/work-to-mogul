import { describe, it, expect } from 'vitest'
import type { GameState } from '../types/domain'
import { initialGameState } from '../store/initialState'
import { applyTick } from './simulate'
import { tickAngelDeal } from './angelDeal'
import { serialize, deserialize } from '../save/serialize'
import { EA_SUMMIT, EA_WARROOM } from '../content/mogulStories'
import {
  isEaStory,
  eaEpisodeIndex,
  eaEligible,
  applyEaOutcome,
  canPoachEa,
  poachEa,
  tickAdvisorFee,
  advisorFeeFraction,
  EA_EPISODE_IDS,
  ADVISOR_FILL_MS,
} from './execAssistant'

/** A state that owns the (automated) Investment Fund → arc-eligible + has idle income. */
function fundState(): GameState {
  const s = initialGameState(0)
  s.businesses.fund.owned = 1
  s.businesses.fund.unlocked = true
  s.employees.op = {
    id: 'op', templateId: 'x', name: 'Op', role: 'operator',
    rarity: 'common', level: 1, affinity: null, traits: [], specialisation: null,
  }
  s.businesses.fund.assigned = ['op']
  s.cash = 1e12
  return s
}

describe('EA arc — episode gating', () => {
  it('identifies the 3 EA episodes', () => {
    expect(EA_EPISODE_IDS).toEqual(['ea_summit', 'ea_warroom', 'ea_offer'])
    expect(isEaStory('ea_summit')).toBe(true)
    expect(isEaStory('love_spark')).toBe(false)
    expect(eaEpisodeIndex('ea_offer')).toBe(2)
  })

  it('offers only the CURRENT episode, gated on the Fund unlock and pre-poach', () => {
    const s = fundState()
    expect(eaEligible(s, EA_SUMMIT)).toBe(true) // arcStage 0 → episode 1
    expect(eaEligible(s, EA_WARROOM)).toBe(false) // not until stage 1
    s.businesses.fund.unlocked = false
    expect(eaEligible(s, EA_SUMMIT)).toBe(false) // no Fund → no arc
    s.businesses.fund.unlocked = true
    s.automation.invest.arcStage = 1
    expect(eaEligible(s, EA_SUMMIT)).toBe(false)
    expect(eaEligible(s, EA_WARROOM)).toBe(true)
    s.automation.invest.unlocked = true // poached → arc closed
    expect(eaEligible(s, EA_WARROOM)).toBe(false)
  })
})

describe('EA arc — progression + poach', () => {
  it('a great/good finish advances the stage; bad/neutral do not', () => {
    const s = fundState()
    applyEaOutcome(s, 'ea_summit', 'great')
    expect(s.automation.invest.arcStage).toBe(1)
    applyEaOutcome(s, 'ea_warroom', 'good')
    expect(s.automation.invest.arcStage).toBe(2)
    applyEaOutcome(s, 'ea_offer', 'bad') // no regress, no advance
    expect(s.automation.invest.arcStage).toBe(2)
    applyEaOutcome(s, 'ea_offer', 'neutral')
    expect(s.automation.invest.arcStage).toBe(2)
    applyEaOutcome(s, 'ea_offer', 'great')
    expect(s.automation.invest.arcStage).toBe(3)
  })

  it('a stale/replayed resolve for a passed episode is a no-op', () => {
    const s = fundState()
    s.automation.invest.arcStage = 2
    applyEaOutcome(s, 'ea_summit', 'great') // episode 0, but we're at stage 2
    expect(s.automation.invest.arcStage).toBe(2)
  })

  it('poaching needs all 3 courted, then unlocks + turns on the EA (free, once)', () => {
    const s = fundState()
    expect(canPoachEa(s)).toBe(false)
    s.automation.invest.arcStage = 3
    expect(canPoachEa(s)).toBe(true)
    const cashBefore = s.cash
    expect(poachEa(s)).toBe(true)
    expect(s.automation.invest.unlocked).toBe(true)
    expect(s.automation.invest.enabled).toBe(true)
    expect(s.cash).toBe(cashBefore) // free — the 3 episodes were the price
    expect(poachEa(s)).toBe(false) // already yours
    expect(canPoachEa(s)).toBe(false)
  })
})

describe('EA arc — first Fund unlock pops episode 1', () => {
  it('tickAngelDeal offers ea_summit the moment the Fund is unlocked', () => {
    const s = fundState()
    expect(s.automation.invest.arcStarted).toBe(false)
    tickAngelDeal(s, 100) // one tick after the Fund is owned
    expect(s.angelDeal.offered).toBe(true)
    expect(s.angelDeal.storyId).toBe('ea_summit')
    expect(s.automation.invest.arcStarted).toBe(true)
  })
})

describe('Board Advisor Fee', () => {
  it('is inert unless the EA is poached AND the toggle is on', () => {
    const s = fundState()
    expect(tickAdvisorFee(s, ADVISOR_FILL_MS)).toBe(0) // not poached
    s.automation.invest.unlocked = true
    expect(tickAdvisorFee(s, ADVISOR_FILL_MS)).toBe(0) // toggle off
  })

  it('accrues to 100%, banks a fee, and resets', () => {
    const s = fundState()
    s.automation.invest.unlocked = true
    s.automation.invest.advisorFee = true
    expect(tickAdvisorFee(s, ADVISOR_FILL_MS / 2)).toBe(0) // half full
    expect(advisorFeeFraction(s)).toBeCloseTo(0.5)
    const cashBefore = s.cash
    const fee = tickAdvisorFee(s, ADVISOR_FILL_MS / 2 + 100) // crosses 100%
    expect(fee).toBeGreaterThan(0)
    expect(s.cash).toBeCloseTo(cashBefore + fee)
    expect(advisorFeeFraction(s)).toBeLessThan(0.1) // reset
  })
})

describe('EA arc — HARNESS byte-inertness', () => {
  it('applyTick with an un-poached EA never adds advisor income (income identical)', () => {
    const off = fundState()
    const control = fundState()
    const rng = () => 0.5
    for (let i = 0; i < 200; i++) {
      applyTick(off, 100, rng)
      applyTick(control, 100, rng)
    }
    expect(off.cash).toBe(control.cash)
    expect(off.automation.invest.unlocked).toBe(false) // bot never poaches
  })
})

describe('EA arc — save round-trip', () => {
  it('persists arc progress + poach + advisor toggle (not the fill meter)', () => {
    const s = fundState()
    s.automation.invest.arcStage = 2
    s.automation.invest.arcStarted = true
    const mid = deserialize(serialize(s, 1))!
    expect(mid.automation.invest.arcStage).toBe(2)
    expect(mid.automation.invest.arcStarted).toBe(true)
    expect(mid.automation.invest.unlocked).toBe(false)

    s.automation.invest.unlocked = true
    s.automation.invest.advisorFee = true
    s.automation.invest.advisorFeeMs = ADVISOR_FILL_MS / 2
    const back = deserialize(serialize(s, 1))!
    expect(back.automation.invest.unlocked).toBe(true)
    expect(back.automation.invest.advisorFee).toBe(true)
    expect(back.automation.invest.advisorFeeMs).toBe(0) // meter is online-only → resets
    expect(back.automation.invest.arcStage).toBe(2) // arc progress preserved as-is
  })
})
