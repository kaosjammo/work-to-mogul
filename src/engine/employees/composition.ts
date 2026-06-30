// ============================================================
//  Employee effect composition.
//  M1 ships the IDENTITY STUB (no staff effects) so the two-layer
//  resolveBusiness fold is proven against the live tick early.
//  M4a replaces computeEmployeeEffects with the real per-channel math.
// ============================================================
import type {
  BusinessDef,
  BusinessState,
  EffectChannel,
  EmployeeEffects,
  EmployeeId,
  EmployeeInstance,
  GameState,
} from '../../types/domain'
import { ROLE_DEFS, RARITY_MULT } from '../../content/roles'
import { SYNERGY_DEFS, type SynergyMods } from '../../content/synergies'
import { TRAIT_DEFS } from '../../content/traits'
import { SPECIALISATIONS } from '../../content/specialisations'
import { INDUSTRIES } from '../../content/industries'
import { staffEffectMult } from '../talents'
import type { RoleId } from '../../types/domain'

/** Effects that change nothing — the multiplicative/additive identity. */
export function identityEffects(): EmployeeEffects {
  return {
    speedAdd: 0,
    profitAdd: 0,
    buyCostMult: 1,
    isAutomated: false,
    critChance: 0,
    critMult: 2,
    moraleScalar: 1,
    riskPenalty: 0,
    focusBonus: 1,
    activeSynergies: [],
  }
}

/** Max profit bonus when every assigned employee is on the industry's theme. */
export const MAX_FOCUS_BONUS = 0.15

/**
 * Industry Focus: the fraction of assigned staff whose role pushes one of the
 * industry's preferred channels, and the resulting profit multiplier (≥ 1).
 * Rewards thematically-aligned staffing (a pure bonus, never a penalty).
 */
export function industryFocus(
  def: BusinessDef,
  roleCounts: Partial<Record<RoleId, number>>,
): { onTheme: number; assigned: number; bonus: number } {
  const preferred = INDUSTRIES[def.industryId]?.bonus.preferredChannels ?? []
  let assigned = 0
  let onTheme = 0
  for (const role in roleCounts) {
    const n = roleCounts[role as RoleId] ?? 0
    if (n <= 0) continue
    assigned += n
    const channel = ROLE_DEFS[role as RoleId]?.primaryChannels[0]
    if (channel && preferred.includes(channel)) onTheme += n
  }
  const fraction = assigned > 0 ? onTheme / assigned : 0
  return { onTheme, assigned, bonus: 1 + MAX_FOCUS_BONUS * fraction }
}

/** Soft cap so stacking a channel has diminishing returns: x/(x+k). */
export function softcap(x: number, k = 0.8): number {
  return x / (x + k)
}

/** How many employee slots are unlocked at the current owned count. */
export function unlockedSlotCount(def: BusinessDef, owned: number): number {
  let count = 0
  for (const threshold of def.slotUnlocks) {
    if (owned >= threshold) count++
  }
  return count
}

/**
 * Reconcile a business's `assigned` slot array (rule #5). Run after buy, load,
 * and prestige. Drops assignments to employees that no longer exist, grows the
 * array with nulls as slots unlock, and trims only trailing empty slots.
 */
export function reconcileSlots(
  bs: BusinessState,
  def: BusinessDef,
  validEmployeeIds: Set<EmployeeId>,
): void {
  for (let i = 0; i < bs.assigned.length; i++) {
    const id = bs.assigned[i]
    if (id && !validEmployeeIds.has(id)) bs.assigned[i] = null
  }
  const target = unlockedSlotCount(def, bs.owned)
  while (bs.assigned.length < target) bs.assigned.push(null)
  while (bs.assigned.length > target && bs.assigned[bs.assigned.length - 1] === null) {
    bs.assigned.pop()
  }
}

/**
 * Per-employee magnitude for a channel: role base × rarity × level × affinity,
 * then × `mult` (the Empire Training prestige talent, 1 when unlearned).
 */
export function effectMagnitude(
  e: EmployeeInstance,
  channel: EffectChannel,
  def: BusinessDef,
  mult = 1,
): number {
  const role = ROLE_DEFS[e.role]
  let base = role?.baseMagnitude[channel] ?? 0
  // Traits add cross-channel modifiers on top of the role's base.
  for (const t of e.traits) base += TRAIT_DEFS[t]?.channelDeltas[channel] ?? 0
  // A chosen L5 specialisation amplifies the primary or branches a secondary.
  if (e.specialisation) base += SPECIALISATIONS[e.specialisation]?.channelDeltas[channel] ?? 0
  if (!base) return 0
  const rarity = RARITY_MULT[e.rarity]
  const level = 1 + 0.15 * (e.level - 1)
  const affinity = e.affinity && e.affinity === def.industryId ? 1.25 : 1
  return base * rarity * level * affinity * mult
}

/**
 * Compose the employees assigned to a business into its effective staff effects.
 * M4a: the four core channels (automation, speed, profit, cost). crit / morale /
 * risk / synergy stay at identity until M4b.
 */
export function computeEmployeeEffects(
  state: GameState,
  def: BusinessDef,
  bs: BusinessState | undefined,
): EmployeeEffects {
  const out = identityEffects()
  if (!bs) return out

  const sm = staffEffectMult(state) // Empire Training: all staff effects scale
  let buyerRaw = 0
  let critChance = 0
  let critMultAdd = 0
  const roleCounts: Partial<Record<RoleId, number>> = {}
  for (const id of bs.assigned) {
    if (!id) continue
    const e = state.employees[id]
    if (!e) continue
    roleCounts[e.role] = (roleCounts[e.role] ?? 0) + 1
    if (ROLE_DEFS[e.role]?.primaryChannels.includes('automation')) out.isAutomated = true
    out.speedAdd += effectMagnitude(e, 'cycleSpeed', def, sm)
    out.profitAdd += effectMagnitude(e, 'profitMult', def, sm)
    buyerRaw += effectMagnitude(e, 'costReduction', def, sm)
    critChance += effectMagnitude(e, 'critChance', def, sm)
    critMultAdd += effectMagnitude(e, 'critMult', def, sm)
  }

  // Named synergies (team-composition bonuses).
  const mods: SynergyMods = { speedMult: 1, profitAdd: 0, critMultAdd: 0, buyCostMult: 1 }
  for (const syn of SYNERGY_DEFS) {
    if (syn.test(roleCounts)) {
      syn.apply(mods)
      out.activeSynergies.push(syn.id)
    }
  }

  // Industry Focus: thematically-aligned staffing earns a profit bonus.
  out.focusBonus = industryFocus(def, roleCounts).bonus
  out.buyCostMult = Math.max(0.4, (1 - softcap(buyerRaw)) * mods.buyCostMult)
  out.critChance = Math.min(0.75, critChance) // hard cap (variance, not a scaling lever)
  out.critMult = 2 + critMultAdd + mods.critMultAdd // base crit is ×2
  out.profitAdd += mods.profitAdd
  // Fold the multiplicative speed synergy into the additive speed factor.
  out.speedAdd = (1 + out.speedAdd) * mods.speedMult - 1
  // Morale: a forgiving revenue multiplier, NEUTRAL at the 60 baseline so it's
  // a pure bonus/penalty (morale 0 → ×0.7, 60 → ×1.0, 100 → ×1.2).
  out.moraleScalar = 1 + (clamp01to100(bs.morale) - 60) * 0.005
  // Risk: while a risk event is active, output is dampened.
  out.riskPenalty = bs.riskEventMsLeft > 0 ? RISK_EVENT_PENALTY : 0
  return out
}

/** Output dampening (fraction) while a risk event is active. */
export const RISK_EVENT_PENALTY = 0.5

/** Combined risk-accrual reduction from assigned auditors (0..~1, softcapped). */
export function auditReduction(state: GameState, def: BusinessDef, bs: BusinessState): number {
  const sm = staffEffectMult(state)
  let raw = 0
  for (const id of bs.assigned) {
    if (!id) continue
    const e = state.employees[id]
    if (!e) continue
    raw += effectMagnitude(e, 'riskReduction', def, sm)
  }
  return softcap(raw)
}

function clamp01to100(n: number): number {
  return Math.max(0, Math.min(100, Number.isFinite(n) ? n : 60))
}

/** The morale level this business drifts toward, raised by assigned HR staff. */
export function moraleEquilibrium(
  state: GameState,
  def: BusinessDef,
  bs: BusinessState,
): number {
  const sm = staffEffectMult(state)
  let eq = 60 // neutral-positive baseline
  for (const id of bs.assigned) {
    if (!id) continue
    const e = state.employees[id]
    if (!e) continue
    eq += effectMagnitude(e, 'morale', def, sm)
  }
  return clamp01to100(eq)
}
