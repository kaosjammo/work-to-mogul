import { useEffect } from 'react'
import { useEventCard } from '../../store/gameStore'
import { resolveCard, dismissCard } from '../../store/actions'
import { haptic } from '../../lib/haptics'

const KIND_ACCENT: Record<string, string> = {
  opportunity: '#46d369',
  crisis: '#f43f5e',
  gamble: '#f5c518',
}

/**
 * The active-decision layer: a periodic event card with a genuine 2-option trade-off.
 * A dismissible modal overlay — the idle loop keeps running behind it (the game isn't
 * paused). Mobile: two full-width tap targets with plain-language effect text.
 */
export function EventCardModal() {
  const card = useEventCard()
  const cardId = card?.id
  // Buzz when a card appears so the waiting decision isn't missed.
  useEffect(() => {
    if (cardId) haptic(20)
  }, [cardId])

  if (!card) return null
  const accent = KIND_ACCENT[card.kind] ?? 'var(--accent)'

  const Option = ({ choice, opt }: { choice: 'a' | 'b'; opt: { label: string; blurb: string } }) => (
    <button
      type="button"
      onClick={() => resolveCard(choice)}
      className="flex w-full flex-col items-start gap-0.5 rounded-2xl p-3 text-left transition active:scale-[0.99]"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', minHeight: 'var(--tap-lg)' }}
    >
      <span className="font-bold">{opt.label}</span>
      <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{opt.blurb}</span>
    </button>
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={dismissCard}
    >
      <div
        className="m-3 flex w-full max-w-sm flex-col gap-3 rounded-2xl p-5"
        style={{ background: 'var(--surface)', border: `1px solid ${accent}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">{card.icon}</span>
          <div className="min-w-0 flex-1">
            <div className="font-bold">{card.title}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: accent }}>
              {card.kind} · {card.secondsLeft}s
            </div>
          </div>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>{card.prompt}</p>
        <Option choice="a" opt={card.a} />
        <Option choice="b" opt={card.b} />
        <button
          type="button"
          onClick={dismissCard}
          className="mt-0.5 rounded-xl py-2 text-xs font-semibold"
          style={{ color: 'var(--text-faint)' }}
        >
          Ignore
        </button>
      </div>
    </div>
  )
}
