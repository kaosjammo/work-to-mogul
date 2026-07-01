import type { BusinessDef } from '../../types/domain'
import { BUSINESSES } from '../../content/businesses'
import { money } from '../../engine/num'
import { Icon } from '../shared/Icon'
import { businessArt } from '../shared/art'

function unlockText(def: BusinessDef): string {
  const u = def.unlock
  switch (u.kind) {
    case 'businessOwned':
      return `Own ${u.count} ${BUSINESSES[u.businessId]?.name ?? ''}`
    case 'industryProgress':
      return `Own ${u.totalOwned} across the industry`
    case 'cash':
      return `Reach ${money(u.amount)}`
    case 'free':
      return ''
  }
}

export function LockedBusinessCard({
  def,
  progress,
}: {
  def: BusinessDef
  progress?: { current: number; target: number }
}) {
  const pct =
    progress && progress.target > 0
      ? Math.min(100, Math.round((progress.current / progress.target) * 100))
      : 0
  return (
    <div className="list-row relative py-2.5 pl-3 pr-3 opacity-60">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg grayscale"
        style={{ background: 'var(--surface-2)' }}
      >
        <Icon art={businessArt(def.id, def.icon)} size={34} alt="" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold" style={{ color: 'var(--text-dim)' }}>
          {def.name}
        </div>
        <div className="truncate text-xs" style={{ color: 'var(--text-faint)' }}>
          🔒 {unlockText(def)}
          {progress ? ` (${progress.current}/${progress.target})` : ''}
        </div>
      </div>
      {progress && progress.target > 0 && (
        <div
          className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden"
          style={{ background: 'var(--surface-2)' }}
          aria-hidden
        >
          <div className="h-full" style={{ background: 'var(--text-faint)', width: `${pct}%` }} />
        </div>
      )}
    </div>
  )
}
