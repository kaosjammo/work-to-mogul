import { useState } from 'react'
import { money } from '../../engine/num'
import { useDaily } from '../../store/gameStore'
import { useUiStore } from '../../store/uiStore'
import { claimDailyBonus } from '../../store/actions'

/**
 * The daily return hook (D7): a "Daily Bonus" card that appears on open when a new
 * real-day's bonus is available. One-tap claim grants ~2h of idle income. Dismissible
 * for the session (the nav badge + the Stats claim row remain, and it re-appears next
 * open). Mirrors the Welcome-Back overlay so it's not a new UI paradigm.
 */
export function DailyBonusModal() {
  const daily = useDaily()
  const welcomeBack = useUiStore((s) => s.welcomeBack)
  const [dismissed, setDismissed] = useState(false)
  // When a Welcome-Back is showing, it folds the daily in (one return moment) — don't stack.
  if (welcomeBack || !daily.available || dismissed) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={() => setDismissed(true)}
    >
      <div
        className="m-3 flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl p-6 text-center"
        style={{ background: 'var(--surface)', border: '1px solid var(--accent)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-5xl">🎁</span>
        <h2 className="text-lg font-bold">Daily Bonus</h2>
        {daily.streak > 0 && (
          <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
            🔥 Day {daily.streak + 1} streak
          </span>
        )}
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          About 2 hours of your empire's income — come back each day to keep it going.
        </p>
        <p className="tnum text-3xl font-extrabold" style={{ color: 'var(--accent)' }}>
          +{money(daily.reward)}
        </p>
        <button
          type="button"
          onClick={claimDailyBonus}
          className="mt-1 w-full rounded-xl font-bold transition active:scale-[0.98]"
          style={{ minHeight: 'var(--tap-lg)', background: 'var(--accent)', color: 'var(--accent-ink)' }}
        >
          Claim
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-xs font-semibold"
          style={{ color: 'var(--text-faint)' }}
        >
          Later
        </button>
      </div>
    </div>
  )
}
