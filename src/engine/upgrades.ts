// ============================================================
//  Upgrade purchase (pure over GameState). Effects fold into
//  economyMultipliers() via the upgradesPurchased list.
// ============================================================
import type { GameState, UpgradeId } from '../types/domain'
import { UPGRADES } from '../content/upgrades'

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
