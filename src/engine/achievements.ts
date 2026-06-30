// ============================================================
//  Achievement predicates + checker (pure over GameState).
//  Predicates live here (not in content) because some need derived state
//  like automation, which depends on the employee/economy engine.
// ============================================================
import type { GameState } from '../types/domain'
import { BUSINESSES } from '../content/businesses'
import { ACHIEVEMENTS } from '../content/achievements'
import { MAX_CAREER_LEVEL } from '../content/career'
import { resolveBusiness } from './resolveBusiness'

function totalOwned(s: GameState): number {
  let n = 0
  for (const id in s.businesses) n += s.businesses[id].owned
  return n
}

function industriesEntered(s: GameState): number {
  const set = new Set<string>()
  for (const id in s.businesses) {
    if (s.businesses[id].owned > 0) set.add(BUSINESSES[id].industryId)
  }
  return set.size
}

function anyAutomated(s: GameState): boolean {
  for (const id in s.businesses) {
    const bs = s.businesses[id]
    if (bs.unlocked && bs.owned > 0 && resolveBusiness(s, BUSINESSES[id]).isAutomated) return true
  }
  return false
}

const PREDICATES: Record<string, (s: GameState) => boolean> = {
  first_shift: (s) => s.career.totalShifts >= 1,
  promoted: (s) => s.career.level >= 2, // Supervisor (3rd rung)
  max_career: (s) => s.career.level >= MAX_CAREER_LEVEL,
  first_business: (s) => totalOwned(s) >= 1,
  hundred_units: (s) => totalOwned(s) >= 100,
  five_hundred_units: (s) => totalOwned(s) >= 500,
  first_automation: anyAutomated,
  first_hire: (s) => Object.keys(s.employees).length >= 1,
  ten_staff: (s) => Object.keys(s.employees).length >= 10,
  three_industries: (s) => industriesEntered(s) >= 3,
  all_industries: (s) => industriesEntered(s) >= 7,
  millionaire: (s) => s.lifetimeEarnings >= 1e6,
  billionaire: (s) => s.lifetimeEarnings >= 1e9,
  first_ascension: (s) => s.prestige.resets >= 1,
}

/**
 * Unlock any newly-satisfied achievements. Mutates state.achievementsUnlocked
 * and returns the ids unlocked this call (for toast notifications).
 */
export function checkAchievements(s: GameState): string[] {
  const unlocked = new Set(s.achievementsUnlocked)
  const fresh: string[] = []
  for (const def of ACHIEVEMENTS) {
    if (unlocked.has(def.id)) continue
    const pred = PREDICATES[def.id]
    if (pred && pred(s)) {
      s.achievementsUnlocked.push(def.id)
      fresh.push(def.id)
    }
  }
  return fresh
}
