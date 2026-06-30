// ============================================================
//  Discrete player actions. Each mutates canonical engine state then
//  publishes immediately so the UI updates without waiting for the next tick.
// ============================================================
import type { BusinessId, BuyMode, IndustryId, TabId } from '../types/domain'
import { getEngineState, resetEngineState } from '../engine/engineState'
import { purchase, tapBusiness } from '../engine/buy'
import { resolveQuantity } from '../engine/economy'
import { startShift, claimConsulting } from '../engine/career'
import {
  hireEmployee,
  assignEmployee,
  assignToFirstFreeSlot,
  unassignEmployee,
  levelUpEmployee,
  chooseSpecialisation as chooseSpecFn,
  fuseEmployees,
} from '../engine/employees/roster'
import { autoAssignBest } from '../engine/employees/autoAssign'
import { buyUpgrade as buyUpgradeFn } from '../engine/upgrades'
import { prestigeReset } from '../engine/prestige'
import { buyTalent as buyTalentFn } from '../engine/talents'
import { claimGoldenDeal } from '../engine/golden'
import { claimContract as claimContractFn } from '../engine/contracts'
import { PRESTIGE_MILESTONE_NAME } from '../content/prestigeMilestones'
import { CONTRACT_BY_ID } from '../content/contracts'
import { money } from '../engine/num'
import { describeMilestone, newlyReached } from '../engine/milestones'
import type { UpgradeId } from '../types/domain'
import { BUSINESSES } from '../content/businesses'
import { publishNow, resetPublishTracking } from '../loop/publisher'
import { clearSave } from '../save/saveManager'
import { useUiStore } from './uiStore'

export function buyBusiness(id: BusinessId): void {
  const s = getEngineState()
  const def = BUSINESSES[id]
  const bs = s.businesses[id]
  if (!def || !bs) return
  const qty = resolveQuantity(s.buyMode, def, bs.owned, s.cash)
  const before = [...s.milestonesReached]
  if (purchase(s, id, qty)) {
    const fresh = newlyReached(before, s.milestonesReached)
    if (fresh.length) {
      const msgs = fresh
        .map(describeMilestone)
        .filter((m): m is NonNullable<typeof m> => m != null)
        .map((m) => m.text)
      if (msgs.length) useUiStore.getState().pushCelebrations(msgs)
    }
    publishNow()
  }
}

export function tap(id: BusinessId): void {
  tapBusiness(getEngineState(), id)
  publishNow()
}

/** Start a work shift (early-game manual income). */
export function workShift(): void {
  startShift(getEngineState())
  publishNow()
}

/** Collect the accrued Board Advisor bonus (optional late-game top-up). */
export function consult(): void {
  const earned = claimConsulting(getEngineState())
  if (earned > 0) {
    useUiStore.getState().pushCelebrations([`💼 Advisory fee +${money(earned)}`])
    publishNow()
  }
}

// ----- Employees -----

export function hire(templateId: string): void {
  if (hireEmployee(getEngineState(), templateId)) publishNow()
}

export function assignToBusiness(empId: string, businessId: BusinessId): void {
  if (assignToFirstFreeSlot(getEngineState(), empId, businessId)) publishNow()
}

export function assignToSlot(empId: string, businessId: BusinessId, slot: number): void {
  if (assignEmployee(getEngineState(), empId, businessId, slot)) publishNow()
}

export function unassign(empId: string): void {
  unassignEmployee(getEngineState(), empId)
  publishNow()
}

export function levelUp(empId: string): void {
  if (levelUpEmployee(getEngineState(), empId)) publishNow()
}

/** Pick (or change) a level-5 employee's specialisation. */
export function chooseSpecialisation(empId: string, specId: string): void {
  if (chooseSpecFn(getEngineState(), empId, specId)) publishNow()
}

/** Fuse two matching employees → promote the kept one a rarity tier. */
export function fuse(keepId: string, consumeId: string): void {
  const promoted = fuseEmployees(getEngineState(), keepId, consumeId)
  if (promoted) {
    useUiStore.getState().pushCelebrations([`✨ Promoted to ${promoted}!`])
    publishNow()
  }
}

export function autoAssign(): void {
  if (autoAssignBest(getEngineState()) > 0) publishNow()
}

// ----- Upgrades & prestige -----

export function buyUpgrade(id: UpgradeId): void {
  if (buyUpgradeFn(getEngineState(), id)) publishNow()
}

export function prestige(): void {
  const s = getEngineState()
  const before = new Set(s.prestigeMilestonesClaimed)
  if (prestigeReset(s)) {
    // Celebrate any ascension-count milestones that just paid out.
    const fresh = s.prestigeMilestonesClaimed
      .filter((id) => !before.has(id))
      .map((id) => PRESTIGE_MILESTONE_NAME[id])
      .filter(Boolean)
      .map((name) => `${name} reached!`)
    if (fresh.length) useUiStore.getState().pushCelebrations(fresh)
    publishNow()
  }
}

/** Spend an Empire Token rank on a prestige talent. */
export function buyTalent(id: string): void {
  if (buyTalentFn(getEngineState(), id)) publishNow()
}

/** Claim a completed contract → bank its Empire Tokens + rotate in the next. */
export function claimContract(id: string): void {
  const name = CONTRACT_BY_ID[id]?.name ?? 'Contract'
  const tokens = claimContractFn(getEngineState(), id)
  if (tokens > 0) {
    useUiStore.getState().pushCelebrations([`📋 ${name} — +${tokens} ✦`])
    publishNow()
  }
}

/** Tap the active Golden Deal → Time Warp (instant idle income). */
export function claimGolden(): void {
  const earned = claimGoldenDeal(getEngineState())
  if (earned > 0) {
    useUiStore.getState().pushCelebrations([`⚡ Time Warp! +${money(earned)}`])
    publishNow()
  }
}

/** Wipe the save and start a brand-new game (destructive; hold-to-confirm in UI). */
export function hardReset(): void {
  clearSave()
  resetEngineState()
  resetPublishTracking()
  const ui = useUiStore.getState()
  ui.dismissWelcomeBack()
  // Drain any pending celebration toasts from the old game.
  while (useUiStore.getState().celebrations.length) useUiStore.getState().shiftCelebration()
  ui.closeAssignment()
  publishNow()
}

export function setBuyMode(mode: BuyMode): void {
  getEngineState().buyMode = mode
  publishNow()
}

export function setActiveTab(tab: TabId): void {
  getEngineState().activeTab = tab
  publishNow()
}

export function setActiveIndustry(id: IndustryId): void {
  getEngineState().activeIndustryTab = id
  publishNow()
}
