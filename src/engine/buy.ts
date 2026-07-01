// ============================================================
//  Purchase + manual tap (pure over GameState).
// ============================================================
import type { BusinessId, GameState } from '../types/domain'
import { BUSINESSES } from '../content/businesses'
import { totalCost } from './economy'
import { resolveBusiness } from './resolveBusiness'
import { reconcileSlots } from './employees/composition'
import { checkUnlocks, START_EPSILON } from './simulate'

function validEmployeeIds(state: GameState): Set<string> {
  return new Set(Object.keys(state.employees))
}

/** Record any milestones now reached (for one-time celebration tracking). */
function updateMilestonesReached(state: GameState, businessId: BusinessId): void {
  const def = BUSINESSES[businessId]
  const owned = state.businesses[businessId].owned
  for (const m of def.milestones) {
    if (owned >= m.threshold && !state.milestonesReached.includes(m.id)) {
      state.milestonesReached.push(m.id)
    }
  }
}

/**
 * Buy `qty` units of a business if affordable. Cost reduction (employees +
 * milestones + upgrades) multiplies the geometric total. Returns success.
 */
export function purchase(state: GameState, businessId: BusinessId, qty: number): boolean {
  const def = BUSINESSES[businessId]
  const bs = state.businesses[businessId]
  if (!def || !bs || !bs.unlocked || qty <= 0) return false

  const r = resolveBusiness(state, def)
  const cost = totalCost(def, bs.owned, qty) * r.buyCostMult
  if (!Number.isFinite(cost) || state.cash < cost) return false

  state.cash -= cost
  bs.owned += qty

  updateMilestonesReached(state, businessId)
  reconcileSlots(bs, def, validEmployeeIds(state))
  checkUnlocks(state)
  return true
}

/** Start a manual cycle on tap. No-op when automated (rule #10), idle-invalid, or
 *  already running. Returns whether a cycle actually STARTED — the UI must only
 *  show payout feedback for taps that did something. */
export function tapBusiness(state: GameState, businessId: BusinessId): boolean {
  const def = BUSINESSES[businessId]
  const bs = state.businesses[businessId]
  if (!def || !bs || !bs.unlocked || bs.owned <= 0) return false
  const r = resolveBusiness(state, def)
  if (r.isAutomated) return false
  if (bs.cycleProgressMs > 0) return false // already running — a tap changes nothing
  bs.cycleProgressMs = START_EPSILON
  return true
}
