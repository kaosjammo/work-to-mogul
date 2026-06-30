// ============================================================
//  Dev-only referential-integrity checks for content data.
//  Catches data-entry mistakes (bad ids, unsorted thresholds) without
//  unit-test ceremony. Call once at dev startup.
// ============================================================
import { INDUSTRIES, INDUSTRY_ORDER } from '../content/industries'
import { BUSINESSES, BUSINESS_ORDER } from '../content/businesses'
import { UPGRADES } from '../content/upgrades'

export function validateContent(): string[] {
  const errors: string[] = []
  const businessIds = new Set(BUSINESS_ORDER)
  const industryIds = new Set(INDUSTRY_ORDER)

  for (const iid of INDUSTRY_ORDER) {
    const ind = INDUSTRIES[iid]
    for (const bid of ind.businessIds) {
      if (!businessIds.has(bid)) errors.push(`Industry "${iid}" references missing business "${bid}"`)
      if (BUSINESSES[bid] && BUSINESSES[bid].industryId !== iid) {
        errors.push(`Business "${bid}" industryId !== "${iid}"`)
      }
    }
  }

  const seenMilestones = new Set<string>()
  for (const bid of BUSINESS_ORDER) {
    const def = BUSINESSES[bid]
    if (!industryIds.has(def.industryId)) errors.push(`Business "${bid}" has unknown industry "${def.industryId}"`)
    if (def.growthRate <= 1) errors.push(`Business "${bid}" growthRate must be > 1`)

    let prev = -1
    for (const m of def.milestones) {
      if (m.threshold <= prev) errors.push(`Business "${bid}" milestones not strictly ascending`)
      prev = m.threshold
      if (seenMilestones.has(m.id)) errors.push(`Duplicate milestone id "${m.id}"`)
      seenMilestones.add(m.id)
    }

    if (def.unlock.kind === 'businessOwned' && !businessIds.has(def.unlock.businessId)) {
      errors.push(`Business "${bid}" unlock references missing business "${def.unlock.businessId}"`)
    }
  }

  for (const id in UPGRADES) {
    const up = UPGRADES[id]
    if (up.scope.kind === 'business' && !businessIds.has(up.scope.businessId)) {
      errors.push(`Upgrade "${id}" references missing business "${up.scope.businessId}"`)
    }
    if (up.scope.kind === 'industry' && !industryIds.has(up.scope.industryId)) {
      errors.push(`Upgrade "${id}" references missing industry "${up.scope.industryId}"`)
    }
  }

  return errors
}
