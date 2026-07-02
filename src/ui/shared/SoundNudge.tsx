import { useSettingsStore } from '../../store/settingsStore'
import { useGameStore } from '../../store/gameStore'
import { playSound, unlockAudio } from '../../lib/sound'

// Show the nudge once the player is genuinely invested (a few minutes in) —
// not on the very first open, when yet another prompt would be noise.
const NUDGE_LIFETIME = 100_000

/**
 * One-time "play with sound?" nudge. Sound ships OFF (mobile players often play
 * muted), but near-zero adoption traced to the enable prompt simply not existing —
 * the toggle is buried in Stats. A small dismissible pill, shown once, then never
 * again (persisted in settings either way).
 */
export function SoundNudge() {
  const sound = useSettingsStore((s) => s.sound)
  const done = useSettingsStore((s) => s.soundNudgeDone)
  const resolve = useSettingsStore((s) => s.resolveSoundNudge)
  const invested = useGameStore((s) => s.lifetimeEarnings >= NUDGE_LIFETIME)
  if (done || sound || !invested) return null

  const enable = () => {
    unlockAudio() // we're inside a user gesture — safe to unlock the AudioContext
    resolve(true)
    playSound('chime') // immediate confirmation of what they just turned on
  }

  return (
    <div
      className="fixed inset-x-0 z-30 mx-auto flex w-max max-w-[92vw] items-center gap-2 rounded-full py-1.5 pl-3 pr-1.5 text-sm shadow-lg"
      style={{
        bottom: 'calc(var(--nav-h, 64px) + env(safe-area-inset-bottom) + 64px)',
        background: 'var(--surface-3)',
        border: '1px solid var(--border)',
      }}
      role="dialog"
      aria-label="Enable sound?"
    >
      <span aria-hidden>🔊</span>
      <span style={{ color: 'var(--text-dim)' }}>Chimes on the big moments?</span>
      <button type="button" onClick={enable} className="btn btn-primary btn-sm">
        Sound on
      </button>
      <button
        type="button"
        onClick={() => resolve(false)}
        className="btn btn-ghost btn-sm"
        aria-label="No sound, don't ask again"
      >
        No thanks
      </button>
    </div>
  )
}
