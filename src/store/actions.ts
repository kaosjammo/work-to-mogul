// ============================================================
//  Discrete player actions. Each mutates canonical engine state then
//  publishes immediately so the UI updates without waiting for the next tick.
// ============================================================
import type { BusinessId, BuyMode, IndustryId, TabId } from '../types/domain'
import { getEngineState, resetEngineState } from '../engine/engineState'
import { purchase, tapBusiness } from '../engine/buy'
import { spendCashBestValue, buyAllAffordableUpgrades } from '../engine/spend'
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
import { chooseFounderPerk as chooseFounderPerkFn } from '../engine/founderPerks'
import { claimGoldenDeal } from '../engine/golden'
import { claimRushHour, RUSH_SPEED_MULT } from '../engine/rushHour'
import { resolveEventCard, declineEventCard } from '../engine/eventCards'
import { claimContract as claimContractFn } from '../engine/contracts'
import { PRESTIGE_MILESTONE_NAME } from '../content/prestigeMilestones'
import { CONTRACT_BY_ID } from '../content/contracts'
import { money } from '../engine/num'
import { haptic } from '../lib/haptics'
import { describeMilestone, newlyReached } from '../engine/milestones'
import type { UpgradeId } from '../types/domain'
import { BUSINESSES } from '../content/businesses'
import { INDUSTRIES } from '../content/industries'
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
  // Entering a new industry (its first owned unit) is a major beat — detect it
  // before the purchase so we can celebrate the expansion.
  const ind = INDUSTRIES[def.industryId]
  const enteringIndustry =
    !!ind && ind.businessIds.every((bid) => (s.businesses[bid]?.owned ?? 0) === 0)
  if (purchase(s, id, qty)) {
    haptic(8) // light tactile click on a successful buy
    const msgs: string[] = []
    if (enteringIndustry && ind) {
      msgs.push(`🏭 Welcome to ${ind.name}!`)
      haptic(26)
    }
    const fresh = newlyReached(before, s.milestonesReached)
    if (fresh.length) {
      haptic(26) // a milestone crossed — celebratory buzz
      msgs.push(
        ...fresh
          .map(describeMilestone)
          .filter((m): m is NonNullable<typeof m> => m != null)
          .map((m) => m.text),
      )
    }
    if (msgs.length) useUiStore.getState().pushCelebrations(msgs)
    publishNow()
  }
}

export function tap(id: BusinessId): void {
  tapBusiness(getEngineState(), id)
  publishNow()
}

/** Quick-spend: pour spare cash into the best-value business buys (optimised). */
export function spendCash(): void {
  const s = getEngineState()
  const before = [...s.milestonesReached]
  const { units, spent } = spendCashBestValue(s)
  if (units <= 0) return
  const msgs = newlyReached(before, s.milestonesReached)
    .map(describeMilestone)
    .filter((m): m is NonNullable<typeof m> => m != null)
    .map((m) => m.text)
  msgs.push(`💸 Spent ${money(spent)} · +${units} ${units === 1 ? 'unit' : 'units'}`)
  haptic(24)
  useUiStore.getState().pushCelebrations(msgs)
  publishNow()
}

/** Quick-spend: buy every affordable upgrade in one tap. */
export function buyAllUpgrades(): void {
  const s = getEngineState()
  const { count, spent } = buyAllAffordableUpgrades(s)
  if (count <= 0) return
  useUiStore
    .getState()
    .pushCelebrations([`⚡ ${count} upgrade${count === 1 ? '' : 's'} · ${money(spent)}`])
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

/** Pick (or change) an employee's specialisation — slot 1 (L5) or the Mastery slot 2 (cap). */
export function chooseSpecialisation(empId: string, specId: string, slot: 1 | 2 = 1): void {
  if (chooseSpecFn(getEngineState(), empId, specId, slot)) publishNow()
}

/** Fuse two matching employees → promote the kept one a rarity tier. */
export function fuse(keepId: string, consumeId: string): void {
  const promoted = fuseEmployees(getEngineState(), keepId, consumeId)
  if (promoted) {
    haptic(22)
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
  const tokensBefore = s.prestige.totalPoints ?? 0
  if (prestigeReset(s)) {
    haptic(45) // ascension — a big, satisfying reset
    const msgs: string[] = []
    // Headline payoff: the tokens this ascension banked (base + any milestone bonus).
    const gained = (s.prestige.totalPoints ?? 0) - tokensBefore
    if (gained > 0) msgs.push(`✦ Empire ascended! +${gained} Empire Token${gained === 1 ? '' : 's'}`)
    // Plus any ascension-count milestones that just paid out.
    for (const id of s.prestigeMilestonesClaimed) {
      if (before.has(id)) continue
      const name = PRESTIGE_MILESTONE_NAME[id]
      if (name) msgs.push(`${name} reached!`)
    }
    if (msgs.length) useUiStore.getState().pushCelebrations(msgs)
    publishNow()
  }
}

/** Spend an Empire Token rank on a prestige talent. */
export function buyTalent(id: string): void {
  if (buyTalentFn(getEngineState(), id)) publishNow()
}

/** Choose (or clear) the run's Founder Perk — flavours the whole current run. */
export function chooseFounderPerk(id: string | null): void {
  if (chooseFounderPerkFn(getEngineState(), id)) publishNow()
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
    haptic(24)
    useUiStore.getState().pushCelebrations([`⚡ Time Warp! +${money(earned)}`])
    publishNow()
  }
}

/** Tap the active Food Rush Hour window → start a Food speed surge (×3 for 25s). */
export function claimRush(): void {
  if (claimRushHour(getEngineState())) {
    haptic(20)
    useUiStore.getState().pushCelebrations([`🍔 Rush Hour! Food ×${RUSH_SPEED_MULT} speed`])
    publishNow()
  }
}

/** Resolve the active event card by picking option 'a' or 'b'. */
export function resolveCard(choice: 'a' | 'b'): void {
  const opt = resolveEventCard(getEngineState(), choice)
  if (opt) {
    haptic(18)
    useUiStore.getState().pushCelebrations([`📋 ${opt.label}`])
    publishNow()
  }
}

/** Dismiss the active event card with no effect. */
export function dismissCard(): void {
  declineEventCard(getEngineState())
  publishNow()
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
  const s = getEngineState()
  s.activeTab = tab
  if (!s.visitedTabs?.includes(tab)) s.visitedTabs = [...(s.visitedTabs ?? []), tab] // clears its "new" pulse
  publishNow()
}

export function setActiveIndustry(id: IndustryId): void {
  getEngineState().activeIndustryTab = id
  publishNow()
}
