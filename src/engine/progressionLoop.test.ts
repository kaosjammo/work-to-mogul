import { describe, it, expect } from 'vitest'
import { simulateProgression } from './harness'
import { format } from './num'

// Validates the PRESTIGE loop — the part of the economy the single-run harness
// never exercises. Drives the greedy bot through several ascensions (playing a
// fixed session each run, then ascending + spending tokens on talents) and asserts
// the meta-economy stays sane. This is the regression guard for the class of bug
// behind the "1.48B Empire Tokens overnight" blowup.
describe('progression loop — multi-ascension prestige economy', () => {
  const result = simulateProgression({ ascensions: 6, perRunSec: 4 * 3600, seed: 7 })

  it('prints the per-ascension curve (for tuning)', () => {
    console.log('\n[progression] per-ascension (run / runLifetime / tokensBanked / cumulative / baseTree%):')
    for (const a of result.ascensions) {
      console.log(
        `  #${a.run}  life $${format(a.runLifetime).padStart(8)}  +${String(a.tokensBanked).padStart(6)} tok  cum ${String(a.cumulativeTokens).padStart(7)}  base ${(a.baseTreeFilledPct * 100).toFixed(0)}%`,
      )
    }
    expect(result.ascensions.length).toBe(6)
  })

  it('first ascension banks a small (single/double-digit) number of tokens', () => {
    // The sqrt curve minted thousands here; the fifth-root cut must keep run #1 tiny.
    expect(result.tokensPerAscension[0]).toBeGreaterThanOrEqual(1)
    expect(result.tokensPerAscension[0]).toBeLessThan(100)
  })

  it('token yield grows but SUB-EXPONENTIALLY (no single ascension explodes)', () => {
    // Catches the sqrt-style blowup: no ascension may mint a wild multiple of the
    // previous one. (Yield rises as talents compound income, but the fifth-root
    // keeps each step bounded.)
    for (let i = 1; i < result.tokensPerAscension.length; i++) {
      const prev = Math.max(1, result.tokensPerAscension[i - 1])
      expect(result.tokensPerAscension[i] / prev).toBeLessThan(20)
    }
  })

  it('the base talent tree is a multi-ascension journey — not maxed instantly, not starved', () => {
    const first = result.ascensions[0].baseTreeFilledPct
    const last = result.ascensions[result.ascensions.length - 1].baseTreeFilledPct
    expect(first).toBeLessThan(1) // run #1 does NOT fill the whole tree (the old bug)
    expect(last).toBeGreaterThan(first) // progress accrues across ascensions
    // Slope re-tune target: by run #6 the tree is a real journey — well past the old
    // glacial ~41%, but still far from maxed (the expensive back half is aspirational).
    expect(last).toBeGreaterThan(0.45)
    expect(last).toBeLessThan(0.85)
  })

  it('the deep Mastery sink is reachable — cumulative tokens clear the first rank', () => {
    // The re-tune lowered Mastery rank-1 to 20 tokens and lifted yield so a player who
    // ascends ~6× can actually dip into the uncapped sink (was 26 cum vs 50 needed →
    // dead content). Guards against the sink drifting back out of reach.
    const cum = result.ascensions[result.ascensions.length - 1].cumulativeTokens
    expect(cum).toBeGreaterThanOrEqual(20)
  })

  it('run lifetime KEEPS climbing — the back half does not plateau', () => {
    const lifes = result.ascensions.map((a) => a.runLifetime)
    // The bug this locks in: pre-re-tune the curve flattened from run #3 (+8% across
    // the last three ascensions). The profit re-tune restores a sustained climb, so
    // the back half (run #3 → run #6) must grow meaningfully, not just trend up.
    expect(lifes[lifes.length - 1]).toBeGreaterThan(lifes[0]) // overall climb
    const backHalfGrowth = lifes[lifes.length - 1] / lifes[2] // run #6 / run #3
    expect(backHalfGrowth).toBeGreaterThan(1.4) // was ~1.08 (a plateau) before the re-tune
  })
})
