import { useEffect } from 'react'
import { useRushHour } from '../../store/gameStore'
import { haptic } from '../../lib/haptics'
import { claimRush } from '../../store/actions'

/**
 * Food's signature active-play layer: a floating tappable "Rush Hour" window that
 * appears periodically once you own Food. Tapping kicks off a short ×N speed surge
 * across Food. Mirrors the Golden-Deal HUD (so it's not a new UI paradigm) but sits
 * one row higher so the two never overlap. While a surge runs it shows a countdown.
 */
export function FloatingRushHour() {
  const r = useRushHour()
  // Buzz when the window opens so the short tap-window isn't missed.
  useEffect(() => {
    if (r.offerActive) haptic(16)
  }, [r.offerActive])

  if (!r.offerActive && !r.surgeActive) return null

  // Stacked above the Golden Deal row (nav + safe-area + golden's 14px + a row).
  const bottom = 'calc(var(--nav-h, 64px) + env(safe-area-inset-bottom) + 70px)'

  if (r.offerActive) {
    return (
      <button
        type="button"
        onClick={() => claimRush()}
        aria-label={`Rush Hour: tap for x${r.speedMult} Food speed`}
        className="golden-pulse fixed inset-x-0 z-40 mx-auto flex w-max max-w-[92vw] items-center gap-2 rounded-full px-4 py-2 font-bold shadow-lg"
        style={{
          bottom,
          background: 'linear-gradient(135deg, #ff7043, #ffb74d)',
          color: '#1a1205',
          border: '2px solid #ffe0b2',
        }}
      >
        <span className="text-xl">🍔</span>
        <span className="flex flex-col items-start leading-tight">
          <span className="text-sm">Rush Hour! Food ×{r.speedMult} speed</span>
          <span className="text-[10px] font-semibold opacity-80">tap! ({r.offerSecondsLeft}s)</span>
        </span>
      </button>
    )
  }

  // Surge running — a non-interactive countdown pill so the boost is legible.
  return (
    <div
      className="fixed inset-x-0 z-40 mx-auto flex w-max max-w-[92vw] items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold shadow"
      style={{
        bottom,
        background: 'rgba(255,112,67,0.18)',
        color: '#ff7043',
        border: '1px solid rgba(255,112,67,0.5)',
      }}
    >
      🍔 Rush Hour · Food ×{r.speedMult} ({r.surgeSecondsLeft}s)
    </div>
  )
}
