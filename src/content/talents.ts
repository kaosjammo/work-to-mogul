// ============================================================
//  Prestige talent tree (data-driven). Spending Empire Tokens on talents is
//  the permanent meta-progression that replaces the old flat +2%/token bonus.
//  Pure data — engine/talents.ts reads these descriptors and folds them in.
//
//  Each talent sets exactly the effect descriptors it uses; engine/talents.ts
//  walks them generically (sum / product / table) so adding a talent is a
//  data-only edit. `cost[i]` is the token price to go from rank i → i+1.
// ============================================================

export type TalentTheme = 'Economy' | 'Workforce' | 'Tempo'

export interface TalentDef {
  id: string
  name: string
  blurb: string
  theme: TalentTheme
  icon: string
  maxRank: number
  // Cost of the next rank — EITHER an explicit array (length === maxRank, used by
  // the shallow tree) OR a geometric formula `round(costBase × costGrowth^rank)`
  // (used by the deep "Mastery" talents, whose escalating cost absorbs huge token
  // counts over many ranks with diminishing value — a self-balancing sink).
  cost?: number[]
  costBase?: number
  costGrowth?: number

  // ---- effect descriptors (only the relevant one(s) are set) ----
  profitMultPerRank?: number // global profit ×(1 + x·rank)
  speedMultPerRank?: number // global speed ×(1 + x·rank)
  costReducPerRank?: number // business buy cost ×(1 − x·rank)
  startCash?: number[] // [rank-1] → absolute cash granted at each run start
  hireLevelPerRank?: number // new hires begin at level 1 + x·rank
  hireCostReducPerRank?: number // hire cost ×(1 − x·rank)
  levelCostReducPerRank?: number // employee level-up cost ×(1 − x·rank)
  offlineMultPerRank?: number // offline / away earnings ×(1 + x·rank)
  tokenYieldPerRank?: number // prestige tokens gained ×(1 + x·rank)
  goldenMultPerRank?: number // Golden Deal / Time-Warp payout ×(1 + x·rank)
  staffEffectPerRank?: number // every employee's effect magnitude ×(1 + x·rank)
  goldenFreqPerRank?: number // Golden Deals spawn ×(1 + x·rank) as often (shorter cooldown)
}

export const TALENTS: Record<string, TalentDef> = {
  // ---------- Economy ----------
  magnate: {
    id: 'magnate',
    name: 'Magnate',
    blurb: 'Every business earns more, forever.',
    theme: 'Economy',
    icon: '📈',
    maxRank: 5,
    cost: [1, 2, 3, 5, 8],
    profitMultPerRank: 0.12,
  },
  seed_capital: {
    id: 'seed_capital',
    name: 'Seed Capital',
    blurb: 'Start each new empire with cash in the bank.',
    theme: 'Economy',
    icon: '💵',
    maxRank: 5,
    cost: [1, 2, 4, 8, 16],
    startCash: [1_000, 10_000, 100_000, 1_000_000, 10_000_000],
  },
  wholesale: {
    id: 'wholesale',
    name: 'Wholesale',
    blurb: 'Buying more units of any business costs less.',
    theme: 'Economy',
    icon: '🏷️',
    maxRank: 5,
    cost: [1, 2, 3, 5, 8],
    costReducPerRank: 0.06,
  },
  overdrive: {
    id: 'overdrive',
    name: 'Overdrive',
    blurb: 'A heavy, expensive profit surge across the empire.',
    theme: 'Economy',
    icon: '🔥',
    maxRank: 3,
    cost: [4, 9, 16],
    profitMultPerRank: 0.3,
  },
  tycoon: {
    id: 'tycoon',
    name: 'Tycoon',
    blurb: 'A premium profit engine that compounds with every other gain.',
    theme: 'Economy',
    icon: '💼',
    maxRank: 5,
    cost: [6, 12, 20, 32, 50],
    profitMultPerRank: 0.18,
  },
  liquidation: {
    id: 'liquidation',
    name: 'Liquidation',
    blurb: 'Bulk-buying businesses gets even cheaper.',
    theme: 'Economy',
    icon: '📦',
    maxRank: 5,
    cost: [4, 8, 13, 20, 30],
    costReducPerRank: 0.05,
  },

  // ---------- Workforce ----------
  fast_learners: {
    id: 'fast_learners',
    name: 'Fast Learners',
    blurb: 'Newly hired staff start at a higher level.',
    theme: 'Workforce',
    icon: '🎓',
    maxRank: 4,
    cost: [2, 4, 7, 11],
    hireLevelPerRank: 1,
  },
  headhunter: {
    id: 'headhunter',
    name: 'Headhunter',
    blurb: 'Hiring new employees is cheaper.',
    theme: 'Workforce',
    icon: '🧲',
    maxRank: 4,
    cost: [1, 2, 4, 7],
    hireCostReducPerRank: 0.12,
  },
  mentorship: {
    id: 'mentorship',
    name: 'Mentorship',
    blurb: 'Levelling up employees costs less.',
    theme: 'Workforce',
    icon: '🧑‍🏫',
    maxRank: 5,
    cost: [1, 2, 3, 5, 8],
    levelCostReducPerRank: 0.1,
  },
  dynasty: {
    id: 'dynasty',
    name: 'Dynasty',
    blurb: 'New hires arrive with even more experience.',
    theme: 'Workforce',
    icon: '🏅',
    maxRank: 3,
    cost: [6, 12, 20],
    hireLevelPerRank: 1,
  },
  empire_training: {
    id: 'empire_training',
    name: 'Empire Training',
    blurb: 'Every employee pulls more weight — all staff effects scale up.',
    theme: 'Workforce',
    icon: '💪',
    maxRank: 5,
    cost: [4, 8, 13, 20, 30],
    staffEffectPerRank: 0.1,
  },

  // ---------- Tempo ----------
  efficiency: {
    id: 'efficiency',
    name: 'Efficiency',
    blurb: 'Every production cycle runs faster.',
    theme: 'Tempo',
    icon: '⏱️',
    maxRank: 5,
    cost: [1, 2, 3, 5, 8],
    speedMultPerRank: 0.08,
  },
  momentum: {
    id: 'momentum',
    name: 'Momentum',
    blurb: 'Production cycles run faster still.',
    theme: 'Tempo',
    icon: '🚀',
    maxRank: 5,
    cost: [3, 6, 10, 15, 22],
    speedMultPerRank: 0.06,
  },
  golden_touch: {
    id: 'golden_touch',
    name: 'Golden Touch',
    blurb: 'Time Warps from Golden Deals pay out more.',
    theme: 'Tempo',
    icon: '🍀',
    maxRank: 4,
    cost: [3, 7, 12, 18],
    goldenMultPerRank: 0.25,
  },
  lucky_streak: {
    id: 'lucky_streak',
    name: 'Lucky Streak',
    blurb: 'Golden Deals appear more often.',
    theme: 'Tempo',
    icon: '🎰',
    maxRank: 4,
    cost: [3, 7, 12, 18],
    goldenFreqPerRank: 0.2,
  },
  idle_mastery: {
    id: 'idle_mastery',
    name: 'Idle Mastery',
    blurb: 'Earn more from time spent away.',
    theme: 'Tempo',
    icon: '🌙',
    maxRank: 4,
    cost: [2, 4, 7, 11],
    offlineMultPerRank: 0.3,
  },
  prestige_scholar: {
    id: 'prestige_scholar',
    name: 'Prestige Scholar',
    blurb: 'Each ascension banks more Empire Tokens.',
    theme: 'Tempo',
    icon: '✦',
    maxRank: 5,
    cost: [2, 4, 6, 9, 13],
    tokenYieldPerRank: 0.15,
  },

  // ---------- Mastery (deep, late-game token sinks) ----------
  // Many ranks with a geometrically-escalating cost: a near-bottomless sink for
  // the Empire Tokens that pile up across many ascensions, with small per-rank
  // gains so dumping a huge surplus is meaningful but never runaway.
  industrialist: {
    id: 'industrialist',
    name: 'Industrialist',
    blurb: 'Endless industrial expansion — profit keeps climbing, rank after rank.',
    theme: 'Economy',
    icon: '🏭',
    maxRank: 50,
    costBase: 50,
    costGrowth: 1.55,
    profitMultPerRank: 0.04,
  },
  grandmaster: {
    id: 'grandmaster',
    name: 'Grandmaster',
    blurb: 'Train your workforce without limit — every employee keeps getting better.',
    theme: 'Workforce',
    icon: '🎖️',
    maxRank: 50,
    costBase: 60,
    costGrowth: 1.55,
    staffEffectPerRank: 0.04,
  },
  overclock: {
    id: 'overclock',
    name: 'Overclock',
    blurb: 'Push production speed ever higher — there is no ceiling.',
    theme: 'Tempo',
    icon: '⚡',
    maxRank: 50,
    costBase: 50,
    costGrowth: 1.55,
    speedMultPerRank: 0.03,
  },
}

// Display order: grouped by theme, strongest-first within each.
export const TALENT_ORDER: string[] = [
  'magnate',
  'overdrive',
  'tycoon',
  'seed_capital',
  'wholesale',
  'liquidation',
  'fast_learners',
  'dynasty',
  'empire_training',
  'headhunter',
  'mentorship',
  'efficiency',
  'momentum',
  'idle_mastery',
  'golden_touch',
  'lucky_streak',
  'prestige_scholar',
  // deep Mastery sinks — shown last within each theme
  'industrialist',
  'grandmaster',
  'overclock',
]

export const TALENT_THEMES: TalentTheme[] = ['Economy', 'Workforce', 'Tempo']
