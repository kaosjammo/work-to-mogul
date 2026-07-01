import { useEffect, useState } from 'react'
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
  const [dismissed, setDismissed] = useState(false)
  // "Later" suppresses the modal only for TODAY's bonus. The component never
  // unmounts (it lives in App), so in a long-lived session/PWA a new day's bonus
  // must clear the dismissal or it would never re-show.
  useEffect(() => {
    if (daily.available) setDismissed(false)
  }, [daily.available])
  // When a Welcome-Back is showing, it folds the daily in (one return moment) — don't stack.
  if (welcomeBack || !daily.available || dismissed) return null

  return (
    <Overlay accent="var(--accent)" onBackdropClick={() => setDismissed(true)} panelClassName="items-center text-center">
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
      <button type="button" onClick={() => setDismissed(true)} className="btn btn-ghost btn-sm">
        Later
      </button>
    </Overlay>
  )
}
