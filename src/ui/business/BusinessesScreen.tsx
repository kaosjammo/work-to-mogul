import { useGameStore, useActiveIndustry } from '../../store/gameStore'
import { INDUSTRIES } from '../../content/industries'
import { BUSINESSES } from '../../content/businesses'
import { money } from '../../engine/num'
import { WorkCard } from '../work/WorkCard'
import { IndustryTabs } from './IndustryTabs'
import { BusinessCard } from './BusinessCard'
import { LockedBusinessCard } from './LockedBusinessCard'

export function BusinessesScreen() {
  const activeId = useActiveIndustry()
  const ind = INDUSTRIES[activeId]
  const industryView = useGameStore((s) => s.industries.find((i) => i.id === activeId))
  const businesses = useGameStore((s) => s.businesses)

  if (!ind || !industryView) return null

  return (
    <div>
      <WorkCard />
      <IndustryTabs />

      {!industryView.ownsAny && (
        <div
          className="mb-3 rounded-2xl p-3 text-sm"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
        >
          <div className="font-semibold">
            Cost of entry: <span style={{ color: ind.theme }}>{money(industryView.entryCost)}</span>
          </div>
          <div style={{ color: 'var(--text-dim)' }}>
            First business: {industryView.firstBusinessName}
          </div>
          {!industryView.entryAffordable && (
            <div className="mt-1" style={{ color: 'var(--text-faint)' }}>
              Earn more capital to buy into this industry.
            </div>
          )}
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
