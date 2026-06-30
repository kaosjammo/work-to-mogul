// ============================================================
//  initialGameState — the concrete first-run state (rule #13).
//  Pure: imports content + types only (no store, no engine singleton).
// ============================================================
import type {
  BusinessState,
  GameState,
  IndustryState,
} from '../types/domain'
import { INDUSTRIES, INDUSTRY_ORDER } from '../content/industries'
import { BUSINESSES, BUSINESS_ORDER } from '../content/businesses'
import { initialCareerState } from '../engine/career'
import { initialGoldenState } from '../engine/golden'
import { initialRushHourState } from '../engine/rushHour'
import { initialContractsState } from '../engine/contracts'

// Players now start broke and earn their first capital from Work (the career
// system), not by buying a business. No required Lemonade Stand purchase.
const STARTING_CASH = 0
const STARTING_MORALE = 60 // slightly positive equilibrium — forgiving for idle players

export function initialGameState(now: number = Date.now()): GameState {
  const industries: Record<string, IndustryState> = {}
  for (const id of INDUSTRY_ORDER) {
    industries[id] = { unlocked: INDUSTRIES[id].unlock.kind === 'free' }
  }

  const businesses: Record<string, BusinessState> = {}
  for (const id of BUSINESS_ORDER) {
    const def = BUSINESSES[id]
    const industryUnlocked = industries[def.industryId].unlocked
    const ownMet = def.unlock.kind === 'free'
    businesses[id] = {
      owned: 0,
      unlocked: industryUnlocked && ownMet,
      cycleProgressMs: 0,
      assigned: [null], // 1 slot open at owned 0 (slotUnlocks[0] === 0)
      morale: STARTING_MORALE,
      risk: 0,
      riskEventMsLeft: 0,
    }
  }

  return {
    cash: STARTING_CASH,
    lifetimeEarnings: 0,
    lastWallClock: now,
    career: initialCareerState(),
    golden: initialGoldenState(),
    rushHour: initialRushHourState(),
    buyMode: 'x1',
    activeTab: 'business',
    activeIndustryTab: 'food',
    industries,
    businesses,
    employees: {},
    hirePool: [],
    purchasedUnlocks: [],
    upgradesPurchased: [],
    milestonesReached: [],
    achievementsUnlocked: [],
    prestigeMilestonesClaimed: [],
    contracts: initialContractsState(),
    prestige: { totalPoints: 0, spentPoints: 0, talents: {}, multiplier: 1, resets: 0, founderPerk: null },
    onboardingStep: 0,
    nextEmployeeSeq: 1,
  }
}
