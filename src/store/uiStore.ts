// Ephemeral UI-only state (not persisted, not part of the sim).
import { create } from 'zustand'
import type { BusinessId } from '../types/domain'

export interface WelcomeBack {
  earned: number
  elapsedMs: number
}

interface UiStore {
  assignmentBusinessId: BusinessId | null
  openAssignment: (id: BusinessId) => void
  closeAssignment: () => void
  welcomeBack: WelcomeBack | null
  setWelcomeBack: (w: WelcomeBack) => void
  dismissWelcomeBack: () => void
  celebrations: string[]
  pushCelebrations: (msgs: string[]) => void
  shiftCelebration: () => void
}

export const useUiStore = create<UiStore>((set) => ({
  assignmentBusinessId: null,
  openAssignment: (id) => set({ assignmentBusinessId: id }),
  closeAssignment: () => set({ assignmentBusinessId: null }),
  welcomeBack: null,
  setWelcomeBack: (welcomeBack) => set({ welcomeBack }),
  dismissWelcomeBack: () => set({ welcomeBack: null }),
  celebrations: [],
  pushCelebrations: (msgs) => set((s) => ({ celebrations: [...s.celebrations, ...msgs] })),
  shiftCelebration: () => set((s) => ({ celebrations: s.celebrations.slice(1) })),
}))
