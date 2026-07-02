import { useState } from 'react'
import { money } from '../../engine/num'
import { useDaily } from '../../store/gameStore'
import { useUiStore } from '../../store/uiStore'
import { claimDailyBonus } from '../../store/actions'
import { DailyStreakProgress } from './DailyStreakProgress'
import { Overlay } from './Overlay'

/**
 * The daily return hook (D7): a "Daily Bonus" card that appears on open when a new
 * real-day's bonus is available. One-tap claim grants ~2h of idle income. Dismissible
 * for the session (the nav badge + the Stats claim row remain, and it re-appears next
 * open). Mirrors the Welcome-Back overlay so it's not a new UI paradigm.
 */
export function DailyBonusModal() {
  const daily = useDaily()
  const welcomeBack = useUiStore((s) => s.welcomeBack)
  // "Later" suppresses the modal only for TODAY's bonus (keyed by day index, not a
  // session boolean): the component never unmounts, and `available` can stay true
  // straight through midnight when the player never claims — a new calendar day
  // must re-show regardless.
  const [dismissedDay, setDismissedDay] = useState<number | null>(null)
  const dismissed = dismissedDay === daily.dayIndex
  // When a Welcome-Back is showing, it folds the daily in (one return moment) — don't stack.
  if (welcomeBack || !daily.available || dismissed) return null

  return (
    <Overlay accent="var(--accent)" onBackdropClick={() => setDismissedDay(daily.dayIndex)} panelClassName="items-center text-center">
      <span className="text-5xl">🎁</span>
      <h2 className="text-lg font-bold">Daily Bonus</h2>
      <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
        About 2 hours of your empire's income — come back each day to keep it going.
      </p>
      <p className="tnum text-3xl font-extrabold" style={{ color: 'var(--accent)' }}>
        +{money(daily.reward)}
      </p>
      <DailyStreakProgress
        streak={daily.streak}
        nextMilestone={daily.nextMilestone}
        milestoneProgress={daily.milestoneProgress}
      />
      <button type="button" onClick={claimDailyBonus} className="btn btn-primary btn-lg btn-block mt-1">
        Claim
      </button>
      <button type="button" onClick={() => setDismissedDay(daily.dayIndex)} className="btn btn-ghost btn-sm">
        Later
      </button>
    </Overlay>
  )
}
