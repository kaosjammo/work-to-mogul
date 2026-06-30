// ============================================================
//  Save manager — localStorage persistence. Loads on startup, autosaves on an
//  interval and on tab hide/close. All storage access is guarded (Safari
//  private mode / quota can throw) so the game keeps running in-memory.
// ============================================================
import { getEngineState, setEngineState } from '../engine/engineState'
import { serialize, deserialize, SAVE_KEY } from './serialize'

const AUTOSAVE_MS = 20_000
let timer: ReturnType<typeof setInterval> | null = null

/** Load a saved game into the engine state if one exists and is valid. */
export function loadGame(): boolean {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(SAVE_KEY)
  } catch {
    return false
  }
  if (!raw) return false
  const state = deserialize(raw)
  if (!state) return false
  setEngineState(state)
  return true
}

export function saveGame(): void {
  try {
    localStorage.setItem(SAVE_KEY, serialize(getEngineState(), Date.now()))
  } catch {
    // Quota / private mode — keep playing in-memory.
  }
}

export function startAutosave(): void {
  if (timer) return
  timer = setInterval(saveGame, AUTOSAVE_MS)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveGame()
  })
  window.addEventListener('pagehide', saveGame)
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY)
  } catch {
    // ignore
  }
}
