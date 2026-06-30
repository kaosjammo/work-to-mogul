import type { RoleId } from '../types/domain'

// Synergy modifiers accumulated when a combo is active.
export interface SynergyMods {
  speedMult: number // multiplies the cycle-speed factor
  profitAdd: number // adds into the profit multiplier (1 + profitAdd)
  critMultAdd: number // adds to the crit multiplier
  buyCostMult: number // multiplies the buy-cost factor (≤ 1 = cheaper)
}

export interface SynergyDef {
  id: string
  label: string
  blurb: string
  test: (roleCounts: Partial<Record<RoleId, number>>) => boolean
  apply: (m: SynergyMods) => void
}

const has = (c: Partial<Record<RoleId, number>>, r: RoleId, n = 1) => (c[r] ?? 0) >= n

// Few, discrete, learnable combos (shown as named badges). Built from the
// roles available in M4a/early-M4b: operator, runner, closer, buyer, gambler.
export const SYNERGY_DEFS: SynergyDef[] = [
  {
    id: 'pit_crew',
    label: 'Pit Crew',
    blurb: 'Operator + Runner — faster cycles',
    test: (c) => has(c, 'operator') && has(c, 'runner'),
    apply: (m) => {
      m.speedMult *= 1.15
    },
  },
  {
    id: 'sales_floor',
    label: 'Sales Floor',
    blurb: '2+ Closers — extra profit',
    test: (c) => has(c, 'closer', 2),
    apply: (m) => {
      m.profitAdd += 0.25
    },
  },
  {
    id: 'high_roller',
    label: 'High Roller',
    blurb: 'Gambler + Closer — bigger jackpots',
    test: (c) => has(c, 'gambler') && has(c, 'closer'),
    apply: (m) => {
      m.critMultAdd += 2
    },
  },
  {
    id: 'lean_ops',
    label: 'Lean Ops',
    blurb: 'Buyer + Auditor — cheaper to expand',
    test: (c) => has(c, 'buyer') && has(c, 'auditor'),
    apply: (m) => {
      m.buyCostMult *= 0.85
    },
  },
  {
    id: 'dream_team',
    label: 'Dream Team',
    blurb: '4+ different roles — big profit boost',
    test: (c) => Object.values(c).filter((n) => (n ?? 0) > 0).length >= 4,
    apply: (m) => {
      m.profitAdd += 0.4
    },
  },
]

export const SYNERGY_LABEL: Record<string, string> = Object.fromEntries(
  SYNERGY_DEFS.map((s) => [s.id, s.label]),
)
