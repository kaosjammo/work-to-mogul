import { money, formatDuration } from '../../engine/num'
import { useUiStore } from '../../store/uiStore'

export function WelcomeBackBanner() {
  const welcome = useUiStore((s) => s.welcomeBack)
  const dismiss = useUiStore((s) => s.dismissWelcomeBack)
  if (!welcome) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={dismiss}
    >
      <div
        className="m-3 flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl p-6 text-center"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-4xl">👋</span>
        <h2 className="text-lg font-bold">Welcome back!</h2>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          Your automated businesses earned
        </p>
        <p className="tnum text-2xl font-bold" style={{ color: 'var(--accent)' }}>
          {money(welcome.earned)}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
          while you were away for {formatDuration(welcome.elapsedMs / 1000)}
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="mt-1 w-full rounded-xl font-bold"
          style={{ minHeight: 'var(--tap-lg)', background: 'var(--accent)', color: 'var(--accent-ink)' }}
        >
          Collect
        </button>
      </div>
    </div>
  )
}
