import { money, formatDuration } from '../../engine/num'
import { OFFLINE_CAP_MS } from '../../engine/catchUp'
import { useUiStore } from '../../store/uiStore'
import { haptic } from '../../lib/haptics'
import { ART_GENERATED } from '../../content/artManifest'

export function WelcomeBackBanner() {
  const welcome = useUiStore((s) => s.welcomeBack)
  const dismiss = useUiStore((s) => s.dismissWelcomeBack)
  if (!welcome) return null

  const collect = () => {
    haptic(24)
    dismiss()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={collect}
    >
      <div
        className="m-3 flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl p-6 text-center"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
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
        <button
          type="button"
          onClick={collect}
          className="mt-1 w-full rounded-xl font-bold transition active:scale-[0.98]"
          style={{ minHeight: 'var(--tap-lg)', background: 'var(--accent)', color: 'var(--accent-ink)' }}
        >
          Collect
        </button>
      </div>
    </div>
  )
}
