import type { Rarity, RoleDef, RoleId } from '../types/domain'

// M4a ships four roles, each mapped to a verb the player already understands.
// (gambler/auditor/hr arrive in M4b.)
export const ROLE_DEFS: Record<RoleId, RoleDef> = {
  operator: {
    id: 'operator',
    name: 'Operator',
    primaryChannels: ['automation'],
    baseMagnitude: { automation: 1 },
    icon: '⚙️',
    color: '#9aa1ad',
    blurb: 'Automates the business — runs without tapping.',
  },
  runner: {
    id: 'runner',
    name: 'Runner',
    primaryChannels: ['cycleSpeed'],
    baseMagnitude: { cycleSpeed: 0.25 },
    icon: '⚡',
    color: '#f5c518',
    blurb: 'Speeds up every production cycle.',
  },
  closer: {
    id: 'closer',
    name: 'Closer',
    primaryChannels: ['profitMult'],
    baseMagnitude: { profitMult: 0.5 },
    icon: '💰',
    color: '#46d369',
    blurb: 'Boosts revenue per cycle.',
  },
  buyer: {
    id: 'buyer',
    name: 'Buyer',
    primaryChannels: ['costReduction'],
    baseMagnitude: { costReduction: 0.4 },
    icon: '🏷️',
    color: '#2bb3e2',
    blurb: 'Reduces the cost of buying more units.',
  },
  gambler: {
    id: 'gambler',
    name: 'Gambler',
    primaryChannels: ['critChance'],
    // +8% crit chance and +1.5 to the crit multiplier (base crit is ×2) per employee.
    baseMagnitude: { critChance: 0.08, critMult: 1.5 },
    icon: '🎲',
    color: '#c084fc',
    blurb: 'Chance of jackpot (critical) payouts.',
  },
  auditor: {
    id: 'auditor',
    name: 'Auditor',
    primaryChannels: ['riskReduction'],
    // Slows risk accrual on volatile (Finance) businesses; softcapped when stacked.
    baseMagnitude: { riskReduction: 0.4 },
    icon: '🛡️',
    color: '#60a5fa',
    blurb: 'Slows risk build-up (fewer disruptions).',
  },
  hr: {
    id: 'hr',
    name: 'Morale Officer',
    primaryChannels: ['morale'],
    // Raises the business's morale equilibrium by this many points per employee.
    baseMagnitude: { morale: 12 },
    icon: '😊',
    color: '#fb7185',
    blurb: 'Lifts team morale over time (more revenue).',
  },
}

export const RARITY_MULT: Record<Rarity, number> = {
  common: 1,
  uncommon: 1.5,
  rare: 2.25,
  epic: 3.4,
}

export const MAX_EMPLOYEE_LEVEL = 10
