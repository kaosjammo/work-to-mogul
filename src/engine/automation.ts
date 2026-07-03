// ============================================================
//  Automation managers — the Executive Assistant (auto-reinvest) + the Chief of
//  Staff (auto hire / level / assign). Pure over GameState, deterministic, and
//  BOUNDED (a fixed action cap per cycle). Both are OFF by default and only act
//  when the player enables them, so the greedy sim harness — which uses a fresh
//  initialGameState (enabled: false) — never triggers them and idle pacing stays
//  byte-identical. Nothing touches the base curve; the managers only spend cash on
//  the same purchases/hires a player could make by hand.
//
//  Meta-progression: the CONFIG persists through prestige (a set-and-forget
//  convenience). The internal cooldowns intentionally do NOT advance offline —
//  automation pauses while away (offline income stays closed-form).
// ============================================================
import type {
  AutomationState,
  AutoInvestConfig,
  AutoStaffConfig,
  BusinessId,
  GameState,
  IndustryId,
} from '../types/domain'
import { BUSINESS_ORDER, BUSINESSES, COMBINATOR_ID } from '../content/businesses'
import { EMPLOYEE_TEMPLATES, HIRE_ORDER } from '../content/employeeTemplates'
import { UPGRADES, UPGRADE_ORDER } from '../content/upgrades'
import type { UpgradeDef, UpgradeId } from '../types/domain'
import { unitCost } from './economy'
import { resolveBusiness } from './resolveBusiness'
import { purchase } from './buy'
import { buyUpgrade } from './upgrades'
import {
  hireCost,
  hireEmployee,
  levelUpCost,
  levelUpEmployee,
  assignToFirstFreeSlot,
  nextRarity,
  fuseEmployees,
  chooseSpecialisation,
} from './employees/roster'
import { unlockedSlotCount } from './employees/composition'
import { autoAssignBest } from './employees/autoAssign'
import { levelCostMult } from './talents'
import { automatedIncomePerSec } from './catchUp'
import { MAX_EMPLOYEE_LEVEL } from '../content/roles'
import { REQUIRED_SPEC_LEVEL, MASTERY_SPEC_LEVEL } from '../content/specialisations'
import { autoWorkCareer } from './execAssistant'
import type { RoleId } from '../types/domain'

// Per-cycle action caps — keep a tick cheap + bounded no matter the cash pile.
const MAX_REINVEST_BUYS = 200
const MAX_HIRES_PER_CYCLE = 8
const MAX_LEVELS_PER_CYCLE = 25
const MAX_FUSIONS_PER_CYCLE = 12
const MAX_FUSION_HIRES_PER_CYCLE = 6

// The Chief's auto-pick specialisations per role: [slot 1 @ L5] amplify the primary channel,
// [slot 2 @ L10] the Mastery capstone. (Operator has no primary amplify → its "Night Owl"
// speed branch.) Ids must exist in content/specialisations.ts.
const AUTO_SPEC_SLOT1: Record<RoleId, string> = {
  operator: 'night_owl', runner: 'sprint_lead', closer: 'rainmaker', buyer: 'bulk_buyer',
  gambler: 'sharpshooter', auditor: 'compliance_officer', hr: 'culture_champion',
}
const AUTO_SPEC_MASTERY: Record<RoleId, string> = {
  operator: 'lights_out', runner: 'slipstream', closer: 'kingpin', buyer: 'monopolist',
  gambler: 'whale', auditor: 'watchdog', hr: 'luminary',
}

// Cheapest operator/booster templates (automation-first hiring). Static content.
const OPERATOR_TEMPLATES = HIRE_ORDER.filter((tid) => EMPLOYEE_TEMPLATES[tid].role === 'operator').sort(
  (a, b) => EMPLOYEE_TEMPLATES[a].baseHireCost - EMPLOYEE_TEMPLATES[b].baseHireCost,
)
const CHEAPEST_TEMPLATES = [...HIRE_ORDER].sort(
  (a, b) => EMPLOYEE_TEMPLATES[a].baseHireCost - EMPLOYEE_TEMPLATES[b].baseHireCost,
)

const clampPct = (n: number) => Math.max(0, Math.min(90, n))

export function initialAutomationState(): AutomationState {
  return {
    invest: {
      unlocked: false,
      arcStage: 0,
      arcStarted: false,
      autoWork: true,
      enabled: false,
      reservePct: 25,
      strategy: 'roi',
      focusIndustry: null,
      intervalSec: 5,
      cooldownMs: 5000,
      lifetimeSpent: 0,
      lifetimeUnits: 0,
    },
    staff: {
      unlocked: false,
      enabled: false,
      budgetPct: 20,
      hire: true,
      level: true,
      assign: true,
      fuse: true,
      spec: true,
      intervalSec: 10,
      cooldownMs: 10000,
      lifetimeSpent: 0,
      lifetimeHires: 0,
    },
  }
}

/** Both managers become available once the player owns any business (past the
 *  pure Work phase). Before that there's nothing to reinvest in or staff. */
export function automationEligible(state: GameState): boolean {
  for (const id in state.businesses) if ((state.businesses[id]?.owned ?? 0) > 0) return true
  return false
}

// ── Chief of Staff — a one-time HIRE that unlocks the auto-roster manager ─────
/** A one-time signing cost, scaled so it's a real decision at any stage: at least
 *  $1M, or ~2 minutes of idle income (whichever is larger). */
export const CHIEF_UNLOCK_FLOOR = 1_000_000
export const CHIEF_UNLOCK_SECONDS = 120

export function chiefUnlockCost(state: GameState): number {
  return Math.max(CHIEF_UNLOCK_FLOOR, automatedIncomePerSec(state) * CHIEF_UNLOCK_SECONDS)
}

/**
 * Hire the Chief of Staff (player action, from the Staff screen): pay the signing
 * cost, flip `unlocked`, and start it working. Returns true if the hire happened.
 * Player-only → the sim bot never hires, so `unlocked`/`enabled` stay false and the
 * automation tick stays inert (income byte-identical).
 */
export function unlockChiefOfStaff(state: GameState): boolean {
  const st = state.automation?.staff
  if (!st || st.unlocked) return false
  const cost = chiefUnlockCost(state)
  if (!(cost >= 0) || state.cash < cost) return false
  state.cash -= cost
  st.unlocked = true
  st.enabled = true // starts working immediately; the player can tune/disable in the menu
  st.cooldownMs = Math.min(st.cooldownMs, 1000) // act promptly after hiring
  return true
}

// ── Executive Assistant — auto-reinvest ──────────────────────────────────────

/** Every business the EA may price: the ordered ladder PLUS the Startup
 *  Combinator — a special reward business outside BUSINESS_ORDER that is
 *  nevertheless fully buyable once the angel deal unlocks it. Excluding it
 *  made the EA blind to what is often the single best $/s purchase on the
 *  board. Gated on `unlocked`, so the sim bot (which never wins the angel
 *  deal) sees an identical list → harness byte-identity holds. */
const INVESTABLE_IDS: BusinessId[] = [...BUSINESS_ORDER, COMBINATOR_ID]

function investCandidates(state: GameState, cfg: AutoInvestConfig): BusinessId[] {
  const ids = INVESTABLE_IDS.filter((id) => state.businesses[id]?.unlocked)
  if (cfg.strategy === 'focus' && cfg.focusIndustry) {
    return ids.filter((id) => BUSINESSES[id].industryId === cfg.focusIndustry)
  }
  return ids
}

/** Marginal $/s the NEXT unit of a business would add (revenue is linear in owned). */
function perUnitPps(state: GameState, id: BusinessId): number {
  const bs = state.businesses[id]
  const def = BUSINESSES[id]
  if (bs.owned > 0) return resolveBusiness(state, def).pps / bs.owned
  bs.owned = 1
  const p = resolveBusiness(state, def).pps
  bs.owned = 0
  return p
}

/** Total $/s currently produced by the businesses in an upgrade's scope.
 *  Iterates INVESTABLE_IDS (not BUSINESS_ORDER) so a global upgrade's value
 *  includes the Combinator's income — global upgrades DO multiply it. */
function scopePps(state: GameState, up: UpgradeDef): number {
  let sum = 0
  for (const id of INVESTABLE_IDS) {
    const bs = state.businesses[id]
    if (!bs?.unlocked || bs.owned <= 0) continue
    const def = BUSINESSES[id]
    if (up.scope.kind === 'business' && id !== up.scope.businessId) continue
    if (up.scope.kind === 'industry' && def.industryId !== up.scope.industryId) continue
    sum += resolveBusiness(state, def).pps
  }
  return sum
}

/** Marginal $/s a one-shot upgrade adds right now: a profit/speed ×factor on its scope
 *  adds ~(factor − 1) × that scope's current $/s. costReduction upgrades add no direct
 *  $/s (they cut future buy costs), so they're valued 0 and stay out of the ROI race. */
function upgradeMarginalPps(state: GameState, up: UpgradeDef): number {
  const eff = up.effect
  if (eff.kind === 'profitMult' || eff.kind === 'speedMult') return (eff.factor - 1) * scopePps(state, up)
  return 0
}

/** Un-owned one-shot upgrades the EA may buy (under 'focus', scoped to that industry +
 *  global). UPGRADE_ORDER is roughly ascending cost. */
function upgradeCandidates(state: GameState, cfg: AutoInvestConfig): UpgradeId[] {
  return UPGRADE_ORDER.filter((uid) => {
    if (state.upgradesPurchased.includes(uid)) return false
    if (cfg.strategy === 'focus' && cfg.focusIndustry) {
      const sc = UPGRADES[uid].scope
      if (sc.kind === 'business') return BUSINESSES[sc.businessId]?.industryId === cfg.focusIndustry
      if (sc.kind === 'industry') return sc.industryId === cfg.focusIndustry
      // global upgrades help the focused industry too → allowed
    }
    return true
  })
}

/**
 * Reinvest up to `budget` cash across the eligible businesses AND un-owned
 * one-shot upgrades, honouring the strategy (roi = best marginal $/s per $;
 * cheapest = lowest price on the board; focus = a single industry, priced by
 * roi within it). Greedy, one purchase at a time, capped. Never spends past
 * the budget (which already excludes the reserve).
 */
export function reinvestWithin(
  state: GameState,
  budget: number,
  cfg: AutoInvestConfig,
): { units: number; spent: number } {
  const startCash = state.cash
  if (!(budget > 0)) return { units: 0, spent: 0 }
  const ids = investCandidates(state, cfg)
  if (ids.length === 0) return { units: 0, spent: 0 }
  let spentBudget = 0
  let units = 0

  for (let i = 0; i < MAX_REINVEST_BUYS; i++) {
    let bestId: BusinessId | null = null
    let bestScore = cfg.strategy === 'cheapest' ? Infinity : 0
    let bestCost = 0

    for (const id of ids) {
      const bs = state.businesses[id]
      const def = BUSINESSES[id]
      const cost = unitCost(def, bs.owned) * resolveBusiness(state, def).buyCostMult
      if (!(cost > 0)) continue
      if (spentBudget + cost > budget || cost > state.cash) continue // stays inside the budget + wallet

      if (cfg.strategy === 'cheapest') {
        if (cost < bestScore) {
          bestScore = cost
          bestId = id
          bestCost = cost
        }
      } else {
        const roi = perUnitPps(state, id) / cost
        if (roi > bestScore) {
          bestScore = roi
          bestId = id
          bestCost = cost
        }
      }
    }

    // One-shot UPGRADES compete for the greedy slot under EVERY strategy, each
    // scored in that strategy's own currency:
    //  • roi/focus — marginal $/s per $ (must beat the best next business unit).
    //    costReduction upgrades add no direct $/s, so they stay out of this race.
    //  • cheapest — raw price: buy an upgrade when it's literally the cheapest
    //    thing on the board (including costReduction ones — permanent one-shots
    //    are always worth their slot when they undercut the cheapest unit).
    let bestUp: UpgradeId | null = null
    let bestUpCost = 0
    if (cfg.strategy === 'cheapest') {
      let cheapest = bestId ? bestCost : Infinity // must undercut the cheapest unit
      for (const uid of upgradeCandidates(state, cfg)) {
        const cost = UPGRADES[uid].cost
        if (spentBudget + cost > budget || cost > state.cash) continue
        if (cost < cheapest) {
          cheapest = cost
          bestUp = uid
          bestUpCost = cost
        }
      }
    } else {
      let bestUpRoi = bestScore // must beat the best business unit's ROI to win the slot
      for (const uid of upgradeCandidates(state, cfg)) {
        const cost = UPGRADES[uid].cost
        if (spentBudget + cost > budget || cost > state.cash) continue
        const mp = upgradeMarginalPps(state, UPGRADES[uid])
        if (mp <= 0) continue
        const roi = mp / cost
        if (roi > bestUpRoi) {
          bestUpRoi = roi
          bestUp = uid
          bestUpCost = cost
        }
      }
    }
    if (bestUp && buyUpgrade(state, bestUp)) {
      spentBudget += bestUpCost
      continue // an upgrade filled this greedy step; upgrades don't count as "units"
    }

    if (!bestId || !purchase(state, bestId, 1)) break
    spentBudget += bestCost
    units++
  }

  return { units, spent: startCash - state.cash }
}

// ── Chief of Staff — auto hire / level / assign ──────────────────────────────

function ownedBusinessWithFreeSlot(state: GameState): BusinessId | null {
  for (const id of BUSINESS_ORDER) {
    const bs = state.businesses[id]
    if (!bs?.unlocked || bs.owned <= 0) continue
    const slots = unlockedSlotCount(BUSINESSES[id], bs.owned)
    let filled = 0
    for (const a of bs.assigned) if (a) filled++
    if (filled < slots && bs.assigned.some((x) => x === null)) return id
  }
  return null
}

/** Whether a business already has an operator (i.e. is staffed for automation). */
function hasOperator(state: GameState, id: BusinessId): boolean {
  for (const slot of state.businesses[id].assigned) {
    if (slot && state.employees[slot]?.role === 'operator') return true
  }
  return false
}

/** Pick a template to hire for a target business: an operator first (to automate
 *  it), else the cheapest template overall. Returns null if none affordable. */
function chooseHireTemplate(state: GameState, businessId: BusinessId, budgetLeft: number): string | null {
  const pool = state.businesses[businessId] && !hasOperator(state, businessId)
    ? [...OPERATOR_TEMPLATES, ...CHEAPEST_TEMPLATES] // operators first, then anyone
    : CHEAPEST_TEMPLATES
  for (const tid of pool) {
    const cost = hireCost(state, tid)
    if (cost > 0 && cost <= budgetLeft && cost <= state.cash) return tid
  }
  return null
}

/** Employee with the CHEAPEST affordable next-level cost (spreads levels widely
 *  for the budget), or null. */
function cheapestLevelUp(state: GameState, budgetLeft: number): string | null {
  let bestId: string | null = null
  let bestCost = Infinity
  const mult = levelCostMult(state)
  for (const id in state.employees) {
    const e = state.employees[id]
    if (e.level >= MAX_EMPLOYEE_LEVEL) continue
    const cost = levelUpCost(e, mult)
    if (cost <= budgetLeft && cost <= state.cash && cost < bestCost) {
      bestCost = cost
      bestId = id
    }
  }
  return bestId
}

/** A fusable pair (same template + rarity, promotable), keeping the higher-level one. */
function findFusablePair(state: GameState): { keep: string; consume: string } | null {
  const groups = new Map<string, string[]>()
  for (const id in state.employees) {
    const e = state.employees[id]
    if (!nextRarity(e.rarity)) continue // top rarity can't fuse
    const key = `${e.templateId}|${e.rarity}`
    const arr = groups.get(key)
    if (arr) arr.push(id)
    else groups.set(key, [id])
  }
  for (const ids of groups.values()) {
    if (ids.length < 2) continue
    const [a, b] = ids
    const keep = (state.employees[a].level >= state.employees[b].level) ? a : b
    return { keep, consume: keep === a ? b : a }
  }
  return null
}

/** Fuse every eligible duplicate pair (free) → promotes rarity ("replace with better"). */
function autoFuse(state: GameState): void {
  for (let i = 0; i < MAX_FUSIONS_PER_CYCLE; i++) {
    const pair = findFusablePair(state)
    if (!pair) break
    if (!fuseEmployees(state, pair.keep, pair.consume)) break
  }
}

/** Auto-pick specialisations (free): the amplify spec at L5, the Mastery capstone at L10. */
function autoPickSpecs(state: GameState): void {
  for (const id in state.employees) {
    const e = state.employees[id]
    if (e.level >= REQUIRED_SPEC_LEVEL && !e.specialisation) {
      const s1 = AUTO_SPEC_SLOT1[e.role]
      if (s1) chooseSpecialisation(state, id, s1, 1)
    }
    if (e.level >= MASTERY_SPEC_LEVEL && !e.specialisation2) {
      const s2 = AUTO_SPEC_MASTERY[e.role]
      if (s2) chooseSpecialisation(state, id, s2, 2)
    }
  }
}

/** The cheapest affordable template we already own an ODD number of at BASE (un-promoted)
 *  rarity — hiring one completes a fusable pair the fuse pass can then promote. Null if none. */
function duplicateToSeedFusion(state: GameState, budgetLeft: number): string | null {
  const baseCount = new Map<string, number>()
  for (const id in state.employees) {
    const e = state.employees[id]
    const t = EMPLOYEE_TEMPLATES[e.templateId]
    if (!t || e.rarity !== t.rarity || !nextRarity(e.rarity)) continue // only un-promoted + promotable
    baseCount.set(e.templateId, (baseCount.get(e.templateId) ?? 0) + 1)
  }
  let best: string | null = null
  let bestCost = Infinity
  for (const [tid, count] of baseCount) {
    if (count % 2 === 0) continue // already paired — a hire wouldn't complete a pair this step
    const cost = hireCost(state, tid)
    if (cost <= budgetLeft && cost <= state.cash && cost < bestCost) {
      bestCost = cost
      best = tid
    }
  }
  return best
}

/**
 * Run one Chief-of-Staff cycle within `budget`: assign the bench (free), fuse duplicate
 * pairs (free), hire to fill empty slots (operators first) + buy duplicates to seed more
 * fusions, auto-pick specialisations (free), then level the roster cheapest-first — each
 * bounded by the budget + a per-cycle action cap.
 */
export function autoStaffOnce(
  state: GameState,
  budget: number,
  cfg: AutoStaffConfig,
): { spent: number; hires: number } {
  const startCash = state.cash
  let spentBudget = 0
  let hires = 0

  if (cfg.assign) autoAssignBest(state)
  if (cfg.fuse) autoFuse(state) // promote existing duplicate pairs first (free)

  if (cfg.hire && budget > 0) {
    for (let i = 0; i < MAX_HIRES_PER_CYCLE; i++) {
      const target = ownedBusinessWithFreeSlot(state)
      if (!target) break
      const tid = chooseHireTemplate(state, target, budget - spentBudget)
      if (!tid) break
      const cost = hireCost(state, tid)
      const id = hireEmployee(state, tid)
      if (!id) break
      spentBudget += cost
      hires++
      assignToFirstFreeSlot(state, id, target)
    }
    // "Replace with better": buy duplicates to complete fusable pairs, then fuse them →
    // the roster's rarity climbs over time, within the remaining budget.
    if (cfg.fuse) {
      for (let i = 0; i < MAX_FUSION_HIRES_PER_CYCLE; i++) {
        const tid = duplicateToSeedFusion(state, budget - spentBudget)
        if (!tid) break
        const cost = hireCost(state, tid)
        const id = hireEmployee(state, tid)
        if (!id) break
        spentBudget += cost
        hires++
      }
      autoFuse(state) // fuse the freshly-seeded duplicates → promote
    }
    if (cfg.assign) autoAssignBest(state) // place any that didn't land in the target
  }

  if (cfg.level && budget > 0) {
    for (let i = 0; i < MAX_LEVELS_PER_CYCLE; i++) {
      const empId = cheapestLevelUp(state, budget - spentBudget)
      if (!empId) break
      const cost = levelUpCost(state.employees[empId], levelCostMult(state))
      if (!levelUpEmployee(state, empId)) break
      spentBudget += cost
    }
  }

  if (cfg.spec) autoPickSpecs(state) // after fuse + level so newly-eligible staff get specs
  if (cfg.assign) autoAssignBest(state) // re-place after promotions / levels

  return { spent: startCash - state.cash, hires }
}

// ── Tick (called from applyTick) ─────────────────────────────────────────────

/**
 * Advance both managers' cooldowns and, when one fires (and is enabled + the
 * player owns a business), run its bounded cycle. The EA reinvests everything
 * above its cash reserve; the Chief spends up to its budget on staff. Order:
 * invest first, then staff (deterministic when both fire the same tick).
 */
export function tickAutomation(state: GameState, dtMs: number): void {
  const a = state.automation
  if (!a) return
  const eligible = automationEligible(state)

  const inv = a.invest
  if (inv.enabled && eligible) {
    autoWorkCareer(state) // clicks "Work Shift" every tick (shifts are short) — gated inside
    inv.cooldownMs -= dtMs
    if (inv.cooldownMs <= 0) {
      inv.cooldownMs = Math.max(1000, inv.intervalSec * 1000)
      const budget = state.cash * (1 - clampPct(inv.reservePct) / 100)
      const { units, spent } = reinvestWithin(state, budget, inv)
      inv.lifetimeSpent += spent
      inv.lifetimeUnits += units
    }
  }

  const st = a.staff
  if (st.enabled && eligible) {
    st.cooldownMs -= dtMs
    if (st.cooldownMs <= 0) {
      st.cooldownMs = Math.max(1000, st.intervalSec * 1000)
      const budget = state.cash * (clampPct(st.budgetPct) / 100)
      const { spent, hires } = autoStaffOnce(state, budget, st)
      st.lifetimeSpent += spent
      st.lifetimeHires += hires
    }
  }
}

// ── Config setters (used by the store actions; clamp everything) ──────────────

const INDUSTRY_LIKE = (v: unknown): IndustryId | null => (typeof v === 'string' ? (v as IndustryId) : null)

/** Merge a partial patch into the EA config, clamped to safe ranges. Resets the
 *  cooldown so a just-enabled EA acts promptly. */
export function updateInvestConfig(state: GameState, patch: Partial<AutoInvestConfig>): void {
  const inv = state.automation.invest
  if (patch.enabled !== undefined) {
    // The EA can only run once POACHED — defends every enable path (incl. the modal tabs).
    inv.enabled = !!patch.enabled && inv.unlocked
    if (inv.enabled) inv.cooldownMs = Math.min(inv.cooldownMs, 1000)
  }
  if (patch.reservePct !== undefined) inv.reservePct = clampPct(patch.reservePct)
  if (patch.strategy !== undefined) inv.strategy = patch.strategy
  if (patch.focusIndustry !== undefined) inv.focusIndustry = INDUSTRY_LIKE(patch.focusIndustry)
  if (patch.intervalSec !== undefined) inv.intervalSec = Math.max(3, Math.min(60, Math.round(patch.intervalSec)))
  if (patch.autoWork !== undefined) inv.autoWork = !!patch.autoWork
}

export function updateStaffConfig(state: GameState, patch: Partial<AutoStaffConfig>): void {
  const st = state.automation.staff
  if (patch.enabled !== undefined) {
    // The Chief can only run once HIRED — this defends every enable path (incl. the
    // modal's tab switcher) so the hire gate can't be bypassed.
    st.enabled = !!patch.enabled && st.unlocked
    if (st.enabled) st.cooldownMs = Math.min(st.cooldownMs, 1000)
  }
  if (patch.budgetPct !== undefined) st.budgetPct = clampPct(patch.budgetPct)
  if (patch.hire !== undefined) st.hire = !!patch.hire
  if (patch.level !== undefined) st.level = !!patch.level
  if (patch.assign !== undefined) st.assign = !!patch.assign
  if (patch.fuse !== undefined) st.fuse = !!patch.fuse
  if (patch.spec !== undefined) st.spec = !!patch.spec
  if (patch.intervalSec !== undefined) st.intervalSec = Math.max(3, Math.min(60, Math.round(patch.intervalSec)))
}
