import { useEffect } from 'react'
import { useUiStore } from '../../store/uiStore'

const SHOW_MS = 2500

export function MilestoneCelebration() {
  const current = useUiStore((s) => s.celebrations[0])
  const shift = useUiStore((s) => s.shiftCelebration)

  useEffect(() => {
    if (!current) return
    const t = window.setTimeout(shift, SHOW_MS)
    return () => clearTimeout(t)
  }, [current, shift])

  if (!current) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-40 flex justify-center"
      style={{ top: 'calc(var(--safe-top) + var(--hud-h) + 8px)' }}
      aria-live="polite"
    >
      <div
        key={current}
        className="toast-in flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold shadow-lg"
        style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}
      >
        <span>🎉</span>
        <span>{current}</span>
      </div>
    </div>
  )
}
