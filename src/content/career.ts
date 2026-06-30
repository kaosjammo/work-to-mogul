import type { CareerLevelDef } from '../types/domain'

// The Work/Career ladder. Manual early-game income: tap a shift, earn a wage,
// build toward promotions. Wages climb ~3× per rung; shifts get a little
// shorter. Designed to bridge the player to their first businesses, then fall
// behind once business income scales exponentially.
export const CAREER_LEVELS: CareerLevelDef[] = [
  { level: 0, title: 'Casual Worker', wage: 3, shiftMs: 2500, shiftsToPromote: 8 },
  { level: 1, title: 'Reliable Worker', wage: 10, shiftMs: 2300, shiftsToPromote: 12 },
  { level: 2, title: 'Supervisor', wage: 35, shiftMs: 2100, shiftsToPromote: 16 },
  { level: 3, title: 'Assistant Manager', wage: 120, shiftMs: 1900, shiftsToPromote: 22 },
  { level: 4, title: 'Department Manager', wage: 450, shiftMs: 1700, shiftsToPromote: 30 },
  { level: 5, title: 'Regional Manager', wage: 1500, shiftMs: 1500, shiftsToPromote: null },
]

export const MAX_CAREER_LEVEL = CAREER_LEVELS.length - 1

export function careerLevelDef(level: number): CareerLevelDef {
  const clamped = Math.max(0, Math.min(MAX_CAREER_LEVEL, level))
  return CAREER_LEVELS[clamped]
}
