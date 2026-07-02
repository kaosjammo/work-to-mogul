import type { IndustryId } from '../../types/domain'
import { Icon } from '../shared/Icon'
import { industryArt } from '../shared/art'

interface Props {
  industryId: IndustryId
  name: string
  theme: string
  totalOwned: number
}

/**
 * Industry header: a theme-tinted gradient with the industry's icon as a large
 * faded watermark — deterministic and always legible, unlike the old cropped
 * banner-art treatment (a 1024×384 abstract SVG squeezed into a 64px strip read
 * as random shapes/blobs at that aspect ratio). Reuses the same icon already
 * proven legible in IndustryTabs, just bigger and faded.
 */
export function IndustryBanner({ industryId, name, theme, totalOwned }: Props) {
  return (
    <div
      className="relative mb-3 flex items-center justify-between overflow-hidden rounded-2xl px-3.5 py-3"
      style={{
        background: `linear-gradient(115deg, color-mix(in srgb, ${theme} 30%, var(--surface-2)) 0%, var(--surface-2) 75%)`,
        boxShadow: 'var(--hairline-top)',
      }}
    >
      <div
        className="pointer-events-none absolute -right-3 -top-3 opacity-[0.16]"
        aria-hidden
        style={{ filter: 'blur(0.5px)' }}
      >
        <Icon art={industryArt(industryId)} size={96} alt="" />
      </div>
      <span className="relative text-lg font-bold" style={{ color: '#fff' }}>
        {name}
      </span>
      {totalOwned > 0 && (
        <span
          className="tnum relative shrink-0 rounded-full px-2 py-0.5 text-xs font-bold"
          style={{ background: 'rgba(0,0,0,0.28)', color: 'rgba(255,255,255,0.92)' }}
        >
          {totalOwned} owned
        </span>
      )}
    </div>
  )
}
