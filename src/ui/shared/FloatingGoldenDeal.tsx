import { useEffect } from 'react'
import { money } from '../../engine/num'
import { useGolden } from '../../store/gameStore'
import { useUiStore } from '../../store/uiStore'
import { haptic } from '../../lib/haptics'
import { claimGolden } from '../../store/actions'

/**
 * The active-play layer: a floating tappable "Golden Deal" that appears
 * periodically. Tapping grants a Time Warp (instant idle income). Sits above
 * the bottom nav, safe-area aware. Hidden when no deal is on offer.
 */
export function FloatingGoldenDeal() {
  const g = useGolden()
  // Buzz when a deal appears so the 12s window isn't missed (respects the
  // haptics setting; effect runs before the early return per the hooks rule).
  useEffect(() => {
    if (g.offerActive) haptic(18)
  }, [g.offerActive])
  if (!g.offerActive) return null

  return (
    <button
      type="button"
      onClick={(e) => {
        // Pop the payout right where you tapped, then claim the Time Warp.
        useUiStore.getState().spawnFloat(e.clientX, e.clientY, `+${money(g.warpValue)}`)
        claimGolden()
      }}
      aria-label={`Golden Deal: Time Warp for ${money(g.warpValue)}`}
      className="golden-pulse fixed left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 font-bold shadow-lg"
      style={{
        bottom: 'calc(var(--nav-h, 64px) + env(safe-area-inset-bottom) + 14px)',
        background: 'linear-gradient(135deg, #f5c518, #ffae34)',
        color: '#1a1205',
        border: '2px solid #fff3c4',
      }}
    >
      <span className="text-xl">⚡</span>
      <span className="flex flex-col items-start leading-tight">
        <span className="text-sm">Time Warp · +{money(g.warpValue)}</span>
        <span className="text-[10px] font-semibold opacity-80">
          {g.warpMinutes} min of income · tap! ({g.offerSecondsLeft}s)
        </span>
      </span>
    </button>
  )
}
