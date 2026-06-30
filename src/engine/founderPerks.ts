// ============================================================
//  Founder Perk folds — pure over GameState. The chosen perk (or none) flavours
//  the whole run: profit/speed fold into economyMultipliers, golden into the
//  Time-Warp value, offline into the away-earnings catch-up.
// ============================================================
import type { GameState } from '../types/domain'
import { FOUNDER_PERKS, type FounderPerkDef } from '../content/founderPerks'

/** The current run's chosen Founder Perk def, or null. */
export function founderPerk(state: GameState): FounderPerkDef | null {
  const id = state.prestige?.founderPerk
  return (id && FOUNDER_PERKS[id]) || null
}

export function founderProfitMult(state: GameState): number {
  return founderPerk(state)?.profitMult ?? 1
}
export function founderSpeedMult(state: GameState): number {
  return founderPerk(state)?.speedMult ?? 1
}
export function founderGoldenMult(state: GameState): number {
  return founderPerk(state)?.goldenMult ?? 1
}
export function founderOfflineMult(state: GameState): number {
  return founderPerk(state)?.offlineMult ?? 1
}

/** Choose (or clear with null) the run's Founder Perk. Returns true if it changed. */
export function chooseFounderPerk(state: GameState, id: string | null): boolean {
  if (id !== null && !FOUNDER_PERKS[id]) return false
  if (state.prestige.founderPerk === id) return false
  state.prestige.founderPerk = id
  return true
}
