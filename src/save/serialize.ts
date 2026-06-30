// ============================================================
//  Save serialization + TOLERANT load.
//  Loads are merged over a fresh initialGameState so saves written before new
//  content/fields existed still load. Numbers are sanitized; industries are
//  normalized to the current "always visible" model; orphaned references are
//  dropped. Never throws to the caller — returns null on unrecoverable input.
// ============================================================
import type { EmployeeInstance, GameState, Rarity, RoleId } from '../types/domain'
import { initialGameState } from '../store/initialState'
import { BUSINESSES } from '../content/businesses'
import { MAX_CAREER_LEVEL } from '../content/career'
import { ROLE_DEFS, MAX_EMPLOYEE_LEVEL } from '../content/roles'
import { TRAIT_DEFS } from '../content/traits'
import { TALENTS } from '../content/talents'
import { SPECIALISATIONS } from '../content/specialisations'
import { CONTRACTS, CONTRACT_BY_ID } from '../content/contracts'
import { INDUSTRY_ORDER } from '../content/industries'
import { reconcileSlots } from '../engine/employees/composition'
import { checkUnlocks } from '../engine/simulate'

export const SAVE_KEY = 'tycoon:save'
export const CURRENT_SAVE_VERSION = 1

interface Envelope {
  version: number
  savedAt: number
  state: GameState
}

/** The versioned save envelope shape — shared by localStorage and cloud save. */
export type SaveEnvelope = Envelope

// Versioned migrations for BREAKING save changes (renamed/removed fields).
// Tolerant deep-merge handles purely-additive fields, so this stays empty until
// a real breaking change lands. Each entry upgrades from key-1 to key.
const MIGRATIONS: Record<number, (s: Partial<GameState>) => Partial<GameState>> = {}

function migrate(fromVersion: number, state: Partial<GameState>): Partial<GameState> {
  let v = Number.isFinite(fromVersion) ? fromVersion : CURRENT_SAVE_VERSION
  let st = state
  while (v < CURRENT_SAVE_VERSION) {
    const step = MIGRATIONS[v + 1]
    if (step) st = step(st)
    v++
  }
  return st
}

const RARITIES = new Set<Rarity>(['common', 'uncommon', 'rare', 'epic'])
const VALID_INDUSTRIES = new Set<string>(INDUSTRY_ORDER)

/** Build a clean EmployeeInstance from raw save data, or null if unrecoverable. */
function sanitizeEmployee(id: string, raw: Partial<EmployeeInstance>): EmployeeInstance | null {
  const role = raw.role as RoleId
  if (!role || !(role in ROLE_DEFS)) return null // unknown role → drop (would break effect math)
  const rarity = raw.rarity && RARITIES.has(raw.rarity) ? raw.rarity : 'common'
  const level = clamp(Math.floor(num(raw.level, 1)), 1, MAX_EMPLOYEE_LEVEL)
  const affinity = raw.affinity && VALID_INDUSTRIES.has(raw.affinity) ? raw.affinity : null
  const traits = Array.isArray(raw.traits) ? raw.traits.filter((t) => t in TRAIT_DEFS) : []
  // Keep a specialisation only if it's a known id whose role matches this employee.
  const spec = typeof raw.specialisation === 'string' ? SPECIALISATIONS[raw.specialisation] : undefined
  const specialisation = spec && spec.role === role ? raw.specialisation! : null
  return {
    id,
    templateId: typeof raw.templateId === 'string' ? raw.templateId : id,
    name: typeof raw.name === 'string' ? raw.name : ROLE_DEFS[role].name,
    role,
    rarity,
    level,
    affinity,
    traits,
    specialisation,
  }
}

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

function strArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
}

export function serialize(state: GameState, savedAt: number): string {
  return JSON.stringify({ version: CURRENT_SAVE_VERSION, savedAt, state } satisfies Envelope)
}

/** Parse + migrate + sanitize a raw save string. Returns null if unusable. */
export function deserialize(raw: string, now: number = Date.now()): GameState | null {
  let env: Partial<Envelope>
  try {
    env = JSON.parse(raw) as Partial<Envelope>
  } catch {
    return null
  }
  if (!env || typeof env !== 'object' || typeof env.state !== 'object' || env.state == null) {
    return null
  }
  const migrated = migrate(num(env.version, CURRENT_SAVE_VERSION), env.state as Partial<GameState>)
  return tolerantLoad(migrated, now)
}

/** Merge a loaded (possibly stale/partial) state over a fresh baseline. */
export function tolerantLoad(loaded: Partial<GameState>, now: number = Date.now()): GameState {
  const s = initialGameState(now)

  s.cash = Math.max(0, num(loaded.cash))
  s.lifetimeEarnings = Math.max(0, num(loaded.lifetimeEarnings))
  s.lastWallClock = num(loaded.lastWallClock, now)
  if (loaded.buyMode) s.buyMode = loaded.buyMode
  if (loaded.activeTab) s.activeTab = loaded.activeTab
  if (loaded.activeIndustryTab) s.activeIndustryTab = loaded.activeIndustryTab
  s.onboardingStep = num(loaded.onboardingStep)
  s.nextEmployeeSeq = Math.max(1, num(loaded.nextEmployeeSeq, 1))

  // Career
  if (loaded.career) {
    const lc = loaded.career
    s.career.level = clamp(Math.floor(num(lc.level)), 0, MAX_CAREER_LEVEL)
    s.career.shiftProgressMs = Math.max(0, num(lc.shiftProgressMs))
    s.career.shiftsThisLevel = Math.max(0, Math.floor(num(lc.shiftsThisLevel)))
    s.career.totalShifts = Math.max(0, Math.floor(num(lc.totalShifts)))
    s.career.consultingMs = Math.max(0, num(lc.consultingMs))
  }

  // Prestige — totals + the talent tree (filter unknown ids; clamp ranks).
  if (loaded.prestige) {
    s.prestige.totalPoints = Math.max(0, Math.floor(num(loaded.prestige.totalPoints)))
    s.prestige.resets = Math.max(0, Math.floor(num(loaded.prestige.resets)))
    s.prestige.multiplier = Math.max(1, num(loaded.prestige.multiplier, 1))
    const rawTalents = loaded.prestige.talents
    const talents: Record<string, number> = {}
    let spent = 0
    if (rawTalents && typeof rawTalents === 'object') {
      for (const [id, rank] of Object.entries(rawTalents)) {
        const def = TALENTS[id]
        if (!def) continue
        const r = clamp(Math.floor(num(rank)), 0, def.maxRank)
        if (r > 0) {
          talents[id] = r
          for (let i = 0; i < r; i++) spent += def.cost[i] // tokens spent reaching rank r
        }
      }
    }
    s.prestige.talents = talents
    // Trust the recomputed spend over the stored value, but never exceed earned.
    s.prestige.spentPoints = Math.min(s.prestige.totalPoints, spent)
  }

  // Employees — fully validated (drop ones with an unknown role; clamp level;
  // filter traits; sanitize rarity/affinity) so bad data can't break the math.
  if (loaded.employees && typeof loaded.employees === 'object') {
    for (const [id, emp] of Object.entries(loaded.employees)) {
      if (!emp || typeof emp !== 'object') continue
      const clean = sanitizeEmployee(id, emp as Partial<EmployeeInstance>)
      if (clean) s.employees[id] = clean
    }
  }
  const validEmployeeIds = new Set(Object.keys(s.employees))

  // Businesses: overlay persisted per-id fields onto fresh structure; drop unknown ids.
  if (loaded.businesses && typeof loaded.businesses === 'object') {
    for (const id in s.businesses) {
      const lb = loaded.businesses[id]
      if (!lb) continue
      const b = s.businesses[id]
      b.owned = Math.max(0, Math.floor(num(lb.owned)))
      b.cycleProgressMs = Math.max(0, num(lb.cycleProgressMs))
      b.morale = clamp(num(lb.morale, 60), 0, 100)
      b.risk = clamp(num(lb.risk), 0, 100)
      b.riskEventMsLeft = Math.max(0, num(lb.riskEventMsLeft))
      if (Array.isArray(lb.assigned)) {
        b.assigned = lb.assigned.map((x) => (typeof x === 'string' ? x : null))
      }
      if (b.owned > 0) b.unlocked = true
    }
  }

  // Arrays (filter to valid milestone/upgrade/unlock ids loosely)
  s.upgradesPurchased = strArray(loaded.upgradesPurchased)
  s.milestonesReached = strArray(loaded.milestonesReached)
  s.achievementsUnlocked = strArray(loaded.achievementsUnlocked)
  s.prestigeMilestonesClaimed = strArray(loaded.prestigeMilestonesClaimed)
  s.purchasedUnlocks = strArray(loaded.purchasedUnlocks)

  // Contracts board: keep only known contract ids; clamp the pool pointer.
  if (loaded.contracts && typeof loaded.contracts === 'object') {
    const active = strArray(loaded.contracts.active).filter((id) => id in CONTRACT_BY_ID)
    const nextIndex = clamp(Math.floor(num(loaded.contracts.nextIndex)), 0, CONTRACTS.length)
    if (active.length) s.contracts = { active, nextIndex }
  }

  // Industries are always visible/unlocked in the current model.
  for (const id in s.industries) s.industries[id].unlocked = true

  // Recompute structural state and slot arrays.
  checkUnlocks(s)
  for (const id in s.businesses) {
    reconcileSlots(s.businesses[id], BUSINESSES[id], validEmployeeIds)
  }

  return s
}
