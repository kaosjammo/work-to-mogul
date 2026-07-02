import { useEffect, useRef } from 'react'
import { useFoodFrenzy } from '../../store/gameStore'
import { useUiStore } from '../../store/uiStore'
import { snoozeFrenzySignal } from '../../store/actions'
import { haptic } from '../../lib/haptics'

/**
 * The Food-industry opportunity: a floating "Lunch Rush" chip that appears when a
 * rush is ready (owns the Food Truck, off cooldown, and no Mogul Story OR Salvage
 * Signal holding the floor — priority: story > salvage > rush, so this can share
 * the salvage chip's screen slot). Tapping opens the fullscreen mini-game;
 * "Not now" snoozes it for a long while. Mirrors FloatingSalvageSignal.
 */
export function FloatingFrenzySignal() {
  const ff = useFoodFrenzy()
  // Hidden while EITHER fullscreen mini-game is open — the chip must neither render
  // behind a z-[60] modal nor fire a phantom buzz (and consume its buzz latch) there.
  const anyGameOpen = useUiStore((s) => s.foodFrenzyOpen || s.spaceShooterOpen)
  // Buzz ONCE per distinct signal (keyed on the cooldown that armed it).
  const buzzedFor = useRef<number | null>(null)
  useEffect(() => {
    if (ff.offerAvailable && !anyGameOpen && buzzedFor.current !== ff.signalKey) {
      buzzedFor.current = ff.signalKey
      haptic(22)
    }
  }, [ff.offerAvailable, ff.signalKey, anyGameOpen])
  if (!ff.offerAvailable || anyGameOpen) return null

  return (
    <div
      // The mini-game chip band (+132px): clear of the Golden Deal chip (+14), the
      // Rush Hour pill (+70, Food-gated so it ROUTINELY coexists with this one), and
      // the salvage slot. Salvage + rush chips themselves never coexist (rotation).
      className="fixed inset-x-0 z-40 mx-auto flex w-max max-w-[92vw] flex-col items-center gap-2"
      style={{ bottom: 'calc(var(--nav-h, 64px) + env(safe-area-inset-bottom) + 132px)' }}
    >
      <button
        type="button"
        onClick={() => {
          haptic(18)
          useUiStore.getState().openFoodFrenzy()
        }}
        aria-label={`Lunch rush — ${ff.tierName}. Tap to serve the crowd.`}
        className="golden-pulse flex items-center gap-2 rounded-full px-4 py-2 font-bold shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #7c2d12, #b45309, #f59e0b)',
          color: '#fff7e6',
          border: '2px solid #fcd34d',
        }}
      >
        <span className="text-xl">🌭</span>
        <span className="flex flex-col items-start leading-tight">
          <span className="text-sm">Lunch Rush! · {ff.tierName}</span>
          <span className="text-[10px] font-semibold opacity-85">
            rabid fans inbound — tap to serve
          </span>
        </span>
      </button>
      <button type="button" onClick={snoozeFrenzySignal} className="btn btn-ghost btn-sm">
        Not now
      </button>
    </div>
  )
}
