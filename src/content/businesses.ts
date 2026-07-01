import type { BusinessDef, BusinessId, EffectChannel, UnlockCondition } from '../types/domain'
import { defaultMilestones, profitHeavyMilestones } from './defaultMilestones'

// Shared slot-unlock thresholds (owned counts that open employee slots → 4 slots).
const SLOTS = [0, 25, 100, 300]

type Row = {
  id: BusinessId
  industryId: string
  name: string
  icon: string
  baseCost: number
  growthRate: number
  baseRevenue: number
  cycleMs: number
  unlock: UnlockCondition
  preferred: EffectChannel[]
  profitHeavy?: boolean
  riskEnabled?: boolean
}

// prev:N means "own N of the previous business in this industry's ladder".
const prev = (businessId: BusinessId, count: number): UnlockCondition => ({
  kind: 'businessOwned',
  businessId,
  count,
})

// ── PACING DIALS ───────────────────────────────────────────────────────────
// A monotonic-rising efficiency curve means every tier is a better $/s-per-$ deal,
// so optimal play climbs as fast as it can afford; without throttles the game
// completes in minutes. These three dials stretch it toward a ~6-10h idle arc
// WITHOUT breaking the efficiency invariant (none of them change a business's
// first-unit efficiency, so balance.test.ts still holds).
//
//  • GROWTH_STEEPNESS — steepens per-unit cost growth (growthRate), so stacking a
//    business hits diminishing returns; scales only the premium above 1.
//  • GATE_MULT — raises the "own N of the previous business" unlock gates, forcing
//    players to stack each tier (mass-buy + milestones stay relevant) before the
//    next unlocks — this is what spreads the climb into a long, smooth curve.
//  • REVENUE_SCALE — uniform multiplier on all baseRevenue (preserves the E
//    ordering exactly); the master pace dial — lower = slower money = longer game.
// GROWTH_STEEPNESS at 7 made even the FIRST business punishing — Lemonade's
// effective per-unit growth became 1.49 (each costs +49%), so the last few units
// before the 25-gate cost tens of thousands and the start stalled for ~80 min on
// a single business. Dialled back to 5 (Lemonade → ~1.35) so stacking the early,
// cheap tiers stays affordable and the opening has momentum; the long arc is held
// by the per-tier unlock gates + REVENUE_SCALE instead of brutal cost growth.
const GROWTH_STEEPNESS = 6.0
const GATE_MULT = 1
const REVENUE_SCALE = 0.28
const steepen = (growthRate: number): number => 1 + (growthRate - 1) * GROWTH_STEEPNESS

// baseRevenue values are derived to make base efficiency E = (baseRevenue/cycleSec)/baseCost
// NON-DECREASING across the cost-affordability order, so a more advanced business is always a
// (slightly) better $/s-per-$ deal than a cheaper one. Rule: newRev = E0 * g^rank * baseCost *
// cycleSec, where rank = 0-based index in baseCost-ascending order, E0 = 0.41667 (Lemonade's
// efficiency — early game is preserved, nothing is nerfed), and g = 1.035 (~2.4x end-to-end
// efficiency gradient). Only baseRevenue changed; baseCost/growthRate/cycleMs/milestones/unlocks
// are untouched. A monotonicity guard test (balance.test.ts) locks this invariant.
const ROWS: Row[] = [
  // ---- Food & Hospitality (cheap, fast, mass-buy) ----
  { id: 'lemonade', industryId: 'food', name: 'Lemonade Stand', icon: '🍋', baseCost: 4, growthRate: 1.07, baseRevenue: 1, cycleMs: 600, unlock: { kind: 'free' }, preferred: ['cycleSpeed', 'morale'] },
  // Food is the onboarding industry: its unlock gates are lower than the rest so
  // the player reaches "what's next after Lemonade" in the first few minutes and
  // gets early momentum. Later industries keep the higher 20/15 gates.
  { id: 'food_truck', industryId: 'food', name: 'Food Truck', icon: '🚚', baseCost: 60, growthRate: 1.08, baseRevenue: 77.6, cycleMs: 3000, unlock: prev('lemonade', 10), preferred: ['cycleSpeed', 'morale'] },
  { id: 'pizzeria', industryId: 'food', name: 'Pizzeria', icon: '🍕', baseCost: 720, growthRate: 1.09, baseRevenue: 1930, cycleMs: 6000, unlock: prev('food_truck', 15), preferred: ['cycleSpeed', 'profitMult'] },
  { id: 'sushi_bar', industryId: 'food', name: 'Sushi Bar', icon: '🍣', baseCost: 8640, growthRate: 1.1, baseRevenue: 47900, cycleMs: 12000, unlock: prev('pizzeria', 18), preferred: ['profitMult', 'morale'] },

  // ---- Retail & Services (employee-synergy, steady) ----
  { id: 'corner_shop', industryId: 'retail', name: 'Corner Shop', icon: '🏪', baseCost: 18000, growthRate: 1.08, baseRevenue: 68900, cycleMs: 8000, unlock: { kind: 'free' }, preferred: ['costReduction', 'profitMult'] },
  { id: 'barbershop', industryId: 'retail', name: 'Barbershop', icon: '💈', baseCost: 90000, growthRate: 1.09, baseRevenue: 624000, cycleMs: 14000, unlock: prev('corner_shop', 20), preferred: ['costReduction', 'profitMult'] },
  { id: 'gym', industryId: 'retail', name: 'Gym Franchise', icon: '🏋️', baseCost: 540000, growthRate: 1.1, baseRevenue: 6.64e6, cycleMs: 24000, unlock: prev('barbershop', 20), preferred: ['profitMult', 'morale'] },
  { id: 'department_store', industryId: 'retail', name: 'Department Store', icon: '🏬', baseCost: 4000000, growthRate: 1.11, baseRevenue: 8.78e7, cycleMs: 40000, unlock: prev('gym', 20), preferred: ['costReduction', 'profitMult'] },

  // ---- Tech & Media (scales hard with milestones) ----
  { id: 'mobile_app', industryId: 'tech', name: 'Mobile App', icon: '📱', baseCost: 2500000, growthRate: 1.1, baseRevenue: 1.33e7, cycleMs: 10000, unlock: { kind: 'free' }, preferred: ['profitMult', 'critChance'], profitHeavy: true },
  { id: 'streaming', industryId: 'tech', name: 'Streaming Channel', icon: '📺', baseCost: 20000000, growthRate: 1.11, baseRevenue: 2.04e8, cycleMs: 18000, unlock: prev('mobile_app', 20), preferred: ['profitMult', 'critChance'], profitHeavy: true },
  { id: 'saas', industryId: 'tech', name: 'SaaS Platform', icon: '☁️', baseCost: 175000000, growthRate: 1.12, baseRevenue: 3.19e9, cycleMs: 30000, unlock: prev('streaming', 20), preferred: ['profitMult', 'critChance'], profitHeavy: true },
  { id: 'ai_lab', industryId: 'tech', name: 'AI Lab', icon: '🤖', baseCost: 1500000000, growthRate: 1.13, baseRevenue: 4.89e10, cycleMs: 50000, unlock: prev('saas', 20), preferred: ['profitMult', 'critChance'], profitHeavy: true },

  // ---- Finance & Property (slow, high-value, risk-enabled) ----
  { id: 'apartments', industryId: 'finance', name: 'Rental Apartments', icon: '🏢', baseCost: 5e9, growthRate: 1.11, baseRevenue: 1.01e11, cycleMs: 30000, unlock: { kind: 'free' }, preferred: ['automation', 'riskReduction'], riskEnabled: true },
  { id: 'fund', industryId: 'finance', name: 'Investment Fund', icon: '📈', baseCost: 4e10, growthRate: 1.12, baseRevenue: 1.79e12, cycleMs: 60000, unlock: prev('apartments', 15), preferred: ['automation', 'riskReduction'], riskEnabled: true },
  { id: 'skyscraper', industryId: 'finance', name: 'Skyscraper', icon: '🏙️', baseCost: 3.5e11, growthRate: 1.14, baseRevenue: 3.48e13, cycleMs: 120000, unlock: prev('fund', 15), preferred: ['automation', 'riskReduction'], riskEnabled: true },

  // ---- Logistics & Transport (efficiency: speed + cost reduction) ----
  { id: 'courier', industryId: 'logistics', name: 'Courier Service', icon: '🛵', baseCost: 8e7, growthRate: 1.09, baseRevenue: 5.64e8, cycleMs: 12000, unlock: { kind: 'free' }, preferred: ['cycleSpeed', 'costReduction'] },
  { id: 'trucking', industryId: 'logistics', name: 'Trucking Fleet', icon: '🚛', baseCost: 7e8, growthRate: 1.1, baseRevenue: 8.81e9, cycleMs: 20000, unlock: prev('courier', 20), preferred: ['cycleSpeed', 'costReduction'] },
  { id: 'cargo_port', industryId: 'logistics', name: 'Cargo Port', icon: '🚢', baseCost: 6.5e9, growthRate: 1.11, baseRevenue: 1.59e11, cycleMs: 35000, unlock: prev('trucking', 20), preferred: ['cycleSpeed', 'profitMult'] },
  { id: 'air_freight', industryId: 'logistics', name: 'Air Freight Hub', icon: '✈️', baseCost: 6e10, growthRate: 1.12, baseRevenue: 2.55e12, cycleMs: 55000, unlock: prev('cargo_port', 20), preferred: ['cycleSpeed', 'costReduction'] },

  // ---- Energy & Power (high-capital, big automated output) ----
  { id: 'solar_farm', industryId: 'energy', name: 'Solar Farm', icon: '☀️', baseCost: 2.5e10, growthRate: 1.11, baseRevenue: 4.52e11, cycleMs: 25000, unlock: { kind: 'free' }, preferred: ['profitMult', 'automation'] },
  { id: 'wind_park', industryId: 'energy', name: 'Wind Park', icon: '🌬️', baseCost: 2.2e11, growthRate: 1.12, baseRevenue: 7.05e12, cycleMs: 40000, unlock: prev('solar_farm', 20), preferred: ['profitMult', 'automation'] },
  { id: 'hydro_dam', industryId: 'energy', name: 'Hydro Dam', icon: '🌊', baseCost: 2e12, growthRate: 1.13, baseRevenue: 1.2e14, cycleMs: 70000, unlock: prev('wind_park', 20), preferred: ['profitMult', 'automation'] },
  { id: 'fusion_plant', industryId: 'energy', name: 'Fusion Plant', icon: '⚛️', baseCost: 1.8e13, growthRate: 1.14, baseRevenue: 1.76e15, cycleMs: 110000, unlock: prev('hydro_dam', 20), preferred: ['profitMult', 'automation'] },

  // ---- Space & Frontier (capstone: huge, volatile, crit-y moonshots) ----
  { id: 'satellite', industryId: 'space', name: 'Satellite Network', icon: '🛰️', baseCost: 1e14, growthRate: 1.12, baseRevenue: 2.76e15, cycleMs: 30000, unlock: { kind: 'free' }, preferred: ['profitMult', 'critChance'] },
  { id: 'rocket_pad', industryId: 'space', name: 'Rocket Launch Pad', icon: '🚀', baseCost: 1e15, growthRate: 1.13, baseRevenue: 4.76e16, cycleMs: 50000, unlock: prev('satellite', 20), preferred: ['profitMult', 'critChance'] },
  { id: 'asteroid_mine', industryId: 'space', name: 'Asteroid Mine', icon: '☄️', baseCost: 1e16, growthRate: 1.14, baseRevenue: 7.88e17, cycleMs: 80000, unlock: prev('rocket_pad', 20), preferred: ['profitMult', 'critChance'] },
  { id: 'mars_colony', industryId: 'space', name: 'Mars Colony', icon: '🪐', baseCost: 1e17, growthRate: 1.14, baseRevenue: 1.32e19, cycleMs: 130000, unlock: prev('asteroid_mine', 20), preferred: ['profitMult', 'critChance'] },
  // Capstone of capstones — the most expensive business in the game, appended at
  // the top of the global cost order so its efficiency (E0·g^27 ≈ 1.055, the new
  // max) simply continues the monotonic curve without shifting any other rank.
  { id: 'dyson', industryId: 'space', name: 'Dyson Sphere', icon: '🔆', baseCost: 1e18, growthRate: 1.14, baseRevenue: 1.69e20, cycleMs: 160000, unlock: prev('mars_colony', 20), preferred: ['profitMult', 'critChance'] },

  // ---- Quantum Frontier (ultra-endgame; ranks 28-31, all costlier than Dyson so
  //      they extend the monotonic efficiency curve without shifting any rank) ----
  { id: 'quantum_computer', industryId: 'quantum', name: 'Quantum Computer', icon: '🔮', baseCost: 1e19, growthRate: 1.12, baseRevenue: 1.97e21, cycleMs: 180000, unlock: { kind: 'free' }, preferred: ['profitMult', 'critChance'] },
  { id: 'antimatter', industryId: 'quantum', name: 'Antimatter Reactor', icon: '🌀', baseCost: 1e20, growthRate: 1.13, baseRevenue: 2.49e22, cycleMs: 220000, unlock: prev('quantum_computer', 20), preferred: ['profitMult', 'critChance'] },
  { id: 'wormhole', industryId: 'quantum', name: 'Wormhole Gate', icon: '🕳️', baseCost: 1e21, growthRate: 1.14, baseRevenue: 3.28e23, cycleMs: 280000, unlock: prev('antimatter', 20), preferred: ['profitMult', 'critChance'] },
  { id: 'multiverse', industryId: 'quantum', name: 'Multiverse Exchange', icon: '♾️', baseCost: 1e22, growthRate: 1.14, baseRevenue: 4.36e24, cycleMs: 360000, unlock: prev('wormhole', 20), preferred: ['profitMult', 'critChance'] },
]

function toDef(r: Row): BusinessDef {
  return {
    id: r.id,
    industryId: r.industryId,
    name: r.name,
    icon: r.icon,
    baseCost: r.baseCost,
    growthRate: steepen(r.growthRate),
    baseRevenue: r.baseRevenue * REVENUE_SCALE,
    baseCycleMs: r.cycleMs,
    preferredChannels: r.preferred,
    slotUnlocks: SLOTS,
    milestones: r.profitHeavy ? profitHeavyMilestones(r.id) : defaultMilestones(r.id),
    unlock:
      r.unlock.kind === 'businessOwned'
        ? { ...r.unlock, count: Math.round(r.unlock.count * GATE_MULT) }
        : r.unlock,
    riskEnabled: r.riskEnabled,
  }
}

// ── Startup Combinator — the Angel Deal "great outcome" reward ──────────────────
// A SPECIAL standalone business: unlocked ONLY by winning the angel deal (never by
// checkUnlocks — the self-referential gate is never met), and deliberately NOT part of
// any industry ladder or BUSINESS_ORDER, so it's excluded from the efficiency-
// monotonicity invariant (balance.test) and doesn't disturb industry gates/lists. It
// pays strong income and periodically fires a large "exit" payout (see engine/angelDeal).
export const COMBINATOR_ID: BusinessId = 'startup_combinator'
const COMBINATOR: BusinessDef = {
  id: COMBINATOR_ID,
  industryId: 'tech', // Finance/Tech hybrid flavour — benefits from Tech's global bonus
  name: 'Startup Combinator',
  icon: '🚀',
  baseCost: 1e11,
  growthRate: 1.16,
  baseRevenue: 4e10,
  baseCycleMs: 20000,
  preferredChannels: ['profitMult', 'critChance'],
  slotUnlocks: SLOTS,
  milestones: profitHeavyMilestones(COMBINATOR_ID),
  unlock: { kind: 'businessOwned', businessId: COMBINATOR_ID, count: Number.MAX_SAFE_INTEGER },
  riskEnabled: false,
  autoRun: true, // a fund — auto-runs the moment you found it, no Operator needed
}

export const BUSINESSES: Record<BusinessId, BusinessDef> = Object.fromEntries([
  ...ROWS.map((r) => [r.id, toDef(r)] as const),
  [COMBINATOR.id, COMBINATOR] as const,
])

// Ordered ladder for gameplay/tests — the special Combinator is intentionally excluded.
export const BUSINESS_ORDER: BusinessId[] = ROWS.map((r) => r.id)
