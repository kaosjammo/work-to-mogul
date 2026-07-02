// ============================================================
//  resolveBusiness — the single seam where the economy layer and the
//  employee layer meet. Both the tick and the UI read its output.
// ============================================================
import type { BusinessDef, GameState, ResolvedBusiness } from '../types/domain'
import { economyMultipliers, type EconomyFoldOptions } from './economy'
import { computeEmployeeEffects, unlockedSlotCount } from './employees/composition'

export function resolveBusiness(
  state: GameState,
  def: BusinessDef,
  opts?: EconomyFoldOptions,
): ResolvedBusiness {
  const bs = state.businesses[def.id]
  const owned = bs?.owned ?? 0

  const econ = economyMultipliers(state, def, opts)
  const emp = computeEmployeeEffects(state, def, bs)

  // CRITICAL: revenue scales linearly with units owned (× owned), then
  // multiplicatively with every bonus source.
  const revenuePerCycle =
    def.baseRevenue *
    owned *
    (1 + emp.profitAdd) *
    emp.moraleScalar *
    (1 - emp.riskPenalty) *
    emp.focusBonus *
    econ.profit

  // Speed bonuses divide cycle time (faster = shorter cycle).
  const cycleMs = def.baseCycleMs / (1 + emp.speedAdd) / econ.speed

  const pps = cycleMs > 0 ? revenuePerCycle / (cycleMs / 1000) : 0

  return {
    cycleMs,
    revenuePerCycle,
    pps,
    buyCostMult: emp.buyCostMult * econ.baseCostFactor,
    isAutomated: emp.isAutomated || !!def.autoRun, // autoRun businesses (e.g. the Combinator fund) run without an Operator
    critChance: emp.critChance,
    critMult: emp.critMult,
    moraleScalar: emp.moraleScalar,
    riskPenalty: emp.riskPenalty,
    unlockedSlots: unlockedSlotCount(def, owned),
    activeSynergies: emp.activeSynergies,
  }
}
