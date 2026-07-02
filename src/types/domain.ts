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
  /** Auto-runs without an assigned Operator (e.g. the Startup Combinator fund). */
  autoRun?: boolean
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

/** Logistics' signature mechanic — "Just-In-Time Dispatch". Cargo load accrues while
 *  Logistics is owned; the player releases it for a profit surge that scales with how
 *  full the load was (a bank-and-release timing decision). Transient (not persisted;
 *  fresh on load/prestige), deterministic — no RNG. */
export interface LogisticsState {
  loadMs: number // accrued cargo load (0..DISPATCH_FILL_MS) while Logistics is owned
  surgeMsLeft: number // > 0 while a released dispatch surge is boosting Logistics profit
  surgeMult: number // the profit multiplier of the active surge (captured at release time)
}

/** Business event cards — the active-decision layer. Transient (not persisted;
 *  fresh on load/prestige), deterministic cadence + deck rotation. */
export interface EventCardsState {
  cooldownMs: number // time until the next card surfaces
  offerMsLeft: number // > 0 while a card is on offer (undecided)
  offerCardId: string | null // the card currently on offer
  nextIndex: number // deterministic deck rotation pointer
  profitMult: number // active timed profit multiplier from a resolved card
  profitMsLeft: number
  speedMult: number // active timed speed multiplier from a resolved card
  speedMsLeft: number
}

/** Contracts board — the currently-offered missions + pool pointer. */
export interface ContractsState {
  active: string[] // contract ids currently on the board
  nextIndex: number // pointer into the ordered CONTRACTS pool for the next deal
}

// ----- Opportunity Mini-Games: Angel Investment Deal -----
export type AngelScoreKey =
  | 'confidence'
  | 'leverage'
  | 'dueDiligence'
  | 'founderTrust'
  | 'risk'
  | 'valuationDiscipline'
export type AngelScores = Record<AngelScoreKey, number>
export type AngelOutcomeBand = 'great' | 'good' | 'neutral' | 'bad'

/** State for the Angel Investment mini-game. Durable meta (combinatorUnlocked,
 *  completedCount, cooldown, timed boost) + a validated in-progress session. */
export interface AngelDealState {
  storyId: string // which Mogul Story this session is running (default: the Angel story)
  combinatorUnlocked: boolean // great outcome once → permanent Finance/Tech bonus (Startup Combinator)
  completedCount: number // times a deal has resolved (any band)
  cooldownMs: number // time until a pitch can be offered again (rare)
  offered: boolean // a pitch is waiting (floating prompt)
  active: boolean // the mini-game modal is open + in progress
  stageId: string | null // current stage id (validated on load; cleared if unknown)
  scores: AngelScores // HIDDEN deal variables (never shown as raw numbers)
  outcome: AngelOutcomeBand | null // set at the outcome screen; cleared on dismiss
  disciplined: boolean // walked away from a bad deal (tiny discipline bonus)
  payout: number // net cash delta applied at resolve (for the outcome screen)
  boostMult: number // timed post-deal industry multiplier (>1 good / <1 bad)
  boostMsLeft: number
  boostIndustryId: string // which industry the timed boost applies to (the resolved story's)
  nextIsDate: boolean // a date went well → the SHORTENED cooldown is reserved for the next episode
  // Startup Combinator business (unlocked by the great outcome): periodic "exit" payouts.
  exitCooldownMs: number // countdown to the next exit lump (while the Combinator is owned)
  exitCount: number // exits fired (drives the deterministic payout sequence + UI celebration)
  lastExitAmount: number // the most recent exit payout (for the celebration)
}

/** Space Salvage Shooter — the rare 5-stage arcade opportunity campaign.
 *  Campaign PROGRESS is persisted (survives save/load/cloud); the in-mission
 *  simulation (ship/enemy/projectile positions) is NEVER persisted — it lives in
 *  the canvas component and is discarded when a mission ends. The timed buff +
 *  AI-salvage timers are transient (reset on load, like golden/eventCards). */
export interface SpaceShooterState {
  // --- persisted campaign progress (overlaid by serialize.tolerantLoad) ---
  stageCompleted: number // highest stage passed (0..5); the offer targets this index
  cooldownUntil: number // wall-clock ms; the next stage/offer is gated until now >= this
  aiPilotUnlocked: boolean // Stage 5 reward: automation — manual stages stop after this
  orbitalYardUnlocked: boolean // Stage 4 reward: a permanent Space perk flag
  bestScores: number[] // best raw score per stage index (length 5)
  missionsPlayed: number // lifetime missions launched (a stat)
  // --- transient (NOT persisted; fresh on load, like golden/eventCards) ---
  buffMult: number // Space-only timed profit multiplier from a run reward (>= 1)
  buffMsLeft: number // countdown for the buff (0 = inactive)
  aiSalvageCooldownMs: number // countdown to the AI pilot's next automatic salvage payout
}

/** The love-story arc (Mogul Stories: the Quinn Harlow episodes) + marriage sink.
 *  META-PROGRESSION: persists through prestige (an ascension is not a divorce). */
export interface RomanceState {
  stage: number // dating progress: romance episodes completed successfully (0..4)
  married: boolean // the proposal landed (stage 4) — unlocks the marriage money-sink
  marriageLevel: number // sink level (0 = not started); each level drains more income
  totalSpent: number // lifetime cash lavished on the marriage (running sink total)
}

export interface GameState {
  cash: Num
  lifetimeEarnings: Num
  lastWallClock: number // Date.now() anchor for catch-up
  career: CareerState
  golden: GoldenState
  rushHour: RushHourState
  logistics: LogisticsState // Logistics' signature: Just-In-Time Dispatch (transient)
  eventCards: EventCardsState // the active-decision layer (transient)
  angelDeal: AngelDealState // Mogul Story session runtime (offers/stages/scores)
  romance: RomanceState // the love-story arc + marriage sink (persists through prestige)
  financeCompoundMs: number // Finance's signature: ms of runtime its compound has accrued (this run)
  quantumPhaseMs: number // Quantum's signature: superposition phase (0..cycle), transient oscillator
  buyMode: BuyMode
  activeTab: TabId
  visitedTabs: TabId[] // tabs the player has opened — a freshly-revealed, unvisited tab pulses "new"
  dailyClaimDay: number // local-day index of the last daily-bonus claim (-1 = never)
  dailyStreak: number // consecutive-day claim streak (for the "Day N" display)
  activeIndustryTab: IndustryId
  industries: Record<IndustryId, IndustryState>
  businesses: Record<BusinessId, BusinessState>
  employees: Record<EmployeeId, EmployeeInstance>
  hirePool: string[] // templateIds currently offered
  purchasedUnlocks: string[] // explicit unlock ids (was a Set)
  upgradesPurchased: UpgradeId[]
  repeatableRanks: Record<string, number> // Executive Programs ranks (run-scoped, like upgrades)
  milestonesReached: MilestoneId[]
  achievementsUnlocked: string[] // meta-progression; persists through prestige
  prestigeMilestonesClaimed: string[] // ascension-count rewards already granted
  contracts: ContractsState // claimable missions board (persists through prestige)
  spaceShooter: SpaceShooterState // Space Salvage Shooter campaign (persists through prestige)
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
