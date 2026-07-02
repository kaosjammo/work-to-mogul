import { money } from '../../engine/num'
import { useUiStore } from '../../store/uiStore'
import { haptic } from '../../lib/haptics'
import { ART_GENERATED } from '../../content/artManifest'
import { Overlay } from './Overlay'

/**
 * Wedding celebration — the payoff for completing the 4-episode love arc. A festive,
 * dismissible full-screen moment the instant the proposal lands: "You're married to
 * {partner}" + the one-time honeymoon gift. The marriage money-sink (lifestyle upkeep)
 * lives on afterward behind the 💍 Married button.
 */
export function WeddingCelebration() {
  const wedding = useUiStore((s) => s.wedding)
  const dismiss = useUiStore((s) => s.dismissWedding)
  if (!wedding) return null

  const close = () => {
    haptic(24)
    dismiss()
  }

  return (
    <Overlay accent="var(--accent)" scrim="rgba(0,0,0,0.7)" onBackdropClick={close} panelClassName="items-center text-center">
      <div className="relative flex h-28 w-28 items-center justify-center">
        <img
          src={ART_GENERATED.props.profitBurst}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full"
          style={{ opacity: 0.55 }}
        />
        <div className="relative text-6xl" style={{ filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.45))' }}>
          💍
        </div>
      </div>
      <h2 className="text-2xl font-extrabold">You’re married! 🎉</h2>
      <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
        The rival you could never beat is now the partner you never will. You and {wedding.partner}
        {' '}said yes under the warm red hum of the EAT sign — the espresso machine survived to see it.
      </p>
      {wedding.gift > 0 && (
        <>
          <p className="tnum text-3xl font-extrabold" style={{ color: 'var(--good)' }}>
            🎁 +{money(wedding.gift)}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
            Honeymoon gift banked. The good life starts now (and so does the upkeep — see 💍 Married).
          </p>
        </>
      )}
      <button type="button" onClick={close} className="btn btn-primary btn-lg btn-block mt-1">
        To forever ▸
      </button>
    </Overlay>
  )
}
