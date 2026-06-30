// ============================================================
//  Pure economy formulas. No React, no Zustand, no I/O.
//  These encode the entire economic model and are unit-tested directly.
// ============================================================
import type {
  BusinessDef,
  BuyMode,
  EconomyMultipliers,
  GameState,
  IndustryId,
  Num,
} from '../types/domain'
import { INDUSTRIES } from '../content/industries'
import { UPGRADES } from '../content/upgrades'
import { talentEconomy } from './talents'

// ----- Cost scaling -----

/** Cost of the next single unit given how many are already owned. */
export function unitCost(def: BusinessDef, owned: number): Num {
  return def.baseCost * Math.pow(def.growthRate, owned)
}

/** Total cost to buy `q` units starting from `owned` (closed-form geometric series). */
export function totalCost(def: BusinessDef, owned: number, q: number): Num {
  if (q <= 0) return 0
  const r = def.growthRate
  const first = def.baseCost * Math.pow(r, owned)
  return (first * (Math.pow(r, q) - 1)) / (r - 1)
}

/** Largest integer q such that totalCost(owned, q) <= cash. */
export function maxAffordable(def: BusinessDef, owned: number, cash: Num): number {
  const r = def.growthRate
  const first = def.baseCost * Math.pow(r, owned)
  if (cash < first) return 0
  const q = Math.log((cash * (r - 1)) / first + 1) / Math.log(r)
  return Math.max(0, Math.floor(q + 1e-9)) // epsilon guards float drift at boundaries
}

/** Resolve a buy mode into a desired quantity (cost-checked separately). */
export function resolveQuantity(
  mode: BuyMode,
  def: BusinessDef,
  owned: number,
  cash: Num,
): number {
  if (mode === 'max') return maxAffordable(def, owned, cash)
  return mode === 'x1' ? 1 : mode === 'x10' ? 10 : 100
}

// ----- Milestones (derived from owned, never mutated onto state) -----

export interface AppliedMilestones {
  profit: number
  speed: number
  costRed: number
  reachedIds: string[]
}

export function appliedMilestones(def: BusinessDef, owned: number): AppliedMilestones {
  let profit = 1
  let speed = 1
  let costRed = 1
  const reachedIds: string[] = []
  for (const m of def.milestones) {
    if (owned >= m.threshold) {
      reachedIds.push(m.id)
      if (m.effect.kind === 'profitMult') profit *= m.effect.factor
      else if (m.effect.kind === 'speedMult') speed *= m.effect.factor
      else costRed *= m.effect.factor
    }
  }
  return { profit, speed, costRed, reachedIds }
}

/** The next milestone a business hasn't reached yet (for UI hints), or null. */
export function nextMilestone(def: BusinessDef, owned: number) {
  return def.milestones.find((m) => owned < m.threshold) ?? null
}

// ----- Industry specialisation -----

export function totalOwnedInIndustry(state: GameState, industryId: IndustryId): number {
  const ind = INDUSTRIES[industryId]
  if (!ind) return 0
  let total = 0
  for (const bid of ind.businessIds) total += state.businesses[bid]?.owned ?? 0
  return total
}

/** Industry-wide profit/speed multipliers from base bonus + specialisation thresholds. */
export function industryMultipliers(state: GameState, industryId: IndustryId) {
  const ind = INDUSTRIES[industryId]
  let profit = ind?.bonus.globalProfitMult ?? 1
  let speed = ind?.bonus.globalSpeedMult ?? 1
  const total = totalOwnedInIndustry(state, industryId)
  if (total >= 100) profit *= 1.5
  if (total >= 250) profit *= 2
  if (total >= 500) {
    profit *= 2
    // Signature perk at the deep specialisation threshold.
    if (ind?.bonus.signaturePerkId === 'rush_hour') speed *= 2
    if (ind?.bonus.signaturePerkId === 'network_effect') profit *= 1.25
    if (ind?.bonus.signaturePerkId === 'just_in_time') speed *= 2
    if (ind?.bonus.signaturePerkId === 'grid_surge') profit *= 1.5
    if (ind?.bonus.signaturePerkId === 'moonshot') profit *= 2
  }
  return { profit, speed }
}

// ----- Prestige -----

/** Prestige points earned for a given lifetime earnings (sqrt scaling). */
export function prestigePointsFor(lifetimeEarnings: Num): number {
  return Math.floor(Math.sqrt(Math.max(0, lifetimeEarnings) / 1e6))
}

export const PRESTIGE_UNLOCK_LIFETIME = 1e6

// ----- Combined economy multipliers (milestone × industry × prestige × upgrades) -----

export function economyMultipliers(state: GameState, def: BusinessDef): EconomyMultipliers {
  const owned = state.businesses[def.id]?.owned ?? 0
  const ms = appliedMilestones(def, owned)
  const ind = industryMultipliers(state, def.industryId)
  const up = upgradeMultipliers(state, def)
  const tal = talentEconomy(state) // prestige talent tree (replaces flat +2%/token)
  return {
    profit: ms.profit * ind.profit * tal.profit * up.profit,
    speed: ms.speed * ind.speed * tal.speed * up.speed,
    baseCostFactor: ms.costRed * tal.costReduc * up.costRed,
  }
}

// Upgrades fold in here (populated in M5; safe no-op until then).
function upgradeMultipliers(state: GameState, def: BusinessDef) {
  let profit = 1
  let speed = 1
  let costRed = 1
  for (const id of state.upgradesPurchased) {
    const up = UPGRADE_LOOKUP[id]
    if (!up) continue
    const inScope =
      up.scope.kind === 'global' ||
      (up.scope.kind === 'industry' && up.scope.industryId === def.industryId) ||
      (up.scope.kind === 'business' && up.scope.businessId === def.id)
    if (!inScope) continue
    if (up.effect.kind === 'profitMult') profit *= up.effect.factor
    else if (up.effect.kind === 'speedMult') speed *= up.effect.factor
    else costRed *= up.effect.factor
  }
  return { profit, speed, costRed }
}

const UPGRADE_LOOKUP = UPGRADES
