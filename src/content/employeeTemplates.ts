import type { EmployeeTemplateDef } from '../types/domain'

// Fixed hire pool for M4a (no refreshing/gacha — hire any you can afford).
// Costs ascend so early Food-affinity staff are reachable from Work + first
// businesses, while pricier specialists gate behind a bigger empire.
export const EMPLOYEE_TEMPLATES: Record<string, EmployeeTemplateDef> = {
  flash_ortega: { templateId: 'flash_ortega', name: 'Flash Ortega', role: 'runner', rarity: 'common', affinity: 'food', traits: ['workaholic'], baseHireCost: 25 },
  mickey_gears: { templateId: 'mickey_gears', name: 'Mickey Gears', role: 'operator', rarity: 'common', affinity: 'food', traits: [], baseHireCost: 50 },
  thrifty_tom: { templateId: 'thrifty_tom', name: 'Thrifty Tom', role: 'buyer', rarity: 'common', affinity: 'food', traits: ['frugal'], baseHireCost: 45 },
  maxine_hustle: { templateId: 'maxine_hustle', name: 'Maxine Hustle', role: 'closer', rarity: 'uncommon', affinity: 'food', traits: [], baseHireCost: 120 },
  sunny_brooks: { templateId: 'sunny_brooks', name: 'Sunny Brooks', role: 'hr', rarity: 'common', affinity: 'food', traits: ['charismatic'], baseHireCost: 90 },
  penny_frugal: { templateId: 'penny_frugal', name: 'Penny Frugal', role: 'buyer', rarity: 'uncommon', affinity: 'retail', traits: ['frugal'], baseHireCost: 600 },
  marco_vance: { templateId: 'marco_vance', name: 'Marco Vance', role: 'closer', rarity: 'rare', affinity: 'retail', traits: [], baseHireCost: 4000 },
  lady_luck: { templateId: 'lady_luck', name: 'Lady Luck Liu', role: 'gambler', rarity: 'rare', affinity: 'tech', traits: ['lucky'], baseHireCost: 6000 },
  nada_hawk: { templateId: 'nada_hawk', name: 'Nada Hawk', role: 'auditor', rarity: 'uncommon', affinity: 'finance', traits: [], baseHireCost: 12000 },
  rosa_swift: { templateId: 'rosa_swift', name: 'Rosa Swift', role: 'runner', rarity: 'rare', affinity: 'logistics', traits: ['workaholic'], baseHireCost: 90000 },
  watt_sterling: { templateId: 'watt_sterling', name: 'Watt Sterling', role: 'closer', rarity: 'epic', affinity: 'energy', traits: [], baseHireCost: 1500000 },
  nova_star: { templateId: 'nova_star', name: 'Nova Star', role: 'gambler', rarity: 'epic', affinity: 'space', traits: ['lucky'], baseHireCost: 50000000 },
  nova_quick: { templateId: 'nova_quick', name: 'Nova Quick', role: 'runner', rarity: 'rare', affinity: 'tech', traits: [], baseHireCost: 250000 },
  dot_matrix: { templateId: 'dot_matrix', name: 'Dot Matrix', role: 'operator', rarity: 'uncommon', affinity: 'finance', traits: [], baseHireCost: 8000 },
  // Late-industry specialists — give Logistics/Energy/Space an on-theme hire each.
  cargo_kate: { templateId: 'cargo_kate', name: 'Cargo Kate', role: 'buyer', rarity: 'rare', affinity: 'logistics', traits: ['frugal'], baseHireCost: 120000 },
  cole_voltaic: { templateId: 'cole_voltaic', name: 'Cole Voltaic', role: 'operator', rarity: 'epic', affinity: 'energy', traits: [], baseHireCost: 2000000 },
  astra_vance: { templateId: 'astra_vance', name: 'Astra Vance', role: 'closer', rarity: 'epic', affinity: 'space', traits: ['lucky'], baseHireCost: 80000000 },
}

export const HIRE_ORDER: string[] = [
  'flash_ortega',
  'mickey_gears',
  'thrifty_tom',
  'sunny_brooks',
  'maxine_hustle',
  'penny_frugal',
  'marco_vance',
  'lady_luck',
  'dot_matrix',
  'nada_hawk',
  'rosa_swift',
  'cargo_kate',
  'nova_quick',
  'watt_sterling',
  'cole_voltaic',
  'nova_star',
  'astra_vance',
]
