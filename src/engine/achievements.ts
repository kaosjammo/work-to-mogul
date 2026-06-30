// ============================================================
//  Achievement predicates + checker (pure over GameState).
//  Predicates live here (not in content) because some need derived state
//  like automation, which depends on the employee/economy engine.
// ============================================================
import type { GameState } from '../types/domain'
import { BUSINESSES } from '../content/businesses'
import { ACHIEVEMENTS } from '../content/achievements'
import { MAX_CAREER_LEVEL } from '../content/career'
import { MAX_EMPLOYEE_LEVEL } from '../content/roles'
import { UPGRADES } from '../content/upgrades'
import { resolveBusiness } from './resolveBusiness'

function totalOwned(s: GameState): number {
  let n = 0
  for (const id in s.businesses) n += s.businesses[id].owned
  return n
}

function maxSingleOwned(s: GameState): number {
  let max = 0
  for (const id in s.businesses) max = Math.max(max, s.businesses[id].owned)
  return max
}

function ownsInIndustry(s: GameState, industryId: string): boolean {
  for (const id in s.businesses) {
    if (s.businesses[id].owned > 0 && BUSINESSES[id].industryId === industryId) return true
  }
  return false
}

const UPGRADE_COUNT = Object.keys(UPGRADES).length

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
  all_industries: (s) => industriesEntered(s) >= 8,
  millionaire: (s) => s.lifetimeEarnings >= 1e6,
  billionaire: (s) => s.lifetimeEarnings >= 1e9,
  first_ascension: (s) => s.prestige.resets >= 1,

  // ---- End-game ladder ----
  trillionaire: (s) => s.lifetimeEarnings >= 1e12,
  quadrillionaire: (s) => s.lifetimeEarnings >= 1e15,
  quintillionaire: (s) => s.lifetimeEarnings >= 1e18,
  thousand_units: (s) => totalOwned(s) >= 1000,
  specialist: (s) => maxSingleOwned(s) >= 500,
  reach_space: (s) => ownsInIndustry(s, 'space'),
  mars_colony: (s) => (s.businesses.mars_colony?.owned ?? 0) >= 1,
  ascend_three: (s) => s.prestige.resets >= 3,
  ascend_ten: (s) => s.prestige.resets >= 10,
  talented: (s) => s.prestige.spentPoints >= 10,
  epic_hire: (s) => Object.values(s.employees).some((e) => e.rarity === 'epic'),
  maxed_employee: (s) => Object.values(s.employees).some((e) => e.level >= MAX_EMPLOYEE_LEVEL),
  big_team: (s) => Object.keys(s.employees).length >= 25,
  fully_upgraded: (s) => s.upgradesPurchased.length >= UPGRADE_COUNT,
  quantum_frontier: (s) => ownsInIndustry(s, 'quantum'),
  multiverse_mogul: (s) => (s.businesses.multiverse?.owned ?? 0) >= 1,
}

// Progress toward the *countable* achievements (current ÷ target, clamped 0..1) so
// the UI can show a "how close am I?" bar — like contracts + ascension milestones.
// Event/one-shot goals (first hire, reach space, own a Mars Colony …) return null:
// they're binary, so a bar would be meaningless.
const PROGRESS: Record<string, (s: GameState) => number> = {
  promoted: (s) => s.career.level / 2,
  max_career: (s) => s.career.level / MAX_CAREER_LEVEL,
  hundred_units: (s) => totalOwned(s) / 100,
  five_hundred_units: (s) => totalOwned(s) / 500,
  thousand_units: (s) => totalOwned(s) / 1000,
  specialist: (s) => maxSingleOwned(s) / 500,
  ten_staff: (s) => Object.keys(s.employees).length / 10,
  big_team: (s) => Object.keys(s.employees).length / 25,
  three_industries: (s) => industriesEntered(s) / 3,
  all_industries: (s) => industriesEntered(s) / 8,
  millionaire: (s) => s.lifetimeEarnings / 1e6,
  billionaire: (s) => s.lifetimeEarnings / 1e9,
  trillionaire: (s) => s.lifetimeEarnings / 1e12,
  quadrillionaire: (s) => s.lifetimeEarnings / 1e15,
  quintillionaire: (s) => s.lifetimeEarnings / 1e18,
  first_ascension: (s) => s.prestige.resets / 1,
  ascend_three: (s) => s.prestige.resets / 3,
  ascend_ten: (s) => s.prestige.resets / 10,
  talented: (s) => (s.prestige.spentPoints ?? 0) / 10,
  fully_upgraded: (s) => s.upgradesPurchased.length / UPGRADE_COUNT,
}

/** Fraction (0..1) toward a countable achievement, or null if it's an event goal. */
export function achievementProgress(s: GameState, id: string): number | null {
  const fn = PROGRESS[id]
  if (!fn) return null
  return Math.min(1, Math.max(0, fn(s)))
}

/**
 * Unlock any newly-satisfied achievements. Mutates state.achievementsUnlocked,
 * banks each one's Empire-Token reward (spendable on talents), and returns the
 * ids unlocked this call (for toast notifications). Idempotent: an already-unlocked
 * achievement is skipped, so the reward is granted exactly once.
 */
export function checkAchievements(s: GameState): string[] {
  const unlocked = new Set(s.achievementsUnlocked)
  const fresh: string[] = []
  for (const def of ACHIEVEMENTS) {
    if (unlocked.has(def.id)) continue
    const pred = PREDICATES[def.id]
    if (pred && pred(s)) {
      s.achievementsUnlocked.push(def.id)
      if (def.reward > 0) s.prestige.totalPoints += def.reward
      fresh.push(def.id)
    }
  }
  return fresh
}
