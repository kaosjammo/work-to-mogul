import { useSettingsStore } from '../store/settingsStore'

// ============================================================
//  Sound layer — synthesized Web-Audio SFX on MEANINGFUL beats only (never per-cycle
//  income). Zero assets, zero deps: each sound is a tiny oscillator envelope. Gated on
//  the `sound` setting (default OFF), unlock-aware (browsers block audio until a user
//  gesture — `unlockAudio` resumes on the first tap), and throttled so a mass-buy can't
//  machine-gun blips. Safe no-op with no console noise before unlock / when unsupported.
// ============================================================

type Ctor = typeof AudioContext
let ctx: AudioContext | null = null
let lastPlayAt = -1 // audio-clock seconds of the last play (for throttling)

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (ctx) return ctx
  const C: Ctor | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext
  if (!C) return null
  try {
    ctx = new C()
  } catch {
    return null
  }
  return ctx
}

/** Resume/unlock the AudioContext — call from the first user gesture (pointerdown). */
export function unlockAudio(): void {
  const c = getCtx()
  if (c && c.state === 'suspended') c.resume().catch(() => {})
}

/** One oscillator note with a fast attack + exponential decay, scheduled on the audio clock. */
function note(
  c: AudioContext,
  at: number,
  opts: { freq: number; dur: number; type?: OscillatorType; gain?: number; freqTo?: number },
): void {
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = opts.type ?? 'sine'
  osc.frequency.setValueAtTime(opts.freq, at)
  if (opts.freqTo) osc.frequency.exponentialRampToValueAtTime(opts.freqTo, at + opts.dur)
  const peak = opts.gain ?? 0.12
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(peak, at + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, at + opts.dur)
  osc.connect(g).connect(c.destination)
  osc.start(at)
  osc.stop(at + opts.dur + 0.02)
}

export type SoundName = 'coin' | 'buy' | 'chime' | 'tap' | 'prestige'

// Each sound = one or two short notes. Kept quiet + brief so they read as "juice", not noise.
const SOUNDS: Record<SoundName, (c: AudioContext, t: number) => void> = {
  coin: (c, t) => {
    note(c, t, { freq: 880, dur: 0.07, type: 'triangle', gain: 0.1 })
    note(c, t + 0.06, { freq: 1320, dur: 0.09, type: 'triangle', gain: 0.1 })
  },
  buy: (c, t) => note(c, t, { freq: 330, dur: 0.06, type: 'square', gain: 0.06, freqTo: 220 }),
  chime: (c, t) => {
    note(c, t, { freq: 660, dur: 0.1, type: 'sine', gain: 0.1 })
    note(c, t + 0.09, { freq: 990, dur: 0.14, type: 'sine', gain: 0.1 })
  },
  tap: (c, t) => note(c, t, { freq: 520, dur: 0.05, type: 'triangle', gain: 0.08, freqTo: 780 }),
  prestige: (c, t) => {
    note(c, t, { freq: 262, dur: 0.5, type: 'sine', gain: 0.12, freqTo: 524 })
    note(c, t + 0.12, { freq: 392, dur: 0.4, type: 'sine', gain: 0.08 })
  },
}

/**
 * Play a UI sound if the player has enabled sound AND audio is unlocked. No-ops silently
 * (no console errors) otherwise, and throttles rapid triggers so mass-actions don't stack.
 */
export function playSound(name: SoundName): void {
  try {
    if (!useSettingsStore.getState().sound) return
    const c = getCtx()
    if (!c || c.state !== 'running') return // not unlocked yet → silent
    if (c.currentTime - lastPlayAt < 0.05) return // throttle (mass-buy safe)
    lastPlayAt = c.currentTime
    SOUNDS[name]?.(c, c.currentTime)
  } catch {
    // ignore — unsupported / blocked
  }
}
