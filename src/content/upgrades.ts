import type { UpgradeDef, UpgradeId } from '../types/domain'

// One-shot upgrades, folded into economyMultipliers by scope. A catalog spanning
// the whole progression: a cheap business starter, a profit boost per industry,
// a couple of speed boosts, and global tiers. (Existing ids are kept stable.)
export const UPGRADES: Record<UpgradeId, UpgradeDef> = {
  // --- starter / business ---
  lemonade_2x: {
    id: 'lemonade_2x',
    name: 'Premium Lemons',
    cost: 12_000,
    scope: { kind: 'business', businessId: 'lemonade' },
    effect: { kind: 'profitMult', factor: 2 },
  },

  // --- per-industry profit ---
  food_industry_25: {
    id: 'food_industry_25',
    name: 'Celebrity Chef',
    cost: 80_000,
    scope: { kind: 'industry', industryId: 'food' },
    effect: { kind: 'profitMult', factor: 1.25 },
  },
  retail_profit_2x: {
    id: 'retail_profit_2x',
    name: 'Loyalty Program',
    cost: 500_000,
    scope: { kind: 'industry', industryId: 'retail' },
    effect: { kind: 'profitMult', factor: 2 },
  },
  tech_profit_2x: {
    id: 'tech_profit_2x',
    name: 'Viral Algorithm',
    cost: 50_000_000,
    scope: { kind: 'industry', industryId: 'tech' },
    effect: { kind: 'profitMult', factor: 2 },
  },
  logistics_profit_2x: {
    id: 'logistics_profit_2x',
    name: 'Route Optimization',
    cost: 2_000_000_000,
    scope: { kind: 'industry', industryId: 'logistics' },
    effect: { kind: 'profitMult', factor: 2 },
  },
  finance_profit_2x: {
    id: 'finance_profit_2x',
    name: 'Leveraged Buyout',
    cost: 5e10,
    scope: { kind: 'industry', industryId: 'finance' },
    effect: { kind: 'profitMult', factor: 2 },
  },
  energy_profit_2x: {
    id: 'energy_profit_2x',
    name: 'Grid Modernization',
    cost: 5e11,
    scope: { kind: 'industry', industryId: 'energy' },
    effect: { kind: 'profitMult', factor: 2 },
  },
  space_profit_2x: {
    id: 'space_profit_2x',
    name: 'Reusable Boosters',
    cost: 5e15,
    scope: { kind: 'industry', industryId: 'space' },
    effect: { kind: 'profitMult', factor: 2 },
  },

  // --- per-industry speed ---
  food_speed_2x: {
    id: 'food_speed_2x',
    name: 'Drive-Thru Windows',
    cost: 200_000,
    scope: { kind: 'industry', industryId: 'food' },
    effect: { kind: 'speedMult', factor: 2 },
  },
  tech_speed_2x: {
    id: 'tech_speed_2x',
    name: 'Edge Computing',
    cost: 200_000_000,
    scope: { kind: 'industry', industryId: 'tech' },
    effect: { kind: 'speedMult', factor: 2 },
  },

  // --- global tiers ---
  global_speed_15: {
    id: 'global_speed_15',
    name: 'Logistics Overhaul',
    cost: 2_500_000,
    scope: { kind: 'global' },
    effect: { kind: 'speedMult', factor: 1.15 },
  },
  global_profit_2x: {
    id: 'global_profit_2x',
    name: 'Corporate Synergy',
    cost: 1e9,
    scope: { kind: 'global' },
    effect: { kind: 'profitMult', factor: 2 },
  },
  global_speed_2x: {
    id: 'global_speed_2x',
    name: 'Automation Suite',
    cost: 1e11,
    scope: { kind: 'global' },
    effect: { kind: 'speedMult', factor: 2 },
  },
  global_profit_3x: {
    id: 'global_profit_3x',
    name: 'Market Domination',
    cost: 1e14,
    scope: { kind: 'global' },
    effect: { kind: 'profitMult', factor: 3 },
  },

  // === Depth tier — second-tier industry boosts + an escalating endgame ladder
  //     so there is always something expensive to pour cash into (up to $1Sx). ===

  // --- more per-industry speed ---
  retail_speed_2x: {
    id: 'retail_speed_2x',
    name: 'Self-Checkout',
    cost: 8e6,
    scope: { kind: 'industry', industryId: 'retail' },
    effect: { kind: 'speedMult', factor: 2 },
  },
  logistics_speed_2x: {
    id: 'logistics_speed_2x',
    name: 'Drone Delivery',
    cost: 5e9,
    scope: { kind: 'industry', industryId: 'logistics' },
    effect: { kind: 'speedMult', factor: 2 },
  },
  finance_speed_2x: {
    id: 'finance_speed_2x',
    name: 'High-Frequency Trading',
    cost: 8e10,
    scope: { kind: 'industry', industryId: 'finance' },
    effect: { kind: 'speedMult', factor: 2 },
  },
  energy_speed_2x: {
    id: 'energy_speed_2x',
    name: 'Smart Grid',
    cost: 2e12,
    scope: { kind: 'industry', industryId: 'energy' },
    effect: { kind: 'speedMult', factor: 2 },
  },
  space_speed_2x: {
    id: 'space_speed_2x',
    name: 'Ion Drives',
    cost: 2e16,
    scope: { kind: 'industry', industryId: 'space' },
    effect: { kind: 'speedMult', factor: 2 },
  },

  // --- second-tier per-industry profit ---
  food_profit_2x: {
    id: 'food_profit_2x',
    name: 'Michelin Stars',
    cost: 3e7,
    scope: { kind: 'industry', industryId: 'food' },
    effect: { kind: 'profitMult', factor: 2 },
  },
  retail_profit_3x: {
    id: 'retail_profit_3x',
    name: 'Megamall',
    cost: 2e10,
    scope: { kind: 'industry', industryId: 'retail' },
    effect: { kind: 'profitMult', factor: 3 },
  },
  tech_profit_3x: {
    id: 'tech_profit_3x',
    name: 'Platform Monopoly',
    cost: 6e12,
    scope: { kind: 'industry', industryId: 'tech' },
    effect: { kind: 'profitMult', factor: 3 },
  },
  finance_profit_3x: {
    id: 'finance_profit_3x',
    name: 'Sovereign Wealth Fund',
    cost: 5e15,
    scope: { kind: 'industry', industryId: 'finance' },
    effect: { kind: 'profitMult', factor: 3 },
  },
  logistics_profit_3x: {
    id: 'logistics_profit_3x',
    name: 'Global Supply Chain',
    cost: 8e16,
    scope: { kind: 'industry', industryId: 'logistics' },
    effect: { kind: 'profitMult', factor: 3 },
  },
  energy_profit_3x: {
    id: 'energy_profit_3x',
    name: 'Fusion Breakthrough',
    cost: 5e17,
    scope: { kind: 'industry', industryId: 'energy' },
    effect: { kind: 'profitMult', factor: 3 },
  },
  space_profit_3x: {
    id: 'space_profit_3x',
    name: 'Interstellar Charter',
    cost: 2e18,
    scope: { kind: 'industry', industryId: 'space' },
    effect: { kind: 'profitMult', factor: 3 },
  },

  // --- cost-reduction line (cheaper to mass-buy) ---
  bulk_logistics: {
    id: 'bulk_logistics',
    name: 'Bulk Logistics',
    cost: 1e10,
    scope: { kind: 'global' },
    effect: { kind: 'costReduction', factor: 0.9 },
  },
  economies_of_scale: {
    id: 'economies_of_scale',
    name: 'Economies of Scale',
    cost: 1e18,
    scope: { kind: 'global' },
    effect: { kind: 'costReduction', factor: 0.8 },
  },

  // --- endgame global tiers (the long-tail money sink) ---
  global_profit_5x: {
    id: 'global_profit_5x',
    name: 'Vertical Integration',
    cost: 1e15,
    scope: { kind: 'global' },
    effect: { kind: 'profitMult', factor: 4 },
  },
  global_speed_3x: {
    id: 'global_speed_3x',
    name: 'Singularity Logistics',
    cost: 1e17,
    scope: { kind: 'global' },
    effect: { kind: 'speedMult', factor: 2 },
  },
  global_profit_10x: {
    id: 'global_profit_10x',
    name: 'Galactic Conglomerate',
    cost: 1e19,
    scope: { kind: 'global' },
    effect: { kind: 'profitMult', factor: 5 },
  },
  global_profit_25x: {
    id: 'global_profit_25x',
    name: 'Total Market Capture',
    cost: 1e21,
    scope: { kind: 'global' },
    effect: { kind: 'profitMult', factor: 6 },
  },

  // --- Quantum Frontier (ultra-endgame industry boosts) ---
  quantum_speed_2x: {
    id: 'quantum_speed_2x',
    name: 'Entangled Throughput',
    cost: 5e19,
    scope: { kind: 'industry', industryId: 'quantum' },
    effect: { kind: 'speedMult', factor: 2 },
  },
  quantum_profit_3x: {
    id: 'quantum_profit_3x',
    name: 'Probability Engine',
    cost: 5e21,
    scope: { kind: 'industry', industryId: 'quantum' },
    effect: { kind: 'profitMult', factor: 3 },
  },
}

// Ordered roughly by cost (the Upgrades screen re-sorts affordable-first).
export const UPGRADE_ORDER: UpgradeId[] = [
  'lemonade_2x',
  'food_industry_25',
  'food_speed_2x',
  'retail_profit_2x',
  'global_speed_15',
  'retail_speed_2x',
  'food_profit_2x',
  'tech_profit_2x',
  'tech_speed_2x',
  'global_profit_2x',
  'logistics_profit_2x',
  'logistics_speed_2x',
  'bulk_logistics',
  'retail_profit_3x',
  'finance_profit_2x',
  'finance_speed_2x',
  'global_speed_2x',
  'energy_profit_2x',
  'energy_speed_2x',
  'tech_profit_3x',
  'global_profit_3x',
  'global_profit_5x',
  'space_profit_2x',
  'finance_profit_3x',
  'space_speed_2x',
  'logistics_profit_3x',
  'global_speed_3x',
  'energy_profit_3x',
  'economies_of_scale',
  'space_profit_3x',
  'quantum_speed_2x',
  'global_profit_10x',
  'global_profit_25x',
  'quantum_profit_3x',
]
