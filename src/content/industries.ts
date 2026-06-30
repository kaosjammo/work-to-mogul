import type { IndustryDef, IndustryId } from '../types/domain'

// Four MVP industries, each with a distinct economic feel. Industries unlock by
// explicit cash purchase (player chooses which sector to open and when).
export const INDUSTRIES: Record<IndustryId, IndustryDef> = {
  food: {
    id: 'food',
    name: 'Food & Hospitality',
    theme: 'var(--industry-food)',
    playstyle: 'fast-cycle',
    unlock: { kind: 'free' },
    businessIds: ['lemonade', 'food_truck', 'pizzeria', 'sushi_bar'],
    bonus: {
      signaturePerkId: 'rush_hour',
      preferredChannels: ['cycleSpeed', 'morale'],
    },
  },
  retail: {
    id: 'retail',
    name: 'Retail & Services',
    theme: 'var(--industry-retail)',
    playstyle: 'steady',
    // All industries are visible from the start; the "cost of entry" is simply
    // the price of the first business below.
    unlock: { kind: 'free' },
    businessIds: ['corner_shop', 'barbershop', 'gym', 'department_store'],
    bonus: {
      signaturePerkId: 'franchise',
      preferredChannels: ['costReduction', 'profitMult'],
    },
  },
  tech: {
    id: 'tech',
    name: 'Tech & Media',
    theme: 'var(--industry-tech)',
    playstyle: 'high-capital',
    unlock: { kind: 'free' },
    businessIds: ['mobile_app', 'streaming', 'saas', 'ai_lab'],
    bonus: {
      signaturePerkId: 'network_effect',
      preferredChannels: ['profitMult', 'critChance'],
    },
  },
  finance: {
    id: 'finance',
    name: 'Finance & Property',
    theme: 'var(--industry-finance)',
    playstyle: 'volatile',
    unlock: { kind: 'free' },
    businessIds: ['apartments', 'fund', 'skyscraper'],
    bonus: {
      signaturePerkId: 'compound_interest',
      preferredChannels: ['automation', 'riskReduction'],
    },
  },
  logistics: {
    id: 'logistics',
    name: 'Logistics & Transport',
    theme: 'var(--industry-logistics)',
    playstyle: 'steady',
    unlock: { kind: 'free' },
    businessIds: ['courier', 'trucking', 'cargo_port', 'air_freight'],
    bonus: {
      // Efficiency play: rewards speed + cost-reduction staffing.
      signaturePerkId: 'just_in_time',
      preferredChannels: ['cycleSpeed', 'costReduction'],
    },
  },
  energy: {
    id: 'energy',
    name: 'Energy & Power',
    theme: 'var(--industry-energy)',
    playstyle: 'high-capital',
    unlock: { kind: 'free' },
    businessIds: ['solar_farm', 'wind_park', 'hydro_dam', 'fusion_plant'],
    bonus: {
      // Heavy automated output: rewards profit + automation staffing.
      signaturePerkId: 'grid_surge',
      preferredChannels: ['profitMult', 'automation'],
    },
  },
  space: {
    id: 'space',
    name: 'Space & Frontier',
    theme: 'var(--industry-space)',
    playstyle: 'volatile',
    unlock: { kind: 'free' },
    businessIds: ['satellite', 'rocket_pad', 'asteroid_mine', 'mars_colony'],
    bonus: {
      // Moonshots: rewards profit + crit (jackpot) staffing.
      signaturePerkId: 'moonshot',
      preferredChannels: ['profitMult', 'critChance'],
    },
  },
}

// Ordered by ascending entry cost (price of each industry's first business) so the
// UI's left-to-right order matches the order players can actually afford to open.
// Logistics (Courier $80M) is reachable well before Finance (Apartments $5B).
export const INDUSTRY_ORDER: IndustryId[] = [
  'food',
  'retail',
  'tech',
  'logistics',
  'finance',
  'energy',
  'space',
]
