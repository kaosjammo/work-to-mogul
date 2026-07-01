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
    if (g.offerActive) haptic(g.mega ? 40 : 18) // a bigger buzz for the jackpot
  }, [g.offerActive, g.mega])
  if (!g.offerActive) return null

  return (
    <button
      type="button"
      onClick={(e) => {
        // Claim FIRST, then pop what was actually banked — the offer can expire
        // between the (throttled) snapshot and the tap, or a double-tap can race;
        // a "+$" float for a claim that returned 0 would be a lie.
        const earned = claimGolden()
        if (earned > 0) useUiStore.getState().spawnFloat(e.clientX, e.clientY, `+${money(earned)}`)
      }}
      aria-label={`${g.mega ? 'MEGA ' : ''}Golden Deal: Time Warp for ${money(g.warpValue)}`}
      // Centered with auto-margins (not a translate) so the pulse animation's
      // scale() can't fight the horizontal centering. w-max sizes to content; the
      // max-width keeps a huge payout string from exceeding a narrow screen.
      className="golden-pulse fixed inset-x-0 z-40 mx-auto flex w-max max-w-[92vw] items-center gap-2 rounded-full px-4 py-2 font-bold shadow-lg"
      style={{
        bottom: 'calc(var(--nav-h, 64px) + env(safe-area-inset-bottom) + 14px)',
        // MEGA deals get a hotter gradient + bolder ring so the jackpot reads instantly.
        background: g.mega
          ? 'linear-gradient(135deg, #ff7a18, #ffd24a, #ff4d6d)'
          : 'linear-gradient(135deg, #f5c518, #ffae34)',
        color: '#1a1205',
        border: g.mega ? '2px solid #fff' : '2px solid #fff3c4',
      }}
    >
      <span className="text-xl">{g.mega ? '🌟' : '⚡'}</span>
      <span className="flex flex-col items-start leading-tight">
        <span className="text-sm">
          {g.mega ? 'MEGA Time Warp' : 'Time Warp'} · +{money(g.warpValue)}
        </span>
        <span className="text-[10px] font-semibold opacity-80">
          {g.warpMinutes} min of income + 🔥 2× · tap! ({g.offerSecondsLeft}s)
        </span>
      </span>
    </button>
  )
}
