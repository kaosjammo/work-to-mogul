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

/**
 * Celebration copy for the milestones crossed by ONE action. A big Max buy (or
 * "Spend cash") can cross a dozen thresholds at once — one toast each would clog
 * the celebration queue for a minute. Collapse a burst into a single summary per
 * business ("Startup Combinator: 5 milestones!"), so the celebration is snappy
 * instead of stuck. 1–2 crossings still show their individual flavour text.
 */
export function milestoneCelebrations(freshIds: MilestoneId[]): string[] {
  const infos = freshIds
    .map(describeMilestone)
    .filter((m): m is MilestoneInfo => m != null)
  if (infos.length === 0) return []
  // Group by business so a mixed multi-business burst still summarises per business.
  const byBusiness = new Map<string, MilestoneInfo[]>()
  for (const info of infos) {
    const list = byBusiness.get(info.businessId) ?? []
    list.push(info)
    byBusiness.set(info.businessId, list)
  }
  const out: string[] = []
  for (const list of byBusiness.values()) {
    if (list.length <= 2) {
      out.push(...list.map((m) => m.text)) // a couple → keep the individual flavour
    } else {
      // Many → one summary at the highest threshold reached.
      const top = list.reduce((a, b) => (b.threshold > a.threshold ? b : a))
      out.push(`${top.businessName}: ${list.length} milestones!`)
    }
  }
  return out
}
