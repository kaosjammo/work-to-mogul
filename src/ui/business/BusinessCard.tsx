import { memo, useEffect, useRef, useState } from 'react'
import type { BusinessView } from '../../store/buildView'
import { formatRate, money, formatEta } from '../../engine/num'
import { tap } from '../../store/actions'
import { haptic } from '../../lib/haptics'
import { useUiStore } from '../../store/uiStore'
import { Icon } from '../shared/Icon'
import { businessArt } from '../shared/art'
import { BuyButton } from './BuyButton'

interface Props {
  view: BusinessView
  accent: string
}

/**
 * A dense, flat business ROW (not a card). Icon + name/owned on line 1, rate + one
 * status micro on line 2, a content-hug Buy chip on the right, staff behind a ghost
 * chip. Best-ROI shows as a 2px accent left stripe; a thin progress baseline runs
 * along the bottom edge. Manual (un-automated) businesses run a cycle on row tap.
 */
function BusinessCardImpl({ view, accent }: Props) {
  const tappable = view.owned > 0 && !view.isAutomated
  const idle = tappable && view.progressFraction <= 0

  // Pop the owned count whenever it grows (a satisfying buy confirmation).
  const [ownedPop, setOwnedPop] = useState(0)
  const prevOwned = useRef(view.owned)
  useEffect(() => {
    if (view.owned > prevOwned.current) setOwnedPop((k) => k + 1)
    prevOwned.current = view.owned
  }, [view.owned])

  const rate = view.owned > 0 ? formatRate(view.pps) : 'not started'
  let state = ''
  if (view.isAutomated) state = ' · auto'
  else if (tappable) state = idle ? ' · tap to run' : ' · running…'
  // One appended status hint, most-urgent first (kept to a single truncated line).
  let hint = ''
  if (view.riskEnabled && view.riskEventActive) hint = ' · ⚠️ −50%'
  else if (!view.affordable && view.affordEtaSec != null) hint = ` · ⏳ ${formatEta(view.affordEtaSec)}`
  else if (view.nextMilestoneThreshold != null) hint = ` · ★ ${view.nextMilestoneThreshold}`

  const runCycle = (e: { clientX: number; clientY: number }) => {
    // Only celebrate a tap that actually started a cycle — a tap while one is
    // already running is a no-op in the engine and must not pop a phantom "+$".
    if (!tap(view.id)) return
    const payout = view.pps * (view.cycleMs / 1000)
    if (payout > 0) useUiStore.getState().spawnFloat(e.clientX, e.clientY, `+${money(payout)}`)
    haptic(12)
  }

  return (
    <div
      className="list-row relative py-2.5 pr-3"
      role={tappable ? 'button' : undefined}
      tabIndex={tappable ? 0 : undefined}
      aria-label={tappable ? `Run a ${view.name} cycle` : undefined}
      style={{
        paddingLeft: view.isBestBuy ? '9px' : '12px',
        borderLeft: view.isBestBuy ? `2px solid ${accent}` : undefined,
        cursor: idle ? 'pointer' : undefined,
      }}
      onClick={tappable ? runCycle : undefined}
      onKeyDown={
        tappable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                const r = e.currentTarget.getBoundingClientRect()
                runCycle({ clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 })
              }
            }
          : undefined
      }
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg ${idle ? 'tap-ready' : ''}`}
        style={{ background: 'var(--surface-2)' }}
      >
        <Icon art={businessArt(view.id, view.icon)} size={34} alt={view.name} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold">{view.name}</span>
          <span
            key={ownedPop}
            className={`tnum shrink-0 text-xs font-bold ${ownedPop > 0 ? 'count-pop' : ''}`}
            style={{ color: accent }}
          >
            ×{view.owned}
          </span>
        </div>
        <div className="tnum truncate text-xs" style={{ color: 'var(--text-dim)' }}>
          {rate}
          <span style={{ color: 'var(--text-faint)' }}>
            {state}
            {hint}
          </span>
        </div>
      </div>

      {view.owned > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            useUiStore.getState().openAssignment(view.id)
          }}
          aria-label={`Manage staff for ${view.name} — ${view.assignedCount} of ${view.unlockedSlots} assigned`}
          className="btn btn-ghost btn-sm shrink-0"
          style={{ padding: '0 8px', gap: '4px' }}
        >
          👤 {view.assignedCount}/{view.unlockedSlots}
          {view.synergies.length > 0 && <span style={{ color: '#c084fc' }}>✨{view.synergies.length}</span>}
        </button>
      )}

      <BuyButton view={view} />

      {view.owned > 0 && (
        <div
          className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden"
          style={{ background: 'var(--surface-2)' }}
          aria-hidden
        >
          <div
            className="progress-fill h-full"
            style={{
              background: accent,
              transform: `scaleX(${view.progressFraction})`,
              transition: 'transform 0.1s linear',
            }}
          />
        </div>
      )}
    </div>
  )
}

export const BusinessCard = memo(BusinessCardImpl)
