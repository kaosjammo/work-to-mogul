import { useEffect, useRef, useState } from 'react'
import { money, formatRate } from '../../engine/num'
import { useCash, useTotalPps, useGolden, useMomentum } from '../../store/gameStore'
import { haptic } from '../../lib/haptics'
import { AccountButton } from '../account/AccountButton'

/** Wealth magnitude tier — bumps each ×1000 (K → M → B → T …). */
function cashTier(cash: number): number {
  return cash >= 1 ? Math.floor(Math.log10(cash) / 3) : 0
}

export function TopHUD() {
  const cash = useCash()
  const pps = useTotalPps()
  const golden = useGolden()
  const momentum = useMomentum()

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
      className="chrome chrome-hud sticky top-0 z-20 flex items-center justify-between gap-3 border-b px-4"
      style={{
        paddingTop: 'calc(var(--safe-top) + 10px)',
        paddingBottom: '10px',
        borderColor: 'var(--border)',
      }}
    >
      {/* Cash is the hero: it claims the full width minus the small account
          pill, so large amounts ($1.24M, $2.48Qa …) never get clipped. */}
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
          {momentum.active && (
            <span className="ml-1 font-bold" style={{ color: '#38bdf8' }}>
              · 🔗 {momentum.mult}× combo
            </span>
          )}
        </span>
      </div>
      <AccountButton />
    </header>
  )
}
