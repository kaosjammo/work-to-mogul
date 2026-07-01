import { money, formatDuration } from '../../engine/num'
import { OFFLINE_CAP_MS } from '../../engine/catchUp'
import { useUiStore } from '../../store/uiStore'
import { useDaily } from '../../store/gameStore'
import { claimDailyBonus } from '../../store/actions'
import { DailyStreakProgress } from './DailyStreakProgress'
import { haptic } from '../../lib/haptics'
import { playSound } from '../../lib/sound'
import { ART_GENERATED } from '../../content/artManifest'
import { Overlay } from './Overlay'

export function WelcomeBackBanner() {
  const welcome = useUiStore((s) => s.welcomeBack)
  const dismiss = useUiStore((s) => s.dismissWelcomeBack)
  const daily = useDaily()
  if (!welcome) return null

  // ONE return moment: if a daily bonus is also waiting, it's folded into this card and
  // Collect claims both — never a second stacked modal (DailyBonusModal hides behind this).
  const collect = () => {
    haptic(24)
    playSound('coin')
    if (daily.available) claimDailyBonus()
    dismiss()
  }

  return (
    <Overlay onBackdropClick={collect} panelClassName="items-center text-center">
      <div className="relative flex h-28 w-28 items-center justify-center">
        <img
          src={ART_GENERATED.props.profitBurst}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full"
          style={{ opacity: 0.55 }}
        />
        <img
          src={ART_GENERATED.mascot.founderExcited}
          alt=""
          aria-hidden
          className="relative h-28 w-28 object-contain"
          style={{ filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.45))' }}
        />
      </div>
      <h2 className="text-lg font-bold">Welcome back!</h2>
      <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
        Your automated businesses earned
      </p>
      <p className="tnum text-3xl font-extrabold" style={{ color: 'var(--accent)' }}>
        {money(welcome.earned)}
      </p>
      <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
        while you were away for {formatDuration(welcome.elapsedMs / 1000)}
        {welcome.elapsedMs >= OFFLINE_CAP_MS && ' (offline earnings cap at 2h)'}
      </p>
      {daily.available && (
        <div
          className="flex w-full flex-col gap-1.5 py-2 pr-3 text-left"
          style={{ background: 'var(--surface-2)', borderLeft: '2px solid var(--accent)', paddingLeft: '10px' }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold">🎁 Daily Bonus</span>
            <span className="tnum font-bold" style={{ color: 'var(--accent)' }}>+{money(daily.reward)}</span>
          </div>
          <DailyStreakProgress
            streak={daily.streak}
            nextMilestone={daily.nextMilestone}
            milestoneProgress={daily.milestoneProgress}
          />
        </div>
      )}
      <button type="button" onClick={collect} className="btn btn-primary btn-lg btn-block mt-1">
        {daily.available ? 'Collect all' : 'Collect'}
      </button>
    </Overlay>
  )
}
