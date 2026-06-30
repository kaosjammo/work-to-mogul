import type { Milestone, MilestoneEffect } from '../types/domain'

const THRESHOLDS = [25, 50, 100, 200, 300, 400, 500, 600, 800, 1000, 1500, 2000]

// AdCap-style alternation: mostly profit doublings, periodic speed doublings,
// one special profit×3 at 100. The early thresholds (≤400) keep their full
// ×2/×3 punch — that's the satisfying mid-game. The long tail (500→2000) is
// DAMPENED (×1.5 / smaller ×2) so deeply stacking a business still rewards you
// but the late-game income curve climbs far more slowly — the empire takes a real
// while to mature instead of blowing through every tier overnight.
const DEFAULT_PATTERN: MilestoneEffect[] = [
  { kind: 'speedMult', factor: 2 }, // 25
  { kind: 'profitMult', factor: 2 }, // 50
  { kind: 'profitMult', factor: 3 }, // 100
  { kind: 'profitMult', factor: 2 }, // 200
  { kind: 'speedMult', factor: 2 }, // 300
  { kind: 'profitMult', factor: 2 }, // 400
  { kind: 'profitMult', factor: 1.5 }, // 500
  { kind: 'speedMult', factor: 1.5 }, // 600
  { kind: 'profitMult', factor: 1.5 }, // 800
  { kind: 'profitMult', factor: 2 }, // 1000 — the "four-figure" club
  { kind: 'speedMult', factor: 1.5 }, // 1500
  { kind: 'profitMult', factor: 2 }, // 2000
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
