import type { IndustryId } from '../../types/domain'
import { industryBanner } from '../shared/art'

interface Props {
  industryId: IndustryId
  name: string
  totalOwned: number
}

/**
 * Slim industry header that showcases the authored banner art for the active
 * industry, with a dark gradient scrim so the name stays legible. The banner is
 * decorative (aria-hidden background); the name is real text. Renders nothing if
 * the industry has no authored banner (graceful — no layout jump).
 */
export function IndustryBanner({ industryId, name, totalOwned }: Props) {
  const src = industryBanner(industryId)
  if (!src) return null
  return (
    <div
      className="relative mb-3 overflow-hidden rounded-2xl"
      style={{
        height: 64,
        backgroundImage: `url(${src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            'linear-gradient(90deg, rgba(15,17,21,0.92) 0%, rgba(15,17,21,0.4) 65%, rgba(15,17,21,0.05) 100%)',
        }}
      />
      <div className="absolute inset-0 flex items-end justify-between p-3">
        <span className="text-lg font-bold" style={{ color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
          {name}
        </span>
        {totalOwned > 0 && (
          <span className="tnum text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
            {totalOwned} owned
          </span>
        )}
      </div>
    </div>
  )
}
