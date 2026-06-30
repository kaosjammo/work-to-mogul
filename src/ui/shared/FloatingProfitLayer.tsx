import { useUiStore } from '../../store/uiStore'
import { ART_GENERATED } from '../../content/artManifest'

// A fixed, non-interactive overlay that renders rising "+$X" pops (tap payoff
// juice). Each pop removes itself when its CSS animation ends.
export function FloatingProfitLayer() {
  const floats = useUiStore((s) => s.floats)
  const removeFloat = useUiStore((s) => s.removeFloat)

  if (floats.length === 0) return null

  return (
    <div className="float-layer" aria-hidden="true">
      {floats.map((f) => (
        <div
          key={f.id}
          className="float-profit"
          style={{ left: f.x, top: f.y }}
          onAnimationEnd={() => removeFloat(f.id)}
        >
          <img className="float-profit__burst" src={ART_GENERATED.props.profitBurst} alt="" />
          <span className="float-profit__amount">{f.text}</span>
        </div>
      ))}
    </div>
  )
}
