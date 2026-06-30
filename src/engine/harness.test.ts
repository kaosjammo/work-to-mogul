import { describe, it, expect } from 'vitest'
import { simulateSession } from './harness'
import { format, formatDuration } from './num'

// The economy is tuned for a long idle arc (~6-10h of optimal active play to the
// final industry). This drives the greedy bot over a 10h horizon and checks the
// pacing landmarks, so a future balance edit that wrecks pacing fails loudly.
describe('balancing harness — 10-hour greedy session', () => {
  const result = simulateSession(10 * 3600, { dtMs: 2000, sampleEverySec: 1800, seed: 1 })

  it('prints the pacing curve (for tuning)', () => {
    const ev = result.events
    console.log('\n[harness] key events:')
    console.log('  first business :', ev.firstBusiness != null ? formatDuration(ev.firstBusiness) : 'never')
    console.log('  first automation:', ev.firstAutomation != null ? formatDuration(ev.firstAutomation) : 'never')
    console.log('  second industry :', ev.secondIndustry != null ? formatDuration(ev.secondIndustry) : 'never')
    console.log('  prestige unlock :', ev.prestigeEligible != null ? formatDuration(ev.prestigeEligible) : 'never')
    console.log('[harness] curve (t / cash / pps / owned / careerLvl / industries):')
    for (const s of result.samples) {
      console.log(
        `  ${formatDuration(s.t).padStart(8)}  $${format(s.cash).padStart(8)}  ${format(s.pps).padStart(8)}/s  owned ${s.owned}  L${s.careerLevel}  ind ${s.industries}`,
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

  it('climbs into every industry over the long arc (not a 5-minute sprint)', () => {
    expect(result.events.secondIndustry).toBeDefined()
    // The point of the rebalance: optimal play takes hours, not minutes, to reach
    // the final industry — but it DOES get there within the 10h horizon.
    expect(result.events.secondIndustry!).toBeGreaterThan(20 * 60) // not trivially fast
    expect(result.industriesEntered).toBe(7)
  })

  it('unlocks prestige within the session, but not in the first hour', () => {
    expect(result.events.prestigeEligible).toBeDefined()
    expect(result.events.prestigeEligible!).toBeGreaterThan(60 * 60) // > 1h — a real climb
    expect(result.events.prestigeEligible!).toBeLessThan(10 * 3600)
  })
})
