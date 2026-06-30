// ============================================================
//  Balancing harness — a pure, deterministic fast-forward simulator.
//  Drives a greedy "reasonable player" bot (work early → buy businesses →
//  hire + auto-assign to automate) and reports the pacing curve, so the
//  economy can be validated/tuned without playing in real time.
// ============================================================
import type { GameState } from '../types/domain'
import { initialGameState } from '../store/initialState'
import { applyTick, checkUnlocks } from './simulate'
import { BUSINESS_ORDER, BUSINESSES } from '../content/businesses'
import { unitCost, PRESTIGE_UNLOCK_LIFETIME } from './economy'
import { resolveBusiness } from './resolveBusiness'
import { purchase } from './buy'
import { startShift } from './career'
import { hireEmployee } from './employees/roster'
import { autoAssignBest } from './employees/autoAssign'
import { EMPLOYEE_TEMPLATES, HIRE_ORDER } from '../content/employeeTemplates'

export interface SimSample {
  t: number
  cash: number
  pps: number
  owned: number
  careerLevel: number
  industries: number
}

export interface SimEvents {
  firstBusiness?: number
  firstAutomation?: number
  /** Time the second business in the FIRST industry (Food Truck) unlocks — the
   *  early-game "what's next after Lemonade" beat. A key onboarding-momentum
   *  landmark: if this drags, the start feels like an unrewarding grind. */
  secondBusinessUnlocked?: number
  secondIndustry?: number
  prestigeEligible?: number
}

// The second business in the starting (Food) industry — the first unlock the
// player chases after their opening business.
const SECOND_BUSINESS_ID = BUSINESS_ORDER[1]

export interface SimResult {
  samples: SimSample[]
  events: SimEvents
  finalCash: number
  finalLifetime: number
  finalOwned: number
  industriesEntered: number
  employees: number
}

// Deterministic RNG (mulberry32) so runs are reproducible.
function makeRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function totalOwned(s: GameState): number {
  let n = 0
  for (const id in s.businesses) n += s.businesses[id].owned
  return n
}

function totalAutomatedPps(s: GameState): number {
  let pps = 0
  for (const id in s.businesses) {
    const bs = s.businesses[id]
    if (!bs.unlocked || bs.owned <= 0) continue
    const r = resolveBusiness(s, BUSINESSES[id])
    if (r.isAutomated) pps += r.pps
  }
  return pps
}

/** Count industries with at least one owned business. */
function industriesEntered(s: GameState): number {
  const set = new Set<string>()
  for (const id in s.businesses) {
    if (s.businesses[id].owned > 0) set.add(BUSINESSES[id].industryId)
  }
  return set.size
}

function anyAutomated(s: GameState): boolean {
  for (const id in s.businesses) {
    const bs = s.businesses[id]
    if (bs.unlocked && bs.owned > 0 && resolveBusiness(s, BUSINESSES[id]).isAutomated) return true
  }
  return false
}

const MAX_EMPLOYEES = 30
const OPERATOR_TEMPLATES = HIRE_ORDER.filter((tid) => EMPLOYEE_TEMPLATES[tid].role === 'operator')
const CHEAPEST_OPERATOR_COST = Math.min(
  ...OPERATOR_TEMPLATES.map((tid) => EMPLOYEE_TEMPLATES[tid].baseHireCost),
)

function cheapestAffordableOperator(s: GameState): string | null {
  let best: string | null = null
  let bc = Infinity
  for (const tid of OPERATOR_TEMPLATES) {
    const c = EMPLOYEE_TEMPLATES[tid].baseHireCost
    if (c <= s.cash && c < bc) {
      bc = c
      best = tid
    }
  }
  return best
}

/** Any owned, unlocked business that isn't automated yet. */
function needsAutomation(s: GameState): boolean {
  for (const id in s.businesses) {
    const bs = s.businesses[id]
    if (bs.unlocked && bs.owned > 0 && !resolveBusiness(s, BUSINESSES[id]).isAutomated) return true
  }
  return false
}

/**
 * One bot decision step. A realistic idle player: works for startup capital,
 * AUTOMATES businesses (hires + assigns operators) before mass-buying, and
 * reserves a little cash so it can always afford the next operator.
 */
function botStep(s: GameState, step: number): void {
  if (s.career.shiftProgressMs <= 0) startShift(s)

  // Assign any benched staff (cheap no-op when none).
  if (step % 5 === 0) autoAssignBest(s)

  // Hire an operator to automate an un-automated business, if affordable.
  if (Object.keys(s.employees).length < MAX_EMPLOYEES && needsAutomation(s)) {
    const op = cheapestAffordableOperator(s)
    if (op) {
      hireEmployee(s, op)
      autoAssignBest(s)
    }
  }

  // Buy the best-VALUE affordable unlocked unit — the one whose next unit adds the
  // most $/s per dollar spent (marginal ROI) — reserving cash for the next operator
  // while any business still needs automating. (Buying "cheapest" is wrong under a
  // monotonic-efficiency economy, where the cheapest business is the worst deal.)
  const reserve = needsAutomation(s) ? CHEAPEST_OPERATOR_COST : 0
  for (let i = 0; i < 40; i++) {
    let bestId: string | null = null
    let bestRoi = 0
    for (const id of BUSINESS_ORDER) {
      const bs = s.businesses[id]
      if (!bs.unlocked) continue
      const def = BUSINESSES[id]
      const r = resolveBusiness(s, def)
      const cost = unitCost(def, bs.owned) * r.buyCostMult
      if (!(cost > 0) || cost > s.cash - reserve) continue
      // $/s the next unit adds (revenue is linear in owned, so per-unit = pps/owned).
      let perUnitPps: number
      if (bs.owned > 0) {
        perUnitPps = r.pps / bs.owned
      } else {
        bs.owned = 1
        perUnitPps = resolveBusiness(s, def).pps
        bs.owned = 0
      }
      const roi = perUnitPps / cost
      if (roi > bestRoi) {
        bestRoi = roi
        bestId = id
      }
    }
    if (!bestId || !purchase(s, bestId, 1)) break
  }

  if (step % 15 === 0) checkUnlocks(s)
}

export function simulateSession(
  seconds: number,
  opts: { dtMs?: number; sampleEverySec?: number; seed?: number } = {},
): SimResult {
  const dtMs = opts.dtMs ?? 1000
  const sampleEvery = opts.sampleEverySec ?? 60
  const rng = makeRng(opts.seed ?? 12345)
  const s = initialGameState(0)
  const samples: SimSample[] = []
  const events: SimEvents = {}

  const totalSteps = Math.floor((seconds * 1000) / dtMs)
  const sampleStepInterval = Math.max(1, Math.floor((sampleEvery * 1000) / dtMs))

  for (let step = 0; step < totalSteps; step++) {
    botStep(s, step)
    applyTick(s, dtMs, rng)
    const tSec = ((step + 1) * dtMs) / 1000

    if (events.firstBusiness == null && totalOwned(s) > 0) events.firstBusiness = tSec
    if (events.firstAutomation == null && anyAutomated(s)) events.firstAutomation = tSec
    if (events.secondBusinessUnlocked == null && s.businesses[SECOND_BUSINESS_ID]?.unlocked) {
      events.secondBusinessUnlocked = tSec
    }
    if (events.secondIndustry == null && industriesEntered(s) >= 2) events.secondIndustry = tSec
    if (events.prestigeEligible == null && s.lifetimeEarnings >= PRESTIGE_UNLOCK_LIFETIME) {
      events.prestigeEligible = tSec
    }

    if (step % sampleStepInterval === 0) {
      samples.push({
        t: tSec,
        cash: s.cash,
        pps: totalAutomatedPps(s),
        owned: totalOwned(s),
        careerLevel: s.career.level,
        industries: industriesEntered(s),
      })
    }
  }

  return {
    samples,
    events,
    finalCash: s.cash,
    finalLifetime: s.lifetimeEarnings,
    finalOwned: totalOwned(s),
    industriesEntered: industriesEntered(s),
    employees: Object.keys(s.employees).length,
  }
}
