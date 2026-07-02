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
  const open = useUiStore((s) => s.spaceShooterOpen)
  // Buzz ONCE per distinct signal (keyed on the cooldown that armed it) — the chip
  // also blinks out/in while a Mogul Story holds the floor, and those visibility
  // flips must not re-buzz for a signal the player already saw and ignored.
  const buzzedFor = useRef<number | null>(null)
  useEffect(() => {
    if (ss.offerAvailable && buzzedFor.current !== ss.signalKey) {
      buzzedFor.current = ss.signalKey
      haptic(22)
    }
  }, [ss.offerAvailable, ss.signalKey])
  if (!ss.offerAvailable || open) return null

  return (
    <div
      // Sits above the Golden Deal chip so both can coexist — with enough clearance
      // that the "Not now" button's expanded 44px tap area can't overlap the golden
      // chip's top edge (it extends ~6px past the button's visual bounds).
      className="fixed inset-x-0 z-40 mx-auto flex w-max max-w-[92vw] flex-col items-center gap-2"
      style={{ bottom: 'calc(var(--nav-h, 64px) + env(safe-area-inset-bottom) + 78px)' }}
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
