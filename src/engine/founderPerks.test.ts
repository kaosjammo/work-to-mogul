import { describe, it, expect } from 'vitest'
import { initialGameState } from '../store/initialState'
import { chooseFounderPerk, founderProfitMult, founderSpeedMult } from './founderPerks'
import { economyMultipliers } from './economy'
import { timeWarpValue } from './golden'
import { applyOfflineEarnings } from './catchUp'
import { BUSINESSES } from '../content/businesses'
import { FOUNDER_PERKS } from '../content/founderPerks'
import type { GameState } from '../types/domain'

function automated(): GameState {
  const s = initialGameState(0)
  s.businesses.lemonade.owned = 20
  s.businesses.lemonade.unlocked = true
  s.employees.op = {
    id: 'op', templateId: 'mickey_gears', name: 'Op', role: 'operator',
    rarity: 'common', level: 1, affinity: null, traits: [], specialisation: null,
  }
  s.businesses.lemonade.assigned = ['op']
  return s
}

describe('founder perks', () => {
  it('no perk by default → all multipliers are 1 (harness-safe)', () => {
    const s = initialGameState(0)
    expect(s.prestige.founderPerk).toBeNull()
    expect(founderProfitMult(s)).toBe(1)
    expect(founderSpeedMult(s)).toBe(1)
  })

  it('choosing/clearing a perk works and rejects unknown ids', () => {
    const s = initialGameState(0)
    expect(chooseFounderPerk(s, 'industrialist')).toBe(true)
    expect(s.prestige.founderPerk).toBe('industrialist')
    expect(chooseFounderPerk(s, 'industrialist')).toBe(false) // no change
    expect(chooseFounderPerk(s, 'bogus')).toBe(false) // unknown id rejected
    expect(s.prestige.founderPerk).toBe('industrialist')
    expect(chooseFounderPerk(s, null)).toBe(true) // clear
    expect(s.prestige.founderPerk).toBeNull()
  })

  it('Industrialist folds +profit / −speed into economyMultipliers', () => {
    const s = initialGameState(0)
    const base = economyMultipliers(s, BUSINESSES.lemonade)
    chooseFounderPerk(s, 'industrialist')
    const withPerk = economyMultipliers(s, BUSINESSES.lemonade)
    expect(withPerk.profit / base.profit).toBeCloseTo(FOUNDER_PERKS.industrialist.profitMult!)
    expect(withPerk.speed / base.speed).toBeCloseTo(FOUNDER_PERKS.industrialist.speedMult!)
  })

  it('Speculator boosts Golden Deal value (golden× compounds with its profit trade-off)', () => {
    const s = automated()
    const base = timeWarpValue(s)
    chooseFounderPerk(s, 'speculator')
    // The warp multiplies idle income, which is itself reduced by the profit trade-off,
    // so the net is goldenMult × profitMult (2 × 0.9 = 1.8) — the intended combined effect.
    const net = FOUNDER_PERKS.speculator.goldenMult! * FOUNDER_PERKS.speculator.profitMult!
    expect(timeWarpValue(s) / base).toBeCloseTo(net)
  })

  it('Homebody boosts offline earnings (offline× compounds with its profit trade-off)', () => {
    const make = () => automated()
    const a = make(); a.lastWallClock = 0
    const plain = applyOfflineEarnings(a, 60_000).earned
    const b = make(); b.lastWallClock = 0
    chooseFounderPerk(b, 'homebody')
    const boosted = applyOfflineEarnings(b, 60_000).earned
    const net = FOUNDER_PERKS.homebody.offlineMult! * FOUNDER_PERKS.homebody.profitMult!
    expect(boosted / plain).toBeCloseTo(net)
  })
})
