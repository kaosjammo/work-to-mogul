// ============================================================
//  Upgrade purchase (pure over GameState). Effects fold into
//  economyMultipliers() via the upgradesPurchased list.
// ============================================================
import type { GameState, UpgradeId } from '../types/domain'
import { UPGRADES, REPEATABLE_UPGRADES } from '../content/upgrades'

/** Buy a one-shot upgrade if affordable and not already owned. */
export function buyUpgrade(state: GameState, upgradeId: UpgradeId): boolean {
  const up = UPGRADES[upgradeId]
  if (!up) return false
  if (state.upgradesPurchased.includes(upgradeId)) return false
  if (state.cash < up.cost) return false
  state.cash -= up.cost
  state.upgradesPurchased.push(upgradeId)
  return true
}

// ----- Executive Programs (repeatable upgrades) -----

/** Current rank of a repeatable program (0 = never bought). */
export function repeatableRank(state: GameState, id: string): number {
  const r = state.repeatableRanks?.[id]
  return typeof r === 'number' && Number.isFinite(r) && r > 0 ? Math.floor(r) : 0
}

/** Cost of the NEXT rank of a program (geometric in ranks already owned). */
export function repeatableCost(state: GameState, id: string): number {
  const def = REPEATABLE_UPGRADES[id]
  if (!def) return Infinity
  return def.baseCost * Math.pow(def.costGrowth, repeatableRank(state, id))
}

/** Buy the next rank of a repeatable program if affordable. */
export function buyRepeatable(state: GameState, id: string): boolean {
  const def = REPEATABLE_UPGRADES[id]
  if (!def) return false
  const cost = repeatableCost(state, id)
  if (!Number.isFinite(cost) || state.cash < cost) return false
  state.cash -= cost
  // Clone-on-write: replacing the object (instead of mutating in place) gives the
  // ranks a fresh identity, which is what invalidates the fold memo below.
  state.repeatableRanks = { ...(state.repeatableRanks ?? {}), [id]: repeatableRank(state, id) + 1 }
  return true
}

// The fold below runs inside upgradeMultipliers → resolveBusiness — the hottest
// path in the game (every business, every 100ms tick, plus every buildView pass).
// Its result depends only on the ranks object, which changes identity exactly when
// a rank is bought / a save loads / a prestige resets — so memoize by identity.
const NO_RANKS = Object.freeze({ profit: 1, speed: 1 })
const foldMemo = new WeakMap<object, { profit: number; speed: number }>()

/** Combined GLOBAL profit/speed multipliers from all program ranks (1 when none). */
export function repeatableMultipliers(state: GameState): { profit: number; speed: number } {
  const ranks = state.repeatableRanks
  if (!ranks) return NO_RANKS
  const memo = foldMemo.get(ranks)
  if (memo) return memo
  let profit = 1
  let speed = 1
  for (const id in ranks) {
    const def = REPEATABLE_UPGRADES[id]
    const rank = repeatableRank(state, id)
    if (!def || rank <= 0) continue
    const factor = Math.pow(def.effect.factorPerRank, rank)
    if (def.effect.kind === 'profitMult') profit *= factor
    else speed *= factor
  }
  const result = { profit, speed }
  foldMemo.set(ranks, result)
  return result
}
