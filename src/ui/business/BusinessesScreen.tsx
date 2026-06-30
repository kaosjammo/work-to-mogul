import { useGameStore, useActiveIndustry } from '../../store/gameStore'
import { INDUSTRIES } from '../../content/industries'
import { BUSINESSES } from '../../content/businesses'
import { money } from '../../engine/num'
import { WorkCard } from '../work/WorkCard'
import { IndustryTabs } from './IndustryTabs'
import { IndustryBanner } from './IndustryBanner'
import { BusinessCard } from './BusinessCard'
import { LockedBusinessCard } from './LockedBusinessCard'
import { industryPattern } from '../shared/art'

export function BusinessesScreen() {
  const activeId = useActiveIndustry()
  const ind = INDUSTRIES[activeId]
  const industryView = useGameStore((s) => s.industries.find((i) => i.id === activeId))
  const businesses = useGameStore((s) => s.businesses)

  if (!ind || !industryView) return null

  const pattern = industryPattern(activeId)

  return (
    <div>
      <WorkCard />
      <IndustryTabs />
      <IndustryBanner industryId={activeId} name={ind.name} totalOwned={industryView.totalOwned} />

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
                Earn more capital to buy into this industry.
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
