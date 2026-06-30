// ============================================================
//  Canonical mutable game state. Lives OUTSIDE React.
//  The game loop mutates this 10×/sec; the Zustand store is a throttled view.
// ============================================================
import type { GameState } from '../types/domain'
import { initialGameState } from '../store/initialState'

let current: GameState = initialGameState()

export function getEngineState(): GameState {
  return current
}

export function setEngineState(next: GameState): void {
  current = next
}

export function resetEngineState(): void {
  current = initialGameState()
}
