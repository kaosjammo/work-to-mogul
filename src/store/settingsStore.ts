// Player preferences for feel/feedback (UI-only, persisted separately from the
// game save). Lets players turn the new juice (haptics, floating numbers) off if
// they find it distracting — satisfying for everyone, not just by default.
import { create } from 'zustand'

const KEY = 'tycoon:settings'

interface Settings {
  haptics: boolean
  effects: boolean // floating "+$" pops
}

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const p = JSON.parse(raw) as Partial<Settings>
      return { haptics: p.haptics !== false, effects: p.effects !== false }
    }
  } catch {
    // ignore (private mode / corrupt) — fall through to defaults
  }
  return { haptics: true, effects: true }
}

function save(s: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    // ignore
  }
}

interface SettingsStore extends Settings {
  toggleHaptics: () => void
  toggleEffects: () => void
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...load(),
  toggleHaptics: () => {
    const next = { haptics: !get().haptics, effects: get().effects }
    save(next)
    set({ haptics: next.haptics })
  },
  toggleEffects: () => {
    const next = { haptics: get().haptics, effects: !get().effects }
    save(next)
    set({ effects: next.effects })
  },
}))
