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

const ROWS: Row[] = [
  // ---- Food & Hospitality (cheap, fast, mass-buy) ----
  { id: 'lemonade', industryId: 'food', name: 'Lemonade Stand', icon: '🍋', baseCost: 4, growthRate: 1.07, baseRevenue: 1, cycleMs: 600, unlock: { kind: 'free' }, preferred: ['cycleSpeed', 'morale'] },
  { id: 'food_truck', industryId: 'food', name: 'Food Truck', icon: '🚚', baseCost: 60, growthRate: 1.08, baseRevenue: 12, cycleMs: 3000, unlock: prev('lemonade', 25), preferred: ['cycleSpeed', 'morale'] },
  { id: 'pizzeria', industryId: 'food', name: 'Pizzeria', icon: '🍕', baseCost: 720, growthRate: 1.09, baseRevenue: 90, cycleMs: 6000, unlock: prev('food_truck', 25), preferred: ['cycleSpeed', 'profitMult'] },
  { id: 'sushi_bar', industryId: 'food', name: 'Sushi Bar', icon: '🍣', baseCost: 8640, growthRate: 1.1, baseRevenue: 720, cycleMs: 12000, unlock: prev('pizzeria', 25), preferred: ['profitMult', 'morale'] },

  // ---- Retail & Services (employee-synergy, steady) ----
  { id: 'corner_shop', industryId: 'retail', name: 'Corner Shop', icon: '🏪', baseCost: 18000, growthRate: 1.08, baseRevenue: 1400, cycleMs: 8000, unlock: { kind: 'free' }, preferred: ['costReduction', 'profitMult'] },
  { id: 'barbershop', industryId: 'retail', name: 'Barbershop', icon: '💈', baseCost: 90000, growthRate: 1.09, baseRevenue: 7500, cycleMs: 14000, unlock: prev('corner_shop', 20), preferred: ['costReduction', 'profitMult'] },
  { id: 'gym', industryId: 'retail', name: 'Gym Franchise', icon: '🏋️', baseCost: 540000, growthRate: 1.1, baseRevenue: 48000, cycleMs: 24000, unlock: prev('barbershop', 20), preferred: ['profitMult', 'morale'] },
  { id: 'department_store', industryId: 'retail', name: 'Department Store', icon: '🏬', baseCost: 4000000, growthRate: 1.11, baseRevenue: 380000, cycleMs: 40000, unlock: prev('gym', 20), preferred: ['costReduction', 'profitMult'] },

  // ---- Tech & Media (scales hard with milestones) ----
  { id: 'mobile_app', industryId: 'tech', name: 'Mobile App', icon: '📱', baseCost: 2500000, growthRate: 1.1, baseRevenue: 130000, cycleMs: 10000, unlock: { kind: 'free' }, preferred: ['profitMult', 'critChance'], profitHeavy: true },
  { id: 'streaming', industryId: 'tech', name: 'Streaming Channel', icon: '📺', baseCost: 20000000, growthRate: 1.11, baseRevenue: 1100000, cycleMs: 18000, unlock: prev('mobile_app', 20), preferred: ['profitMult', 'critChance'], profitHeavy: true },
  { id: 'saas', industryId: 'tech', name: 'SaaS Platform', icon: '☁️', baseCost: 175000000, growthRate: 1.12, baseRevenue: 9500000, cycleMs: 30000, unlock: prev('streaming', 20), preferred: ['profitMult', 'critChance'], profitHeavy: true },
  { id: 'ai_lab', industryId: 'tech', name: 'AI Lab', icon: '🤖', baseCost: 1500000000, growthRate: 1.13, baseRevenue: 90000000, cycleMs: 50000, unlock: prev('saas', 20), preferred: ['profitMult', 'critChance'], profitHeavy: true },

  // ---- Finance & Property (slow, high-value, risk-enabled) ----
  { id: 'apartments', industryId: 'finance', name: 'Rental Apartments', icon: '🏢', baseCost: 5e9, growthRate: 1.11, baseRevenue: 350000000, cycleMs: 30000, unlock: { kind: 'free' }, preferred: ['automation', 'riskReduction'], riskEnabled: true },
  { id: 'fund', industryId: 'finance', name: 'Investment Fund', icon: '📈', baseCost: 4e10, growthRate: 1.12, baseRevenue: 3e9, cycleMs: 60000, unlock: prev('apartments', 15), preferred: ['automation', 'riskReduction'], riskEnabled: true },
  { id: 'skyscraper', industryId: 'finance', name: 'Skyscraper', icon: '🏙️', baseCost: 3.5e11, growthRate: 1.14, baseRevenue: 2.8e10, cycleMs: 120000, unlock: prev('fund', 15), preferred: ['automation', 'riskReduction'], riskEnabled: true },

  // ---- Logistics & Transport (efficiency: speed + cost reduction) ----
  { id: 'courier', industryId: 'logistics', name: 'Courier Service', icon: '🛵', baseCost: 8e7, growthRate: 1.09, baseRevenue: 5.5e6, cycleMs: 12000, unlock: { kind: 'free' }, preferred: ['cycleSpeed', 'costReduction'] },
  { id: 'trucking', industryId: 'logistics', name: 'Trucking Fleet', icon: '🚛', baseCost: 7e8, growthRate: 1.1, baseRevenue: 4.8e7, cycleMs: 20000, unlock: prev('courier', 20), preferred: ['cycleSpeed', 'costReduction'] },
  { id: 'cargo_port', industryId: 'logistics', name: 'Cargo Port', icon: '🚢', baseCost: 6.5e9, growthRate: 1.11, baseRevenue: 4.2e8, cycleMs: 35000, unlock: prev('trucking', 20), preferred: ['cycleSpeed', 'profitMult'] },
  { id: 'air_freight', industryId: 'logistics', name: 'Air Freight Hub', icon: '✈️', baseCost: 6e10, growthRate: 1.12, baseRevenue: 3.8e9, cycleMs: 55000, unlock: prev('cargo_port', 20), preferred: ['cycleSpeed', 'costReduction'] },

  // ---- Energy & Power (high-capital, big automated output) ----
  { id: 'solar_farm', industryId: 'energy', name: 'Solar Farm', icon: '☀️', baseCost: 2.5e10, growthRate: 1.11, baseRevenue: 1.6e9, cycleMs: 25000, unlock: { kind: 'free' }, preferred: ['profitMult', 'automation'] },
  { id: 'wind_park', industryId: 'energy', name: 'Wind Park', icon: '🌬️', baseCost: 2.2e11, growthRate: 1.12, baseRevenue: 1.4e10, cycleMs: 40000, unlock: prev('solar_farm', 20), preferred: ['profitMult', 'automation'] },
  { id: 'hydro_dam', industryId: 'energy', name: 'Hydro Dam', icon: '🌊', baseCost: 2e12, growthRate: 1.13, baseRevenue: 1.2e11, cycleMs: 70000, unlock: prev('wind_park', 20), preferred: ['profitMult', 'automation'] },
  { id: 'fusion_plant', industryId: 'energy', name: 'Fusion Plant', icon: '⚛️', baseCost: 1.8e13, growthRate: 1.14, baseRevenue: 1e12, cycleMs: 110000, unlock: prev('hydro_dam', 20), preferred: ['profitMult', 'automation'] },

  // ---- Space & Frontier (capstone: huge, volatile, crit-y moonshots) ----
  { id: 'satellite', industryId: 'space', name: 'Satellite Network', icon: '🛰️', baseCost: 1e14, growthRate: 1.12, baseRevenue: 6e12, cycleMs: 30000, unlock: { kind: 'free' }, preferred: ['profitMult', 'critChance'] },
  { id: 'rocket_pad', industryId: 'space', name: 'Rocket Launch Pad', icon: '🚀', baseCost: 1e15, growthRate: 1.13, baseRevenue: 7e13, cycleMs: 50000, unlock: prev('satellite', 20), preferred: ['profitMult', 'critChance'] },
  { id: 'asteroid_mine', industryId: 'space', name: 'Asteroid Mine', icon: '☄️', baseCost: 1e16, growthRate: 1.14, baseRevenue: 8e14, cycleMs: 80000, unlock: prev('rocket_pad', 20), preferred: ['profitMult', 'critChance'] },
  { id: 'mars_colony', industryId: 'space', name: 'Mars Colony', icon: '🪐', baseCost: 1e17, growthRate: 1.14, baseRevenue: 9e15, cycleMs: 130000, unlock: prev('asteroid_mine', 20), preferred: ['profitMult', 'critChance'] },
]

function toDef(r: Row): BusinessDef {
  return {
    id: r.id,
    industryId: r.industryId,
    name: r.name,
    icon: r.icon,
    baseCost: r.baseCost,
    growthRate: r.growthRate,
    baseRevenue: r.baseRevenue,
    baseCycleMs: r.cycleMs,
    preferredChannels: r.preferred,
    slotUnlocks: SLOTS,
    milestones: r.profitHeavy ? profitHeavyMilestones(r.id) : defaultMilestones(r.id),
    unlock: r.unlock,
    riskEnabled: r.riskEnabled,
  }
}

export const BUSINESSES: Record<BusinessId, BusinessDef> = Object.fromEntries(
  ROWS.map((r) => [r.id, toDef(r)]),
)

export const BUSINESS_ORDER: BusinessId[] = ROWS.map((r) => r.id)
