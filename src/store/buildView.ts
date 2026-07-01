// ============================================================
//  buildView — derive the UI-facing snapshot from canonical GameState.
//  Pure: takes state as an argument. Called by the publisher (throttled)
//  and immediately after discrete actions.
// ============================================================
import type {
  BusinessId,
  BuyMode,
  GameState,
  IndustryId,
  PrestigeState,
  Rarity,
  RoleId,
  TabId,
  UpgradeId,
} from '../types/domain'
import { INDUSTRIES, INDUSTRY_ORDER } from '../content/industries'
import { BUSINESSES } from '../content/businesses'
import { UPGRADES, UPGRADE_ORDER } from '../content/upgrades'
import { careerLevelDef, MAX_CAREER_LEVEL } from '../content/career'
import { ROLE_DEFS, RARITY_MULT, MAX_EMPLOYEE_LEVEL } from '../content/roles'
import { SYNERGY_LABEL } from '../content/synergies'
import { ACHIEVEMENTS } from '../content/achievements'
import { achievementProgress } from '../engine/achievements'
import { FOUNDER_PERKS, FOUNDER_PERK_ORDER, type FounderPerkDef } from '../content/founderPerks'
import { PRESTIGE_MILESTONES } from '../content/prestigeMilestones'
import { ART_UPGRADES, ART_MILESTONE } from '../content/artManifest'
import { EMPLOYEE_TEMPLATES, HIRE_ORDER } from '../content/employeeTemplates'
import { TRAIT_NAME, TRAIT_DEFS } from '../content/traits'
import { TALENTS, TALENT_ORDER, type TalentTheme } from '../content/talents'
import { SPECIALISATIONS, SPECS_BY_ROLE, REQUIRED_SPEC_LEVEL, MASTERY_SPEC_LEVEL } from '../content/specialisations'
import { resolveBusiness } from '../engine/resolveBusiness'
import { automatedIncomePerSec } from '../engine/catchUp'
import {
  shiftPayout,
  consultingPayout,
  isRetired,
  GOLDEN_SHIFT_EVERY,
  CONSULT_CAP_MS,
} from '../engine/career'
import { computeEmployeeEffects } from '../engine/employees/composition'
import { levelUpCost, hireCost, nextRarity } from '../engine/employees/roster'
import {
  availableTokens,
  levelCostMult,
  talentRank,
  talentLabel,
  talentCostAt,
  talentProfitBonusPct,
} from '../engine/talents'
import { prestigePending, nextTokenLifetime, nextTokenProgress } from '../engine/prestige'
import { goldenOfferValue, GOLDEN_WARP_SECONDS, GOLDEN_MEGA_MULT } from '../engine/golden'
import { RUSH_SPEED_MULT } from '../engine/rushHour'
import {
  LOGISTICS_INDUSTRY_ID,
  ownsLogistics,
  logisticsLoadFraction,
  logisticsDispatchActive,
  canDispatch,
  dispatchMultAt,
} from '../engine/logistics'
import { EVENT_CARD_BY_ID } from '../content/eventCards'
import { ANGEL_DEAL } from '../content/angelDeal'
import { getMogulStory } from '../content/mogulStories'
import { COMBINATOR_ID } from '../content/businesses'
import { EXIT_INTERVAL_MS } from '../engine/angelDeal'
import type { AngelScores, AngelOutcomeBand } from '../types/domain'
import { canClaimDaily, dailyReward } from '../engine/daily'
import { nextMilestone as nextDailyMilestone, prevMilestoneDay } from '../content/dailyMilestones'
import {
  financeCompoundMult,
  FINANCE_INDUSTRY_ID,
  quantumCollapsing,
  quantumSuperpositionMult,
  QUANTUM_INDUSTRY_ID,
  ownsSpace,
} from '../engine/economy'
import { SPACE_SHOOTER_STAGE_BY_INDEX, SPACE_SHOOTER_TOTAL_STAGES } from '../content/spaceShooter'
import {
  spaceShooterOfferAvailable,
  nextStageIndex,
  campaignComplete,
} from '../engine/spaceShooter'
import { CONTRACT_BY_ID } from '../content/contracts'
import { contractProgress, isContractComplete } from '../engine/contracts'
import type { EffectChannel, EmployeeInstance } from '../types/domain'
import {
  nextMilestone,
  resolveQuantity,
  totalCost,
  PRESTIGE_UNLOCK_LIFETIME,
} from '../engine/economy'

export interface BusinessView {
  id: BusinessId
  name: string
  icon: string
  industryId: IndustryId
  owned: number
  unlocked: boolean
  isAutomated: boolean
  unlockedSlots: number
  assignedCount: number
  pps: number
  progressFraction: number
  cycleMs: number
  buyQty: number
  buyCost: number
  affordable: boolean
  // Estimated seconds until the next purchase is affordable on current idle income
  // (null when already affordable or when there's no idle income to estimate from).
  affordEtaSec: number | null
  isBestBuy: boolean // highest reinvestment ROI right now (among owned, affordable)
  nextMilestoneThreshold: number | null
  nextMilestoneLabel: string | null
  // Staff summary (M4a + M4b crit)
  automated: boolean
  staffProfitPct: number
  staffSpeedPct: number
  staffCostPct: number
  staffCritChance: number // 0..100 (%)
  staffCritMult: number
  staffMoralePct: number // revenue % from morale above the neutral baseline
  staffFocusPct: number // profit % from industry-themed staffing (0..15)
  synergies: string[] // active synergy labels
  riskEnabled: boolean
  riskPct: number // 0..100 risk build-up
  riskEventActive: boolean // a dampening event is currently running
  slots: (string | null)[] // employee ids per unlocked slot
}

export interface EmployeeView {
  id: string
  templateId: string
  name: string
  role: RoleId
  roleName: string
  roleIcon: string
  roleColor: string
  roleBlurb: string
  rarity: Rarity
  level: number
  affinity: IndustryId | null
  affinityName: string | null
  assignedToBusinessId: BusinessId | null
  assignedToName: string | null
  effectLabel: string
  nextEffectLabel: string // effect at level+1 ('' if maxed) — previews the level-up gain
  traitNames: string[]
  levelUpCost: number
  atMaxLevel: boolean
  levelUpAffordable: boolean
  // L5 specialisation
  canSpecialise: boolean // level >= REQUIRED_SPEC_LEVEL
  specialisationId: string | null
  specialisationName: string | null
  specOptions: SpecOptionView[] // role's base picks (empty until canSpecialise)
  // Mastery (second) specialisation slot — unlocks at the level cap
  canMastery: boolean // level >= MASTERY_SPEC_LEVEL
  specialisation2Id: string | null
  specialisation2Name: string | null
  specOptions2: SpecOptionView[] // role's picks minus the slot-1 choice (empty until canMastery)
  // Fusion / promotion (Tier 5)
  canFuse: boolean // a matching duplicate exists and rarity < epic
  fuseWithId: string | null // the partner to consume
  fuseToRarity: Rarity | null // resulting rarity, for the label
}

export interface SpecOptionView {
  id: string
  name: string
  icon: string
  blurb: string
  chosen: boolean
}

export interface HireOptionView {
  templateId: string
  name: string
  role: RoleId
  roleName: string
  roleIcon: string
  roleColor: string
  rarity: Rarity
  affinity: IndustryId | null
  affinityName: string | null
  traitNames: string[]
  cost: number
  affordable: boolean
}

export interface IndustryView {
  id: IndustryId
  name: string
  theme: string
  // All industries are visible from the start; "entry" = cost of the first business.
  entryCost: number
  firstBusinessName: string
  entryAffordable: boolean
  // Seconds until the entry cost is affordable on current idle income (null when
  // already affordable or there's no idle income to estimate from).
  entryEtaSec: number | null
  ownsAny: boolean
  totalOwned: number
}

export interface CareerView {
  level: number
  title: string
  wage: number
  shiftMs: number
  working: boolean
  shiftProgressFraction: number
  shiftsThisLevel: number
  shiftsToPromote: number | null
  promotionFraction: number
  isMaxLevel: boolean
  nextTitle: string | null
  nextWage: number | null
  // Salary Draw: what a completed shift actually pays right now, how many times
  // the flat base wage that is (the empire-income boost), and whether the next
  // one is a Golden Shift (periodic multiplier).
  salaryDrawValue: number
  salaryDrawMult: number // salaryDrawValue / base wage; 1 when the flat wage still wins
  nextShiftIsGolden: boolean
  // Senior Consultant (retired) stage: optional over-time bonus.
  retired: boolean
  consultingValue: number // cash a Collect tap grants right now
  consultingFraction: number // 0..1 pool fill toward the cap
  consultingFull: boolean
}

export interface UpgradeView {
  id: UpgradeId
  name: string
  cost: number
  purchased: boolean
  affordable: boolean
  scopeLabel: string
  effectLabel: string // what it does, e.g. "×2 profit" / "+25% speed" / "−10% cost"
  iconSrc: string
}

export interface TalentView {
  id: string
  name: string
  blurb: string
  theme: TalentTheme
  icon: string
  rank: number
  maxRank: number
  maxed: boolean
  nextCost: number | null
  affordable: boolean
  currentLabel: string // cumulative effect at the current rank ('—' at rank 0)
  nextLabel: string | null // effect after buying the next rank (null if maxed)
}

export interface FounderPerkView {
  id: string
  name: string
  icon: string
  blurb: string
  chosen: boolean
  effectLabel: string // e.g. "+50% profit · −22% speed"
}

export interface RevealedTabs {
  employees: boolean
  upgrades: boolean
  prestige: boolean
  stats: boolean
}

export interface GoldenView {
  offerActive: boolean
  offerSecondsLeft: number
  warpValue: number // cash a tap grants right now (MEGA-adjusted)
  warpMinutes: number // for the label ("15 min of income")
  mega: boolean // the current offer is a MEGA jackpot
  frenzyActive: boolean // a claimed deal's temporary Profit Rush is running
  frenzySecondsLeft: number
}

export interface RushHourView {
  offerActive: boolean // a Rush Hour window is open to tap
  offerSecondsLeft: number
  surgeActive: boolean // a claimed surge is boosting Food
  surgeSecondsLeft: number
  speedMult: number // the Food speed multiplier during a surge (for the label)
}

export interface CombinatorView {
  unlocked: boolean // player owns the Startup Combinator (great-outcome reward)
  business: BusinessView | null // its business row (owned / pps / buy) — null until unlocked
  nextExitSec: number // countdown to the next "exit" payout
  exitProgress: number // 0..1 toward the next exit
  exitCount: number // exits fired (drives the celebration)
  lastExitAmount: number // most recent exit payout
}

export interface AngelDealView {
  storyId: string // which Mogul Story is active (the modal renders this story's def)
  offered: boolean // a pitch is waiting (floating prompt)
  active: boolean // the mini-game modal is open
  stageId: string | null
  stageIndex: number // 1-based (0 when not in a stage)
  stageTotal: number
  outcome: AngelOutcomeBand | null
  payout: number
  disciplined: boolean
  combinatorUnlocked: boolean
  hints: string[] // qualitative read on the hidden scores (never raw numbers)
}

/** Qualitative "read" on the hidden deal scores — flavour, never numbers. */
function angelHints(s: AngelScores): string[] {
  const out: string[] = []
  if (s.risk >= 6) out.push('⚠️ Something here doesn’t add up.')
  else if (s.risk >= 3) out.push('A few loose threads nag at you.')
  else if (s.dueDiligence >= 4) out.push('The numbers hold up so far.')
  if (s.leverage >= 3) out.push('You’re holding the cards.')
  else if (s.leverage <= -2) out.push('He’s setting the pace, not you.')
  else if (s.founderTrust >= 4) out.push('You genuinely like this founder.')
  return out.slice(0, 2)
}

export interface LogisticsView {
  industryId: string
  owned: boolean // owns any Logistics (only show the cue when relevant)
  loadFraction: number // 0..1 cargo load accrued
  canDispatch: boolean // load is full enough + no surge running → the button is live
  readyPct: number // the profit % a dispatch would grant right now (for the button label)
  surgeActive: boolean // a released dispatch surge is boosting Logistics profit
  surgeSecondsLeft: number
  surgePct: number // the active surge's profit % (for the running countdown label)
}

export interface EventCardView {
  id: string
  icon: string
  title: string
  prompt: string
  kind: 'opportunity' | 'crisis' | 'gamble'
  secondsLeft: number
  a: { label: string; blurb: string }
  b: { label: string; blurb: string }
}

export interface ContractView {
  id: string
  name: string
  description: string
  icon: string
  progress: number
  target: number
  fraction: number // 0..1
  rewardTokens: number
  complete: boolean
}

export interface SpaceShooterView {
  offerAvailable: boolean // a salvage signal is on offer now (the floating chip shows)
  stageIndex: number // next incomplete stage (0..4), or -1 when the campaign is done
  stageNumber: number // 1..5 for display
  stageTitle: string
  stageCodename: string
  stagesCompleted: number
  totalStages: number
  campaignComplete: boolean
  aiPilotUnlocked: boolean
  orbitalYardUnlocked: boolean
  buffActive: boolean // a Space profit buff from a run reward is running
  buffSecondsLeft: number
  buffPct: number // e.g. 50 for a ×1.5 buff
  bestScore: number // best score for the current next stage
  ownsSpace: boolean
}

/** Reveal thresholds for the onboarding staged reveal (lifetime earnings). */
export const REVEAL_UPGRADES_LIFETIME = 10_000

export interface ViewSnapshot {
  cash: number
  lifetimeEarnings: number
  totalPps: number
  career: CareerView
  revealedTabs: RevealedTabs
  newTabs: RevealedTabs
  golden: GoldenView
  rushHour: RushHourView
  logistics: LogisticsView
  angelDeal: AngelDealView
  combinator: CombinatorView
  financeCompound: { industryId: string; pct: number }
  quantumSuperposition: { industryId: string; collapsing: boolean; mult: number }
  eventCard: EventCardView | null
  spaceShooter: SpaceShooterView
  daily: {
    available: boolean
    reward: number
    streak: number
    nextMilestone: { day: number; label: string } | null
    milestoneProgress: number
  }
  contracts: ContractView[]
  contractsClaimable: number
  buyMode: BuyMode
  activeTab: TabId
  activeIndustryTab: IndustryId
  prestige: PrestigeState
  prestigePending: number
  prestigeUnlocked: boolean
  prestigeNextTokenAt: number // lifetime earnings at which pending tokens next increase
  prestigeNextTokenProgress: number // 0..1 through the current sqrt band
  prestigeProfitBonusPct: number // permanent profit bonus from talents (whole %)
  talents: TalentView[]
  founderPerks: FounderPerkView[]
  talentTokensAvailable: number
  talentTokensSpent: number
  onboardingStep: number
  businesses: Record<BusinessId, BusinessView>
  industries: IndustryView[]
  employees: EmployeeView[]
  hireOptions: HireOptionView[]
  upgrades: UpgradeView[]
  achievements: AchievementView[]
  achievementsUnlockedCount: number
  prestigeMilestones: PrestigeMilestoneView[]
  navBadges: Partial<Record<TabId, number>> // actionable-reward counts per tab
  stats: GameStats
  // Benched employee id → $/s the open assignment sheet's business would gain by
  // assigning them (empty unless a sheet is open). Powers the "Assign → +$X/s" cue.
  assignPreviews: Record<string, number>
}

export interface GameStats {
  totalOwned: number
  automatedCount: number
  businessesUnlocked: number
  industriesEntered: number
  industriesTotal: number
  employees: number
  careerLevel: number
}

export interface AchievementView {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  reward: number // Empire Tokens granted on unlock
  progress: number | null // 0..1 toward a countable goal (null = event/one-shot)
}

export interface PrestigeMilestoneView {
  id: string
  name: string
  description: string
  icon: string
  rewardTokens: number
  resets: number
  reached: boolean
  progress: number // 0..1 toward the reset threshold
}

function industryName(id: IndustryId | null): string | null {
  return id ? (INDUSTRIES[id]?.name ?? null) : null
}

/** Current primary-effect description for an employee (generic, no affinity). */
function employeeEffectLabel(e: EmployeeInstance): string {
  const role = ROLE_DEFS[e.role]
  const ch: EffectChannel | undefined = role?.primaryChannels[0]
  // Reflect the employee's BUILD on its primary channel — traits + both specs on
  // top of the role base — so a Rainmaker/Kingpin closer visibly out-earns a bare
  // one on the roster card (affinity/Empire-Training are per-assignment, omitted here).
  let base = (ch && role?.baseMagnitude[ch]) || 0
  if (ch) {
    for (const t of e.traits) base += TRAIT_DEFS[t]?.channelDeltas[ch] ?? 0
    if (e.specialisation) base += SPECIALISATIONS[e.specialisation]?.channelDeltas[ch] ?? 0
    if (e.specialisation2) base += SPECIALISATIONS[e.specialisation2]?.channelDeltas[ch] ?? 0
  }
  const mag = base * RARITY_MULT[e.rarity] * (1 + 0.15 * (e.level - 1))
  const pct = Math.round(mag * 100)
  switch (ch) {
    case 'automation':
      return 'Automates business'
    case 'cycleSpeed':
      return `+${pct}% speed`
    case 'profitMult':
      return `+${pct}% profit`
    case 'costReduction':
      return `−${pct}% buy cost`
    case 'critChance':
      return `+${pct}% crit chance`
    case 'morale':
      return 'Lifts team morale'
    case 'riskReduction':
      return 'Slows risk build-up'
    default:
      return role?.blurb ?? ''
  }
}

function milestoneLabel(effect: { kind: string; factor: number }): string {
  if (effect.kind === 'profitMult') return `×${effect.factor} profit`
  if (effect.kind === 'speedMult') return `×${effect.factor} speed`
  return `−cost`
}

// "+50% profit · −22% speed · ×2 golden" — the perk's trade-off at a glance.
function founderPerkEffectLabel(p: FounderPerkDef): string {
  const parts: string[] = []
  const pct = (m: number) => `${m >= 1 ? '+' : '−'}${Math.round(Math.abs(m - 1) * 100)}%`
  if (p.profitMult != null && p.profitMult !== 1) parts.push(`${pct(p.profitMult)} profit`)
  if (p.speedMult != null && p.speedMult !== 1) parts.push(`${pct(p.speedMult)} speed`)
  if (p.goldenMult != null && p.goldenMult !== 1) parts.push(`×${p.goldenMult} golden`)
  if (p.offlineMult != null && p.offlineMult !== 1) parts.push(`×${p.offlineMult} offline`)
  return parts.join(' · ')
}

function scopeLabel(id: UpgradeId): string {
  const up = UPGRADES[id]
  if (up.scope.kind === 'global') return 'All businesses'
  if (up.scope.kind === 'industry') return INDUSTRIES[up.scope.industryId]?.name ?? 'Industry'
  return BUSINESSES[up.scope.businessId]?.name ?? 'Business'
}

// Plain-language "what it does" — a multiplier (×2) for doublings, a percentage
// (+25%) for smaller boosts, so the buy decision isn't a guess from the name.
function upgradeEffectLabel(id: UpgradeId): string {
  const e = UPGRADES[id].effect
  const grow = (f: number) => (f >= 2 ? `×${+f.toFixed(2)}` : `+${Math.round((f - 1) * 100)}%`)
  if (e.kind === 'profitMult') return `${grow(e.factor)} profit`
  if (e.kind === 'speedMult') return `${grow(e.factor)} speed`
  return `−${Math.round((1 - e.factor) * 100)}% cost`
}

export function buildView(
  state: GameState,
  openAssignmentBusinessId: BusinessId | null = null,
): ViewSnapshot {
  const businesses: Record<BusinessId, BusinessView> = {}
  let totalPps = 0
  let totalOwned = 0
  let automatedCount = 0
  let businessesUnlocked = 0
  // Best reinvestment ROI: among owned, unlocked, affordable-next businesses,
  // the one whose next unit adds the most $/s per dollar spent.
  let bestBuyId: BusinessId | null = null
  let bestBuyRatio = 0

  // Map each assigned employee → the business it's working at.
  const assignmentOf: Record<string, BusinessId> = {}
  for (const bid in state.businesses) {
    for (const eid of state.businesses[bid].assigned) {
      if (eid) assignmentOf[eid] = bid
    }
  }

  for (const id in state.businesses) {
    const bs = state.businesses[id]
    const def = BUSINESSES[id]
    const r = resolveBusiness(state, def)
    const emp = computeEmployeeEffects(state, def, bs)
    const qty = resolveQuantity(state.buyMode, def, bs.owned, state.cash, r.buyCostMult)
    const cost = totalCost(def, bs.owned, Math.max(qty, 1)) * r.buyCostMult
    const nm = nextMilestone(def, bs.owned)

    if (r.isAutomated && bs.unlocked) totalPps += r.pps
    totalOwned += bs.owned
    if (bs.unlocked) businessesUnlocked++
    if (r.isAutomated && bs.unlocked && bs.owned > 0) automatedCount++
    // ROI of the next single unit (only meaningful for owned, affordable ones).
    if (bs.unlocked && bs.owned > 0) {
      const nextUnitCost = totalCost(def, bs.owned, 1) * r.buyCostMult
      if (nextUnitCost > 0 && state.cash >= nextUnitCost) {
        const ratio = r.pps / bs.owned / nextUnitCost
        if (ratio > bestBuyRatio) {
          bestBuyRatio = ratio
          bestBuyId = id
        }
      }
    }

    businesses[id] = {
      id,
      name: def.name,
      icon: def.icon,
      industryId: def.industryId,
      owned: bs.owned,
      unlocked: bs.unlocked,
      isAutomated: r.isAutomated,
      unlockedSlots: r.unlockedSlots,
      assignedCount: bs.assigned.filter(Boolean).length,
      pps: r.pps,
      progressFraction: r.cycleMs > 0 ? Math.min(1, bs.cycleProgressMs / r.cycleMs) : 0,
      cycleMs: r.cycleMs,
      buyQty: qty,
      buyCost: cost,
      affordable: qty > 0 && state.cash >= cost,
      affordEtaSec: null,
      isBestBuy: false,
      nextMilestoneThreshold: nm?.threshold ?? null,
      nextMilestoneLabel: nm ? milestoneLabel(nm.effect) : null,
      automated: emp.isAutomated,
      staffProfitPct: Math.round(emp.profitAdd * 100),
      staffSpeedPct: Math.round(emp.speedAdd * 100),
      staffCostPct: Math.round((1 - emp.buyCostMult) * 100),
      staffCritChance: Math.round(emp.critChance * 100),
      staffCritMult: emp.critMult,
      staffMoralePct: Math.round((emp.moraleScalar - 1) * 100),
      staffFocusPct: Math.round((emp.focusBonus - 1) * 100),
      synergies: r.activeSynergies.map((id) => SYNERGY_LABEL[id] ?? id),
      riskEnabled: def.riskEnabled === true,
      riskPct: Math.round(bs.risk),
      riskEventActive: bs.riskEventMsLeft > 0,
      slots: bs.assigned.slice(0, r.unlockedSlots),
    }
  }

  // Fusion partners: group by archetype+rarity so each employee can find a
  // matching duplicate to fuse with (promotes a rarity tier).
  const fuseGroups: Record<string, string[]> = {}
  for (const e of Object.values(state.employees)) {
    const key = `${e.templateId}|${e.rarity}`
    ;(fuseGroups[key] ??= []).push(e.id)
  }

  const lvlMult = levelCostMult(state) // Mentorship talent
  const employees: EmployeeView[] = Object.values(state.employees).map((e) => {
    const role = ROLE_DEFS[e.role]
    const bizId = assignmentOf[e.id] ?? null
    const canSpecialise = e.level >= REQUIRED_SPEC_LEVEL
    const canMastery = e.level >= MASTERY_SPEC_LEVEL
    const fuseTo = nextRarity(e.rarity)
    const partnerId = fuseTo
      ? (fuseGroups[`${e.templateId}|${e.rarity}`] ?? []).find((id) => id !== e.id) ?? null
      : null
    const roleSpecs = SPECS_BY_ROLE[e.role] ?? []
    // Slot 1 (L5): the two base specs only — the Mastery capstone is L10-exclusive.
    const specOptions: SpecOptionView[] = canSpecialise
      ? roleSpecs
          .filter((sp) => !sp.mastery)
          .map((sp) => ({ id: sp.id, name: sp.name, icon: sp.icon, blurb: sp.blurb, chosen: e.specialisation === sp.id }))
      : []
    // Slot 2 (cap): any of the role's specs except the slot-1 pick (so the leftover
    // base spec or the Mastery capstone) — the real "which two of three" decision.
    const specOptions2: SpecOptionView[] = canMastery
      ? roleSpecs
          .filter((sp) => sp.id !== e.specialisation)
          .map((sp) => ({ id: sp.id, name: sp.name, icon: sp.icon, blurb: sp.blurb, chosen: e.specialisation2 === sp.id }))
      : []
    const specDef = e.specialisation ? SPECIALISATIONS[e.specialisation] : null
    const spec2Def = e.specialisation2 ? SPECIALISATIONS[e.specialisation2] : null
    return {
      id: e.id,
      templateId: e.templateId,
      name: e.name,
      role: e.role,
      roleName: role?.name ?? e.role,
      roleIcon: role?.icon ?? '',
      roleColor: role?.color ?? 'var(--text)',
      roleBlurb: role?.blurb ?? '',
      rarity: e.rarity,
      level: e.level,
      affinity: e.affinity,
      affinityName: industryName(e.affinity),
      assignedToBusinessId: bizId,
      assignedToName: bizId ? (BUSINESSES[bizId]?.name ?? null) : null,
      effectLabel: employeeEffectLabel(e),
      nextEffectLabel: e.level >= MAX_EMPLOYEE_LEVEL ? '' : employeeEffectLabel({ ...e, level: e.level + 1 }),
      traitNames: e.traits.map((t) => TRAIT_NAME[t] ?? t),
      levelUpCost: levelUpCost(e, lvlMult),
      atMaxLevel: e.level >= MAX_EMPLOYEE_LEVEL,
      levelUpAffordable: e.level < MAX_EMPLOYEE_LEVEL && state.cash >= levelUpCost(e, lvlMult),
      canSpecialise,
      specialisationId: e.specialisation,
      specialisationName: specDef?.name ?? null,
      specOptions,
      canMastery,
      specialisation2Id: e.specialisation2 ?? null,
      specialisation2Name: spec2Def?.name ?? null,
      specOptions2,
      canFuse: partnerId != null,
      fuseWithId: partnerId,
      fuseToRarity: partnerId ? fuseTo : null,
    }
  })

  const hireOptions: HireOptionView[] = HIRE_ORDER.map((tid) => {
    const t = EMPLOYEE_TEMPLATES[tid]
    const role = ROLE_DEFS[t.role]
    const cost = hireCost(state, tid) // includes the Headhunter talent discount
    return {
      templateId: tid,
      name: t.name,
      role: t.role,
      roleName: role?.name ?? t.role,
      roleIcon: role?.icon ?? '',
      roleColor: role?.color ?? 'var(--text)',
      rarity: t.rarity,
      affinity: t.affinity,
      affinityName: industryName(t.affinity),
      traitNames: t.traits.map((tr) => TRAIT_NAME[tr] ?? tr),
      cost,
      affordable: state.cash >= cost,
    }
  })

  if (bestBuyId) businesses[bestBuyId].isBestBuy = true

  // "Time to afford" estimate: now that total idle income is known, give each
  // unaffordable unlocked business a countdown so a disabled Buy button reads as
  // progress, not a dead end. Assumes all idle income is saved toward it (the
  // standard idle-game convention) — only shown when there's income to estimate from.
  if (totalPps > 0) {
    for (const id in businesses) {
      const bv = businesses[id]
      if (bv.unlocked && !bv.affordable && bv.buyCost > state.cash) {
        bv.affordEtaSec = (bv.buyCost - state.cash) / totalPps
      }
    }
  }

  const industries: IndustryView[] = INDUSTRY_ORDER.map((iid) => {
    const ind = INDUSTRIES[iid]
    const firstDef = BUSINESSES[ind.businessIds[0]]
    let totalOwned = 0
    for (const bid of ind.businessIds) totalOwned += state.businesses[bid]?.owned ?? 0
    const entryCost = firstDef.baseCost
    const entryAffordable = state.cash >= entryCost
    return {
      id: iid,
      name: ind.name,
      theme: ind.theme,
      entryCost,
      firstBusinessName: firstDef.name,
      entryAffordable,
      entryEtaSec: !entryAffordable && totalPps > 0 ? (entryCost - state.cash) / totalPps : null,
      ownsAny: totalOwned > 0,
      totalOwned,
    }
  })

  const industriesEntered = industries.filter((i) => i.totalOwned > 0).length

  const upgrades: UpgradeView[] = UPGRADE_ORDER.map((uid) => {
    const up = UPGRADES[uid]
    const purchased = state.upgradesPurchased.includes(uid)
    return {
      id: uid,
      name: up.name,
      cost: up.cost,
      purchased,
      affordable: !purchased && state.cash >= up.cost,
      scopeLabel: scopeLabel(uid),
      effectLabel: upgradeEffectLabel(uid),
      iconSrc: ART_UPGRADES[uid]?.icon ?? ART_MILESTONE[up.effect.kind],
    }
  })

  const pendingTokens = prestigePending(state)
  const prestigeUnlocked = state.lifetimeEarnings >= PRESTIGE_UNLOCK_LIFETIME

  // Prestige talent tree
  const tokensAvailable = availableTokens(state)
  const talents: TalentView[] = TALENT_ORDER.map((id) => {
    const def = TALENTS[id]
    const rank = talentRank(state, id)
    const maxed = rank >= def.maxRank
    const nextCost = maxed ? null : talentCostAt(def, rank)
    return {
      id,
      name: def.name,
      blurb: def.blurb,
      theme: def.theme,
      icon: def.icon,
      rank,
      maxRank: def.maxRank,
      maxed,
      nextCost,
      affordable: nextCost != null && tokensAvailable >= nextCost,
      currentLabel: talentLabel(def, rank),
      nextLabel: maxed ? null : talentLabel(def, rank + 1),
    }
  })

  // Founder Perks — the per-run flavour choice.
  const chosenPerk = state.prestige?.founderPerk ?? null
  const founderPerks: FounderPerkView[] = FOUNDER_PERK_ORDER.map((id) => {
    const p = FOUNDER_PERKS[id]
    return {
      id,
      name: p.name,
      icon: p.icon,
      blurb: p.blurb,
      chosen: chosenPerk === id,
      effectLabel: founderPerkEffectLabel(p),
    }
  })

  const unlockedAch = new Set(state.achievementsUnlocked)
  const achievements: AchievementView[] = ACHIEVEMENTS.map((a) => {
    const unlocked = unlockedAch.has(a.id)
    return {
      id: a.id,
      name: a.name,
      description: a.description,
      icon: a.icon,
      unlocked,
      reward: a.reward,
      // Only locked, countable goals need a progress bar.
      progress: unlocked ? null : achievementProgress(state, a.id),
    }
  })

  const claimedPm = new Set(state.prestigeMilestonesClaimed)
  const prestigeMilestones: PrestigeMilestoneView[] = PRESTIGE_MILESTONES.map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description,
    icon: m.icon,
    rewardTokens: m.rewardTokens,
    resets: m.resets,
    reached: claimedPm.has(m.id) || state.prestige.resets >= m.resets,
    progress: Math.min(1, state.prestige.resets / m.resets),
  }))

  // Onboarding staged reveal — derived from progress so it survives save/load.
  // Veterans (have ascended) see everything immediately.
  const veteran = state.prestige.resets > 0
  const revealedTabs: RevealedTabs = {
    employees: veteran || totalOwned >= 1,
    upgrades: veteran || state.lifetimeEarnings >= REVEAL_UPGRADES_LIFETIME,
    prestige: veteran || prestigeUnlocked,
    stats: veteran || totalOwned >= 1,
  }
  // A tab that just revealed but the player hasn't opened yet pulses "new" in the nav —
  // makes the staged onboarding legible (a section unlocked → tap to discover it).
  const visited = state.visitedTabs ?? []
  const newTabs: RevealedTabs = {
    employees: revealedTabs.employees && !visited.includes('employees'),
    upgrades: revealedTabs.upgrades && !visited.includes('upgrades'),
    prestige: revealedTabs.prestige && !visited.includes('prestige'),
    stats: revealedTabs.stats && !visited.includes('stats'),
  }

  const goldenMega = state.golden?.offerMega ?? false
  const frenzyMs = state.golden?.frenzyMsLeft ?? 0
  const golden: GoldenView = {
    offerActive: (state.golden?.offerMsLeft ?? 0) > 0,
    offerSecondsLeft: Math.ceil((state.golden?.offerMsLeft ?? 0) / 1000),
    warpValue: goldenOfferValue(state),
    warpMinutes: Math.round((GOLDEN_WARP_SECONDS * (goldenMega ? GOLDEN_MEGA_MULT : 1)) / 60),
    mega: goldenMega,
    frenzyActive: frenzyMs > 0,
    frenzySecondsLeft: Math.ceil(frenzyMs / 1000),
  }

  const rushHour: RushHourView = {
    offerActive: (state.rushHour?.offerMsLeft ?? 0) > 0,
    offerSecondsLeft: Math.ceil((state.rushHour?.offerMsLeft ?? 0) / 1000),
    surgeActive: (state.rushHour?.surgeMsLeft ?? 0) > 0,
    surgeSecondsLeft: Math.ceil((state.rushHour?.surgeMsLeft ?? 0) / 1000),
    speedMult: RUSH_SPEED_MULT,
  }

  // Logistics' Just-In-Time Dispatch — the cargo load + any active release surge.
  const logisticsFraction = logisticsLoadFraction(state)
  const logistics: LogisticsView = {
    industryId: LOGISTICS_INDUSTRY_ID,
    owned: ownsLogistics(state),
    loadFraction: logisticsFraction,
    canDispatch: canDispatch(state),
    readyPct: Math.round((dispatchMultAt(logisticsFraction) - 1) * 100),
    surgeActive: logisticsDispatchActive(state),
    surgeSecondsLeft: Math.ceil((state.logistics?.surgeMsLeft ?? 0) / 1000),
    surgePct: Math.round(((state.logistics?.surgeMult ?? 1) - 1) * 100),
  }

  // Mogul Story session (Angel Investment is the reference story) — offer/active/outcome
  // + qualitative hints. The active story is resolved by id so this drives ANY story.
  const ad = state.angelDeal
  const story = getMogulStory(ad.storyId) ?? ANGEL_DEAL
  const angelDeal: AngelDealView = {
    storyId: ad.storyId,
    offered: ad.offered && !ad.active,
    active: ad.active,
    stageId: ad.stageId,
    stageIndex: ad.stageId ? story.order.indexOf(ad.stageId) + 1 : 0,
    stageTotal: story.order.length,
    outcome: ad.outcome,
    payout: ad.payout,
    disciplined: ad.disciplined,
    combinatorUnlocked: ad.combinatorUnlocked,
    hints: angelHints(ad.scores),
  }

  // Startup Combinator business (great-outcome reward) — its row + the exit-payout timer.
  const combinator: CombinatorView = {
    unlocked: ad.combinatorUnlocked,
    business: businesses[COMBINATOR_ID] ?? null,
    nextExitSec: Math.ceil((ad.exitCooldownMs ?? 0) / 1000),
    exitProgress: 1 - Math.min(1, Math.max(0, (ad.exitCooldownMs ?? 0) / EXIT_INTERVAL_MS)),
    exitCount: ad.exitCount ?? 0,
    lastExitAmount: ad.lastExitAmount ?? 0,
  }

  // Finance's Compound Interest — its current profit bonus (for the industry cue).
  const financeCompound = {
    industryId: FINANCE_INDUSTRY_ID,
    pct: Math.round((financeCompoundMult(state) - 1) * 100),
  }

  // Quantum's Superposition — whether it's mid-collapse (jackpot) and the current mult.
  const quantumSuperposition = {
    industryId: QUANTUM_INDUSTRY_ID,
    collapsing: quantumCollapsing(state),
    mult: quantumSuperpositionMult(state),
  }

  // Daily return hook — availability is a runtime (wall-clock) check; the harness never
  // reads buildView, so a Date.now() here is UI-only and inert in the sims.
  const dailyStreakVal = Math.max(0, state.dailyStreak ?? 0)
  const nm = nextDailyMilestone(dailyStreakVal)
  const prevDay = prevMilestoneDay(dailyStreakVal)
  const daily = {
    available: canClaimDaily(state, Date.now()),
    reward: dailyReward(state),
    streak: dailyStreakVal,
    // The next streak reward, so the streak reads as a goal (not a hidden counter).
    nextMilestone: nm ? { day: nm.day, label: nm.label } : null,
    // Progress from the last milestone toward the next (0..1), for the card's thin bar.
    milestoneProgress: nm && nm.day > prevDay ? (dailyStreakVal - prevDay) / (nm.day - prevDay) : 0,
  }

  // Event card currently on offer (null when none) — the active-decision modal reads this.
  const ec = state.eventCards
  const offerCard = ec?.offerCardId ? EVENT_CARD_BY_ID[ec.offerCardId] : undefined
  const eventCard: EventCardView | null =
    offerCard && (ec?.offerMsLeft ?? 0) > 0
      ? {
          id: offerCard.id,
          icon: offerCard.icon,
          title: offerCard.title,
          prompt: offerCard.prompt,
          kind: offerCard.kind,
          secondsLeft: Math.ceil((ec?.offerMsLeft ?? 0) / 1000),
          a: { label: offerCard.a.label, blurb: offerCard.a.blurb },
          b: { label: offerCard.b.label, blurb: offerCard.b.blurb },
        }
      : null

  // Space Salvage Shooter — the rare opportunity mini-game. Offer availability is a
  // wall-clock (Date.now()) gate, harmless in sims (the harness never reads buildView).
  const ssState = state.spaceShooter
  const ssNextIdx = nextStageIndex(state)
  const ssStageDef = ssNextIdx >= 0 ? SPACE_SHOOTER_STAGE_BY_INDEX[ssNextIdx] : null
  const spaceShooter: SpaceShooterView = {
    offerAvailable: spaceShooterOfferAvailable(state, Date.now()),
    stageIndex: ssNextIdx,
    stageNumber: ssStageDef?.number ?? SPACE_SHOOTER_TOTAL_STAGES,
    stageTitle: ssStageDef?.title ?? 'Campaign Complete',
    stageCodename: ssStageDef?.codename ?? '',
    stagesCompleted: ssState?.stageCompleted ?? 0,
    totalStages: SPACE_SHOOTER_TOTAL_STAGES,
    campaignComplete: campaignComplete(state),
    aiPilotUnlocked: ssState?.aiPilotUnlocked ?? false,
    orbitalYardUnlocked: ssState?.orbitalYardUnlocked ?? false,
    buffActive: (ssState?.buffMsLeft ?? 0) > 0,
    buffSecondsLeft: Math.ceil((ssState?.buffMsLeft ?? 0) / 1000),
    buffPct: Math.round(((ssState?.buffMult ?? 1) - 1) * 100),
    bestScore: ssNextIdx >= 0 ? (ssState?.bestScores?.[ssNextIdx] ?? 0) : 0,
    ownsSpace: ownsSpace(state),
  }

  const contracts: ContractView[] = (state.contracts?.active ?? [])
    .map((id) => CONTRACT_BY_ID[id])
    .filter((def): def is NonNullable<typeof def> => def != null)
    .map((def) => {
      const progress = contractProgress(state, def)
      return {
        id: def.id,
        name: def.name,
        description: def.description,
        icon: def.icon,
        progress,
        target: def.target,
        fraction: Math.min(1, def.target > 0 ? progress / def.target : 0),
        rewardTokens: def.rewardTokens,
        complete: isContractComplete(state, def),
      }
    })
  const contractsClaimable = contracts.filter((c) => c.complete).length

  const c = state.career
  const cdef = careerLevelDef(c.level)
  const isMaxLevel = c.level >= MAX_CAREER_LEVEL
  const nextDef = isMaxLevel ? null : careerLevelDef(c.level + 1)
  // HUD shows the LIVE instantaneous rate (buffs included) so frenzies visibly spike.
  const passivePerSec = automatedIncomePerSec(state, { steady: false })
  const retired = isRetired(state)
  const drawValue = shiftPayout(state, passivePerSec)
  const career: CareerView = {
    level: c.level,
    title: cdef.title,
    wage: cdef.wage,
    shiftMs: cdef.shiftMs,
    working: c.shiftProgressMs > 0,
    shiftProgressFraction: cdef.shiftMs > 0 ? Math.min(1, c.shiftProgressMs / cdef.shiftMs) : 0,
    shiftsThisLevel: c.shiftsThisLevel,
    shiftsToPromote: cdef.shiftsToPromote,
    promotionFraction:
      cdef.shiftsToPromote && cdef.shiftsToPromote > 0
        ? Math.min(1, c.shiftsThisLevel / cdef.shiftsToPromote)
        : 1,
    isMaxLevel,
    nextTitle: nextDef?.title ?? null,
    nextWage: nextDef?.wage ?? null,
    salaryDrawValue: drawValue,
    salaryDrawMult: cdef.wage > 0 ? drawValue / cdef.wage : 1,
    nextShiftIsGolden: (c.totalShifts + 1) % GOLDEN_SHIFT_EVERY === 0,
    retired,
    consultingValue: consultingPayout(state, passivePerSec),
    consultingFraction: Math.min(1, c.consultingMs / CONSULT_CAP_MS),
    consultingFull: c.consultingMs >= CONSULT_CAP_MS,
  }

  // Tab badges for actionable rewards — claimable contracts (Stats) and a
  // worthwhile ascension (Ascend). Only unambiguous "go claim this" signals.
  const navBadges: Partial<Record<TabId, number>> = {}
  // The daily bonus + any ready contracts both surface on the Stats tab.
  const statsBadge = contractsClaimable + (daily.available ? 1 : 0)
  if (statsBadge > 0) navBadges.stats = statsBadge
  if (prestigeUnlocked && pendingTokens > 0) navBadges.prestige = pendingTokens

  // "Assign → +$X/s" previews for the open assignment sheet: resolve the business
  // against a shallow clone that drops each benched employee into a free slot, and
  // report the $/s gain. Non-mutating; only runs while a sheet is open + has a slot.
  const assignPreviews: Record<string, number> = {}
  if (openAssignmentBusinessId) {
    const def = BUSINESSES[openAssignmentBusinessId]
    const bs = state.businesses[openAssignmentBusinessId]
    const freeSlot = bs ? bs.assigned.findIndex((x) => x == null) : -1
    if (def && bs && freeSlot >= 0) {
      const before = resolveBusiness(state, def).pps
      for (const e of Object.values(state.employees)) {
        if (assignmentOf[e.id]) continue // already working somewhere
        const trialAssigned = bs.assigned.slice()
        trialAssigned[freeSlot] = e.id
        const trialState = {
          ...state,
          businesses: { ...state.businesses, [def.id]: { ...bs, assigned: trialAssigned } },
        }
        assignPreviews[e.id] = resolveBusiness(trialState, def).pps - before
      }
    }
  }

  return {
    cash: state.cash,
    lifetimeEarnings: state.lifetimeEarnings,
    totalPps,
    career,
    revealedTabs,
    newTabs,
    golden,
    rushHour,
    logistics,
    angelDeal,
    combinator,
    financeCompound,
    quantumSuperposition,
    eventCard,
    spaceShooter,
    daily,
    contracts,
    contractsClaimable,
    buyMode: state.buyMode,
    activeTab: state.activeTab,
    activeIndustryTab: state.activeIndustryTab,
    prestige: state.prestige,
    prestigePending: pendingTokens,
    prestigeUnlocked,
    prestigeNextTokenAt: nextTokenLifetime(state),
    prestigeNextTokenProgress: nextTokenProgress(state),
    prestigeProfitBonusPct: talentProfitBonusPct(state),
    talents,
    founderPerks,
    talentTokensAvailable: tokensAvailable,
    talentTokensSpent: state.prestige.spentPoints ?? 0,
    onboardingStep: state.onboardingStep,
    businesses,
    industries,
    employees,
    hireOptions,
    upgrades,
    achievements,
    achievementsUnlockedCount: unlockedAch.size,
    prestigeMilestones,
    navBadges,
    stats: {
      totalOwned,
      automatedCount,
      businessesUnlocked,
      industriesEntered,
      industriesTotal: INDUSTRY_ORDER.length,
      employees: Object.values(state.employees).length,
      careerLevel: state.career.level,
    },
    assignPreviews,
  }
}
