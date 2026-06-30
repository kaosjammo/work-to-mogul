import { useGameStore, useActiveIndustry } from '../../store/gameStore'
import { INDUSTRIES } from '../../content/industries'
import { BUSINESSES } from '../../content/businesses'
import { money, formatEta } from '../../engine/num'
import { spendCash } from '../../store/actions'
import { WorkCard } from '../work/WorkCard'
import { IndustryTabs } from './IndustryTabs'
import { IndustryBanner } from './IndustryBanner'
import { BusinessCard } from './BusinessCard'
import { LockedBusinessCard } from './LockedBusinessCard'
import { industryPattern } from '../shared/art'

// Industry specialisation bonuses unlock at owned thresholds (industryMultipliers):
// 100 → ×1.5 profit, 250 → ×2, 500 → ×2 + the industry's signature perk.
const INDUSTRY_TIERS = [
  { at: 100, label: '×1.5 profit' },
  { at: 250, label: '×2 profit' },
  { at: 500, label: '×2 profit + perk' },
]

/** Surfaces the (otherwise invisible) industry specialisation bonus + progress. */
function IndustryBonusCue({ totalOwned, theme }: { totalOwned: number; theme: string }) {
  const nextIdx = INDUSTRY_TIERS.findIndex((t) => totalOwned < t.at)
  const next = nextIdx >= 0 ? INDUSTRY_TIERS[nextIdx] : null
  const reached = nextIdx === -1 ? INDUSTRY_TIERS[INDUSTRY_TIERS.length - 1] : nextIdx > 0 ? INDUSTRY_TIERS[nextIdx - 1] : null
  const prevAt = next ? (nextIdx > 0 ? INDUSTRY_TIERS[nextIdx - 1].at : 0) : 500
  const frac = next ? Math.min(1, (totalOwned - prevAt) / (next.at - prevAt)) : 1
  return (
    <div className="mb-3 rounded-2xl px-3 py-2" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span style={{ color: 'var(--text-dim)' }}>⭐ Industry bonus{reached ? `: ${reached.label}` : ''}</span>
        <span className="tnum" style={{ color: next ? 'var(--text-faint)' : 'var(--good)' }}>
          {next ? `next ${next.label} at ${next.at}` : 'maxed + perk ✓'}
        </span>
      </div>
      {next && (
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full" style={{ background: 'var(--surface-3)' }}>
          <div className="h-full rounded-full" style={{ background: theme, width: `${Math.round(frac * 100)}%` }} />
        </div>
      )}
    </div>
  )
}

export function BusinessesScreen() {
  const activeId = useActiveIndustry()
  const ind = INDUSTRIES[activeId]
  const industryView = useGameStore((s) => s.industries.find((i) => i.id === activeId))
  const businesses = useGameStore((s) => s.businesses)

  if (!ind || !industryView) return null

  const pattern = industryPattern(activeId)
  // Global quick-spend is only useful once you actually own a business.
  const hasAnyBusiness = Object.values(businesses).some((b) => b.owned > 0)

  return (
    <div>
      {!hasAnyBusiness && (
        <div
          className="mb-3 rounded-2xl px-3 py-2 text-sm"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}
        >
          👋 <span className="font-semibold" style={{ color: 'var(--text)' }}>New here?</span> Tap{' '}
          <span className="font-semibold" style={{ color: '#6aa9ff' }}>Work Shift</span> below to earn your
          first cash, then buy a business to start your empire.
        </div>
      )}
      <WorkCard />
      <IndustryTabs />
      <IndustryBanner industryId={activeId} name={ind.name} totalOwned={industryView.totalOwned} />

      {industryView.totalOwned > 0 && (
        <IndustryBonusCue totalOwned={industryView.totalOwned} theme={ind.theme} />
      )}

      {hasAnyBusiness && (
        <button
          type="button"
          onClick={spendCash}
          title="Spend your cash on the best-value buys across all your businesses"
          className="mb-3 flex w-full items-center justify-center gap-1.5 rounded-2xl px-3 text-sm font-bold transition active:scale-[0.99]"
          style={{
            minHeight: 'var(--tap)',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            color: 'var(--accent)',
          }}
        >
          💸 Spend Cash <span className="font-normal" style={{ color: 'var(--text-dim)' }}>· best value</span>
        </button>
      )}

      {!industryView.ownsAny && (
        <div
          className="relative mb-3 overflow-hidden rounded-2xl p-3 text-sm"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
        >
          {pattern && (
            <div
              className="pointer-events-none absolute inset-0"
              aria-hidden
              style={{ backgroundImage: `url(${pattern})`, backgroundSize: '64px', opacity: 0.6 }}
            />
          )}
          <div className="relative">
            <div className="font-semibold">
              Cost of entry: <span style={{ color: ind.theme }}>{money(industryView.entryCost)}</span>
            </div>
            <div style={{ color: 'var(--text-dim)' }}>
              First business: {industryView.firstBusinessName}
            </div>
            {industryView.entryAffordable ? (
              <div className="mt-1 font-semibold" style={{ color: 'var(--good)' }}>
                ✓ You can afford to start — buy {industryView.firstBusinessName} below.
              </div>
            ) : (
              <div className="mt-1" style={{ color: 'var(--text-faint)' }}>
                {industryView.entryEtaSec != null
                  ? `⏳ About ${formatEta(industryView.entryEtaSec)} away at your current income.`
                  : 'Earn more capital to buy into this industry.'}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
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
          return <LockedBusinessCard key={bid} def={def} progress={progress} />
        })}
      </div>
    </div>
  )
}
