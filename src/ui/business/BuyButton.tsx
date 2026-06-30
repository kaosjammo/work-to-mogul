import type { BusinessView } from '../../store/buildView'
import { money } from '../../engine/num'
import { buyBusiness } from '../../store/actions'

export function BuyButton({ view }: { view: BusinessView }) {
  const disabled = !view.affordable
  const qtyLabel = view.buyQty > 1 ? ` ×${view.buyQty}` : view.buyQty === 0 ? '' : ''
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        buyBusiness(view.id)
      }}
      className="flex flex-col items-center justify-center rounded-xl px-4 font-bold transition-opacity"
      style={{
        minHeight: 'var(--tap-lg)',
        minWidth: '104px',
        background: disabled ? 'var(--surface-3)' : 'var(--accent)',
        color: disabled ? 'var(--text-faint)' : 'var(--accent-ink)',
        opacity: disabled ? 0.7 : 1,
      }}
    >
      <span className="text-sm leading-tight">Buy{qtyLabel}</span>
      <span className="tnum text-xs leading-tight opacity-90">{money(view.buyCost)}</span>
    </button>
  )
}
