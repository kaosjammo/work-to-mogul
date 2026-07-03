// ============================================================
//  Quick-spend helpers (pure over GameState). One-tap conveniences that
//  pour spare cash into the best purchases, so late-game players don't have
//  to click each business individually.
// ============================================================
import type { GameState } from '../types/domain'
import { BUSINESS_ORDER, BUSINESSES, COMBINATOR_ID } from '../content/businesses'
import { UPGRADES } from '../content/upgrades'
import { unitCost } from './economy'
import { resolveBusiness } from './resolveBusiness'
import { purchase } from './buy'
import { buyUpgrade } from './upgrades'

export interface SpendResult {
  units: number
  spent: number
}

/**
 * "Best value" spend: repeatedly buy the single unit that adds the most income
 * per dollar (marginal $/s ÷ cost) across all unlocked businesses, until nothing
 * affordable improves the empire (or the buy cap is hit). This is the same greedy
 * the balancing harness uses for a "reasonable optimal" player.
 *
 * Capped at `maxBuys` per call so a tap stays responsive on a huge cash pile —
 * tap again to keep spending.
 */
export function spendCashBestValue(state: GameState, maxBuys = 1000): SpendResult {
  const startCash = state.cash
  let units = 0

  // The ladder plus the Startup Combinator — buyable once the angel deal
  // unlocks it, and often the best $/s per $ on the board. The `unlocked`
  // filter below keeps the harness bot's candidate list identical (it never
  // wins the angel deal), so sim pacing is untouched.
  const candidates = [...BUSINESS_ORDER, COMBINATOR_ID]

  for (let i = 0; i < maxBuys; i++) {
    let bestId: string | null = null
    let bestRoi = 0

    for (const id of candidates) {
      const bs = state.businesses[id]
      if (!bs?.unlocked) continue
      const def = BUSINESSES[id]
      const r = resolveBusiness(state, def)
      const cost = unitCost(def, bs.owned) * r.buyCostMult
      if (!(cost > 0) || cost > state.cash) continue

      // $/s the next unit adds (revenue is linear in owned → per-unit = pps / owned).
      let perUnitPps: number
      if (bs.owned > 0) {
        perUnitPps = r.pps / bs.owned
      } else {
        bs.owned = 1
        perUnitPps = resolveBusiness(state, def).pps
        bs.owned = 0
      }
      const roi = perUnitPps / cost
      if (roi > bestRoi) {
        bestRoi = roi
        bestId = id
      }
    }

    if (!bestId || !purchase(state, bestId, 1)) break
    units++
  }

  return { units, spent: startCash - state.cash }
}

export interface UpgradeBuyResult {
  count: number
  spent: number
}

/** Buy every affordable, not-yet-owned upgrade (cheapest first → most bought). */
export function buyAllAffordableUpgrades(state: GameState): UpgradeBuyResult {
  const startCash = state.cash
  let count = 0
  const ids = Object.keys(UPGRADES).sort((a, b) => UPGRADES[a].cost - UPGRADES[b].cost)
  for (const id of ids) {
    if (state.upgradesPurchased.includes(id)) continue
    if (state.cash < UPGRADES[id].cost) continue
    if (buyUpgrade(state, id)) count++
  }
  return { count, spent: startCash - state.cash }
}
