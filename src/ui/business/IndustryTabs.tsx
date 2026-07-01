import { money } from '../../engine/num'
import { useIndustries, useActiveIndustry } from '../../store/gameStore'
import { setActiveIndustry } from '../../store/actions'
import { Icon } from '../shared/Icon'
import { industryArt } from '../shared/art'

export function IndustryTabs() {
  const industries = useIndustries()
  const active = useActiveIndustry()

  return (
    <div className="-mx-3 mb-1.5 flex gap-1.5 overflow-x-auto px-3 pb-1">
      {industries.map((ind) => {
        const isActive = ind.id === active
        // Dim industries you don't own yet and can't afford to enter.
        const lockedOut = !ind.ownsAny && !ind.entryAffordable
        const costColor = isActive
          ? 'var(--accent-ink)'
          : ind.entryAffordable
            ? 'var(--good)'
            : 'var(--text-faint)'
        return (
          <button
            key={ind.id}
            type="button"
            onClick={() => setActiveIndustry(ind.id)}
            className="flex shrink-0 items-center gap-1.5 px-3 text-sm font-semibold transition active:scale-[0.97]"
            style={{
              minHeight: 'var(--tap)',
              borderRadius: 'var(--radius-pill)',
              background: isActive ? ind.theme : 'var(--surface-2)',
              color: isActive ? 'var(--accent-ink)' : 'var(--text-dim)',
              opacity: lockedOut && !isActive ? 0.7 : 1,
            }}
          >
            <Icon art={industryArt(ind.id)} size={20} alt="" />
            <span>{ind.name.split(' ')[0]}</span>
            {!ind.ownsAny && (
              <span className="tnum text-xs font-bold" style={{ color: costColor }}>
                {ind.entryAffordable ? '✓' : ''}
                {money(ind.entryCost)}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
