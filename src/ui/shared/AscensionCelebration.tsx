import { format } from '../../engine/num'
import { useUiStore } from '../../store/uiStore'
import { haptic } from '../../lib/haptics'
import { ART_GENERATED } from '../../content/artManifest'

/**
 * Ascension celebration — the game's biggest beat. On a successful prestige the run
 * resets; this brief, dismissible full-screen moment marks it ("Empire Ascended · +N ✦")
 * so the reset feels earned, not silent. Reuses the Welcome-Back overlay pattern + the
 * founder mascot; the `prestige` sound + haptic already fired in the action.
 */
export function AscensionCelebration() {
  const ascension = useUiStore((s) => s.ascension)
  const dismiss = useUiStore((s) => s.dismissAscension)
  if (!ascension) return null

  const close = () => {
    haptic(18)
    dismiss()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={close}
    >
      <div
        className="m-3 flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl p-6 text-center"
        style={{ background: 'var(--surface)', border: '1px solid var(--accent)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex h-28 w-28 items-center justify-center">
          <img
            src={ART_GENERATED.props.profitBurst}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full"
            style={{ opacity: 0.6 }}
          />
          <img
            src={ART_GENERATED.mascot.founderExcited}
            alt=""
            aria-hidden
            className="relative h-28 w-28 object-contain"
            style={{ filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.45))' }}
          />
        </div>
        <h2 className="text-2xl font-extrabold">✦ Empire Ascended!</h2>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          A fresh start — your talents, tokens and progress carry over.
        </p>
        {ascension.tokens > 0 && (
          <p className="tnum text-3xl font-extrabold" style={{ color: 'var(--accent)' }}>
            +{format(ascension.tokens)} Empire Token{ascension.tokens === 1 ? '' : 's'}
          </p>
        )}
        <button
          type="button"
          onClick={close}
          className="mt-1 w-full rounded-xl font-bold transition active:scale-[0.98]"
          style={{ minHeight: 'var(--tap-lg)', background: 'var(--accent)', color: 'var(--accent-ink)' }}
        >
          Rise again
        </button>
      </div>
    </div>
  )
}
