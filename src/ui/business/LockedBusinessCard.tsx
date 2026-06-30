import type { BusinessDef } from '../../types/domain'
import { BUSINESSES } from '../../content/businesses'
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
      return `Reach $${u.amount}`
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
  return (
    <div
      className="flex items-center gap-3 rounded-2xl p-3 opacity-70"
      style={{ background: 'var(--surface)', border: '1px dashed var(--border)' }}
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl grayscale"
        style={{ background: 'var(--surface-2)' }}
      >
        <Icon art={businessArt(def.id, def.icon)} size={40} alt="" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold" style={{ color: 'var(--text-dim)' }}>
          {def.name}
        </div>
        <div className="text-xs" style={{ color: 'var(--text-faint)' }}>
          Unlock: {unlockText(def)}
          {progress ? ` (${progress.current}/${progress.target})` : ''}
        </div>
        {progress && progress.target > 0 && (
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full" style={{ background: 'var(--surface-3)' }}>
            <div
              className="h-full rounded-full"
              style={{
                background: 'var(--text-dim)',
                width: `${Math.min(100, Math.round((progress.current / progress.target) * 100))}%`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
