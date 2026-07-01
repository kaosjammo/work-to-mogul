import { useEffect } from 'react'
import { useEventCard } from '../../store/gameStore'
import { resolveCard, dismissCard } from '../../store/actions'
import { haptic } from '../../lib/haptics'
import { Overlay } from './Overlay'

const KIND_ACCENT: Record<string, string> = {
  opportunity: '#46d369',
  crisis: '#f43f5e',
  gamble: '#f5c518',
}

/**
 * The active-decision layer: a periodic event card with a genuine 2-option trade-off.
 * A dismissible modal overlay — the idle loop keeps running behind it (the game isn't
 * paused). Mobile: two dense option rows (accent LEFT stripe by kind) with plain-language
 * effect text, then a ghost "Ignore".
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
      className="flex w-full flex-col items-start justify-center gap-0.5 rounded-[var(--ctrl-radius)] py-2 pr-3 text-left transition active:scale-[0.99]"
      style={{ minHeight: 'var(--tap)', background: 'var(--surface-2)', borderLeft: `2px solid ${accent}`, paddingLeft: '10px' }}
    >
      <span className="text-sm font-bold">{opt.label}</span>
      <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{opt.blurb}</span>
    </button>
  )

  return (
    <Overlay accent={accent} onBackdropClick={dismissCard}>
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
      <button type="button" onClick={dismissCard} className="btn btn-ghost btn-sm self-center">
        Ignore
      </button>
    </Overlay>
  )
}
