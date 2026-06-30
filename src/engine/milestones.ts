// ============================================================
//  Milestone description helpers (pure). Used to build celebration copy
//  and detect newly-reached milestones after a purchase.
// ============================================================
import type { MilestoneId } from '../types/domain'
import { BUSINESSES } from '../content/businesses'

export interface MilestoneInfo {
  businessId: string
  businessName: string
  threshold: number
  text: string
}

/** Resolve a milestone id like "food_truck_25" into display info, or null. */
export function describeMilestone(id: MilestoneId): MilestoneInfo | null {
  const idx = id.lastIndexOf('_')
  if (idx < 0) return null
  const businessId = id.slice(0, idx)
  const def = BUSINESSES[businessId]
  if (!def) return null
  const m = def.milestones.find((x) => x.id === id)
  if (!m) return null

  const e = m.effect
  const text =
    e.kind === 'profitMult'
      ? `${def.name}: ×${e.factor} profit!`
      : e.kind === 'speedMult'
        ? `${def.name}: ×${e.factor} speed!`
        : `${def.name}: cheaper to expand!`

  return { businessId, businessName: def.name, threshold: m.threshold, text }
}

/** Ids present in `after` but not `before` (newly reached this purchase). */
export function newlyReached(before: MilestoneId[], after: MilestoneId[]): MilestoneId[] {
  const seen = new Set(before)
  return after.filter((id) => !seen.has(id))
}
