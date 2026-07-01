import type { ReactNode } from 'react'

interface OverlayProps {
  /** Panel contents (each caller keeps its own layout + handlers). */
  children: ReactNode
  /** Fires when the scrim is tapped. Omit to make the backdrop inert (no dismiss). */
  onBackdropClick?: () => void
  /** Accent for the panel's hairline border (defaults to the neutral --border). */
  accent?: string
  /** Extra classes appended to the panel's flex column (e.g. `items-center text-center`). */
  panelClassName?: string
  /** Scrim opacity — a touch darker for the biggest beats (Ascension). */
  scrim?: string
}

/**
 * The one presentational modal shell. A fixed scrim + a flat `.card` panel that sits as a
 * bottom-sheet on phones (items-end) and centers on larger screens (sm:items-center). The
 * entrance reuses the shared `celebrate-pop` keyframe (scale/settle), which reduced-motion
 * neutralises globally. Purely presentational: all content + handlers live in the callers.
 */
export function Overlay({
  children,
  onBackdropClick,
  accent = 'var(--border)',
  panelClassName = '',
  scrim = 'rgba(0,0,0,0.55)',
}: OverlayProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: scrim }}
      onClick={onBackdropClick}
    >
      <div
        className={`card celebrate-pop m-3 flex w-full max-w-sm flex-col gap-3 p-5 ${panelClassName}`}
        style={{ borderColor: accent }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
