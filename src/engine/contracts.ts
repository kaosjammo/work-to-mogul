// ============================================================
//  Contracts engine — progress metrics + claim/rotate logic (pure over
//  GameState). Progress is recomputed live from state (like achievements);
//  claiming a completed contract grants its Empire Tokens and deals the next
//  contract from the ordered pool into the freed board slot.
// ============================================================
import type { ContractsState, GameState } from '../types/domain'
import {
  CONTRACTS,
  CONTRACT_BY_ID,
  CONTRACT_BOARD_SIZE,
  type ContractDef,
  type ContractMetric,
} from '../content/contracts'
import { BUSINESSES } from '../content/businesses'
import { resolveBusiness } from './resolveBusiness'

export function initialContractsState(): ContractsState {
  return {
    active: CONTRACTS.slice(0, CONTRACT_BOARD_SIZE).map((c) => c.id),
    nextIndex: Math.min(CONTRACT_BOARD_SIZE, CONTRACTS.length),
  }
}

/**
 * Deal pool contracts into free board slots (never re-dealing something already
 * on the board). The ONE board-dealing rule — claimContract deals singles through
 * the same pool pointer; the save loader calls this after a content change
 * removed active ids, so persistence never grows its own (drifting) dealer.
 */
export function refillBoard(c: ContractsState): void {
  while (c.active.length < CONTRACT_BOARD_SIZE && c.nextIndex < CONTRACTS.length) {
    const candidate = CONTRACTS[c.nextIndex++].id
    if (!c.active.includes(candidate)) c.active.push(candidate)
  }
}

/** Current value of a contract's tracked metric. */
export function contractMetric(state: GameState, metric: ContractMetric): number {
  switch (metric) {
    case 'totalOwned': {
      let n = 0
      for (const id in state.businesses) n += state.businesses[id].owned
      return n
    }
    case 'employees':
      return Object.keys(state.employees).length
    case 'lifetime':
      return state.lifetimeEarnings
    case 'industries': {
      const set = new Set<string>()
      for (const id in state.businesses) {
        if (state.businesses[id].owned > 0) set.add(BUSINESSES[id].industryId)
      }
      return set.size
    }
    case 'automated': {
      let n = 0
      for (const id in state.businesses) {
        const bs = state.businesses[id]
        if (bs.unlocked && bs.owned > 0 && resolveBusiness(state, BUSINESSES[id]).isAutomated) n++
      }
      return n
    }
  }
}

export function contractProgress(state: GameState, def: ContractDef): number {
  return contractMetric(state, def.metric)
}

export function isContractComplete(state: GameState, def: ContractDef): boolean {
  return contractProgress(state, def) >= def.target
}

/**
 * Claim a completed contract: grant its tokens, remove it from the board, and
 * deal the next pool contract into the freed slot. Returns the tokens granted
 * (0 if the contract isn't on the board or isn't complete). Mutates state.
 */
export function claimContract(state: GameState, id: string): number {
  const c = state.contracts
  const idx = c.active.indexOf(id)
  if (idx < 0) return 0
  const def = CONTRACT_BY_ID[id]
  if (!def || !isContractComplete(state, def)) return 0

  state.prestige.totalPoints += def.rewardTokens
  c.active.splice(idx, 1)
  if (c.nextIndex < CONTRACTS.length) {
    c.active.push(CONTRACTS[c.nextIndex].id)
    c.nextIndex++
  }
  return def.rewardTokens
}
