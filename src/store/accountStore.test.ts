import { describe, it, expect } from 'vitest'
import { sameSave } from './accountStore'
import type { SaveSummary } from '../save/saveManager'

const base: SaveSummary = { savedAt: 1_700_000_000_000, cash: 1_000_000, lifetime: 5_000_000 }

describe('sameSave — cloud-conflict tolerance', () => {
  it('treats a byte-identical save as the same', () => {
    expect(sameSave(base, { ...base })).toBe(true)
  })

  it('treats tiny idle drift (1s later, +0.5% cash) as the same — no spurious conflict on login', () => {
    // The idle game ticks cash every 100ms, so the local copy is always a hair
    // ahead of the cloud copy at reconcile time. That must NOT surface a conflict.
    const drift: SaveSummary = {
      savedAt: base.savedAt + 1000,
      cash: base.cash * 1.005,
      lifetime: base.lifetime * 1.005,
    }
    expect(sameSave(base, drift)).toBe(true)
  })

  it('is symmetric for idle drift', () => {
    const drift: SaveSummary = {
      savedAt: base.savedAt + 1000,
      cash: base.cash * 1.005,
      lifetime: base.lifetime * 1.005,
    }
    expect(sameSave(drift, base)).toBe(true)
  })

  it('surfaces a conflict when cash materially diverges (2x — a different device made real progress)', () => {
    const diverged: SaveSummary = { ...base, cash: base.cash * 2 }
    expect(sameSave(base, diverged)).toBe(false)
  })

  it('surfaces a conflict when lifetime materially diverges', () => {
    const diverged: SaveSummary = { ...base, lifetime: base.lifetime * 2 }
    expect(sameSave(base, diverged)).toBe(false)
  })

  it('surfaces a conflict when savedAt is far apart (well beyond idle drift)', () => {
    const older: SaveSummary = { ...base, savedAt: base.savedAt - 60_000 }
    expect(sameSave(base, older)).toBe(false)
  })

  it('treats two brand-new zeroed saves as the same (0 === 0, no divide-by-zero)', () => {
    const zero: SaveSummary = { savedAt: 0, cash: 0, lifetime: 0 }
    expect(sameSave(zero, { ...zero })).toBe(true)
  })

  it('flags cash going from 0 to a real amount as a conflict (relative tolerance vs 0)', () => {
    const fresh: SaveSummary = { savedAt: base.savedAt, cash: 0, lifetime: 0 }
    const played: SaveSummary = { savedAt: base.savedAt, cash: 1000, lifetime: 1000 }
    expect(sameSave(fresh, played)).toBe(false)
  })
})
