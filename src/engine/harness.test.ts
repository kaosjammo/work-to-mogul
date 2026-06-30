import { describe, it, expect } from 'vitest'
import { simulateSession } from './harness'
import { format, formatDuration } from './num'

describe('balancing harness — 45-minute greedy session', () => {
  const result = simulateSession(45 * 60, { dtMs: 1000, sampleEverySec: 300, seed: 1 })

  it('prints the pacing curve (for tuning)', () => {
    // Visible in test output; not an assertion.
    const ev = result.events
    console.log('\n[harness] key events:')
    console.log('  first business :', ev.firstBusiness != null ? formatDuration(ev.firstBusiness) : 'never')
    console.log('  first automation:', ev.firstAutomation != null ? formatDuration(ev.firstAutomation) : 'never')
    console.log('  second industry :', ev.secondIndustry != null ? formatDuration(ev.secondIndustry) : 'never')
    console.log('  prestige ($1M)  :', ev.prestigeEligible != null ? formatDuration(ev.prestigeEligible) : 'never')
    console.log('[harness] curve (t / cash / pps / owned / careerLvl / industries):')
    for (const s of result.samples) {
      console.log(
        `  ${formatDuration(s.t).padStart(7)}  $${format(s.cash).padStart(8)}  ${format(s.pps).padStart(8)}/s  owned ${s.owned}  L${s.careerLevel}  ind ${s.industries}`,
      )
    }
    console.log(
      `[harness] final: cash $${format(result.finalCash)}, lifetime $${format(result.finalLifetime)}, owned ${result.finalOwned}, industries ${result.industriesEntered}, employees ${result.employees}\n`,
    )
    expect(result.samples.length).toBeGreaterThan(0)
  })

  it('reaches the first business quickly from Work', () => {
    expect(result.events.firstBusiness).toBeDefined()
    expect(result.events.firstBusiness!).toBeLessThan(120) // within ~2 min
  })

  it('automates a business during the session', () => {
    expect(result.events.firstAutomation).toBeDefined()
  })

  it('expands into a second industry during the session', () => {
    expect(result.events.secondIndustry).toBeDefined()
    expect(result.industriesEntered).toBeGreaterThanOrEqual(2)
  })

  it('reaches prestige eligibility ($1M lifetime) within the session', () => {
    expect(result.events.prestigeEligible).toBeDefined()
    expect(result.events.prestigeEligible!).toBeLessThan(45 * 60)
  })
})
