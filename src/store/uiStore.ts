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
  pushCelebrations: (msgs) => set((s) => ({ celebrations: [...s.celebrations, ...msgs] })),
  shiftCelebration: () => set((s) => ({ celebrations: s.celebrations.slice(1) })),
  accountOpen: false,
  openAccount: () => set({ accountOpen: true }),
  closeAccount: () => set({ accountOpen: false }),
  spaceShooterOpen: false,
  openSpaceShooter: () => set({ spaceShooterOpen: true }),
  closeSpaceShooter: () => set({ spaceShooterOpen: false }),
  tabConflict: false,
  setTabConflict: (tabConflict) => set({ tabConflict }),
}))
