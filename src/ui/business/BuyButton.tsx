import type { BusinessView } from '../../store/buildView'
import { money } from '../../engine/num'
import { buyBusiness } from '../../store/actions'

/** Content-hugging Buy chip — gold when affordable, neutral-dim when not. One line. */
export function BuyButton({ view }: { view: BusinessView }) {
  const disabled = !view.affordable
  const qtyLabel = view.buyQty > 1 ? ` ×${view.buyQty}` : ''
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        buyBusiness(view.id)
      }}
      className={`btn btn-md shrink-0 ${disabled ? 'btn-secondary' : 'btn-primary'}`}
    >
      <span>Buy{qtyLabel}</span>
      <span className="tnum" style={{ fontWeight: 400, opacity: 0.7 }}>
        {money(view.buyCost)}
      </span>
    </button>
  )
}
