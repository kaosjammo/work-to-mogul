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
