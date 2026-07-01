// ============================================================
//  Business event cards — the active-decision layer. Periodically a card surfaces
//  with a genuine 2-option trade-off (opportunity / crisis / gamble). Pure DATA;
//  engine/eventCards.ts drives the deterministic cadence + applies the effects.
//
//  Design rules (see roadmap Task 5):
//   • No dominant option — each is *situationally* better (cash-now vs buff-over-time,
//     or the lesser of two evils for a crisis).
//   • Effects are BOUNDED + TRANSIENT — a one-off cash swing (priced in seconds of idle
//     income) or a short timed profit/speed multiplier. Nothing touches the base curve.
// ============================================================

export type CardEffect =
  | { kind: 'cash'; incomeSeconds: number } // ± this many seconds of idle income, one-off
  | { kind: 'profit'; mult: number; durationMs: number } // timed all-business profit ×mult
  | { kind: 'speed'; mult: number; durationMs: number } // timed all-business speed ×mult

export interface CardOption {
  label: string
  blurb: string // plain-language outcome for the button
  effects: CardEffect[]
}

export interface EventCardDef {
  id: string
  icon: string
  title: string
  prompt: string
  kind: 'opportunity' | 'crisis' | 'gamble'
  a: CardOption
  b: CardOption
}

const SEC = 1000

// 4 cards prove the loop: two opportunities, one crisis, one gamble. Rotated by a
// deterministic index (no RNG), so the harness/balance sims stay reproducible.
export const EVENT_CARDS: EventCardDef[] = [
  {
    id: 'supply_glut',
    icon: '📦',
    title: 'Supply Glut',
    prompt: 'A surplus floods the market. Hoard it for a profit run, or dump it for fast cash?',
    kind: 'opportunity',
    a: {
      label: 'Stockpile',
      blurb: 'Pay 30s of income now → +60% profit for 60s',
      effects: [
        { kind: 'cash', incomeSeconds: -30 },
        { kind: 'profit', mult: 1.6, durationMs: 60 * SEC },
      ],
    },
    b: {
      label: 'Sell the surplus',
      blurb: '+40s of income now → −30% speed for 60s',
      effects: [
        { kind: 'cash', incomeSeconds: 40 },
        { kind: 'speed', mult: 0.7, durationMs: 60 * SEC },
      ],
    },
  },
  {
    id: 'investor_offer',
    icon: '🤝',
    title: 'Investor Offer',
    prompt: 'An investor wants a piece of the empire. Take the lump sum, or bet on yourself?',
    kind: 'opportunity',
    a: {
      label: 'Take the buyout',
      blurb: '+120s of income, right now',
      effects: [{ kind: 'cash', incomeSeconds: 120 }],
    },
    b: {
      label: 'Stay independent',
      blurb: '+35% profit for 90s',
      effects: [{ kind: 'profit', mult: 1.35, durationMs: 90 * SEC }],
    },
  },
  {
    id: 'surprise_audit',
    icon: '🕵️',
    title: 'Surprise Audit',
    prompt: 'Inspectors are at the door. Settle quietly, or fight it out?',
    kind: 'crisis',
    a: {
      label: 'Pay the fine',
      blurb: '−45s of income now, then done',
      effects: [{ kind: 'cash', incomeSeconds: -45 }],
    },
    b: {
      label: 'Contest it',
      blurb: 'No cash — but −40% profit for 45s',
      effects: [{ kind: 'profit', mult: 0.6, durationMs: 45 * SEC }],
    },
  },
  {
    id: 'viral_moment',
    icon: '📣',
    title: 'Viral Moment',
    prompt: 'The empire is trending. Ride the hype hard, or build the brand slow?',
    kind: 'gamble',
    a: {
      label: 'Ride the hype',
      blurb: '+80% speed for 30s (fast burst)',
      effects: [{ kind: 'speed', mult: 1.8, durationMs: 30 * SEC }],
    },
    b: {
      label: 'Steady the brand',
      blurb: '+30% profit for 90s (slow lift)',
      effects: [{ kind: 'profit', mult: 1.3, durationMs: 90 * SEC }],
    },
  },
]

export const EVENT_CARD_BY_ID: Record<string, EventCardDef> = Object.fromEntries(
  EVENT_CARDS.map((c) => [c.id, c]),
)
