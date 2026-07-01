// ============================================================
//  Tycoon Empire — domain types (single source of truth)
//  engine/ and content/ depend on this; it imports nothing.
// ============================================================

// ----- ID aliases -----
export type IndustryId = string
export type BusinessId = string
export type EmployeeId = string // instance id
export type UpgradeId = string
export type MilestoneId = string
export type TraitId = string
export type SpecId = string
export type SynergyId = string

// Money seam: all currency is `number` for the slice. Swap behind engine/num.ts.
export type Num = number

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic'
export type Playstyle = 'fast-cycle' | 'steady' | 'high-capital' | 'volatile'
export type BuyMode = 'x1' | 'x10' | 'x100' | 'max'

// Roles shipped in the slice. M4a: operator/runner/closer/buyer.
// M4b adds gambler/auditor/hr. (mentor/synergist/custodian are deferred.)
export type RoleId =
  | 'operator'
  | 'runner'
  | 'closer'
  | 'buyer'
  | 'gambler'
  | 'auditor'
  | 'hr'

// Effect channels an employee can push. (No offlineRate — deferred.)
export type EffectChannel =
  | 'automation'
  | 'cycleSpeed'
  | 'profitMult'
  | 'costReduction'
  | 'critChance'
  | 'critMult'
  | 'riskReduction'
  | 'morale'

export type TabId = 'business' | 'employees' | 'upgrades' | 'prestige' | 'stats'

// ============================================================
//  CONTENT (immutable defs — never persisted, referenced by id)
// ============================================================

export type UnlockCondition =
  | { kind: 'free' }
  | { kind: 'cash'; amount: Num } // explicit purchase decision
  | { kind: 'businessOwned'; businessId: BusinessId; count: number } // passive gate
  | { kind: 'industryProgress'; industryId: IndustryId; totalOwned: number }

export interface IndustryBonus {
  globalProfitMult?: number
  globalSpeedMult?: number
  signaturePerkId: string // unlocked at the deep specialisation threshold
  preferredChannels: EffectChannel[] // for focus bonus + UI hints
}

export interface IndustryDef {
  id: IndustryId
  name: string
  theme: string // CSS var name, e.g. 'var(--industry-food)'
  playstyle: Playstyle
  unlock: UnlockCondition
  businessIds: BusinessId[] // ordered ladder
  bonus: IndustryBonus
}

export type MilestoneEffect =
  | { kind: 'profitMult'; factor: number }
  | { kind: 'speedMult'; factor: number }
  | { kind: 'costReduction'; factor: number }

export interface Milestone {
  id: MilestoneId
  threshold: number // owned-count required
  effect: MilestoneEffect
}

export interface BusinessDef {
  id: BusinessId
  industryId: IndustryId
  name: string
  icon: string // emoji for the slice
  baseCost: Num
  growthRate: number // 1.07..1.14
  baseRevenue: Num
  baseCycleMs: number
  preferredChannels: EffectChannel[]
  slotUnlocks: number[] // owned-count thresholds, e.g. [0, 25, 100, 300]
  milestones: Milestone[] // sorted ascending by threshold
  unlock: UnlockCondition
  /** Finance-style businesses accrue risk (M4b). */
  riskEnabled?: boolean
}

export interface RoleDef {
  id: RoleId
  name: string
  primaryChannels: EffectChannel[]
  baseMagnitude: Partial<Record<EffectChannel, number>> // per-employee, pre rarity/level
  icon: string
  color: string
  blurb: string // one plain-language line for the UI
}

/** A rung on the Work/Career ladder — the early-game manual income source. */
export interface CareerLevelDef {
  level: number
  title: string
  wage: Num // paid per completed shift
  shiftMs: number // shift cycle duration
  shiftsToPromote: number | null // null = top of the ladder
}

export interface TraitDef {
  id: TraitId
  name: string
  channelDeltas: Partial<Record<EffectChannel, number>>
  affinityMult?: number
}

export interface EmployeeTemplateDef {
  templateId: string
  name: string
  role: RoleId
  rarity: Rarity
  affinity: IndustryId | null
  traits: TraitId[]
  baseHireCost: Num
}

// (Synergies are defined in content/synergies.ts — SynergyDef/SynergyMods there.)

export interface UpgradeDef {
  id: UpgradeId
  name: string
  cost: Num
  scope:
    | { kind: 'business'; businessId: BusinessId }
    | { kind: 'industry'; industryId: IndustryId }
    | { kind: 'global' }
  effect: MilestoneEffect // reuse the profit/speed/cost factor shape
}

// ============================================================
//  STATE (mutable, persisted — ids + counts + timers only)
// ============================================================

export interface EmployeeInstance {
  id: EmployeeId
  templateId: string
  name: string
  role: RoleId
  rarity: Rarity
  level: number // 1..10
  affinity: IndustryId | null
  traits: TraitId[]
  specialisation: SpecId | null // unlocked at level 5 (M4b)
  specialisation2?: SpecId | null // second slot, unlocked at the level cap (Mastery)
  // assignment authority lives on the business, NOT here.
  salaryPerSec?: number // reserved, unused (0) in slice
}

export interface BusinessState {
  owned: number
  unlocked: boolean
  cycleProgressMs: number // 0..effectiveCycle
  assigned: (EmployeeId | null)[] // length === unlocked slot count (authority)
  morale: number // 0..100
  risk: number // 0..100 (Finance only meaningful)
  riskEventMsLeft: number // > 0 while a risk event is dampening output
}

export interface IndustryState {
  unlocked: boolean
}

export interface PrestigeState {
  totalPoints: number // Empire Tokens earned across all ascensions
  spentPoints: number // tokens spent on talents
  talents: Record<string, number> // talentId → rank
  multiplier: number // deprecated (kept for save compat); profit now comes from talents
  resets: number
  founderPerk?: string | null // chosen Founder Perk id flavouring the current run (null = none)
}

export interface CareerState {
  level: number // index into CAREER_LEVELS
  shiftProgressMs: number // 0 = idle; > 0 = a shift is in progress
  shiftsThisLevel: number // progress toward the next promotion
  totalShifts: number
  // Senior Consultant (post-retirement): accrued idle time for the optional
  // over-time consulting bonus, claimed by tapping. Only accrues at max career level.
  consultingMs: number
}

/** Golden Deals — transient active-play tap rewards (Time Warp). */
export interface GoldenState {
  offerMsLeft: number // > 0 while a deal is tappable on screen
  cooldownMs: number // time until the next deal spawns
  offerMega: boolean // the current offer is a MEGA jackpot (worth several normal deals)
  spawnCount: number // deals spawned this session — every Nth is a MEGA (deterministic)
  frenzyMsLeft: number // > 0 while a claimed deal's temporary "Profit Rush" (×profit) is active
}

/** Food's signature mechanic — a recurring tappable "Rush Hour" speed-surge window.
 *  Transient (not persisted; fresh on load/prestige), deterministic cadence. */
export interface RushHourState {
  offerMsLeft: number // > 0 while the Rush Hour window is tappable
  cooldownMs: number // time until the next window opens
  surgeMsLeft: number // > 0 while a claimed surge is boosting Food's speed
}

/** Contracts board — the currently-offered missions + pool pointer. */
export interface ContractsState {
  active: string[] // contract ids currently on the board
  nextIndex: number // pointer into the ordered CONTRACTS pool for the next deal
}

export interface GameState {
  cash: Num
  lifetimeEarnings: Num
  lastWallClock: number // Date.now() anchor for catch-up
  career: CareerState
  golden: GoldenState
  rushHour: RushHourState
  financeCompoundMs: number // Finance's signature: ms of runtime its compound has accrued (this run)
  buyMode: BuyMode
  activeTab: TabId
  activeIndustryTab: IndustryId
  industries: Record<IndustryId, IndustryState>
  businesses: Record<BusinessId, BusinessState>
  employees: Record<EmployeeId, EmployeeInstance>
  hirePool: string[] // templateIds currently offered
  purchasedUnlocks: string[] // explicit unlock ids (was a Set)
  upgradesPurchased: UpgradeId[]
  milestonesReached: MilestoneId[]
  achievementsUnlocked: string[] // meta-progression; persists through prestige
  prestigeMilestonesClaimed: string[] // ascension-count rewards already granted
  contracts: ContractsState // claimable missions board (persists through prestige)
  prestige: PrestigeState
  onboardingStep: number
  nextEmployeeSeq: number // for generating unique employee ids deterministically
}

// ============================================================
//  COMPOSITION CONTRACTS (the reconciled seam)
// ============================================================

/** Output of the EMPLOYEE layer. */
export interface EmployeeEffects {
  speedAdd: number
  profitAdd: number
  buyCostMult: number // <= 1
  isAutomated: boolean
  critChance: number // 0..0.75
  critMult: number // >= 2
  moraleScalar: number // 0.8..1.2
  riskPenalty: number // 0 normally
  focusBonus: number // >= 1; profit bonus for industry-themed staffing
  activeSynergies: SynergyId[]
}

/** Output of the ECONOMY layer. */
export interface EconomyMultipliers {
  profit: number // milestone * industry * prestige * upgrades
  speed: number // milestone * industry * upgrades
  baseCostFactor: number // milestone/upgrade costReduction
}

/** Final fold consumed by the tick + UI. */
export interface ResolvedBusiness {
  cycleMs: number
  revenuePerCycle: Num // INCLUDES the × owned term
  pps: Num // revenuePerCycle / (cycleMs/1000)
  buyCostMult: number
  isAutomated: boolean
  critChance: number
  critMult: number
  moraleScalar: number
  riskPenalty: number
  unlockedSlots: number
  activeSynergies: SynergyId[]
}

// ============================================================
//  SAVE SCHEMA
// ============================================================

export interface SaveEnvelope {
  version: number
  savedAt: number
  state: GameState
}
