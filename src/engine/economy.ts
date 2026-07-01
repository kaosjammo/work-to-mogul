// ============================================================
//  Pure economy formulas. No React, no Zustand, no I/O.
//  These encode the entire economic model and are unit-tested directly.
// ============================================================
import type {
  BusinessDef,
  BuyMode,
  EconomyMultipliers,
  GameState,
  IndustryId,
  Num,
} from '../types/domain'
import { INDUSTRIES, INDUSTRY_ORDER } from '../content/industries'
import { UPGRADES } from '../content/upgrades'
import { talentEconomy } from './talents'
import { founderProfitMult, founderSpeedMult } from './founderPerks'
import { foodRushSpeedMult, FOOD_INDUSTRY_ID } from './rushHour'
import { logisticsDispatchProfitMult, LOGISTICS_INDUSTRY_ID } from './logistics'
import { mogulStoryBoostMult } from './angelDeal'
import { eventProfitMult, eventSpeedMult } from './eventCards'

// ----- Cost scaling -----

/** Cost of the next single unit given how many are already owned. */
export function unitCost(def: BusinessDef, owned: number): Num {
  return def.baseCost * Math.pow(def.growthRate, owned)
}

/** Total cost to buy `q` units starting from `owned` (closed-form geometric series). */
export function totalCost(def: BusinessDef, owned: number, q: number): Num {
  if (q <= 0) return 0
  const r = def.growthRate
  const first = def.baseCost * Math.pow(r, owned)
  return (first * (Math.pow(r, q) - 1)) / (r - 1)
}

/** Largest integer q such that totalCost(owned, q) × costMult <= cash.
 *  `costMult` is the buyer's combined cost reduction (resolveBusiness.buyCostMult) —
 *  purchase() charges the discounted total, so Buy Max must count with it too. */
export function maxAffordable(def: BusinessDef, owned: number, cash: Num, costMult = 1): number {
  const r = def.growthRate
  const effectiveCash = costMult > 0 ? cash / costMult : cash
  const first = def.baseCost * Math.pow(r, owned)
  if (effectiveCash < first) return 0
  const q = Math.log((effectiveCash * (r - 1)) / first + 1) / Math.log(r)
  return Math.max(0, Math.floor(q + 1e-9)) // epsilon guards float drift at boundaries
}

/** Resolve a buy mode into a desired quantity (cost-checked separately). */
export function resolveQuantity(
  mode: BuyMode,
  def: BusinessDef,
  owned: number,
  cash: Num,
  costMult = 1,
): number {
  if (mode === 'max') return maxAffordable(def, owned, cash, costMult)
  return mode === 'x1' ? 1 : mode === 'x10' ? 10 : 100
}

// ----- Milestones (derived from owned, never mutated onto state) -----

export interface AppliedMilestones {
  profit: number
  speed: number
  costRed: number
  reachedIds: string[]
}

export function appliedMilestones(def: BusinessDef, owned: number): AppliedMilestones {
  let profit = 1
  let speed = 1
  let costRed = 1
  const reachedIds: string[] = []
  for (const m of def.milestones) {
    if (owned >= m.threshold) {
      reachedIds.push(m.id)
      if (m.effect.kind === 'profitMult') profit *= m.effect.factor
      else if (m.effect.kind === 'speedMult') speed *= m.effect.factor
      else costRed *= m.effect.factor
    }
  }
  return { profit, speed, costRed, reachedIds }
}

/** The next milestone a business hasn't reached yet (for UI hints), or null. */
export function nextMilestone(def: BusinessDef, owned: number) {
  return def.milestones.find((m) => owned < m.threshold) ?? null
}

// ----- Industry specialisation -----

export function totalOwnedInIndustry(state: GameState, industryId: IndustryId): number {
  const ind = INDUSTRIES[industryId]
  if (!ind) return 0
  let total = 0
  for (const bid of ind.businessIds) total += state.businesses[bid]?.owned ?? 0
  return total
}

// Signature perks unlocked at 500 owned in an industry — one per industry, applied
// on top of the generic ×2 tier. Data-driven (vs a hard-coded if-chain) so every
// industry's perk actually does something; `content.test` guards against dead perks.
export const SIGNATURE_PERKS: Record<string, { profit?: number; speed?: number }> = {
  rush_hour: { speed: 2 }, // Food — fast cycles
  franchise: { profit: 1.5 }, // Retail — the chain scales
  network_effect: { profit: 1.25 }, // Tech — audience compounds
  // Finance's `compound_interest` is now a FELT mechanic, not a flat perk: its profit
  // COMPOUNDS the longer Finance runs (see financeCompoundMult). This value is the
  // ramp's cap/peak (mean over a run ≈ the old flat ×1.5) — it's read by the mechanic,
  // and industryMultipliers no longer applies it as a flat 500-owned bonus.
  compound_interest: { profit: 2 }, // Finance — wealth compounds over time (ramp cap)
  just_in_time: { speed: 2 }, // Logistics — lean, fast turnaround
  grid_surge: { profit: 1.5 }, // Energy — peak-demand pricing
  moonshot: { profit: 2 }, // Space — high-variance payoff
  // Quantum's `superposition` is a FELT mechanic (see quantumSuperpositionMult): profit
  // sits at ×1 but periodically "collapses" into a big jackpot. This value is the mean
  // over a cycle (≈ the old shared moonshot ×2); read by the mechanic, not applied flat.
  superposition: { profit: 2 }, // Quantum — deterministic collapse jackpots (mean ×2)
}

// ----- Late-game pacing dampener -----
// A RUNTIME profit multiplier (≤ 1) applied to the higher industry tiers, layered on
// top of the economy exactly like milestones/industry bonuses. It deliberately does
// NOT touch the base revenue/cost curve, so the income-efficiency monotonicity
// invariant (balance.test) is untouched — advancing is still always an upgrade, the
// late tiers just climb more slowly. This implements the "slow the mid/late game
// significantly" directive in a tunable, measurable way (the harness sees it because
// the bot reaches these tiers); INDUSTRY_ORDER is ascending entry-cost order, so the
// index is the progression tier. Tunable: raise the rate / lower the start for more.
const LATE_DAMPEN_START_TIER = 3 // Logistics onward (mid-late game) gets dampened
const LATE_DAMPEN_PER_TIER = 0.15 // each tier past the start earns ×0.85 (compounding)

export function lateGameDampen(industryId: IndustryId): number {
  const tier = INDUSTRY_ORDER.indexOf(industryId)
  const past = tier - LATE_DAMPEN_START_TIER
  if (past <= 0) return 1
  return Math.pow(1 - LATE_DAMPEN_PER_TIER, past)
}

// ----- Finance's signature: Compound Interest (a passive-DYNAMIC profit ramp) -----
// Finance income actually *compounds* the longer the industry runs this run: a profit
// multiplier that ramps 1.0 → cap over FINANCE_COMPOUND_RAMP_MS of Finance runtime,
// then holds. This REPLACES the old flat ×1.5 signature perk (mean over a run ≈ the old
// ×1.5, so no power creep); the cap is read from SIGNATURE_PERKS so the table stays the
// source of truth. Deterministic (time-accumulated, no RNG). Resets on prestige (fresh
// initialGameState). A different mechanic *shape* from Food's tap-window, by design.
export const FINANCE_INDUSTRY_ID = 'finance'
export const FINANCE_COMPOUND_RAMP_MS = 90 * 60_000 // ~90 min of Finance runtime to reach the cap

/** Finance's current compound profit multiplier (1.0 → cap as `financeCompoundMs` grows). */
export function financeCompoundMult(state: GameState): number {
  const cap = SIGNATURE_PERKS.compound_interest?.profit ?? 2
  const t = Math.min(1, Math.max(0, (state.financeCompoundMs ?? 0) / FINANCE_COMPOUND_RAMP_MS))
  return 1 + (cap - 1) * t
}

/** Does the player own any Finance business? (Gate for accruing the compound.) */
export function ownsFinance(state: GameState): boolean {
  const ids = INDUSTRIES[FINANCE_INDUSTRY_ID]?.businessIds ?? []
  for (const id of ids) if ((state.businesses[id]?.owned ?? 0) > 0) return true
  return false
}

// ----- Quantum's signature: Superposition (deterministic collapse jackpots) -----
// Quantum profit normally sits at ×1, but on a DETERMINISTIC cadence it "collapses"
// into a big ×COLLAPSE jackpot for a short window — a high-variance-*feeling* rhythm
// (no RNG). Duty cycle is tuned so the mean over a cycle ≈ the old shared moonshot ×2,
// giving Quantum its own identity instead of borrowing Space's. A third distinct
// mechanic *shape* (fast auto-oscillation) vs Food's tap-window and Finance's slow ramp.
export const QUANTUM_INDUSTRY_ID = 'quantum'
export const SUPERPOSITION_CYCLE_MS = 60_000 // one collapse cycle
export const SUPERPOSITION_COLLAPSE_MS = 7_500 // the jackpot window within a cycle (12.5%)
export const SUPERPOSITION_COLLAPSE_MULT = 9 // ×9 during a collapse → mean ≈ ×2 over the cycle

/** Is Quantum currently in a "collapse" jackpot window? */
export function quantumCollapsing(state: GameState): boolean {
  return (state.quantumPhaseMs ?? 0) < SUPERPOSITION_COLLAPSE_MS
}

/** Quantum's current profit multiplier — ×COLLAPSE during a collapse, ×1 otherwise. */
export function quantumSuperpositionMult(state: GameState): number {
  return quantumCollapsing(state) ? SUPERPOSITION_COLLAPSE_MULT : 1
}

/** Does the player own any Quantum business? (Gate for advancing the phase.) */
export function ownsQuantum(state: GameState): boolean {
  const ids = INDUSTRIES[QUANTUM_INDUSTRY_ID]?.businessIds ?? []
  for (const id of ids) if ((state.businesses[id]?.owned ?? 0) > 0) return true
  return false
}

// ----- Space's signature bolt-on: the Salvage Shooter campaign -----
// The rare 5-stage arcade mini-game (engine/spaceShooter.ts) feeds back into the
// idle economy through Space-only profit: a short TIMED run-reward buff, plus two
// small PERMANENT perks earned late in the campaign. Read-only helpers live here
// (next to the other industry-signature reads) so economy.ts never imports the
// shooter engine — the shooter engine imports these, keeping the graph acyclic.
export const SPACE_INDUSTRY_ID = 'space'
/** Stage 4 reward — the Orbital Salvage Yard: a small permanent Space profit perk. */
export const SALVAGE_YARD_SPACE_PROFIT = 1.05
/** Stage 5 reward — the AI Salvage Pilot: a small permanent Space profit perk. */
export const AI_PILOT_SPACE_PROFIT = 1.1

/** Does the player own any Space business? (Gate for salvage offers + AI pilot.) */
export function ownsSpace(state: GameState): boolean {
  const ids = INDUSTRIES[SPACE_INDUSTRY_ID]?.businessIds ?? []
  for (const id of ids) if ((state.businesses[id]?.owned ?? 0) > 0) return true
  return false
}

/** Space-only profit multiplier from the Salvage campaign: a timed run-reward buff
 *  × the permanent Orbital-Yard / AI-Pilot perks. 1 when nothing is active/unlocked.
 *  Pure (no `now`) — the buff runs on a countdown decremented by tickSpaceShooter.
 *  `steady` folds only the permanent perks (see EconomyFoldOptions). */
export function spaceSalvageProfitMult(state: GameState, steady = false): number {
  const s = state.spaceShooter
  if (!s) return 1
  let m = 1
  if (!steady && (s.buffMsLeft ?? 0) > 0) m *= s.buffMult || 1
  if (s.orbitalYardUnlocked) m *= SALVAGE_YARD_SPACE_PROFIT
  if (s.aiPilotUnlocked) m *= AI_PILOT_SPACE_PROFIT
  return m
}

// ----- Fold options -----
// `steady: true` prices the economy at its FAIR LONG-RUN rate: short activity-
// triggered buffs (Golden frenzy, Rush Hour, dispatch surges, event cards, Mogul
// boosts, the timed salvage buff) are excluded and Quantum's collapse oscillator is
// replaced by its cycle mean. Used wherever a rate is multiplied over a long span —
// offline catch-up and every "N seconds/hours of income" reward — so a 20-second
// buff can never multiply a 2-hour payout. The live tick and the HUD use the
// default (transients included).
export interface EconomyFoldOptions {
  steady?: boolean
}

/** Industry-wide profit/speed multipliers from base bonus + specialisation thresholds. */
export function industryMultipliers(
  state: GameState,
  industryId: IndustryId,
  opts?: EconomyFoldOptions,
) {
  const ind = INDUSTRIES[industryId]
  let profit = ind?.bonus.globalProfitMult ?? 1
  let speed = ind?.bonus.globalSpeedMult ?? 1
  // Specialisation tiers: a strong early ×1.5 at 100, then gentler ×1.5 steps at
  // 250/500 (was ×2 each) so deeply maxing an industry climbs more slowly — part of
  // the late-game slowdown. (Was ×1.5 ×2 ×2 = ×6 maxed; now ×1.5 ×1.5 ×1.5 = ×3.4.)
  const total = totalOwnedInIndustry(state, industryId)
  if (total >= 100) profit *= 1.5
  if (total >= 250) profit *= 1.5
  if (total >= 500) {
    profit *= 1.5
    // Signature perk at the deep specialisation threshold. Finance's `compound_interest`
    // is skipped here — it's a time-ramp mechanic applied below, not a flat 500-owned bonus.
    const perkId = ind?.bonus.signaturePerkId
    const perk = perkId ? SIGNATURE_PERKS[perkId] : undefined
    // compound_interest (Finance) and superposition (Quantum) are FELT mechanics applied
    // below, not flat 500-owned bonuses. Everything else applies here as before.
    if (perk && perkId !== 'compound_interest' && perkId !== 'superposition') {
      profit *= perk.profit ?? 1
      speed *= perk.speed ?? 1
    }
  }
  // Finance's signature: income compounds the longer the industry has been running.
  // (A slow persistent ramp, not a transient buff — it folds in steady mode too.)
  if (industryId === FINANCE_INDUSTRY_ID) profit *= financeCompoundMult(state)
  // Quantum's signature: profit periodically collapses into a jackpot. Steady folds
  // use the cycle MEAN (the perk table's value) instead of the instantaneous phase.
  if (industryId === QUANTUM_INDUSTRY_ID) {
    profit *= opts?.steady
      ? SIGNATURE_PERKS.superposition?.profit ?? 1
      : quantumSuperpositionMult(state)
  }
  return { profit, speed }
}

// ----- Prestige -----

// Prestige is denominated in lifetime earnings, which the efficiency rebalance
// inflated by many orders of magnitude (top-tier revenue had to rise to keep
// efficiency monotonic). PRESTIGE_SCALE re-anchors the sqrt curve so first-prestige
// lands at a sane point and token yield stays in the tens–hundreds, not millions.
// NOTE: provisional — final value belongs with the broader cost rescale (upgrades,
// employees, contracts are still priced on the old dollar scale).
export const PRESTIGE_SCALE = 1e15

// Token-yield curve exponent. Was 0.5 (sqrt), which exploded — late-game lifetimes
// (1e30+) minted hundreds of millions of tokens per ascension, trivialising the
// talent tree. 0.2 (fifth-root) stopped the blowup but OVER-corrected: the
// progression sim showed run yield stuck at ~5/run, the tree crawling, and the deep
// Mastery sink unreachable (26 cum tokens vs 50 for rank 1) — a flat, unrewarding
// prestige loop. 0.25 (fourth-root) is the measured middle ground: run #1 still banks
// 1 token (small first ascension preserved), but late runs yield enough that the tree
// fills as a satisfying journey and surplus tokens reach the uncapped Mastery talents,
// so each ascension visibly accelerates the next run without re-opening the blowup.
export const PRESTIGE_YIELD_EXP = 0.26

/** Prestige points earned for a given lifetime earnings (gentle fifth-root scaling). */
export function prestigePointsFor(lifetimeEarnings: Num): number {
  return Math.floor(Math.pow(Math.max(0, lifetimeEarnings) / PRESTIGE_SCALE, PRESTIGE_YIELD_EXP))
}

export const PRESTIGE_UNLOCK_LIFETIME = PRESTIGE_SCALE

// ----- Combined economy multipliers (milestone × industry × prestige × upgrades) -----

/** Temporary all-business profit multiplier from a claimed Golden Deal's "Profit Rush". */
export const PROFIT_FRENZY_MULT = 2

export function economyMultipliers(
  state: GameState,
  def: BusinessDef,
  opts?: EconomyFoldOptions,
): EconomyMultipliers {
  const owned = state.businesses[def.id]?.owned ?? 0
  const steady = opts?.steady === true
  const ms = appliedMilestones(def, owned)
  const ind = industryMultipliers(state, def.industryId, opts)
  const up = upgradeMultipliers(state, def)
  const tal = talentEconomy(state) // prestige talent tree (replaces flat +2%/token)
  // A claimed Golden Deal briefly multiplies all profit (read inline to avoid an
  // import cycle with engine/golden). Bounded + active-play only → harness-safe.
  const frenzy = !steady && (state.golden?.frenzyMsLeft ?? 0) > 0 ? PROFIT_FRENZY_MULT : 1
  const lateDampen = lateGameDampen(def.industryId) // slows the higher tiers (≤ 1)
  // Food's "Rush Hour" signature: a claimed surge multiplies Food speed (1 otherwise).
  const rush = !steady && def.industryId === FOOD_INDUSTRY_ID ? foodRushSpeedMult(state) : 1
  // Logistics' "Just-In-Time Dispatch" signature: a released surge multiplies Logistics
  // profit for a short window (1 otherwise). Opt-in + bot-inert → harness byte-identical.
  const dispatch =
    !steady && def.industryId === LOGISTICS_INDUSTRY_ID ? logisticsDispatchProfitMult(state) : 1
  // Event cards: a resolved card's timed all-business profit/speed buff (1 when none).
  const evProfit = steady ? 1 : eventProfitMult(state)
  const evSpeed = steady ? 1 : eventSpeedMult(state)
  // Mogul Stories: a timed post-deal profit boost/debuff on the resolved story's industry
  // (×1 until the player plays a story → harness-safe). The Startup Combinator is now a
  // standalone business, not a multiplier.
  const mogul = steady ? 1 : mogulStoryBoostMult(state, def.industryId)
  // Space Salvage Shooter: a Space-only timed run-reward buff × permanent campaign
  // perks (Orbital Yard, AI Pilot). 1 for non-Space and until anything is earned.
  // Opt-in + bot-inert (the harness never plays the shooter) → harness-safe.
  const salvage = def.industryId === SPACE_INDUSTRY_ID ? spaceSalvageProfitMult(state, steady) : 1
  return {
    profit:
      ms.profit * ind.profit * tal.profit * up.profit * frenzy * founderProfitMult(state) * lateDampen * dispatch * evProfit * mogul * salvage,
    speed: ms.speed * ind.speed * tal.speed * up.speed * founderSpeedMult(state) * rush * evSpeed,
    baseCostFactor: ms.costRed * tal.costReduc * up.costRed,
  }
}

// Upgrades fold in here (populated in M5; safe no-op until then).
function upgradeMultipliers(state: GameState, def: BusinessDef) {
  let profit = 1
  let speed = 1
  let costRed = 1
  for (const id of state.upgradesPurchased) {
    const up = UPGRADE_LOOKUP[id]
    if (!up) continue
    const inScope =
      up.scope.kind === 'global' ||
      (up.scope.kind === 'industry' && up.scope.industryId === def.industryId) ||
      (up.scope.kind === 'business' && up.scope.businessId === def.id)
    if (!inScope) continue
    if (up.effect.kind === 'profitMult') profit *= up.effect.factor
    else if (up.effect.kind === 'speedMult') speed *= up.effect.factor
    else costRed *= up.effect.factor
  }
  return { profit, speed, costRed }
}

const UPGRADE_LOOKUP = UPGRADES
