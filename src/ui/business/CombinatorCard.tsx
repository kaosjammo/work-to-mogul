import { useEffect, useRef } from 'react'
import { useCombinator } from '../../store/gameStore'
import { useUiStore } from '../../store/uiStore'
import { formatRate, money, formatEta } from '../../engine/num'
import { haptic } from '../../lib/haptics'
import { BuyButton } from './BuyButton'

const ACCENT = '#2bd47a' // Combinator green (Finance/Tech hybrid)

/**
 * The Startup Combinator — a SPECIAL standalone business unlocked by the Angel Deal's
 * great outcome. Pays steady income + periodically fires a large "exit" jackpot. Rendered
 * at the top of the Business screen only once unlocked. Celebrates every exit.
 */
/**
 * Always-mounted watcher (rendered in App, not the Business tab) so a Combinator "exit"
 * — which fires automatically on a ~2-min cadence — celebrates no matter which tab you're on.
 */
export function CombinatorExitWatcher() {
  const c = useCombinator()
  const prevExits = useRef(c.exitCount)
  useEffect(() => {
    if (c.exitCount > prevExits.current && c.lastExitAmount > 0) {
      haptic(30)
      useUiStore.getState().pushCelebrations([`🚀 Startup EXIT! +${money(c.lastExitAmount)}`])
    }
    prevExits.current = c.exitCount
  }, [c.exitCount, c.lastExitAmount])
  return null
}

export function CombinatorCard() {
  const c = useCombinator()
  if (!c.unlocked || !c.business) return null
  const b = c.business

  return (
    <div
      className="card relative mb-3 overflow-hidden p-3"
      style={{ borderColor: ACCENT, background: 'linear-gradient(180deg, rgba(43,212,122,0.10), transparent 60%), var(--surface)' }}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl" style={{ background: 'var(--surface-2)' }}>
          🚀
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-bold" style={{ color: ACCENT }}>
              Startup Combinator
            </span>
            <span className="tnum shrink-0 text-xs font-bold" style={{ color: ACCENT }}>
              ×{b.owned}
            </span>
          </div>
          <div className="tnum text-xs" style={{ color: 'var(--text-dim)' }}>
            {formatRate(b.pps)} · 🤖 auto · exits pay a lump of income
          </div>
        </div>
        <BuyButton view={b} />
      </div>

      {/* Exit timer — the jackpot cadence. */}
      <div className="mt-2">
        <div className="mb-1 flex items-center justify-between text-[11px]" style={{ color: 'var(--text-faint)' }}>
          <span>Next exit in ~{formatEta(c.nextExitSec)}</span>
          {c.exitCount > 0 && (
            <span className="tnum" style={{ color: ACCENT }}>
              last: +{money(c.lastExitAmount)}
            </span>
          )}
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: 'var(--surface-3)' }}>
          <div
            className="progress-fill h-full rounded-full"
            style={{ background: ACCENT, transform: `scaleX(${c.exitProgress})`, transition: 'transform 0.2s linear' }}
          />
        </div>
      </div>
    </div>
  )
}
