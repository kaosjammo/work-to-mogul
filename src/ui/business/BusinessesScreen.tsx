import {
  useGameStore,
  useActiveIndustry,
  useFinanceCompound,
  useQuantumSuperposition,
  useLogistics,
  useBuyMode,
  useAutomation,
  useRomance,
  useLog,
} from '../../store/gameStore'
import { useUiStore } from '../../store/uiStore'
import { INDUSTRIES } from '../../content/industries'
import { BUSINESSES } from '../../content/businesses'
import { money, formatEta } from '../../engine/num'
import { spendCash, dispatchCargo, setBuyMode, poachAssistant } from '../../store/actions'
import type { LogisticsView } from '../../store/buildView'
import type { BuyMode } from '../../types/domain'
import { WorkCard } from '../work/WorkCard'
import { IndustryTabs } from './IndustryTabs'
import { IndustryBanner } from './IndustryBanner'
import { BusinessCard } from './BusinessCard'
import { LockedBusinessCard } from './LockedBusinessCard'
import { CombinatorCard } from './CombinatorCard'

// Industry specialisation bonuses unlock at owned thresholds (industryMultipliers):
// 100 → ×1.5 profit, 250 → ×2, 500 → ×2 + the industry's signature perk.
const INDUSTRY_TIERS = [
  { at: 100, label: '×1.5 profit' },
  { at: 250, label: '×2 profit' },
  { at: 500, label: '×2 profit + perk' },
]

const BUY_MODES: BuyMode[] = ['x1', 'x10', 'x100', 'max']

/**
 * One flat, borderless signature strip under the banner — replaces the stack of separate
 * cue boxes. Left = the industry specialisation bonus (all industries); right = the active
 * signature for this industry (Finance compound / Quantum superposition / Logistics dispatch
 * — only one is ever active). A 2px accent left stripe + a thin baseline (bonus progress).
 */
function IndustrySignatureStrip({
  totalOwned,
  activeId,
  theme,
  financeCompound,
  quantumSuperposition,
  logistics,
}: {
  totalOwned: number
  activeId: string
  theme: string
  financeCompound: { industryId: string; pct: number }
  quantumSuperposition: { industryId: string; collapsing: boolean; mult: number }
  logistics: LogisticsView
}) {
  const nextIdx = INDUSTRY_TIERS.findIndex((t) => totalOwned < t.at)
  const next = nextIdx >= 0 ? INDUSTRY_TIERS[nextIdx] : null
  const reached =
    nextIdx === -1
      ? INDUSTRY_TIERS[INDUSTRY_TIERS.length - 1]
      : nextIdx > 0
        ? INDUSTRY_TIERS[nextIdx - 1]
        : null
  const prevAt = next ? (nextIdx > 0 ? INDUSTRY_TIERS[nextIdx - 1].at : 0) : 500
  const frac = next ? Math.min(1, (totalOwned - prevAt) / (next.at - prevAt)) : 1

  return (
    <div className="relative mb-3 overflow-hidden py-1.5 pl-2.5" style={{ borderLeft: `2px solid ${theme}` }}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 truncate text-xs">
          <span style={{ color: 'var(--text-dim)' }}>⭐ {reached ? reached.label : 'Industry bonus'}</span>
          <span className="tnum" style={{ color: 'var(--text-faint)' }}>
            {next ? ` · next ${next.label} at ${next.at}` : ' · maxed ✓'}
          </span>
        </div>

        {activeId === financeCompound.industryId && (
          <span
            className="tnum shrink-0 text-xs font-bold"
            style={{ color: financeCompound.pct > 0 ? 'var(--good)' : 'var(--text-faint)' }}
          >
            📈 +{financeCompound.pct}%
          </span>
        )}

        {activeId === quantumSuperposition.industryId && (
          <span
            className="tnum shrink-0 text-xs font-bold"
            style={{ color: quantumSuperposition.collapsing ? theme : 'var(--text-faint)' }}
          >
            ⚛️ {quantumSuperposition.collapsing ? `×${quantumSuperposition.mult}!` : 'stable'}
          </span>
        )}

        {activeId === logistics.industryId &&
          (logistics.surgeActive ? (
            <span className="tnum shrink-0 text-xs font-bold" style={{ color: theme }}>
              🚀 +{logistics.surgePct}% ({logistics.surgeSecondsLeft}s)
            </span>
          ) : (
            <button
              type="button"
              onClick={dispatchCargo}
              disabled={!logistics.canDispatch}
              className={`btn btn-sm shrink-0 ${logistics.canDispatch ? 'btn-primary' : 'btn-secondary'}`}
            >
              {logistics.canDispatch
                ? `🚚 Dispatch +${logistics.readyPct}%`
                : `🚚 ${Math.round(logistics.loadFraction * 100)}%`}
            </button>
          ))}
      </div>

      <div
        className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden"
        style={{ background: 'var(--surface-2)' }}
        aria-hidden
      >
        <div
          className="progress-fill h-full"
          style={{ background: theme, transform: `scaleX(${frac})`, transition: 'transform 0.2s linear' }}
        />
      </div>
    </div>
  )
}

export function BusinessesScreen() {
  const activeId = useActiveIndustry()
  const ind = INDUSTRIES[activeId]
  const industryView = useGameStore((s) => s.industries.find((i) => i.id === activeId))
  const businesses = useGameStore((s) => s.businesses)
  const financeCompound = useFinanceCompound()
  const quantumSuperposition = useQuantumSuperposition()
  const logistics = useLogistics()
  const buyMode = useBuyMode()
  const automation = useAutomation()
  const romance = useRomance()
  const log = useLog()
  const openAutomation = useUiStore((s) => s.openAutomation)
  const openMarriage = useUiStore((s) => s.openMarriage)
  const openLog = useUiStore((s) => s.openLog)

  if (!ind || !industryView) return null

  // Global quick-spend is only useful once you actually own a business.
  const hasAnyBusiness = Object.values(businesses).some((b) => b.owned > 0)

  return (
    <div>
      {!hasAnyBusiness && (
        <div className="mb-3 pl-2.5 text-sm" style={{ borderLeft: '2px solid #6aa9ff', color: 'var(--text-dim)' }}>
          👋 <span className="font-semibold" style={{ color: 'var(--text)' }}>New here?</span> Tap{' '}
          <span className="font-semibold" style={{ color: '#6aa9ff' }}>Work Shift</span> below to earn your
          first cash, then buy a business to start your empire.
        </div>
      )}
      <WorkCard />
      <CombinatorCard />
      <IndustryTabs />
      <IndustryBanner
        industryId={activeId}
        name={ind.name}
        theme={ind.theme}
        totalOwned={industryView.totalOwned}
      />

      {industryView.totalOwned > 0 && (
        <IndustrySignatureStrip
          totalOwned={industryView.totalOwned}
          activeId={activeId}
          theme={ind.theme}
          financeCompound={financeCompound}
          quantumSuperposition={quantumSuperposition}
          logistics={logistics}
        />
      )}

      {!industryView.ownsAny && (
        <div className="mb-3 pl-2.5 text-sm" style={{ borderLeft: `2px solid ${ind.theme}` }}>
          <div className="font-semibold">
            Cost of entry: <span style={{ color: ind.theme }}>{money(industryView.entryCost)}</span>
          </div>
          <div style={{ color: 'var(--text-dim)' }}>First business: {industryView.firstBusinessName}</div>
          {industryView.entryAffordable ? (
            <div className="mt-0.5 font-semibold" style={{ color: 'var(--good)' }}>
              ✓ You can afford to start — buy {industryView.firstBusinessName} below.
            </div>
          ) : (
            <div className="mt-0.5" style={{ color: 'var(--text-faint)' }}>
              {industryView.entryEtaSec != null
                ? `⏳ About ${formatEta(industryView.entryEtaSec)} away at your current income.`
                : 'Earn more capital to buy into this industry.'}
            </div>
          )}
        </div>
      )}

      {hasAnyBusiness && (
        <div className="mb-2 flex gap-1" role="group" aria-label="Buy amount">
          {BUY_MODES.map((mode) => {
            const active = mode === buyMode
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setBuyMode(mode)}
                aria-pressed={active}
                className={`btn btn-sm btn-block capitalize ${active ? 'btn-primary' : 'btn-secondary'}`}
              >
                {mode}
              </button>
            )
          })}
        </div>
      )}

      <div className="section mb-2 flex items-center justify-between gap-1.5">
        <h2>Businesses</h2>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {/* Manager + status buttons — each opens its own thing, right by Spend cash. */}
          {automation.ea.canPoach && (
            <button
              type="button"
              onClick={() => poachAssistant()}
              className="btn btn-primary btn-sm"
              title={`${automation.ea.partnerName} is ready to jump — poach her as your Executive Assistant`}
            >
              🤝 Poach {automation.ea.partnerName.split(' ')[0]}
            </button>
          )}
          {automation.ea.unlocked && (
            <button
              type="button"
              onClick={() => openAutomation('invest')}
              className={`btn btn-sm ${automation.invest.enabled ? 'btn-primary' : 'btn-secondary'}`}
              title={
                automation.invest.enabled
                  ? `${automation.ea.partnerName} on · reinvesting every ${automation.invest.intervalSec}s`
                  : `${automation.ea.partnerName} (paused)`
              }
            >
              🤖 {automation.ea.partnerName.split(' ')[0]} · EA
            </button>
          )}
          {automation.staff.unlocked && (
            <button
              type="button"
              onClick={() => openAutomation('staff')}
              className={`btn btn-sm ${automation.staff.enabled ? 'btn-primary' : 'btn-secondary'}`}
              title={automation.staff.enabled ? `Chief of Staff on · managing every ${automation.staff.intervalSec}s` : 'Chief of Staff (paused)'}
            >
              👔 Chief
            </button>
          )}
          {romance.married && (
            <button
              type="button"
              onClick={() => openMarriage()}
              className={`btn btn-sm relative ${romance.honeymoonPending ? 'btn-primary' : 'btn-secondary'}`}
              title={
                romance.honeymoonPending
                  ? 'Book the honeymoon!'
                  : romance.drainPct > 0
                    ? `Lifestyle upkeep: ${romance.drainPct}% of income`
                    : 'Married — no upkeep yet'
              }
            >
              💍 Married{romance.honeymoonPending ? ' · 🌴' : romance.drainPct > 0 ? ` · ${romance.drainPct}%` : ''}
              {romance.honeymoonPending && (
                <span
                  className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-pulse rounded-full"
                  style={{ background: '#f5c518', boxShadow: '0 0 0 2px rgba(0,0,0,0.4)' }}
                  aria-hidden
                />
              )}
            </button>
          )}
          {log.hasContent && (
            <button
              type="button"
              onClick={() => openLog()}
              className="btn btn-secondary btn-sm"
              title="The Log — replay a mini-game or re-read a past story"
            >
              📜 Log
            </button>
          )}
          {hasAnyBusiness && (
            <button type="button" onClick={spendCash} className="btn btn-secondary btn-sm" style={{ color: 'var(--accent)' }}>
              💸 Spend cash
            </button>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        {ind.businessIds.map((bid) => {
          const view = businesses[bid]
          if (!view) return null
          if (view.unlocked) {
            return <BusinessCard key={bid} view={view} accent={ind.theme} />
          }
          const def = BUSINESSES[bid]
          const progress =
            def.unlock.kind === 'businessOwned'
              ? {
                  current: businesses[def.unlock.businessId]?.owned ?? 0,
                  target: def.unlock.count,
                }
              : undefined
          return <LockedBusinessCard key={bid} def={def} progress={progress} accent={ind.theme} />
        })}
      </div>
    </div>
  )
}
