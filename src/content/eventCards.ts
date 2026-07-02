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

// The deck rotates by a deterministic index (no RNG), so the harness/balance sims
// stay reproducible. Every card obeys the bounds above: cash swings within roughly
// ±2 minutes of idle income, buffs/debuffs ×0.6–×1.8 for 30–90s. Kinds are
// interleaved so consecutive cards feel different.
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
  {
    id: 'union_talks',
    icon: '🪧',
    title: 'Union Talks',
    prompt: 'The workforce wants a better deal. Sign quickly, or let the talks drag?',
    kind: 'crisis',
    a: {
      label: 'Sign the deal',
      blurb: '−60s of income now → +25% speed for 60s (morale surge)',
      effects: [
        { kind: 'cash', incomeSeconds: -60 },
        { kind: 'speed', mult: 1.25, durationMs: 60 * SEC },
      ],
    },
    b: {
      label: 'Stall the talks',
      blurb: 'No cash — but −25% speed for 60s (slowdown)',
      effects: [{ kind: 'speed', mult: 0.75, durationMs: 60 * SEC }],
    },
  },
  {
    id: 'flash_sale',
    icon: '🏷️',
    title: 'Flash Sale',
    prompt: 'A rival dumps inventory. Undercut them for volume, or hold your price?',
    kind: 'opportunity',
    a: {
      label: 'Undercut them',
      blurb: '+70% speed for 45s, −20% profit for 45s',
      effects: [
        { kind: 'speed', mult: 1.7, durationMs: 45 * SEC },
        { kind: 'profit', mult: 0.8, durationMs: 45 * SEC },
      ],
    },
    b: {
      label: 'Hold your price',
      blurb: '+45s of income as loyal customers pay up',
      effects: [{ kind: 'cash', incomeSeconds: 45 }],
    },
  },
  {
    id: 'moonshot_pitch',
    icon: '🧪',
    title: 'Moonshot Pitch',
    prompt: 'R&D wants funding for a wild prototype. Bankroll it, or bank the budget?',
    kind: 'gamble',
    a: {
      label: 'Fund the lab',
      blurb: 'Pay 50s of income → +55% profit for 75s',
      effects: [
        { kind: 'cash', incomeSeconds: -50 },
        { kind: 'profit', mult: 1.55, durationMs: 75 * SEC },
      ],
    },
    b: {
      label: 'Bank the budget',
      blurb: '+30s of income, no strings',
      effects: [{ kind: 'cash', incomeSeconds: 30 }],
    },
  },
  {
    id: 'power_outage',
    icon: '🔌',
    title: 'Grid Brownout',
    prompt: 'The grid is flickering. Rent generators, or ride out the brownout?',
    kind: 'crisis',
    a: {
      label: 'Rent generators',
      blurb: '−40s of income now, business as usual',
      effects: [{ kind: 'cash', incomeSeconds: -40 }],
    },
    b: {
      label: 'Ride it out',
      blurb: 'No cash — but −35% speed for 50s',
      effects: [{ kind: 'speed', mult: 0.65, durationMs: 50 * SEC }],
    },
  },
  {
    id: 'celebrity_visit',
    icon: '🌟',
    title: 'Celebrity Drop-In',
    prompt: 'A megastar was spotted at one of your venues. Lean into it, or play it cool?',
    kind: 'opportunity',
    a: {
      label: 'Lean into it',
      blurb: '+50% profit for 60s while the buzz lasts',
      effects: [{ kind: 'profit', mult: 1.5, durationMs: 60 * SEC }],
    },
    b: {
      label: 'Sell the story',
      blurb: '+75s of income from the tabloids, −15% profit for 45s (fans grumble)',
      effects: [
        { kind: 'cash', incomeSeconds: 75 },
        { kind: 'profit', mult: 0.85, durationMs: 45 * SEC },
      ],
    },
  },
  {
    id: 'logistics_snarl',
    icon: '🚧',
    title: 'Port Congestion',
    prompt: 'Shipments are stuck offshore. Pay for air freight, or wait out the queue?',
    kind: 'crisis',
    a: {
      label: 'Air-freight it',
      blurb: '−55s of income → +30% speed for 45s once it lands',
      effects: [
        { kind: 'cash', incomeSeconds: -55 },
        { kind: 'speed', mult: 1.3, durationMs: 45 * SEC },
      ],
    },
    b: {
      label: 'Wait it out',
      blurb: 'No cash — but −30% profit for 60s',
      effects: [{ kind: 'profit', mult: 0.7, durationMs: 60 * SEC }],
    },
  },
  {
    id: 'conference_keynote',
    icon: '🎤',
    title: 'Keynote Invite',
    prompt: 'A huge industry summit wants you on stage. Take the spotlight, or send a deputy?',
    kind: 'gamble',
    a: {
      label: 'Take the stage',
      blurb: '+40% profit for 90s (the long tail of buzz)',
      effects: [{ kind: 'profit', mult: 1.4, durationMs: 90 * SEC }],
    },
    b: {
      label: 'Send a deputy',
      blurb: '+60s of income — you stayed home and closed deals',
      effects: [{ kind: 'cash', incomeSeconds: 60 }],
    },
  },
  {
    id: 'data_breach',
    icon: '🔓',
    title: 'Data Leak',
    prompt: 'A vendor leaked customer data. Come clean immediately, or quietly patch it?',
    kind: 'crisis',
    a: {
      label: 'Come clean',
      blurb: '−50s of income (refunds + PR), trust intact',
      effects: [{ kind: 'cash', incomeSeconds: -50 }],
    },
    b: {
      label: 'Quiet patch',
      blurb: 'No cash — but −35% profit for 55s if word spreads (it does)',
      effects: [{ kind: 'profit', mult: 0.65, durationMs: 55 * SEC }],
    },
  },
  {
    id: 'poach_exec',
    icon: '🎯',
    title: 'Poaching Window',
    prompt: "A rival's star operator is unhappy. Make an offer, or tip off the press?",
    kind: 'opportunity',
    a: {
      label: 'Make the offer',
      blurb: 'Pay 65s of income → +45% speed for 70s',
      effects: [
        { kind: 'cash', incomeSeconds: -65 },
        { kind: 'speed', mult: 1.45, durationMs: 70 * SEC },
      ],
    },
    b: {
      label: 'Tip the press',
      blurb: "+35s of income shorting the rival's stock",
      effects: [{ kind: 'cash', incomeSeconds: 35 }],
    },
  },
  {
    id: 'weather_front',
    icon: '⛈️',
    title: 'Storm Front',
    prompt: 'A storm is rolling in. Close early and batten down, or stay open for the rush?',
    kind: 'gamble',
    a: {
      label: 'Batten down',
      blurb: '−20s of income now, then +20% profit for 60s (repairs avoided)',
      effects: [
        { kind: 'cash', incomeSeconds: -20 },
        { kind: 'profit', mult: 1.2, durationMs: 60 * SEC },
      ],
    },
    b: {
      label: 'Stay open',
      blurb: '+55s of income from the pre-storm rush, −25% speed for 45s cleaning up',
      effects: [
        { kind: 'cash', incomeSeconds: 55 },
        { kind: 'speed', mult: 0.75, durationMs: 45 * SEC },
      ],
    },
  },
]

export const EVENT_CARD_BY_ID: Record<string, EventCardDef> = Object.fromEntries(
  EVENT_CARDS.map((c) => [c.id, c]),
)
