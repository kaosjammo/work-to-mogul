import { describe, it, expect } from 'vitest'
import { BUSINESSES, BUSINESS_ORDER } from './businesses'
import { INDUSTRIES, INDUSTRY_ORDER } from './industries'

// Base income-efficiency of a business's FIRST unit: $/s purchased per $ of cost.
// This is the invariant the balance overhaul protects — a more advanced (more
// expensive) business must always be at least as good a $/s-per-$ deal as a
// cheaper one, so "advancing" is never a downgrade. See businesses.ts.
function baseEfficiency(id: string): number {
  const def = BUSINESSES[id]
  const cycleSec = def.baseCycleMs / 1000
  return def.baseRevenue / cycleSec / def.baseCost
}

describe('economy efficiency monotonicity (balance Target B)', () => {
  it('base efficiency is non-decreasing across the global cost-affordability order', () => {
    const sorted = [...BUSINESS_ORDER].sort((a, b) => BUSINESSES[a].baseCost - BUSINESSES[b].baseCost)
    for (let i = 1; i < sorted.length; i++) {
      const prevE = baseEfficiency(sorted[i - 1])
      const curE = baseEfficiency(sorted[i])
      expect(
        curE,
        `${sorted[i]} (E=${curE.toExponential(3)}) must be >= cheaper ${sorted[i - 1]} (E=${prevE.toExponential(3)})`,
      ).toBeGreaterThanOrEqual(prevE * (1 - 1e-9))
    }
  })

  it('base efficiency strictly increases within every industry ladder', () => {
    for (const iid of INDUSTRY_ORDER) {
      const ladder = INDUSTRIES[iid].businessIds
      for (let i = 1; i < ladder.length; i++) {
        const prevE = baseEfficiency(ladder[i - 1])
        const curE = baseEfficiency(ladder[i])
        expect(
          curE,
          `${iid}: ${ladder[i]} (E=${curE.toExponential(3)}) must exceed ${ladder[i - 1]} (E=${prevE.toExponential(3)})`,
        ).toBeGreaterThan(prevE)
      }
    }
  })

  it('industries are listed in ascending entry-cost (affordability) order', () => {
    const entryCosts = INDUSTRY_ORDER.map((iid) => BUSINESSES[INDUSTRIES[iid].businessIds[0]].baseCost)
    for (let i = 1; i < entryCosts.length; i++) {
      expect(entryCosts[i], `industry order ${INDUSTRY_ORDER.join(',')}`).toBeGreaterThan(entryCosts[i - 1])
    }
  })
})
