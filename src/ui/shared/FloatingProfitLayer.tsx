import { useEffect, useState } from 'react'
import { useUiStore } from '../../store/uiStore'
import { ART_GENERATED } from '../../content/artManifest'

const BURST_FRAMES = ART_GENERATED.vfx.cashBurstFrames
const FRAME_MS = 55 // 8 frames ≈ 0.44s — a quick punch, then the +$ keeps rising

// Plays the authored cash-burst frame sequence once, then holds the last frame
// (the parent float fades + self-removes at ~0.9s). Under prefers-reduced-motion the
// float removes near-instantly, so this shows only the first frame — no motion.
function CashBurst() {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (i >= BURST_FRAMES.length - 1) return
    const t = setTimeout(() => setI((n) => n + 1), FRAME_MS)
    return () => clearTimeout(t)
  }, [i])
  return <img className="float-profit__burst" src={BURST_FRAMES[i]} alt="" />
}

// A fixed, non-interactive overlay that renders rising "+$X" pops (the money payoff
// juice). Each pop plays a cash-burst and removes itself when its rise animation ends.
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
          <CashBurst />
          <span className="float-profit__amount">{f.text}</span>
        </div>
      ))}
    </div>
  )
}
