interface Props {
  fraction: number // 0..1
  color?: string
}

/**
 * GPU-composited fill via transform: scaleX(). A short linear transition
 * smooths between the ~7 Hz store publishes so the bar reads as continuous.
 */
export function ProgressBar({ fraction, color = 'var(--accent)' }: Props) {
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full"
      style={{ background: 'var(--surface-3)' }}
      role="progressbar"
      aria-valuenow={Math.round(fraction * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="progress-fill h-full w-full rounded-full"
        style={{
          background: color,
          transform: `scaleX(${Math.max(0, Math.min(1, fraction))})`,
          transition: 'transform 0.14s linear',
        }}
      />
    </div>
  )
}
