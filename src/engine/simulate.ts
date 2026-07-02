// ============================================================
//  applyTick — the fixed-timestep simulation step (pure over GameState).
// ============================================================
import type { GameState, UnlockCondition } from '../types/domain'
import { BUSINESSES, COMBINATOR_ID } from '../content/businesses'
import { resolveBusiness } from './resolveBusiness'
import {
  totalOwnedInIndustry,
  ownsFinance,
  FINANCE_COMPOUND_RAMP_MS,
  ownsQuantum,
  SUPERPOSITION_CYCLE_MS,
} from './economy'
import { applyCareerTick } from './career'
import { moraleEquilibrium, auditReduction } from './employees/composition'
import { checkAchievements } from './achievements'
import { tickGolden } from './golden'
import { tickRushHour } from './rushHour'
import { tickLogistics } from './logistics'
import { tickAngelDeal, tickCombinatorExit } from './angelDeal'
import { applyMarriageUpkeep } from './romance'
import { tickAutomation } from './automation'
import { tickEventCards } from './eventCards'
import { tickMomentum } from './momentum'
import { tickSpaceShooter } from './spaceShooter'
import { tickFoodFrenzy } from './foodFrenzy'

/** Morale eases toward its equilibrium with ~20s time constant. */
const MORALE_DRIFT_PER_MS = 1 / 20000

/** Risk builds 0→100 over ~90s (before auditors), then fires a ~30s event. */
const RISK_ACCRUAL_PER_MS = 100 / 90000
const RISK_EVENT_MS = 30000

/** Marks a manual cycle as "running" so applyTick will advance it. */
export const START_EPSILON = 1

/** Above this many cycles in one batch, use expected value instead of rolling each. */
const CRIT_ROLL_LIMIT = 20

function addCash(state: GameState, amount: number): void {
  if (!Number.isFinite(amount) || amount <= 0) return
  state.cash += amount
  state.lifetimeEarnings += amount
}

/**
 * Total payout for `cycles` completed cycles, applying critical hits.
 * Small batches roll per-cycle (real variance/excitement); large batches use
 * the expected value to stay cheap. rng is injectable for deterministic tests.
 */
export function payoutWithCrit(
  revenuePerCycle: number,
  cycles: number,
  critChance: number,
  critMult: number,
  rng: () => number,
): number {
  if (cycles <= 0) return 0
  if (critChance <= 0) return revenuePerCycle * cycles
  if (cycles <= CRIT_ROLL_LIMIT) {
    let total = 0
    for (let i = 0; i < cycles; i++) {
      total += rng() < critChance ? revenuePerCycle * critMult : revenuePerCycle
    }
    return total
  }
  // Expected value for large batches.
  return revenuePerCycle * cycles * (1 + critChance * (critMult - 1))
}

export function applyTick(state: GameState, dtMs: number, rng: () => number = Math.random): void {
  // Work/Career: the early-game manual income source.
  applyCareerTick(state, dtMs)

  // Snapshot for the marriage upkeep: the sink takes a share of BUSINESS income
  // earned this tick (married-only → the sim bot never reaches the branch).
  const cashBeforeBusinesses = state.cash

  for (const id in state.businesses) {
    const bs = state.businesses[id]
    if (!bs.unlocked || bs.owned <= 0) continue
    const def = BUSINESSES[id]

    // Morale eases toward its equilibrium (raised by assigned HR staff).
    const eq = moraleEquilibrium(state, def, bs)
    bs.morale = Math.max(0, Math.min(100, bs.morale + (eq - bs.morale) * MORALE_DRIFT_PER_MS * dtMs))

    // Risk (volatile / Finance businesses): build up, then fire a dampening event.
    if (def.riskEnabled) {
      if (bs.riskEventMsLeft > 0) {
        bs.riskEventMsLeft = Math.max(0, bs.riskEventMsLeft - dtMs)
      } else {
        const reduce = auditReduction(state, def, bs)
        bs.risk += RISK_ACCRUAL_PER_MS * dtMs * Math.max(0, 1 - reduce)
        if (bs.risk >= 100) {
          bs.risk = 0
          bs.riskEventMsLeft = RISK_EVENT_MS
        }
      }
    }

    const r = resolveBusiness(state, def)

    const running = r.isAutomated || bs.cycleProgressMs > 0
    if (!running) continue

    bs.cycleProgressMs += dtMs
    if (bs.cycleProgressMs < r.cycleMs) continue

    if (r.isAutomated) {
      // Pay every cycle that completed this tick (rule #2), carry the remainder.
      const cycles = Math.floor(bs.cycleProgressMs / r.cycleMs)
      bs.cycleProgressMs -= cycles * r.cycleMs
      addCash(state, payoutWithCrit(r.revenuePerCycle, cycles, r.critChance, r.critMult, rng))
    } else {
      // Manual: one cycle per tap, then stop.
      addCash(state, payoutWithCrit(r.revenuePerCycle, 1, r.critChance, r.critMult, rng))
      bs.cycleProgressMs = 0
    }
  }

  // 💍 Marriage upkeep — the spouse's lifestyle takes its share of what the
  // businesses just earned (player-opted money sink; never negative, no offline).
  applyMarriageUpkeep(state, state.cash - cashBeforeBusinesses)

  tickGolden(state, dtMs)
  tickRushHour(state, dtMs)
  tickLogistics(state, dtMs)
  tickEventCards(state, dtMs)
  tickMomentum(state, dtMs) // decays the Hot Streak; inert when there's no streak (bot)
  tickAngelDeal(state, dtMs)
  // Startup Combinator "exit" payouts — only compute its income when actually owned
  // (great-outcome reward; the sim bot never owns it, so this stays byte-identical).
  if (state.angelDeal.combinatorUnlocked && (state.businesses[COMBINATOR_ID]?.owned ?? 0) > 0) {
    tickCombinatorExit(state, resolveBusiness(state, BUSINESSES[COMBINATOR_ID]).pps, dtMs)
  }
  tickSpaceShooter(state, dtMs)
  tickFoodFrenzy(state, dtMs)
  // Finance's Compound Interest accrues while Finance is owned (capped at the ramp).
  if (ownsFinance(state)) {
    state.financeCompoundMs = Math.min(
      FINANCE_COMPOUND_RAMP_MS,
      (state.financeCompoundMs ?? 0) + dtMs,
    )
  }
  // Quantum's Superposition phase advances while Quantum is owned (wraps each cycle).
  if (ownsQuantum(state)) {
    state.quantumPhaseMs = ((state.quantumPhaseMs ?? 0) + dtMs) % SUPERPOSITION_CYCLE_MS
  }
  // Automation managers (EA auto-reinvest, Chief-of-Staff) — OFF by default, so
  // the harness bot never triggers them. Runs after income + upkeep so it spends
  // the tick's earnings, and BEFORE checkUnlocks so auto-bought units flip unlocks.
  tickAutomation(state, dtMs)
  checkUnlocks(state)
  checkAchievements(state)
}

/** Whether a passive unlock condition is currently satisfied. */
export function isUnlockMet(state: GameState, cond: UnlockCondition): boolean {
  switch (cond.kind) {
    case 'free':
      return true
    case 'businessOwned':
      return (state.businesses[cond.businessId]?.owned ?? 0) >= cond.count
    case 'industryProgress':
      return totalOwnedInIndustry(state, cond.industryId) >= cond.totalOwned
    case 'cash':
      // Industries unlock by explicit purchase, not passively — handled elsewhere.
      return false
  }
}

/** Flip passive business unlocks whose conditions are now met. */
export function checkUnlocks(state: GameState): void {
  for (const id in state.businesses) {
    const bs = state.businesses[id]
    if (bs.unlocked) continue
    const def = BUSINESSES[id]
    if (!state.industries[def.industryId]?.unlocked) continue
    if (isUnlockMet(state, def.unlock)) bs.unlocked = true
  }
}
