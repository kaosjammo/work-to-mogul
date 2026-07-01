import { useEffect } from 'react'
import { useSpaceShooter } from '../../store/gameStore'
import { useUiStore } from '../../store/uiStore'
import { haptic } from '../../lib/haptics'

/**
 * The rare Space-industry opportunity: a floating "Salvage Signal" that appears
 * when the next Space Salvage Shooter stage is ready (owns Space, off cooldown,
 * AI pilot not yet in charge). Tapping opens the fullscreen mini-game. Hidden
 * while the game is open or when no signal is on offer. Mirrors FloatingGoldenDeal.
 */
export function FloatingSalvageSignal() {
  const ss = useSpaceShooter()
  const open = useUiStore((s) => s.spaceShooterOpen)
  // Buzz when a signal appears so a returning captain notices it.
  useEffect(() => {
    if (ss.offerAvailable) haptic(22)
  }, [ss.offerAvailable])
  if (!ss.offerAvailable || open) return null

  return (
    <button
      type="button"
      onClick={() => {
        haptic(18)
        useUiStore.getState().openSpaceShooter()
      }}
      aria-label={`Space salvage signal — Stage ${ss.stageNumber}: ${ss.stageTitle}. Tap to respond.`}
      // Sits a little higher than the Golden Deal chip so both can coexist.
      className="golden-pulse fixed inset-x-0 z-40 mx-auto flex w-max max-w-[92vw] items-center gap-2 rounded-full px-4 py-2 font-bold shadow-lg"
      style={{
        bottom: 'calc(var(--nav-h, 64px) + env(safe-area-inset-bottom) + 66px)',
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
  )
}
