import type { Milestone, MilestoneEffect } from '../types/domain'

const THRESHOLDS = [25, 50, 100, 200, 300, 400, 500, 600]

// AdCap-style alternation: mostly profit doublings, periodic speed doublings,
// one special profit×3 at 100.
const DEFAULT_PATTERN: MilestoneEffect[] = [
  { kind: 'speedMult', factor: 2 }, // 25
  { kind: 'profitMult', factor: 2 }, // 50
  { kind: 'profitMult', factor: 3 }, // 100
  { kind: 'profitMult', factor: 2 }, // 200
  { kind: 'speedMult', factor: 2 }, // 300
  { kind: 'profitMult', factor: 2 }, // 400
  { kind: 'profitMult', factor: 2 }, // 500
  { kind: 'speedMult', factor: 2 }, // 600
]

// Tech leans profit-heavy: the 200 and 400 entries become profit×3.
const PROFIT_HEAVY_PATTERN: MilestoneEffect[] = DEFAULT_PATTERN.map((e, i) =>
  i === 3 || i === 5 ? { kind: 'profitMult', factor: 3 } : e,
)

function build(businessId: string, pattern: MilestoneEffect[]): Milestone[] {
  return THRESHOLDS.map((threshold, i) => ({
    id: `${businessId}_${threshold}`,
    threshold,
    effect: pattern[i],
  }))
}

export function defaultMilestones(businessId: string): Milestone[] {
  return build(businessId, DEFAULT_PATTERN)
}

export function profitHeavyMilestones(businessId: string): Milestone[] {
  return build(businessId, PROFIT_HEAVY_PATTERN)
}
