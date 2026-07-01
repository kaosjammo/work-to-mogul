// Player preferences for feel/feedback (UI-only, persisted separately from the
// game save). Lets players turn the new juice (haptics, floating numbers) off if
// they find it distracting — satisfying for everyone, not just by default.
import { create } from 'zustand'

const KEY = 'tycoon:settings'

interface Settings {
  haptics: boolean
  effects: boolean // floating "+$" pops
  sound: boolean // synthesized SFX on meaningful beats — DEFAULT OFF (opt-in; mobile players often play muted)
  soundNudgeDone: boolean // the one-time "play with sound?" nudge has been answered/dismissed
}

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const p = JSON.parse(raw) as Partial<Settings>
      return {
        haptics: p.haptics !== false,
        effects: p.effects !== false,
        sound: p.sound === true,
        // Anyone who already turned sound ON never needs the nudge.
        soundNudgeDone: p.soundNudgeDone === true || p.sound === true,
      }
    }
  } catch {
    // ignore (private mode / corrupt) — fall through to defaults
  }
  return { haptics: true, effects: true, sound: false, soundNudgeDone: false }
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
  toggleSound: () => void
  // Resolve the one-time sound nudge: optionally enable sound, always mark it done.
  resolveSoundNudge: (enable: boolean) => void
}

function snapshot(s: SettingsStore): Settings {
  return { haptics: s.haptics, effects: s.effects, sound: s.sound, soundNudgeDone: s.soundNudgeDone }
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...load(),
  toggleHaptics: () => {
    const next = { ...snapshot(get()), haptics: !get().haptics }
    save(next)
    set(next)
  },
  toggleEffects: () => {
    const next = { ...snapshot(get()), effects: !get().effects }
    save(next)
    set(next)
  },
  toggleSound: () => {
    // Touching the toggle answers the nudge either way.
    const next = { ...snapshot(get()), sound: !get().sound, soundNudgeDone: true }
    save(next)
    set(next)
  },
  resolveSoundNudge: (enable) => {
    const next = { ...snapshot(get()), sound: enable || get().sound, soundNudgeDone: true }
    save(next)
    set(next)
  },
}))
