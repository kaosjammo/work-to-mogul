// ============================================================
//  Prestige talent folds — pure over GameState. Turns purchased talent ranks
//  into the multipliers/values the rest of the engine reads:
//   • talentEconomy()  → folded into economyMultipliers (profit/speed/cost)
//   • hireStartLevel / hireCostMult → roster.hireEmployee
//   • levelCostMult    → roster.levelUpCost
//   • offlineMult      → catchUp
//   • tokenYieldMult / startCash → prestigeReset
//  buyTalent() spends Empire Tokens to raise a rank.
// ============================================================
import type { GameState } from '../types/domain'
import { TALENTS, type TalentDef } from '../content/talents'
import { money } from './num'

export function talentRank(state: GameState, id: string): number {
  return state.prestige.talents?.[id] ?? 0
}

/** Unspent Empire Tokens available to invest. */
export function availableTokens(state: GameState): number {
  const p = state.prestige
  return Math.max(0, (p.totalPoints ?? 0) - (p.spentPoints ?? 0))
}

/** Token cost of the NEXT rank, or null if maxed/unknown. */
export function nextTalentCost(state: GameState, id: string): number | null {
  const def = TALENTS[id]
  if (!def) return null
  const rank = talentRank(state, id)
  if (rank >= def.maxRank) return null
  return def.cost[rank]
}

/** Buy one rank of a talent if affordable and not maxed. Mutates state. */
export function buyTalent(state: GameState, id: string): boolean {
  const def = TALENTS[id]
  if (!def) return false
  const rank = talentRank(state, id)
  if (rank >= def.maxRank) return false
  const cost = def.cost[rank]
  if (availableTokens(state) < cost) return false
  if (!state.prestige.talents) state.prestige.talents = {}
  state.prestige.talents[id] = rank + 1
  state.prestige.spentPoints = (state.prestige.spentPoints ?? 0) + cost
  return true
}

// ----- generic descriptor walkers -----

// The per-rank scalar effect descriptors (excludes the startCash table).
type ScalarTalentKey =
  | 'profitMultPerRank'
  | 'speedMultPerRank'
  | 'costReducPerRank'
  | 'hireLevelPerRank'
  | 'hireCostReducPerRank'
  | 'levelCostReducPerRank'
  | 'offlineMultPerRank'
  | 'tokenYieldPerRank'
  | 'goldenMultPerRank'

function sumPerRank(state: GameState, key: ScalarTalentKey): number {
  let sum = 0
  const talents = state.prestige.talents ?? {}
  for (const id in talents) {
    const def = TALENTS[id]
    const rank = talents[id]
    const per = def?.[key]
    if (typeof per === 'number' && rank) sum += per * rank
  }
  return sum
}

/** Product of per-talent reduction factors ×(1 − per·rank), floored at 0.1. */
function productReduc(state: GameState, key: ScalarTalentKey): number {
  let m = 1
  const talents = state.prestige.talents ?? {}
  for (const id in talents) {
    const def = TALENTS[id]
    const rank = talents[id]
    const per = def?.[key]
    if (typeof per === 'number' && rank) m *= Math.max(0.1, 1 - per * rank)
  }
  return m
}

// ----- economy fold (profit / speed / cost) -----

export interface TalentEconomy {
  profit: number
  speed: number
  costReduc: number
}

export function talentEconomy(state: GameState): TalentEconomy {
  return {
    profit: 1 + sumPerRank(state, 'profitMultPerRank'),
    speed: 1 + sumPerRank(state, 'speedMultPerRank'),
    costReduc: productReduc(state, 'costReducPerRank'),
  }
}

// ----- workforce / tempo folds -----

/** Starting level for newly hired staff (1 + Fast Learners). */
export function hireStartLevel(state: GameState): number {
  return 1 + Math.floor(sumPerRank(state, 'hireLevelPerRank'))
}

/** Multiplier on hire cost (≤ 1, from Headhunter). */
export function hireCostMult(state: GameState): number {
  return productReduc(state, 'hireCostReducPerRank')
}

/** Multiplier on employee level-up cost (≤ 1, from Mentorship). */
export function levelCostMult(state: GameState): number {
  return productReduc(state, 'levelCostReducPerRank')
}

/** Multiplier on offline/away earnings (≥ 1, from Idle Mastery). */
export function offlineMult(state: GameState): number {
  return 1 + sumPerRank(state, 'offlineMultPerRank')
}

/** Multiplier on prestige tokens earned at ascension (≥ 1, from Prestige Scholar). */
export function tokenYieldMult(state: GameState): number {
  return 1 + sumPerRank(state, 'tokenYieldPerRank')
}

/** Multiplier on Golden Deal / Time-Warp payouts (≥ 1, from Golden Touch). */
export function goldenValueMult(state: GameState): number {
  return 1 + sumPerRank(state, 'goldenMultPerRank')
}

/** Cash granted at the start of each run (highest Seed Capital rank). */
export function startCash(state: GameState): number {
  let cash = 0
  const talents = state.prestige.talents ?? {}
  for (const id in talents) {
    const def = TALENTS[id]
    const rank = talents[id]
    if (def?.startCash && rank > 0) cash = Math.max(cash, def.startCash[rank - 1] ?? 0)
  }
  return cash
}

/** The permanent profit bonus from talents, as a whole-percent (for the UI). */
export function talentProfitBonusPct(state: GameState): number {
  return Math.round((talentEconomy(state).profit - 1) * 100)
}

/** Human-readable description of a talent's cumulative effect at a given rank. */
export function talentLabel(def: TalentDef, rank: number): string {
  if (rank <= 0) return '—'
  const pct = (x: number) => Math.round(x * rank * 100)
  if (def.profitMultPerRank) return `+${pct(def.profitMultPerRank)}% profit`
  if (def.speedMultPerRank) return `+${pct(def.speedMultPerRank)}% speed`
  if (def.costReducPerRank) return `−${pct(def.costReducPerRank)}% buy cost`
  if (def.startCash) return `Start with ${money(def.startCash[rank - 1] ?? 0)}`
  if (def.hireLevelPerRank) return `Hires start at Lv ${1 + def.hireLevelPerRank * rank}`
  if (def.hireCostReducPerRank) return `−${pct(def.hireCostReducPerRank)}% hire cost`
  if (def.levelCostReducPerRank) return `−${pct(def.levelCostReducPerRank)}% level-up cost`
  if (def.offlineMultPerRank) return `+${pct(def.offlineMultPerRank)}% offline earnings`
  if (def.tokenYieldPerRank) return `+${pct(def.tokenYieldPerRank)}% token yield`
  if (def.goldenMultPerRank) return `+${pct(def.goldenMultPerRank)}% Time Warp value`
  return ''
}
