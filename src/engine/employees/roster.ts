// ============================================================
//  Roster operations — hire, assign, move, unassign (pure over GameState).
//  Assignment authority is the business's `assigned` slot array.
// ============================================================
import type { BusinessId, EmployeeId, EmployeeInstance, GameState, Rarity } from '../../types/domain'
import { EMPLOYEE_TEMPLATES } from '../../content/employeeTemplates'
import { MAX_EMPLOYEE_LEVEL } from '../../content/roles'
import { BUSINESSES } from '../../content/businesses'
import { reconcileSlots, unlockedSlotCount } from './composition'
import { hireStartLevel, hireCostMult, levelCostMult } from '../talents'
import { SPECIALISATIONS, REQUIRED_SPEC_LEVEL, MASTERY_SPEC_LEVEL } from '../../content/specialisations'

function validIds(state: GameState): Set<string> {
  return new Set(Object.keys(state.employees))
}

/** Cash cost to hire a fresh employee from a template (incl. Headhunter talent). */
export function hireCost(state: GameState, templateId: string): number {
  const t = EMPLOYEE_TEMPLATES[templateId]
  if (!t) return Infinity
  return Math.ceil(t.baseHireCost * hireCostMult(state))
}

/** Hire a fresh employee from a template if affordable. Returns the new id. */
export function hireEmployee(state: GameState, templateId: string): EmployeeId | null {
  const t = EMPLOYEE_TEMPLATES[templateId]
  if (!t) return null
  const cost = hireCost(state, templateId)
  if (state.cash < cost) return null
  state.cash -= cost
  const id = `e${state.nextEmployeeSeq++}`
  state.employees[id] = {
    id,
    templateId: t.templateId,
    name: t.name,
    role: t.role,
    rarity: t.rarity,
    level: Math.min(MAX_EMPLOYEE_LEVEL, hireStartLevel(state)), // Fast Learners talent
    affinity: t.affinity,
    traits: [...t.traits],
    specialisation: null,
  }
  return id
}

/** Cash cost to level an employee from its current level to the next.
 *  `levelMult` applies the Mentorship talent reduction (default 1 = no talent). */
export function levelUpCost(e: EmployeeInstance, levelMult = 1): number {
  const base = EMPLOYEE_TEMPLATES[e.templateId]?.baseHireCost ?? 50
  return Math.ceil(base * Math.pow(1.6, e.level) * levelMult)
}

/** Level an employee up one level if not maxed and affordable. */
export function levelUpEmployee(state: GameState, empId: EmployeeId): boolean {
  const e = state.employees[empId]
  if (!e || e.level >= MAX_EMPLOYEE_LEVEL) return false
  const cost = levelUpCost(e, levelCostMult(state))
  if (state.cash < cost) return false
  state.cash -= cost
  e.level += 1
  return true
}

/**
 * Choose (or change) an employee's specialisation in slot 1 (unlocked at level 5)
 * or slot 2 (the Mastery slot, unlocked at the level cap). Requires the slot's
 * level gate and a spec that matches the employee's role; the two slots must hold
 * DIFFERENT specs (so the build always leaves one of the role's three out).
 * Re-choosable (no cost) so a pick is never permanently regrettable. Returns false
 * if invalid.
 */
export function chooseSpecialisation(
  state: GameState,
  empId: EmployeeId,
  specId: string,
  slot: 1 | 2 = 1,
): boolean {
  const e = state.employees[empId]
  if (!e) return false
  const minLevel = slot === 2 ? MASTERY_SPEC_LEVEL : REQUIRED_SPEC_LEVEL
  if (e.level < minLevel) return false
  const spec = SPECIALISATIONS[specId]
  if (!spec || spec.role !== e.role) return false
  if (slot === 2) {
    if (e.specialisation === specId) return false // can't duplicate the slot-1 pick
    e.specialisation2 = specId
  } else {
    if (e.specialisation2 === specId) e.specialisation2 = null // freed the slot-2 pick
    e.specialisation = specId
  }
  return true
}

// ----- Fusion / promotion (Tier 5) -----

export const RARITY_LADDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic']

/** The rarity one tier above `r`, or null if already at the top (epic). */
export function nextRarity(r: Rarity): Rarity | null {
  const i = RARITY_LADDER.indexOf(r)
  return i >= 0 && i < RARITY_LADDER.length - 1 ? RARITY_LADDER[i + 1] : null
}

/** Two employees can fuse if they're distinct, the same archetype + rarity,
 *  and not already at the top rarity. */
export function canFuse(a: EmployeeInstance | undefined, b: EmployeeInstance | undefined): boolean {
  if (!a || !b || a.id === b.id) return false
  return a.templateId === b.templateId && a.rarity === b.rarity && nextRarity(a.rarity) != null
}

/**
 * Fuse `consumeId` into `keepId`: the kept employee is promoted one rarity tier
 * (stronger effects via RARITY_MULT), inherits the higher level of the pair, and
 * the consumed employee is unassigned + removed. Returns the new rarity or null
 * if the pair can't fuse. Mutates state.
 */
export function fuseEmployees(
  state: GameState,
  keepId: EmployeeId,
  consumeId: EmployeeId,
): Rarity | null {
  const keep = state.employees[keepId]
  const consume = state.employees[consumeId]
  if (!canFuse(keep, consume)) return null
  const promoted = nextRarity(keep.rarity)
  if (!promoted) return null

  unassignEmployee(state, consumeId)
  delete state.employees[consumeId]

  keep.rarity = promoted
  keep.level = Math.max(keep.level, consume.level)
  // Preserve a chosen specialisation from either source (the kept one wins).
  keep.specialisation = keep.specialisation ?? consume.specialisation

  // Drop the consumed id from any slot arrays that still reference it.
  const ids = validIds(state)
  for (const bid in state.businesses) {
    reconcileSlots(state.businesses[bid], BUSINESSES[bid], ids)
  }
  return promoted
}

/** Remove an employee from whatever slot it currently occupies. */
export function unassignEmployee(state: GameState, empId: EmployeeId): void {
  for (const bid in state.businesses) {
    const arr = state.businesses[bid].assigned
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === empId) arr[i] = null
    }
  }
}

/** Assign an employee to a specific slot (moves it off any prior slot first). */
export function assignEmployee(
  state: GameState,
  empId: EmployeeId,
  businessId: BusinessId,
  slotIndex: number,
): boolean {
  const e = state.employees[empId]
  const bs = state.businesses[businessId]
  const def = BUSINESSES[businessId]
  if (!e || !bs || !def) return false
  if (slotIndex < 0 || slotIndex >= unlockedSlotCount(def, bs.owned)) return false

  unassignEmployee(state, empId)
  reconcileSlots(bs, def, validIds(state))
  bs.assigned[slotIndex] = empId
  return true
}

/** Assign to the first empty slot of a business, if any. */
export function assignToFirstFreeSlot(
  state: GameState,
  empId: EmployeeId,
  businessId: BusinessId,
): boolean {
  const bs = state.businesses[businessId]
  const def = BUSINESSES[businessId]
  if (!bs || !def || !state.employees[empId]) return false
  reconcileSlots(bs, def, validIds(state))
  const free = bs.assigned.findIndex((x) => x === null)
  if (free < 0) return false
  return assignEmployee(state, empId, businessId, free)
}
