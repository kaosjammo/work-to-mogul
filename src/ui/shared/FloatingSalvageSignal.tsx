import { useEffect, useRef } from 'react'
import { useSpaceShooter } from '../../store/gameStore'
import { useUiStore } from '../../store/uiStore'
import { snoozeSalvageSignal } from '../../store/actions'
import { haptic } from '../../lib/haptics'

/**
 * The rare Space-industry opportunity: a floating "Salvage Signal" that appears
 * when the next Space Salvage Shooter stage is ready (owns Space, off cooldown,
 * AI pilot not yet in charge, and no Mogul Story holding the floor). Tapping
 * opens the fullscreen mini-game; "Not now" snoozes it for a long while. Hidden
 * while the game is open or when no signal is on offer. Mirrors the story offer.
 */
export function FloatingSalvageSignal() {
  const ss = useSpaceShooter()
  // Hidden while EITHER fullscreen mini-game is open — no rendering behind a z-[60]
  // modal, and no phantom buzz (which would also consume the once-per-signal latch).
  const anyGameOpen = useUiStore((s) => s.spaceShooterOpen || s.foodFrenzyOpen)
  // Buzz ONCE per distinct signal (keyed on the cooldown that armed it) — the chip
  // also blinks out/in while a Mogul Story holds the floor, and those visibility
  // flips must not re-buzz for a signal the player already saw and ignored.
  const buzzedFor = useRef<number | null>(null)
  useEffect(() => {
    if (ss.offerAvailable && !anyGameOpen && buzzedFor.current !== ss.signalKey) {
      buzzedFor.current = ss.signalKey
      haptic(22)
    }
  }, [ss.offerAvailable, ss.signalKey, anyGameOpen])
  if (!ss.offerAvailable || anyGameOpen) return null

  return (
    <div
      // The mini-game chip band (+132px): clear of the Golden Deal chip (+14) and the
      // Rush Hour pill (+70 — Food-gated, so a Space player CAN see both at once).
      // The Lunch Rush chip shares this band; the two never coexist (rotation rule).
      className="fixed inset-x-0 z-40 mx-auto flex w-max max-w-[92vw] flex-col items-center gap-2"
      style={{ bottom: 'calc(var(--nav-h, 64px) + env(safe-area-inset-bottom) + 132px)' }}
    >
      <button
        type="button"
        onClick={() => {
          haptic(18)
          useUiStore.getState().openSpaceShooter()
        }}
        aria-label={`Space salvage signal — Stage ${ss.stageNumber}: ${ss.stageTitle}. Tap to respond.`}
        className="golden-pulse flex items-center gap-2 rounded-full px-4 py-2 font-bold shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #1b2a6b, #3b1d6e, #0e7490)',
          color: '#e8f0ff',
          border: '2px solid #6ee7ff',
        }}
      >
        <span className="text-xl">📡</span>
        <span className="flex flex-col items-start leading-tight">
          <span className="text-sm">Salvage Signal · Stage {ss.stageNumber}</span>
          <span className="text-[10px] font-semibold opacity-85">
            {ss.stageTitle} — tap to respond
          </span>
        </span>
      </button>
      <button type="button" onClick={snoozeSalvageSignal} className="btn btn-ghost btn-sm">
        Not now
      </button>
    </div>
  )
}
