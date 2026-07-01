// ============================================================
//  Save manager — localStorage persistence. Loads on startup, autosaves on an
//  interval and on tab hide/close. All storage access is guarded (Safari
//  private mode / quota can throw) so the game keeps running in-memory.
// ============================================================
import { getEngineState, setEngineState } from '../engine/engineState'
import { resetPublishTracking } from '../loop/publisher'
import { serialize, deserialize, SAVE_KEY, type SaveEnvelope } from './serialize'

const AUTOSAVE_MS = 20_000
let timer: ReturnType<typeof setInterval> | null = null
let listenersAttached = false
// While another tab owns the game (tab-guard takeover), this tab must not write
// the save — its state is stale and a late write would clobber the active tab.
let savingPaused = false

export function pauseSaving(): void {
  savingPaused = true
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

export function resumeSaving(): void {
  savingPaused = false
  startAutosave()
}

export function isSavingPaused(): boolean {
  return savingPaused
}

// Optional hook fired after every successful local save (used by cloud sync to
// piggyback an upload on autosave). Decoupled so the engine never imports cloud.
let afterSaveHook: (() => void) | null = null
export function setAfterSave(fn: (() => void) | null): void {
  afterSaveHook = fn
}

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
  if (savingPaused) return // another tab owns the game — never clobber its save
  try {
    localStorage.setItem(SAVE_KEY, serialize(getEngineState(), Date.now()))
  } catch {
    // Quota / private mode — keep playing in-memory.
  }
  afterSaveHook?.() // e.g. debounced cloud upload when signed in
}

export interface SaveSummary {
  savedAt: number
  cash: number
  lifetime: number
}

/** A fresh envelope of the live engine state (savedAt = now). For cloud upload. */
export function snapshotEnvelope(): SaveEnvelope {
  return JSON.parse(serialize(getEngineState(), Date.now())) as SaveEnvelope
}

/** The current localStorage envelope, or null. For conflict comparison. */
export function readLocalEnvelope(): SaveEnvelope | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    return raw ? (JSON.parse(raw) as SaveEnvelope) : null
  } catch {
    return null
  }
}

/** Load an arbitrary envelope (e.g. from cloud) into the engine + persist it. */
export function applyEnvelope(obj: unknown): boolean {
  const state = deserialize(JSON.stringify(obj))
  if (!state) return false
  setEngineState(state)
  // Re-sync toast tracking to the restored state — without this, a cloud restore
  // with more unlocked achievements queues a toast (+ haptic) for every OLD unlock.
  resetPublishTracking()
  saveGame()
  return true
}

/** Defensive at-a-glance summary of an envelope for the conflict chooser. */
export function summarizeEnvelope(obj: unknown): SaveSummary | null {
  if (!obj || typeof obj !== 'object') return null
  const env = obj as { savedAt?: unknown; state?: { cash?: unknown; lifetimeEarnings?: unknown } }
  const state = env.state
  if (!state || typeof state !== 'object') return null
  return {
    savedAt: typeof env.savedAt === 'number' ? env.savedAt : 0,
    cash: typeof state.cash === 'number' ? state.cash : 0,
    lifetime: typeof state.lifetimeEarnings === 'number' ? state.lifetimeEarnings : 0,
  }
}

export function startAutosave(): void {
  if (!timer && !savingPaused) timer = setInterval(saveGame, AUTOSAVE_MS)
  if (listenersAttached) return // resumeSaving() re-enters — never stack listeners
  listenersAttached = true
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
