import { useEffect, useRef, useState } from 'react'

interface Props {
  label: string
  holdingLabel?: string
  onConfirm: () => void
  holdMs?: number
  disabled?: boolean
  color?: string
}

/**
 * A destructive-action button that requires a sustained press (default 2s).
 * Releasing early cancels. Touch-first (pointer events, no hover dependency).
 */
export function HoldToConfirmButton({
  label,
  holdingLabel = 'Hold…',
  onConfirm,
  holdMs = 2000,
  disabled = false,
  color = 'var(--bad)',
}: Props) {
  const [holding, setHolding] = useState(false)
  const timer = useRef<number | null>(null)

  // A destructive onConfirm must never fire after the button is gone (e.g. the
  // screen unmounts mid-hold) — clear any pending hold timer on unmount.
  useEffect(
    () => () => {
      if (timer.current != null) clearTimeout(timer.current)
    },
    [],
  )

  const start = () => {
    if (disabled) return
    setHolding(true)
    timer.current = window.setTimeout(() => {
      timer.current = null
      setHolding(false)
      onConfirm()
    }, holdMs)
  }
  const cancel = () => {
    if (timer.current != null) {
      clearTimeout(timer.current)
      timer.current = null
    }
    setHolding(false)
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onContextMenu={(e) => e.preventDefault()}
      className="relative overflow-hidden rounded-xl font-bold"
      style={{
        minHeight: 'var(--tap-lg)',
        background: 'var(--surface-3)',
        color: disabled ? 'var(--text-faint)' : 'var(--text)',
        touchAction: 'none',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-full"
        style={{
          background: color,
          opacity: 0.4,
          transformOrigin: 'left center',
          transform: `scaleX(${holding ? 1 : 0})`,
          transition: `transform ${holding ? holdMs : 0}ms linear`,
        }}
      />
      <span className="relative z-10">{holding ? holdingLabel : label}</span>
    </button>
  )
}
