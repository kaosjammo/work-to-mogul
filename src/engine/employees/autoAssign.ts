// ============================================================
//  Auto-Assign Best — a greedy convenience so the employee depth is OPTIONAL
//  (one tap fills slots sensibly; experts can still micro-manage).
//  Not claimed optimal: pass 1 maximizes idle $/s (operators automate first,
//  then boosters); pass 2 fills any leftover slots affinity-first.
// ============================================================
import type { BusinessId, EmployeeId, GameState } from '../../types/domain'
import { BUSINESSES } from '../../content/businesses'
import { resolveBusiness } from '../resolveBusiness'
import { assignEmployee } from './roster'
import { reconcileSlots } from './composition'

/** Idle earnings rate of a business right now (0 unless automated). */
function idlePps(state: GameState, businessId: BusinessId): number {
  const r = resolveBusiness(state, BUSINESSES[businessId])
  return r.isAutomated ? r.pps : 0
}

function benchedIds(state: GameState): EmployeeId[] {
  const assigned = new Set<string>()
  for (const bid in state.businesses) {
    for (const id of state.businesses[bid].assigned) if (id) assigned.add(id)
  }
  return Object.keys(state.employees).filter((id) => !assigned.has(id))
}

function ownedUnlockedBusinesses(state: GameState): BusinessId[] {
  return Object.keys(state.businesses).filter(
    (id) => state.businesses[id].unlocked && state.businesses[id].owned > 0,
  )
}

/**
 * Fill empty employee slots. Returns how many employees were placed.
 */
export function autoAssignBest(state: GameState): number {
  let placed = 0
  const validIds = new Set(Object.keys(state.employees))
  for (const bid of Object.keys(state.businesses)) {
    reconcileSlots(state.businesses[bid], BUSINESSES[bid], validIds)
  }

  // Pass 1: greedily maximize total idle $/s.
  // (Operators enabling automation produce the biggest single delta.)
  for (;;) {
    const bench = benchedIds(state)
    if (!bench.length) break
    let best: { delta: number; empId: EmployeeId; biz: BusinessId; slot: number } | null = null

    for (const biz of ownedUnlockedBusinesses(state)) {
      const slots = state.businesses[biz].assigned
      const free = slots.indexOf(null)
      if (free < 0) continue
      const before = idlePps(state, biz)
      for (const empId of bench) {
        slots[free] = empId
        const delta = idlePps(state, biz) - before
        slots[free] = null
        if (!best || delta > best.delta) best = { delta, empId, biz, slot: free }
      }
    }

    if (!best || best.delta <= 0) break
    assignEmployee(state, best.empId, best.biz, best.slot)
    placed++
  }

  // Pass 2: park any remaining benched staff in free slots, affinity-first,
  // so nobody sits idle (purely "reasonable", not optimal).
  for (const empId of benchedIds(state)) {
    const e = state.employees[empId]
    const candidates = ownedUnlockedBusinesses(state).filter(
      (biz) => state.businesses[biz].assigned.indexOf(null) >= 0,
    )
    if (!candidates.length) break
    candidates.sort((a, b) => {
      const am = BUSINESSES[a].industryId === e.affinity ? 0 : 1
      const bm = BUSINESSES[b].industryId === e.affinity ? 0 : 1
      return am - bm
    })
    const biz = candidates[0]
    const slot = state.businesses[biz].assigned.indexOf(null)
    assignEmployee(state, empId, biz, slot)
    placed++
  }

  return placed
}
