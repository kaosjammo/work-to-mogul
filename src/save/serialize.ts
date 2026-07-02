// ============================================================
//  Save serialization + TOLERANT load.
//  Loads are merged over a fresh initialGameState so saves written before new
//  content/fields existed still load. Numbers are sanitized; industries are
//  normalized to the current "always visible" model; orphaned references are
//  dropped. Never throws to the caller — returns null on unrecoverable input.
// ============================================================
import type { EmployeeInstance, GameState, Rarity, RoleId, TabId } from '../types/domain'
import { initialGameState } from '../store/initialState'
import { BUSINESSES, COMBINATOR_ID } from '../content/businesses'
import { MAX_CAREER_LEVEL } from '../content/career'
import { ROLE_DEFS, MAX_EMPLOYEE_LEVEL } from '../content/roles'
import { TRAIT_DEFS } from '../content/traits'
import { TALENTS } from '../content/talents'
import { talentCostAt } from '../engine/talents'
import { FINANCE_COMPOUND_RAMP_MS, SUPERPOSITION_CYCLE_MS } from '../engine/economy'
import { FOUNDER_PERKS } from '../content/founderPerks'
import { SPECIALISATIONS } from '../content/specialisations'
import { CONTRACTS, CONTRACT_BY_ID } from '../content/contracts'
import { refillBoard } from '../engine/contracts'
import { REPEATABLE_UPGRADES } from '../content/upgrades'
import { ANGEL_DEAL, SCORE_KEYS } from '../content/angelDeal'
import { getMogulStory } from '../content/mogulStories'
import { ROMANCE_EPISODE_IDS, MARRIAGE_MAX_LEVEL } from '../engine/romance'
import { SPACE_SHOOTER_TOTAL_STAGES } from '../content/spaceShooter'
import { FOOD_FRENZY_TOTAL_TIERS } from '../content/foodFrenzy'
import { ACHIEVEMENT_REWARD } from '../content/achievements'
import { INDUSTRY_ORDER } from '../content/industries'
import { reconcileSlots } from '../engine/employees/composition'
import { checkUnlocks } from '../engine/simulate'

export const SAVE_KEY = 'tycoon:save'
export const CURRENT_SAVE_VERSION = 2

interface Envelope {
  version: number
  savedAt: number
  state: GameState
}

/** The versioned save envelope shape — shared by localStorage and cloud save. */
export type SaveEnvelope = Envelope

// Versioned migrations for BREAKING save changes (renamed/removed fields).
// Tolerant deep-merge handles purely-additive fields, so most changes need no entry.
// Each entry upgrades a save from key-1 to key; it runs at most once per save.
const MIGRATIONS: Record<number, (s: Partial<GameState>) => Partial<GameState>> = {
  // v2: achievements now grant Empire Tokens. Back-grant the rewards for everything
  // already unlocked so existing players aren't shortchanged. Runs once (v1 → v2);
  // a v2 save never re-enters this step, so there's no double-grant.
  2: (s) => {
    const earned = (s.achievementsUnlocked ?? []).reduce(
      (sum, id) => sum + (ACHIEVEMENT_REWARD[id] ?? 0),
      0,
    )
    if (earned > 0) {
      const prestige = (s.prestige ?? {}) as Partial<GameState['prestige']>
      s.prestige = { ...prestige, totalPoints: num(prestige.totalPoints, 0) + earned } as GameState['prestige']
    }
    return s
  },
}

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

const ALL_TAB_IDS: TabId[] = ['business', 'employees', 'upgrades', 'prestige', 'stats']
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
  // The Mastery (slot-2) spec must also match the role AND differ from slot 1.
  const spec2 = typeof raw.specialisation2 === 'string' ? SPECIALISATIONS[raw.specialisation2] : undefined
  const specialisation2 =
    spec2 && spec2.role === role && raw.specialisation2 !== specialisation ? raw.specialisation2! : null
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
    specialisation2,
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
  // Finance's compound accrual — a per-run buildup that survives refresh (old saves
  // default to 0, so they load with a fresh compound; clamped to the ramp cap).
  s.financeCompoundMs = clamp(num(loaded.financeCompoundMs), 0, FINANCE_COMPOUND_RAMP_MS)
  // Quantum's superposition phase must survive refresh too: phase 0 sits INSIDE the
  // ×9 collapse window, so resetting on every load let refresh-spam hold the jackpot.
  s.quantumPhaseMs = clamp(num(loaded.quantumPhaseMs), 0, SUPERPOSITION_CYCLE_MS)
  if (loaded.buyMode) s.buyMode = loaded.buyMode
  if (loaded.activeTab) s.activeTab = loaded.activeTab
  if (loaded.activeIndustryTab) s.activeIndustryTab = loaded.activeIndustryTab
  // Visited tabs drive the "new" nav pulse. Old saves (no field) default to ALL tabs so
  // an existing player never sees a false "new" on tabs they've long since used.
  s.visitedTabs = Array.isArray(loaded.visitedTabs)
    ? (loaded.visitedTabs.filter((t): t is TabId => ALL_TAB_IDS.includes(t as TabId)))
    : [...ALL_TAB_IDS]
  // Daily return hook — old saves default to "never claimed" (claimable on next open).
  s.dailyClaimDay = Math.floor(num(loaded.dailyClaimDay, -1))
  s.dailyStreak = Math.max(0, Math.floor(num(loaded.dailyStreak)))
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
          for (let i = 0; i < r; i++) spent += talentCostAt(def, i) // tokens spent reaching rank r
        }
      }
    }
    s.prestige.talents = talents
    // Trust the recomputed spend over the stored value, but never exceed earned.
    s.prestige.spentPoints = Math.min(s.prestige.totalPoints, spent)
    // Founder Perk — keep only a known id, else clear.
    const fp = loaded.prestige.founderPerk
    s.prestige.founderPerk = typeof fp === 'string' && FOUNDER_PERKS[fp] ? fp : null
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
  // Executive Program ranks: keep only known program ids with sane integer ranks.
  if (loaded.repeatableRanks && typeof loaded.repeatableRanks === 'object') {
    for (const [id, rank] of Object.entries(loaded.repeatableRanks)) {
      if (!REPEATABLE_UPGRADES[id]) continue
      const r = Math.floor(num(rank))
      if (r > 0) s.repeatableRanks[id] = r
    }
  }
  s.milestonesReached = strArray(loaded.milestonesReached)
  s.achievementsUnlocked = strArray(loaded.achievementsUnlocked)
  s.prestigeMilestonesClaimed = strArray(loaded.prestigeMilestonesClaimed)
  s.purchasedUnlocks = strArray(loaded.purchasedUnlocks)

  // Contracts board: keep only known contract ids; clamp the pool pointer.
  // An EMPTY active list is a valid, meaningful state (the finite pool is exhausted) —
  // it must restore as empty, or every reload would resurrect the full board and its
  // already-claimed token rewards.
  if (loaded.contracts && typeof loaded.contracts === 'object') {
    if (Array.isArray(loaded.contracts.active)) {
      const active = strArray(loaded.contracts.active).filter((id) => id in CONTRACT_BY_ID)
      const nextIndex = clamp(Math.floor(num(loaded.contracts.nextIndex)), 0, CONTRACTS.length)
      s.contracts = { active, nextIndex }
      // If a content change removed ids from the board, the engine's one dealer
      // fills the freed slots from the pool.
      refillBoard(s.contracts)
    }
  }

  // Angel Investment mini-game: restore durable meta always; the in-progress session
  // is kept only if its stage id is still valid (content changes safely cancel it).
  if (loaded.angelDeal && typeof loaded.angelDeal === 'object') {
    const la = loaded.angelDeal
    const a = s.angelDeal
    // Active Mogul Story id — keep it only if the story is still registered (else default).
    a.storyId = typeof la.storyId === 'string' && getMogulStory(la.storyId) ? la.storyId : a.storyId
    a.combinatorUnlocked = !!la.combinatorUnlocked
    a.completedCount = Math.max(0, Math.floor(num(la.completedCount)))
    // Ceiling the re-offer cooldown at 1h: no legit value exceeds ANGEL_REOFFER_MS
    // (14 min), and an inflated/corrupt value here would silently lock Mogul Stories
    // for days — the exact opposite of "surface the stories more often".
    a.cooldownMs = clamp(num(la.cooldownMs, a.cooldownMs), 0, 60 * 60_000)
    a.boostMult = num(la.boostMult, 1) || 1
    a.boostMsLeft = Math.max(0, num(la.boostMsLeft))
    if (typeof la.boostIndustryId === 'string') a.boostIndustryId = la.boostIndustryId
    a.nextIsDate = la.nextIsDate === true
    a.exitCooldownMs = Math.max(0, num(la.exitCooldownMs, a.exitCooldownMs))
    a.exitCount = Math.max(0, Math.floor(num(la.exitCount)))
    a.lastExitAmount = Math.max(0, num(la.lastExitAmount))
    a.payout = num(la.payout)
    a.disciplined = !!la.disciplined
    if (la.scores && typeof la.scores === 'object') {
      const raw = la.scores as Record<string, unknown>
      for (const k of SCORE_KEYS) a.scores[k] = num(raw[k])
    }
    a.offered = !!la.offered
    // Reconcile the Startup Combinator reward with its business row. The card
    // renders off `combinatorUnlocked`, but buying checks the BUSINESS's own
    // unlocked flag — which only applyOutcome sets. Saves from before the
    // Combinator became a standalone business (and any drift) land here with
    // combinatorUnlocked=true but a locked, 0-owned row: a visible card whose
    // Buy button is a dead tap. Re-grant what the great outcome grants.
    if (a.combinatorUnlocked) {
      const combo = s.businesses[COMBINATOR_ID]
      if (combo) {
        combo.unlocked = true
        combo.owned = Math.max(1, combo.owned) // the founding unit the reward includes
      }
    }
    if (la.active) {
      const story = getMogulStory(a.storyId) ?? ANGEL_DEAL
      const stageOk = typeof la.stageId === 'string' && !!story.stages[la.stageId]
      const outcomeOk =
        typeof la.outcome === 'string' && ['great', 'good', 'neutral', 'bad'].includes(la.outcome)
      if (stageOk || outcomeOk) {
        a.active = true
        a.offered = false
        a.stageId = stageOk ? (la.stageId as string) : null
        a.outcome = outcomeOk ? (la.outcome as GameState['angelDeal']['outcome']) : null
      }
      // else: unrecoverable session → stays idle (meta preserved above)
    }
  }

  // Romance / marriage — meta-progression (like the salvage campaign): the arc
  // stage, marriage, sink level, and the lifetime-lavished total all persist.
  // Consistency guards: married implies the arc is complete; the sink can only
  // exist inside a marriage.
  if (loaded.romance && typeof loaded.romance === 'object') {
    const lr = loaded.romance
    const r = s.romance
    r.stage = clamp(Math.floor(num(lr.stage)), 0, ROMANCE_EPISODE_IDS.length)
    r.married = lr.married === true
    r.marriageLevel = clamp(Math.floor(num(lr.marriageLevel)), 0, MARRIAGE_MAX_LEVEL)
    r.totalSpent = Math.max(0, num(lr.totalSpent))
    if (r.married) {
      r.stage = ROMANCE_EPISODE_IDS.length
    } else {
      r.marriageLevel = 0
      // Unmarried can be AT MOST "ready for the proposal" — a corrupt {stage: 4,
      // married: false} would otherwise dead-end the arc forever (no episode left).
      r.stage = Math.min(r.stage, ROMANCE_EPISODE_IDS.length - 1)
    }
  }

  // Automation managers — restore the player's config + lifetime stats (a
  // set-and-forget convenience). Clamp everything; the internal cooldowns reset to
  // a prompt tick on load (they don't advance offline). Old saves keep the defaults.
  if (loaded.automation && typeof loaded.automation === 'object') {
    const la = loaded.automation as Partial<GameState['automation']>
    if (la.invest && typeof la.invest === 'object') {
      const src = la.invest
      const inv = s.automation.invest
      // Executive Assistant arc progress (permanent meta-progression). `advisorFeeMs`
      // (the fill meter) is intentionally NOT restored — it's online-only, like the
      // internal cooldowns, so it resets to 0 on load.
      inv.unlocked = src.unlocked === true || src.enabled === true // grandfather a pre-arc EA
      inv.arcStage = clamp(Math.floor(num(src.arcStage)), 0, 3)
      inv.arcStarted = src.arcStarted === true || inv.unlocked || inv.arcStage > 0
      inv.advisorFee = src.advisorFee === true && inv.unlocked
      inv.enabled = src.enabled === true
      inv.reservePct = clamp(num(src.reservePct, inv.reservePct), 0, 90)
      inv.strategy = src.strategy === 'cheapest' || src.strategy === 'focus' ? src.strategy : 'roi'
      inv.focusIndustry = typeof src.focusIndustry === 'string' ? src.focusIndustry : null
      inv.intervalSec = clamp(Math.round(num(src.intervalSec, inv.intervalSec)), 3, 60)
      inv.lifetimeSpent = Math.max(0, num(src.lifetimeSpent))
      inv.lifetimeUnits = Math.max(0, Math.floor(num(src.lifetimeUnits)))
    }
    if (la.staff && typeof la.staff === 'object') {
      const src = la.staff
      const st = s.automation.staff
      // Grandfather: a save that already had the Chief ENABLED (from before it became a
      // one-time hire) counts as hired, so existing players keep their manager and the
      // UI stays consistent (never shows a "Hire" card for a running Chief).
      st.unlocked = src.unlocked === true || src.enabled === true
      st.enabled = src.enabled === true
      st.budgetPct = clamp(num(src.budgetPct, st.budgetPct), 0, 90)
      st.hire = src.hire !== false
      st.level = src.level !== false
      st.assign = src.assign !== false
      st.fuse = src.fuse !== false
      st.spec = src.spec !== false
      st.intervalSec = clamp(Math.round(num(src.intervalSec, st.intervalSec)), 3, 60)
      st.lifetimeSpent = Math.max(0, num(src.lifetimeSpent))
      st.lifetimeHires = Math.max(0, Math.floor(num(src.lifetimeHires)))
    }
  }

  // Space Salvage Shooter — persist ONLY the campaign progress (the transient buff +
  // AI-salvage timers stay at their fresh initial defaults, like golden/eventCards;
  // the in-mission simulation is never persisted). Old saves (no field) keep the
  // fresh baseline. cooldownUntil is a wall-clock epoch, capped so a corrupt value
  // can't lock the offer forever.
  if (loaded.spaceShooter && typeof loaded.spaceShooter === 'object') {
    const ss = loaded.spaceShooter
    const target = s.spaceShooter
    target.stageCompleted = clamp(Math.floor(num(ss.stageCompleted)), 0, SPACE_SHOOTER_TOTAL_STAGES)
    target.cooldownUntil = clamp(num(ss.cooldownUntil), 0, now + 24 * 60 * 60 * 1000)
    target.aiPilotUnlocked = ss.aiPilotUnlocked === true
    target.orbitalYardUnlocked = ss.orbitalYardUnlocked === true
    target.missionsPlayed = Math.max(0, Math.floor(num(ss.missionsPlayed)))
    if (Array.isArray(ss.bestScores)) {
      for (let i = 0; i < target.bestScores.length; i++) {
        target.bestScores[i] = Math.max(0, Math.floor(num(ss.bestScores[i])))
      }
    }
    // A finished campaign implies both unlocks (defends against a partial/edited save).
    if (target.stageCompleted >= SPACE_SHOOTER_TOTAL_STAGES) target.aiPilotUnlocked = true
  }

  // Lunch Rush — persist ONLY the campaign progress (the transient buff stays at its
  // fresh default; the in-run swarm is never persisted). Old saves keep the baseline.
  if (loaded.foodFrenzy && typeof loaded.foodFrenzy === 'object') {
    const ff = loaded.foodFrenzy
    const target = s.foodFrenzy
    target.tiersCleared = clamp(Math.floor(num(ff.tiersCleared)), 0, FOOD_FRENZY_TOTAL_TIERS)
    target.cooldownUntil = clamp(num(ff.cooldownUntil), 0, now + 24 * 60 * 60 * 1000)
    target.runsPlayed = Math.max(0, Math.floor(num(ff.runsPlayed)))
    if (Array.isArray(ff.bestScores)) {
      for (let i = 0; i < target.bestScores.length; i++) {
        target.bestScores[i] = Math.max(0, Math.floor(num(ff.bestScores[i])))
      }
    }
    // The Spatula is exactly "campaign complete" — repair either direction of a
    // partial/edited save (spatula without the clears, or clears without it).
    target.goldenSpatula = target.tiersCleared >= FOOD_FRENZY_TOTAL_TIERS
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
