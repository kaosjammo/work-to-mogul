import { describe, it, expect } from 'vitest'
import {
  applyOfflineEarnings,
  automatedIncomePerSec,
  expireTransientsOffline,
  OFFLINE_CAP_MS,
} from './catchUp'
import { resolveBusiness } from './resolveBusiness'
import { hireEmployee, assignToFirstFreeSlot } from './employees/roster'
import { PROFIT_FRENZY_MULT } from './economy'
import { BUSINESSES } from '../content/businesses'
import { initialGameState } from '../store/initialState'
import type { GameState } from '../types/domain'

function withAutomatedLemonade(): GameState {
  const s = initialGameState(0)
  s.cash = 1e9
  s.businesses.lemonade.owned = 10
  s.businesses.lemonade.unlocked = true
  const op = hireEmployee(s, 'mickey_gears')! // operator → automation
  assignToFirstFreeSlot(s, op, 'lemonade')
  s.cash = 0 // reset so offline earnings are isolated
  return s
}

describe('offline catch-up', () => {
  it('credits automated businesses at their per-second rate', () => {
    const s = withAutomatedLemonade()
    s.lastWallClock = 0
    const pps = resolveBusiness(s, BUSINESSES.lemonade).pps
    const res = applyOfflineEarnings(s, 60_000) // 60s away
    expect(res.elapsedMs).toBe(60_000)
    expect(res.earned).toBeCloseTo(pps * 60, 2)
    expect(s.cash).toBeCloseTo(pps * 60, 2)
    expect(s.lastWallClock).toBe(60_000)
  })

  it('pays nothing for non-automated businesses', () => {
    const s = initialGameState(0)
    s.businesses.lemonade.owned = 10
    s.businesses.lemonade.unlocked = true // no operator → manual
    s.lastWallClock = 0
    const res = applyOfflineEarnings(s, 60_000)
    expect(res.earned).toBe(0)
    expect(s.cash).toBe(0)
  })

  it('caps elapsed time at the offline cap', () => {
    const s = withAutomatedLemonade()
    s.lastWallClock = 0
    const huge = OFFLINE_CAP_MS * 10
    const res = applyOfflineEarnings(s, huge)
    expect(res.elapsedMs).toBe(OFFLINE_CAP_MS)
    // anchor still advances to the real now so we don't re-credit next time
    expect(s.lastWallClock).toBe(huge)
  })

  it('reports nothing for a sub-second gap', () => {
    const s = withAutomatedLemonade()
    s.lastWallClock = 0
    const res = applyOfflineEarnings(s, 200)
    expect(res.elapsedMs).toBe(0)
    expect(res.earned).toBe(0)
  })

  it('prices the away time at the STEADY rate — a short frenzy cannot multiply hours', () => {
    const buffed = withAutomatedLemonade()
    buffed.lastWallClock = 0
    buffed.golden.frenzyMsLeft = 20_000 // ×2 profit frenzy active when the tab closed
    const plain = withAutomatedLemonade()
    plain.lastWallClock = 0
    const a = applyOfflineEarnings(buffed, OFFLINE_CAP_MS)
    const b = applyOfflineEarnings(plain, OFFLINE_CAP_MS)
    expect(a.earned).toBeCloseTo(b.earned, 2) // identical — the 20s buff didn't scale 2h
  })

  it('live vs steady income: the frenzy shows in the live rate only', () => {
    const s = withAutomatedLemonade()
    const steady = automatedIncomePerSec(s)
    s.golden.frenzyMsLeft = 20_000
    expect(automatedIncomePerSec(s)).toBeCloseTo(steady, 6) // steady default unchanged
    expect(automatedIncomePerSec(s, { steady: false })).toBeCloseTo(steady * PROFIT_FRENZY_MULT, 6)
  })

  it('expires timed buffs by the elapsed away time', () => {
    const s = withAutomatedLemonade()
    s.lastWallClock = 0
    s.golden.frenzyMsLeft = 20_000
    s.rushHour.surgeMsLeft = 25_000
    s.eventCards.profitMsLeft = 60_000
    s.eventCards.profitMult = 3
    s.angelDeal.boostMsLeft = 30_000
    s.angelDeal.boostMult = 1.5
    s.spaceShooter.buffMsLeft = 45_000
    applyOfflineEarnings(s, 10 * 60_000) // 10 minutes away — all of these ran out
    expect(s.golden.frenzyMsLeft).toBe(0)
    expect(s.rushHour.surgeMsLeft).toBe(0)
    expect(s.eventCards.profitMsLeft).toBe(0)
    expect(s.angelDeal.boostMsLeft).toBe(0)
    expect(s.angelDeal.boostMult).toBe(1) // boost cleared once expired
    expect(s.spaceShooter.buffMsLeft).toBe(0)
  })

  it('a partially-elapsed buff keeps its remainder', () => {
    const s = withAutomatedLemonade()
    s.lastWallClock = 0
    s.angelDeal.boostMsLeft = 10 * 60_000
    s.angelDeal.boostMult = 1.5
    applyOfflineEarnings(s, 60_000) // 1 minute away
    expect(s.angelDeal.boostMsLeft).toBe(9 * 60_000)
    expect(s.angelDeal.boostMult).toBe(1.5) // still running
  })

  it('an open offer expires unclaimed while away', () => {
    const s = withAutomatedLemonade()
    s.lastWallClock = 0
    s.golden.offerMsLeft = 12_000
    s.golden.offerMega = true
    s.eventCards.offerMsLeft = 90_000
    s.eventCards.offerCardId = 'anything'
    applyOfflineEarnings(s, 5 * 60_000)
    expect(s.golden.offerMsLeft).toBe(0)
    expect(s.golden.offerMega).toBe(false)
    expect(s.eventCards.offerCardId).toBe(null)
  })

  it('does NOT apply the away-earnings bonuses when awayBonuses is off (in-session stalls)', () => {
    const withPerk = () => {
      const s = withAutomatedLemonade()
      s.lastWallClock = 0
      s.prestige.founderPerk = 'homebody' // ×2 offline earnings perk
      return s
    }
    const away = applyOfflineEarnings(withPerk(), 60_000)
    const stall = applyOfflineEarnings(withPerk(), 60_000, { awayBonuses: false })
    expect(stall.earned).toBeGreaterThan(0)
    expect(away.earned).toBeGreaterThan(stall.earned) // perk applies only to real absences
  })

  // TRIP-WIRE for the tick↔offline mirror: expireTransientsOffline hand-mirrors the
  // countdown half of every subsystem tick. This walks the WHOLE GameState for
  // *MsLeft countdown fields (however deeply nested), so a NEW timed buff added to
  // a tick without a matching offline-expiry line fails here instead of silently
  // surviving (already fully paid) across an absence.
  it('expires every *MsLeft countdown in GameState by the away time', () => {
    const s = withAutomatedLemonade()
    const armed: string[] = []
    const arm = (obj: Record<string, unknown>, path: string) => {
      for (const [k, v] of Object.entries(obj)) {
        if (/MsLeft$/.test(k) && typeof v === 'number') {
          obj[k] = 60_000 // 1 min — well inside the 10-min away span below
          armed.push(`${path}.${k}`)
        } else if (v && typeof v === 'object' && !Array.isArray(v)) {
          arm(v as Record<string, unknown>, `${path}.${k}`)
        }
      }
    }
    arm(s as unknown as Record<string, unknown>, 'state')
    expect(armed.length).toBeGreaterThan(5) // sanity: the walk found the known timers
    expireTransientsOffline(s, 10 * 60_000)
    const survivors: string[] = []
    const check = (obj: Record<string, unknown>, path: string) => {
      for (const [k, v] of Object.entries(obj)) {
        if (/MsLeft$/.test(k) && typeof v === 'number') {
          if (v !== 0) survivors.push(`${path}.${k}`)
        } else if (v && typeof v === 'object' && !Array.isArray(v)) {
          check(v as Record<string, unknown>, `${path}.${k}`)
        }
      }
    }
    check(s as unknown as Record<string, unknown>, 'state')
    expect(
      survivors,
      `these countdown timers froze through an offline span — add them to expireTransientsOffline: ${survivors.join(', ')}`,
    ).toEqual([])
  })
})
