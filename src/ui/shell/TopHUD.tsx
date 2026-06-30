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
      className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b px-4"
      style={{
        paddingTop: 'calc(var(--safe-top) + 10px)',
        paddingBottom: '10px',
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="flex min-w-0 flex-col">
        <span className="tnum truncate text-2xl font-bold" style={{ color: 'var(--accent)' }}>
          {money(cash)}
        </span>
        <span className="tnum truncate text-xs" style={{ color: 'var(--text-dim)' }}>
          {pps > 0 ? `${formatRate(pps)} idle` : 'tap to earn'}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
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
              className="px-3 text-sm font-semibold capitalize"
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
        <AccountButton />
      </div>
    </header>
  )
}
