import { describe, it, expect } from 'vitest'
import { initialGameState } from '../store/initialState'
import {
  buyTalent,
  availableTokens,
  talentEconomy,
  hireStartLevel,
  hireCostMult,
  levelCostMult,
  offlineMult,
  tokenYieldMult,
  goldenValueMult,
  startCash,
} from './talents'
import { timeWarpValue } from './golden'
import { economyMultipliers, PRESTIGE_SCALE } from './economy'
import { prestigeReset } from './prestige'
import { hireEmployee, levelUpCost } from './employees/roster'
import { applyOfflineEarnings } from './catchUp'
import { BUSINESSES } from '../content/businesses'

function withTokens(n: number) {
  const s = initialGameState(0)
  s.prestige.totalPoints = n
  return s
}

describe('buyTalent', () => {
  it('spends tokens, raises the rank, and refuses when broke or maxed', () => {
    const s = withTokens(3)
    expect(availableTokens(s)).toBe(3)

    expect(buyTalent(s, 'magnate')).toBe(true) // cost 1 (rank 0→1)
    expect(s.prestige.talents.magnate).toBe(1)
    expect(s.prestige.spentPoints).toBe(1)
    expect(availableTokens(s)).toBe(2)

    expect(buyTalent(s, 'magnate')).toBe(true) // cost 2 (rank 1→2)
    expect(s.prestige.talents.magnate).toBe(2)
    expect(availableTokens(s)).toBe(0)

    expect(buyTalent(s, 'magnate')).toBe(false) // cost 3 (rank 2→3), can't afford
    expect(s.prestige.talents.magnate).toBe(2)
  })

  it('rejects unknown ids', () => {
    const s = withTokens(99)
    expect(buyTalent(s, 'nope')).toBe(false)
  })

  it('cannot exceed maxRank', () => {
    const s = withTokens(999)
    while (buyTalent(s, 'overdrive')) {
      /* spend until maxed */
    }
    expect(s.prestige.talents.overdrive).toBe(3) // overdrive maxRank
  })
})

describe('talent economy fold', () => {
  it('magnate raises global profit; efficiency raises speed; wholesale cuts cost', () => {
    const s = withTokens(99)
    const base = economyMultipliers(s, BUSINESSES.lemonade)
    buyTalent(s, 'magnate') // +12% profit
    buyTalent(s, 'efficiency') // +8% speed
    buyTalent(s, 'wholesale') // -6% buy cost
    const eco = talentEconomy(s)
    expect(eco.profit).toBeCloseTo(1.12)
    expect(eco.speed).toBeCloseTo(1.08)
    expect(eco.costReduc).toBeCloseTo(0.94)

    const after = economyMultipliers(s, BUSINESSES.lemonade)
    expect(after.profit).toBeCloseTo(base.profit * 1.12)
    expect(after.speed).toBeCloseTo(base.speed * 1.08)
    expect(after.baseCostFactor).toBeCloseTo(base.baseCostFactor * 0.94)
  })
})

describe('workforce talents', () => {
  it('fast learners raise the starting level of new hires', () => {
    const s = withTokens(99)
    buyTalent(s, 'fast_learners')
    buyTalent(s, 'fast_learners') // rank 2 → start at level 3
    expect(hireStartLevel(s)).toBe(3)
    s.cash = 1e9
    const id = hireEmployee(s, 'flash_ortega')!
    expect(s.employees[id].level).toBe(3)
  })

  it('headhunter cuts hire cost; mentorship cuts level-up cost', () => {
    const s = withTokens(99)
    buyTalent(s, 'headhunter') // -12%
    expect(hireCostMult(s)).toBeCloseTo(0.88)
    buyTalent(s, 'mentorship') // -10%
    expect(levelCostMult(s)).toBeCloseTo(0.9)
    const e = { templateId: 'flash_ortega', level: 1 } as never
    expect(levelUpCost(e, levelCostMult(s))).toBeLessThan(levelUpCost(e, 1))
  })
})

describe('tempo talents', () => {
  it('idle mastery multiplies offline earnings', () => {
    const s = withTokens(99)
    s.businesses.lemonade.owned = 5
    s.businesses.lemonade.unlocked = true
    s.businesses.lemonade.assigned = ['op']
    s.employees.op = {
      id: 'op', templateId: 'mickey_gears', name: 'Op', role: 'operator',
      rarity: 'common', level: 1, affinity: null, traits: [], specialisation: null,
    }
    const baseline = applyOfflineEarnings(structuredClone(s), 60_000).earned
    buyTalent(s, 'idle_mastery') // +30%
    expect(offlineMult(s)).toBeCloseTo(1.3)
    const boosted = applyOfflineEarnings(s, 60_000).earned
    expect(boosted).toBeCloseTo(baseline * 1.3, 1)
  })

  it('golden touch boosts Time-Warp payout value', () => {
    const s = withTokens(99)
    s.businesses.lemonade.owned = 5
    s.businesses.lemonade.unlocked = true
    s.businesses.lemonade.assigned = ['op']
    s.employees.op = {
      id: 'op', templateId: 'mickey_gears', name: 'Op', role: 'operator',
      rarity: 'common', level: 1, affinity: null, traits: [], specialisation: null,
    }
    const base = timeWarpValue(structuredClone(s))
    expect(goldenValueMult(s)).toBeCloseTo(1)
    buyTalent(s, 'golden_touch') // +25%
    expect(goldenValueMult(s)).toBeCloseTo(1.25)
    expect(timeWarpValue(s)).toBeCloseTo(base * 1.25, 1)
  })

  it('prestige scholar increases tokens banked at ascension', () => {
    const s = initialGameState(0)
    s.prestige.totalPoints = 99
    buyTalent(s, 'prestige_scholar') // +15% token yield
    expect(tokenYieldMult(s)).toBeCloseTo(1.15)
    s.lifetimeEarnings = 100 * PRESTIGE_SCALE // sqrt(100) = 10 base tokens → floor(10*1.15)=11
    const before = s.prestige.totalPoints
    prestigeReset(s)
    expect(s.prestige.totalPoints - before).toBe(11)
  })
})

describe('seed capital', () => {
  it('grants a starting bankroll after ascension', () => {
    const s = initialGameState(0)
    s.prestige.totalPoints = 99
    buyTalent(s, 'seed_capital') // rank 1 → $1,000
    expect(startCash(s)).toBe(1_000)
    s.lifetimeEarnings = PRESTIGE_SCALE // enough to ascend
    prestigeReset(s)
    expect(s.cash).toBe(1_000) // fresh run starts with the seed, not broke
    expect(s.prestige.talents.seed_capital).toBe(1) // talent preserved
  })
})
