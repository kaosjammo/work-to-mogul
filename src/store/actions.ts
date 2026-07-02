// ============================================================
//  Discrete player actions. Each mutates canonical engine state then
//  publishes immediately so the UI updates without waiting for the next tick.
// ============================================================
import type { BusinessId, BuyMode, IndustryId, TabId } from '../types/domain'
import { getEngineState, resetEngineState } from '../engine/engineState'
import { purchase, tapBusiness } from '../engine/buy'
import { resolveBusiness } from '../engine/resolveBusiness'
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
import { buyUpgrade as buyUpgradeFn, buyRepeatable as buyRepeatableFn } from '../engine/upgrades'
import { prestigeReset } from '../engine/prestige'
import { buyTalent as buyTalentFn } from '../engine/talents'
import { chooseFounderPerk as chooseFounderPerkFn } from '../engine/founderPerks'
import { claimGoldenDeal } from '../engine/golden'
import { claimRushHour, RUSH_SPEED_MULT } from '../engine/rushHour'
import { claimDispatch } from '../engine/logistics'
import {
  startAngelDeal,
  declineAngelDeal,
  chooseAngelChoice,
  dismissAngelOutcome,
  hiredRoles,
} from '../engine/angelDeal'
import { resolveEventCard, declineEventCard } from '../engine/eventCards'
import { resolveMission, abortMission, snoozeSignal, type MissionMetrics, type MissionResult } from '../engine/spaceShooter'
import { buyMarriageLevel, isRomanceStory, PARTNER_NAME, ROMANCE_EPISODE_IDS } from '../engine/romance'
import { resolveFrenzyRun, abortFrenzy, snoozeFrenzy, type FrenzyMetrics, type FrenzyResult } from '../engine/foodFrenzy'
import { updateInvestConfig, updateStaffConfig, unlockChiefOfStaff } from '../engine/automation'
import { poachEa, EA_PARTNER_NAME } from '../engine/execAssistant'
import type { AutoInvestConfig, AutoStaffConfig } from '../types/domain'
import { momentumMult } from '../engine/momentum'
import { claimDaily } from '../engine/daily'
import { playSound } from '../lib/sound'
import { claimContract as claimContractFn } from '../engine/contracts'
import { PRESTIGE_MILESTONE_NAME } from '../content/prestigeMilestones'
import { CONTRACT_BY_ID } from '../content/contracts'
import { money } from '../engine/num'
import { haptic } from '../lib/haptics'
import { newlyReached, milestoneCelebrations } from '../engine/milestones'
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
  // Buy Max must count with the same discounted price purchase() charges. Only
  // the 'max' branch reads the multiplier — skip the full economy fold otherwise.
  const costMult = s.buyMode === 'max' ? resolveBusiness(s, def).buyCostMult : 1
  const qty = resolveQuantity(s.buyMode, def, bs.owned, s.cash, costMult)
  const before = [...s.milestonesReached]
  // Entering a new industry (its first owned unit) is a major beat — detect it
  // before the purchase so we can celebrate the expansion.
  const ind = INDUSTRIES[def.industryId]
  const enteringIndustry =
    !!ind && ind.businessIds.every((bid) => (s.businesses[bid]?.owned ?? 0) === 0)
  if (purchase(s, id, qty)) {
    haptic(8) // light tactile click on a successful buy
    playSound('buy')
    const msgs: string[] = []
    if (enteringIndustry && ind) {
      msgs.push(`🏭 Welcome to ${ind.name}!`)
      haptic(26)
      playSound('chime')
    }
    const fresh = newlyReached(before, s.milestonesReached)
    if (fresh.length) {
      haptic(26) // a milestone crossed — celebratory buzz
      playSound('chime')
      // Collapse a multi-threshold burst (a Max buy can cross many at once) into a
      // compact summary so the celebration queue doesn't clog.
      msgs.push(...milestoneCelebrations(fresh))
    }
    if (msgs.length) useUiStore.getState().pushCelebrations(msgs)
    publishNow()
  }
}

/** Tap a manual business. Returns whether a cycle actually started. */
export function tap(id: BusinessId): boolean {
  const started = tapBusiness(getEngineState(), id)
  if (started) publishNow()
  return started
}

/** Quick-spend: pour spare cash into the best-value business buys (optimised). */
export function spendCash(): void {
  const s = getEngineState()
  const before = [...s.milestonesReached]
  const { units, spent } = spendCashBestValue(s)
  if (units <= 0) return
  const msgs = milestoneCelebrations(newlyReached(before, s.milestonesReached))
  msgs.push(`💸 Spent ${money(spent)} · +${units} ${units === 1 ? 'unit' : 'units'}`)
  haptic(24)
  playSound('buy')
  useUiStore.getState().pushCelebrations(msgs)
  publishNow()
}

/** Quick-spend: buy every affordable upgrade in one tap. */
export function buyAllUpgrades(): void {
  const s = getEngineState()
  const { count, spent } = buyAllAffordableUpgrades(s)
  if (count <= 0) return
  playSound('buy')
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
    playSound('chime')
    useUiStore.getState().pushCelebrations([`✨ Promoted to ${promoted}!`])
    publishNow()
  }
}

export function autoAssign(): void {
  if (autoAssignBest(getEngineState()) > 0) publishNow()
}

// ----- Upgrades & prestige -----

export function buyUpgrade(id: UpgradeId): void {
  if (buyUpgradeFn(getEngineState(), id)) {
    playSound('buy')
    publishNow()
  }
}

/** Buy the next rank of a repeatable Executive Program. */
export function buyRepeatableProgram(id: string): void {
  if (buyRepeatableFn(getEngineState(), id)) {
    playSound('buy')
    publishNow()
  }
}

export function prestige(): void {
  const s = getEngineState()
  const before = new Set(s.prestigeMilestonesClaimed)
  const tokensBefore = s.prestige.totalPoints ?? 0
  if (prestigeReset(s)) {
    haptic(45) // ascension — a big, satisfying reset
    playSound('prestige')
    // Headline payoff: the tokens this ascension banked (base + any milestone bonus) —
    // shown as a full-screen celebration beat, the game's biggest moment.
    const gained = (s.prestige.totalPoints ?? 0) - tokensBefore
    useUiStore.getState().setAscension(gained)
    // Any ascension-count milestones that just paid out ride the toast queue.
    const msgs: string[] = []
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
    haptic(20)
    playSound('chime')
    useUiStore.getState().pushCelebrations([`📋 ${name} — +${tokens} ✦`])
    publishNow()
  }
}

/** Hot Streak suffix for a claim's celebration — the multiplier this claim actually
 *  received (read from the streak BEFORE the claim bumped it), matching the HUD chip. */
function comboTag(mult: number): string {
  return mult > 1 ? ` · 🔗 ${+mult.toFixed(2)}× combo` : ''
}

/** Tap the active Golden Deal → Time Warp (instant idle income).
 *  Returns the cash actually earned (0 if the offer had already expired). */
export function claimGolden(): number {
  const es = getEngineState()
  const mult = momentumMult(es) // the Hot Streak boost this claim gets, before it bumps
  const earned = claimGoldenDeal(es)
  if (earned > 0) {
    haptic(24)
    playSound('coin')
    useUiStore.getState().pushCelebrations([`⚡ Time Warp! +${money(earned)}${comboTag(mult)}`])
    publishNow()
  }
  return earned
}

/** Tap the active Food Rush Hour window → start a Food speed surge (×3 for 25s). */
export function claimRush(): void {
  const es = getEngineState()
  const mult = momentumMult(es)
  if (claimRushHour(es)) {
    haptic(20)
    playSound('tap')
    useUiStore.getState().pushCelebrations([`🍔 Rush Hour! Food ×${RUSH_SPEED_MULT} speed${comboTag(mult)}`])
    publishNow()
  }
}

/** Release Logistics' accrued cargo → a profit surge scaling with how full the load was. */
export function dispatchCargo(): void {
  const mult = claimDispatch(getEngineState())
  if (mult > 1) {
    haptic(20)
    playSound('tap')
    const pct = Math.round((mult - 1) * 100)
    useUiStore.getState().pushCelebrations([`🚚 Dispatch! Logistics +${pct}% profit`])
    publishNow()
  }
}

/** Resolve the active event card by picking option 'a' or 'b'. */
export function resolveCard(choice: 'a' | 'b'): void {
  const es = getEngineState()
  const mult = momentumMult(es)
  const opt = resolveEventCard(es, choice)
  if (opt) {
    haptic(18)
    playSound('tap')
    useUiStore.getState().pushCelebrations([`📋 ${opt.label}${comboTag(mult)}`])
    publishNow()
  }
}

/** Dismiss the active event card with no effect. */
export function dismissCard(): void {
  declineEventCard(getEngineState())
  publishNow()
}

/**
 * Resolve a finished Space Salvage Shooter mission: applies BOUNDED rewards,
 * advances the campaign on a pass (else re-arms the same stage), and surfaces a
 * reward toast. Returns the outcome so the mini-game can render the debrief screen.
 */
export function completeSpaceMission(stageIndex: number, metrics: MissionMetrics): MissionResult {
  const result = resolveMission(getEngineState(), stageIndex, metrics, Date.now())
  const passed = result.band !== 'failed'
  haptic(passed ? 40 : 12)
  playSound(passed ? 'chime' : 'tap')
  const msgs: string[] = []
  if (result.cashReward > 0) msgs.push(`🛰️ Salvage banked · +${money(result.cashReward)}`)
  if (result.buffMult > 1) {
    msgs.push(`🚀 Space profit +${Math.round((result.buffMult - 1) * 100)}% for ${Math.round(result.buffMs / 1000)}s`)
  }
  if (result.unlockedYard) msgs.push('🏗️ Orbital Salvage Yard unlocked!')
  if (result.unlockedAiPilot) msgs.push('🤖 AI Salvage Pilot online — salvage runs are now automatic')
  if (msgs.length) useUiStore.getState().pushCelebrations(msgs)
  publishNow()
  return result
}

/** Walk away from a salvage signal before launch — re-arms later, no progress, no penalty. */
export function abortSpaceMission(): void {
  abortMission(getEngineState(), Date.now())
  publishNow()
}

/** "Not now" on the floating salvage chip — snoozes the signal for a long while. */
export function snoozeSalvageSignal(): void {
  snoozeSignal(getEngineState(), Date.now())
  publishNow()
}

// ----- Lunch Rush (the Vampire-Survivors food-truck mini-game) -----

/** Hand a finished rush's metrics to the engine → bounded rewards + progress. */
export function completeFrenzyRun(tierIndex: number, metrics: FrenzyMetrics): FrenzyResult {
  const result = resolveFrenzyRun(getEngineState(), tierIndex, metrics, Date.now())
  const passed = result.band !== 'failed'
  haptic(passed ? 40 : 12)
  playSound(passed ? 'chime' : 'tap')
  const msgs: string[] = []
  if (result.cashReward > 0) msgs.push(`🌭 Till banked · +${money(result.cashReward)}`)
  if (result.buffMult > 1) {
    msgs.push(`🍔 Food profit +${Math.round((result.buffMult - 1) * 100)}% for ${Math.round(result.buffMs / 1000)}s`)
  }
  if (result.unlockedSpatula) msgs.push('🏆 GOLDEN SPATULA — Food cooks +10% hotter, forever!')
  if (msgs.length) useUiStore.getState().pushCelebrations(msgs)
  publishNow()
  return result
}

/** Walk away from a rush before starting (or bail mid-run) — re-arms later. */
export function abortFrenzyRun(): void {
  abortFrenzy(getEngineState(), Date.now())
  publishNow()
}

/** "Not now" on the floating rush chip — snoozes it for a long while. */
export function snoozeFrenzySignal(): void {
  snoozeFrenzy(getEngineState(), Date.now())
  publishNow()
}

// ----- Automation managers (Executive Assistant + Chief of Staff) -----

/** Update the Executive Assistant's auto-reinvest config (clamped in the engine). */
export function setAutoInvest(patch: Partial<AutoInvestConfig>): void {
  const s = getEngineState()
  updateInvestConfig(s, patch)
  if (patch.enabled === true) {
    haptic(18)
    playSound('chime')
  }
  publishNow()
}

/** Update the Chief of Staff's auto-roster config (clamped in the engine). */
export function setAutoStaff(patch: Partial<AutoStaffConfig>): void {
  const s = getEngineState()
  updateStaffConfig(s, patch)
  if (patch.enabled === true) {
    haptic(18)
    playSound('chime')
  }
  publishNow()
}

/** Hire the Chief of Staff (one-time unlock, from the Staff screen). */
export function hireChiefOfStaff(): void {
  if (unlockChiefOfStaff(getEngineState())) {
    haptic(26)
    playSound('chime')
    useUiStore.getState().pushCelebrations(['👔 Chief of Staff hired! Auto hire / level / assign is on.'])
    publishNow()
  }
}

/** Poach the courted Executive Assistant (from the main-screen widget) → they're yours. */
export function poachAssistant(): void {
  if (poachEa(getEngineState())) {
    haptic(28)
    playSound('chime')
    useUiStore.getState().pushCelebrations([`🤝 ${EA_PARTNER_NAME} is now YOUR Executive Assistant!`])
    publishNow()
  }
}

/** Claim today's daily bonus (~2h of idle income) + any streak milestone reward. */
export function claimDailyBonus(): void {
  const { cash, milestone } = claimDaily(getEngineState(), Date.now())
  if (cash > 0 || milestone) {
    haptic(milestone ? 40 : 24)
    playSound(milestone ? 'chime' : 'coin')
    const msgs = [`🎁 Daily Bonus! +${money(cash)}`]
    if (milestone) msgs.push(`🔥 Day ${milestone.day} streak · ${milestone.label}!`)
    useUiStore.getState().pushCelebrations(msgs)
    publishNow()
  }
}

// ----- Angel Investment mini-game (opportunity) -----

/** Accept the offered pitch → open the mini-game at its first stage. */
export function acceptAngelDeal(): void {
  if (startAngelDeal(getEngineState())) {
    haptic(18)
    playSound('chime')
    publishNow()
  }
}

/** Decline the offered pitch without starting it. */
export function declineAngel(): void {
  declineAngelDeal(getEngineState())
  publishNow()
}

/** Pick a choice in the current stage (advances, or resolves the deal). */
export function chooseAngel(choiceId: string): void {
  const s = getEngineState()
  if (chooseAngelChoice(s, choiceId, hiredRoles(s))) {
    const outcome = s.angelDeal.outcome
    haptic(outcome ? 30 : 12)
    if (outcome === 'great') playSound('prestige')
    else if (outcome) playSound('coin')
    else playSound('tap')
    publishNow()
  }
}

/** Close the outcome screen (starts the re-offer cooldown). */
export function closeAngelOutcome(): void {
  const s = getEngineState()
  const outcome = s.angelDeal.outcome
  const storyId = s.angelDeal.storyId
  const great = outcome === 'great'
  const progressed = outcome === 'great' || outcome === 'good'
  dismissAngelOutcome(s)
  if (isRomanceStory(storyId)) {
    const proposalId = ROMANCE_EPISODE_IDS[ROMANCE_EPISODE_IDS.length - 1]
    if (storyId === proposalId && progressed) {
      useUiStore
        .getState()
        .pushCelebrations([`💍 You married ${PARTNER_NAME}! The marriage panel is on the Stats tab.`])
    } else if (progressed) {
      useUiStore.getState().pushCelebrations([`💕 ${PARTNER_NAME} wants to see you again…`])
    }
  } else if (great && storyId === 'angel_fridgemind') {
    useUiStore.getState().pushCelebrations(['🚀 Startup Combinator founded — see the Business screen!'])
  }
  publishNow()
}

/** Level up the marriage (the money sink): a lump cost now, more upkeep forever. */
export function renewVows(): void {
  const s = getEngineState()
  const res = buyMarriageLevel(s)
  if (!res) return
  haptic(30)
  playSound('coin')
  useUiStore
    .getState()
    .pushCelebrations([
      `💍 Lv ${res.level}: ${res.title} — ${PARTNER_NAME} is delighted. (-${money(res.cost)})`,
    ])
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
