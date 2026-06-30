// ============================================================
//  Founder Perks — a per-ascension CHOICE that flavours the whole run.
//  Each is a trade-off, so successive ascensions feel different ("this run I'll
//  be a fast-cycle sprinter / a Golden-Deal speculator / an idle homebody")
//  instead of just "the same run, faster". Pure data; engine/founderPerks.ts
//  folds the multipliers into the economy / golden / offline systems.
// ============================================================

export interface FounderPerkDef {
  id: string
  name: string
  icon: string
  blurb: string
  // Multipliers applied for the whole run (default 1 = no effect on that axis).
  profitMult?: number // all-business profit
  speedMult?: number // all-business cycle speed
  goldenMult?: number // Golden Deal / Time-Warp payout
  offlineMult?: number // offline / away earnings
}

export const FOUNDER_PERKS: Record<string, FounderPerkDef> = {
  industrialist: {
    id: 'industrialist',
    name: 'Industrialist',
    icon: '🏭',
    blurb: 'Heavy industry — fatter margins, but slower production lines.',
    profitMult: 1.5,
    speedMult: 0.78,
  },
  sprinter: {
    id: 'sprinter',
    name: 'Sprinter',
    icon: '⚡',
    blurb: 'Rapid-fire cycles that churn out volume, at leaner margins.',
    speedMult: 1.6,
    profitMult: 0.8,
  },
  speculator: {
    id: 'speculator',
    name: 'Speculator',
    icon: '🎲',
    blurb: 'Live for the big score — Golden Deals pay double, base profit dips.',
    goldenMult: 2,
    profitMult: 0.9,
  },
  homebody: {
    id: 'homebody',
    name: 'Homebody',
    icon: '🌙',
    blurb: 'The empire runs itself — double offline earnings, a touch less while watching.',
    offlineMult: 2,
    profitMult: 0.92,
  },
}

export const FOUNDER_PERK_ORDER: string[] = ['industrialist', 'sprinter', 'speculator', 'homebody']
