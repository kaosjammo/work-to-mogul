import { memo } from 'react'
import type { BusinessView } from '../../store/buildView'
import { formatRate } from '../../engine/num'
import { tap } from '../../store/actions'
import { useUiStore } from '../../store/uiStore'
import { Icon } from '../shared/Icon'
import { businessArt } from '../shared/art'
import { ProgressBar } from './ProgressBar'
import { BuyButton } from './BuyButton'

interface Props {
  view: BusinessView
  accent: string
}

function BusinessCardImpl({ view, accent }: Props) {
  const tappable = view.owned > 0 && !view.isAutomated
  const idle = view.owned > 0 && !view.isAutomated && view.progressFraction <= 0

  return (
    <div
      onClick={tappable ? () => tap(view.id) : undefined}
      className="flex flex-col gap-2 rounded-2xl p-3"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        cursor: tappable ? 'pointer' : 'default',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl"
          style={{ background: 'var(--surface-2)' }}
        >
          <Icon art={businessArt(view.id, view.icon)} size={40} alt={view.name} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-semibold">{view.name}</span>
            <span
              className="tnum shrink-0 rounded-full px-2 py-0.5 text-xs font-bold"
              style={{ background: 'var(--surface-3)', color: accent }}
            >
              ×{view.owned}
            </span>
          </div>
          <div className="tnum text-xs" style={{ color: 'var(--text-dim)' }}>
            {view.owned > 0 ? formatRate(view.pps) : 'not started'}
            {view.isAutomated ? ' · 🤖 auto' : ''}
          </div>
        </div>
      </div>

      <ProgressBar fraction={view.owned > 0 ? view.progressFraction : 0} color={accent} />

      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {view.isBestBuy && (
            <span
              className="w-fit rounded-full px-2 py-0.5 text-xs font-bold"
              style={{ background: 'rgba(245,197,24,0.18)', color: 'var(--accent)' }}
              title="Best return on investment right now"
            >
              ⭐ Best ROI
            </span>
          )}
          {/* Compact staff chip — opens the assignment sheet. */}
          {view.owned > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                useUiStore.getState().openAssignment(view.id)
              }}
              className="flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}
            >
              <span>👤 {view.assignedCount}/{view.unlockedSlots}</span>
              {view.automated && <span title="Automated">⚙️</span>}
              {view.staffProfitPct > 0 && <span style={{ color: 'var(--good)' }}>+{view.staffProfitPct}%</span>}
              {view.staffSpeedPct > 0 && <span style={{ color: 'var(--accent)' }}>⚡{view.staffSpeedPct}%</span>}
              {view.staffCritChance > 0 && <span title="Crit chance">🎲{view.staffCritChance}%</span>}
              {view.staffFocusPct > 0 && (
                <span style={{ color: 'var(--accent)' }} title="Industry focus bonus">
                  🎯{view.staffFocusPct}%
                </span>
              )}
              {view.synergies.length > 0 && (
                <span style={{ color: '#c084fc' }} title={view.synergies.join(', ')}>
                  ✨{view.synergies.length}
                </span>
              )}
            </button>
          )}
          {view.nextMilestoneThreshold != null && (
            <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
              ★ at {view.nextMilestoneThreshold} → {view.nextMilestoneLabel}
            </span>
          )}
          {view.riskEnabled && (
            <span
              className="text-xs"
              style={{ color: view.riskEventActive ? 'var(--bad)' : 'var(--text-faint)' }}
            >
              {view.riskEventActive ? '⚠️ Disruption (−50%)' : `🛡️ Risk ${view.riskPct}%`}
            </span>
          )}
          {idle && (
            <span className="text-xs font-semibold" style={{ color: accent }}>
              tap to collect
            </span>
          )}
        </div>
        <BuyButton view={view} />
      </div>
    </div>
  )
}

export const BusinessCard = memo(BusinessCardImpl)
