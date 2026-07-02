// Ephemeral UI-only state (not persisted, not part of the sim).
import { create } from 'zustand'
import type { BusinessId } from '../types/domain'
import { useSettingsStore } from './settingsStore'

export interface WelcomeBack {
  earned: number
  elapsedMs: number
}

/** A transient "+$X" pop that rises and fades at a screen point (tap juice). */
export interface FloatItem {
  id: number
  x: number
  y: number
  text: string
}

let floatSeq = 0

interface UiStore {
  assignmentBusinessId: BusinessId | null
  openAssignment: (id: BusinessId) => void
  closeAssignment: () => void
  floats: FloatItem[]
  spawnFloat: (x: number, y: number, text: string) => void
  removeFloat: (id: number) => void
  welcomeBack: WelcomeBack | null
  setWelcomeBack: (w: WelcomeBack) => void
  dismissWelcomeBack: () => void
  ascension: { tokens: number } | null // a just-completed prestige, for the celebration overlay
  setAscension: (tokens: number) => void
  dismissAscension: () => void
  celebrations: string[]
  pushCelebrations: (msgs: string[]) => void
  shiftCelebration: () => void
  accountOpen: boolean
  openAccount: () => void
  closeAccount: () => void
  // Space Salvage Shooter — is the fullscreen mini-game modal open? (UI-only; the
  // campaign PROGRESS lives in engine state, this is just the open/closed flag.)
  spaceShooterOpen: boolean
  openSpaceShooter: () => void
  closeSpaceShooter: () => void
  // Lunch Rush — is the fullscreen mini-game modal open? (UI-only flag, same deal.)
  foodFrenzyOpen: boolean
  openFoodFrenzy: () => void
  closeFoodFrenzy: () => void
  // Automation config modal ('invest' | 'staff' | null → closed).
  automationTab: 'invest' | 'staff' | null
  openAutomation: (tab: 'invest' | 'staff') => void
  closeAutomation: () => void
  // Another tab took over the save — this tab is paused behind a blocking overlay.
  tabConflict: boolean
  setTabConflict: (v: boolean) => void
}

export const useUiStore = create<UiStore>((set) => ({
  assignmentBusinessId: null,
  openAssignment: (id) => set({ assignmentBusinessId: id }),
  closeAssignment: () => set({ assignmentBusinessId: null }),
  floats: [],
  spawnFloat: (x, y, text) => {
    if (!useSettingsStore.getState().effects) return // player disabled the pops
    set((s) => {
      const next = [...s.floats, { id: ++floatSeq, x, y, text }]
      // Cap the live count so rapid taps can't grow the array unbounded.
      return { floats: next.length > 24 ? next.slice(next.length - 24) : next }
    })
  },
  removeFloat: (id) => set((s) => ({ floats: s.floats.filter((f) => f.id !== id) })),
  welcomeBack: null,
  setWelcomeBack: (welcomeBack) => set({ welcomeBack }),
  dismissWelcomeBack: () => set({ welcomeBack: null }),
  ascension: null,
  setAscension: (tokens) => set({ ascension: { tokens } }),
  dismissAscension: () => set({ ascension: null }),
  celebrations: [],
  pushCelebrations: (msgs) =>
    set((s) => {
      // Each toast shows ~2.5s, so an unbounded queue reads as "stuck": a single
      // Max buy of a high-count business crosses many milestone thresholds at once,
      // and exits/achievements can pile on. Drop consecutive duplicates and cap the
      // backlog so a burst clears in seconds, not a minute.
      const next = [...s.celebrations]
      for (const m of msgs) {
        if (next.length > 0 && next[next.length - 1] === m) continue // no repeats back-to-back
        next.push(m)
      }
      // Keep the CURRENTLY-showing toast (index 0) plus the most-recent few, so a
      // flood collapses to a short, current tail instead of a stale minute-long queue.
      const MAX = 5
      if (next.length > MAX) return { celebrations: [next[0], ...next.slice(next.length - (MAX - 1))] }
      return { celebrations: next }
    }),
  shiftCelebration: () => set((s) => ({ celebrations: s.celebrations.slice(1) })),
  accountOpen: false,
  openAccount: () => set({ accountOpen: true }),
  closeAccount: () => set({ accountOpen: false }),
  spaceShooterOpen: false,
  openSpaceShooter: () => set({ spaceShooterOpen: true }),
  closeSpaceShooter: () => set({ spaceShooterOpen: false }),
  foodFrenzyOpen: false,
  openFoodFrenzy: () => set({ foodFrenzyOpen: true }),
  closeFoodFrenzy: () => set({ foodFrenzyOpen: false }),
  automationTab: null,
  openAutomation: (automationTab) => set({ automationTab }),
  closeAutomation: () => set({ automationTab: null }),
  tabConflict: false,
  setTabConflict: (tabConflict) => set({ tabConflict }),
}))
