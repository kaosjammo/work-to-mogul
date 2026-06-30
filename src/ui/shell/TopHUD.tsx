import type { BuyMode } from '../../types/domain'
import { money, formatRate } from '../../engine/num'
import { useCash, useTotalPps, useBuyMode } from '../../store/gameStore'
import { setBuyMode } from '../../store/actions'
import { AccountButton } from '../account/AccountButton'

const BUY_MODES: BuyMode[] = ['x1', 'x10', 'x100', 'max']

export function TopHUD() {
  const cash = useCash()
  const pps = useTotalPps()
  const buyMode = useBuyMode()

  return (
    <header
      className="sticky top-0 z-20 flex flex-col gap-2 border-b px-4"
      style={{
        paddingTop: 'calc(var(--safe-top) + 10px)',
        paddingBottom: '10px',
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Row 1 — cash is the hero: it claims the full width minus the small
          account pill, so large amounts ($1.24M, $2.48Qa …) never get clipped.
          (Previously the buy-mode toggle shared this row and squeezed the cash
          to ~70px on a phone, truncating anything past ~5 characters.) */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="tnum truncate text-2xl font-bold leading-tight" style={{ color: 'var(--accent)' }}>
            {money(cash)}
          </span>
          <span className="tnum truncate text-xs" style={{ color: 'var(--text-dim)' }}>
            {pps > 0 ? `${formatRate(pps)} idle` : 'tap to earn'}
          </span>
        </div>
        <AccountButton />
      </div>

      {/* Row 2 — buy-mode toggle as a full-width segmented control (even,
          generous tap targets). */}
      <div
        className="flex overflow-hidden rounded-full"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
        role="group"
        aria-label="Buy amount"
      >
        {BUY_MODES.map((mode) => {
          const active = mode === buyMode
          return (
            <button
              key={mode}
              type="button"
              onClick={() => setBuyMode(mode)}
              className="flex-1 text-sm font-semibold capitalize"
              style={{
                minHeight: 'var(--tap)',
                color: active ? 'var(--accent-ink)' : 'var(--text-dim)',
                background: active ? 'var(--accent)' : 'transparent',
              }}
            >
              {mode}
            </button>
          )
        })}
      </div>
    </header>
  )
}
