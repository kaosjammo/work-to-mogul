import { useEffect, useRef, useState } from 'react'
import type { BuyMode } from '../../types/domain'
import { money, formatRate } from '../../engine/num'
import { useCash, useTotalPps, useBuyMode, useGolden } from '../../store/gameStore'
import { setBuyMode } from '../../store/actions'
import { haptic } from '../../lib/haptics'
import { AccountButton } from '../account/AccountButton'

const BUY_MODES: BuyMode[] = ['x1', 'x10', 'x100', 'max']

/** Wealth magnitude tier — bumps each ×1000 (K → M → B → T …). */
function cashTier(cash: number): number {
  return cash >= 1 ? Math.floor(Math.log10(cash) / 3) : 0
}

export function TopHUD() {
  const cash = useCash()
  const pps = useTotalPps()
  const buyMode = useBuyMode()
  const golden = useGolden()

  // Pop + buzz the cash only when it crosses into a new magnitude (a rare,
  // satisfying "you hit millions!" beat — never on ordinary idle ticks).
  const tier = cashTier(cash)
  const prevTier = useRef(tier)
  const [popKey, setPopKey] = useState(0)
  useEffect(() => {
    if (tier > prevTier.current) {
      setPopKey((k) => k + 1)
      haptic(20)
    }
    prevTier.current = tier
  }, [tier])

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
          <span
            key={popKey}
            // leading-normal (not -tight): the 24px bold glyph ink is ~32px tall, so a
            // 30px tight line box + truncate's overflow:hidden shaved the top & bottom of
            // the hero number. Normal leading clears the ink with margin to spare.
            className={`tnum truncate text-2xl font-bold leading-normal ${popKey > 0 ? 'cash-pop' : ''}`}
            style={{ color: 'var(--accent)', transformOrigin: 'left center' }}
          >
            {money(cash)}
          </span>
          <span className="tnum truncate text-xs" style={{ color: 'var(--text-dim)' }}>
            {pps > 0 ? `${formatRate(pps)} idle` : 'tap to earn'}
            {golden.frenzyActive && (
              <span className="ml-1 font-bold" style={{ color: '#ff7a18' }}>
                · 🔥 2× ({golden.frenzySecondsLeft}s)
              </span>
            )}
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
