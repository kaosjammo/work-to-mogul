import type { TraitDef, TraitId } from '../types/domain'

// Traits are cross-channel modifiers added on top of an employee's role before
// rarity/level/affinity scaling. They create tradeoffs and build variety —
// e.g. a Workaholic runs faster but dents morale.
export const TRAIT_DEFS: Record<TraitId, TraitDef> = {
  workaholic: {
    id: 'workaholic',
    name: 'Workaholic',
    channelDeltas: { cycleSpeed: 0.1, morale: -5 },
  },
  frugal: {
    id: 'frugal',
    name: 'Frugal',
    channelDeltas: { costReduction: 0.15 },
  },
  charismatic: {
    id: 'charismatic',
    name: 'Charismatic',
    channelDeltas: { morale: 8 },
  },
  lucky: {
    id: 'lucky',
    name: 'Lucky',
    channelDeltas: { critChance: 0.05 },
  },
}

export const TRAIT_NAME: Record<string, string> = Object.fromEntries(
  Object.values(TRAIT_DEFS).map((t) => [t.id, t.name]),
)

// Player-facing trait explanations. The engine uses `channelDeltas` above; these
// turn each trait into a self-documenting chip (icon + plain-language effect +
// a fuller tooltip), so "what does Workaholic do?" is answered at a glance.
export interface TraitInfo {
  id: TraitId
  name: string
  icon: string
  /** Compact effect shown inline on the chip. */
  effect: string
  /** Fuller sentence for the tooltip / a11y title. */
  blurb: string
}

export const TRAIT_INFO: Record<TraitId, TraitInfo> = {
  workaholic: {
    id: 'workaholic',
    name: 'Workaholic',
    icon: '🏃',
    effect: '+10% speed, −5 morale',
    blurb: 'Runs its business 10% faster, but dents team morale (−5).',
  },
  frugal: {
    id: 'frugal',
    name: 'Frugal',
    icon: '🏷️',
    effect: '−15% buy cost',
    blurb: 'Cuts the cost of buying more of its business by 15%.',
  },
  charismatic: {
    id: 'charismatic',
    name: 'Charismatic',
    icon: '😊',
    effect: '+8 morale',
    blurb: 'Lifts team morale (+8), which lifts the whole business’s output.',
  },
  lucky: {
    id: 'lucky',
    name: 'Lucky',
    icon: '🍀',
    effect: '+5% crit',
    blurb: 'Adds a 5% chance of a bonus “crit” payout each cycle.',
  },
}

// Keyed by display name, since the view layer passes trait display names.
export const TRAIT_BY_NAME: Record<string, TraitInfo> = Object.fromEntries(
  Object.values(TRAIT_INFO).map((t) => [t.name, t]),
)
