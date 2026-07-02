# Event Cards 2.0 — a plan for giving events real meat

*Status: PLAN (user-requested 2026-07-02: "just a decision between two choices seems so
boring"). Phases are independently shippable slices, ordered by payoff-per-risk.*

## What events are today (and why they feel thin)

A card surfaces every ~5 min (deterministic deck rotation, no RNG), shows a prompt +
**two options + Ignore**, applies a bounded effect (±seconds-of-income cash, or a short
all-business profit/speed multiplier), and **closes instantly** — no acknowledgement, no
consequence text, no memory, no connection to anything else in the game. Every card is a
one-shot coin-flip between two blurbs.

The three structural gaps:
1. **No aftermath** — you never *see* what your choice did (the modal just vanishes).
2. **No connection to your empire** — the same two options whether you employ nobody or a
   full roster of specialists; effects are always all-business, never targeted.
3. **No memory** — cards never reference each other; choices have no echoes.

## Phase 1 — Aftermath + your empire matters (small, big payoff)

**1a. Consequence beat.** Every option gains a `result` line (the Mogul-Stories pattern):
after choosing, the modal shows the outcome copy + the concrete effect ("You hoarded the
surplus. +60% profit is running — 58s left…") with a Continue button. One component change,
copy for the existing deck. *The single cheapest fix for "boring".*

**1b. Staff-gated third options.** `EventCardDef` gains an optional `c: CardOption & {
requiresRole: RoleId }` — a third, usually-better option that only renders when the player
EMPLOYS that role (e.g. Supply Glut gains *"Have your Buyer negotiate warehousing — keep the
surplus AND skip the cash cost"*). The roster the player built starts paying off in the
decision layer, exactly like Mogul-Story `roleBoost`s. Harness-inert (bot never resolves).

**1c. Targeted effects.** New `CardEffect` kinds using seams that already exist:
- `{ kind: 'industryProfit', industryId, mult, durationMs }` — the boost machinery exists.
- `{ kind: 'morale', delta }` — bump/hit all businesses' morale (bounded ±15).
- `{ kind: 'riskVent' }` / `{ kind: 'riskSpike' }` — clear or raise Finance risk meters.
- `{ kind: 'goldenNow' }` — force-spawn a Golden Deal (a "luck" reward that isn't cash).
Cards stop feeling samey because effects touch different subsystems.

## Phase 2 — Chains: choices that call back

`EventCardsState` gains a small deterministic queue: `pending: { cardId: string;
inSpawns: number }[]`. A `CardOption` may declare `followUp: { cardId, afterSpawns: 1|2|3 }`.
Choosing it schedules the follow-up card to REPLACE the normal deck pick N spawns later.

Example arc — *Supply Glut* → choose Stockpile → 2 spawns later **"Warehouse Trouble"**
arrives ("Your hoarded surplus attracted rats — pay for exterminators, or sell fast at a
discount?"), whose options only make sense because of what you chose. 6–8 follow-up cards
covering the most-picked options of the existing deck turns one-shot coin-flips into little
stories with consequences. Deterministic (spawn-count based, no wall clock, no RNG), fully
persisted, bot-inert (the queue only fills when a player resolves a card).

## Phase 3 — Storm events + gamble memory

**3a. Storms (multi-step crises).** Every ~8th spawn is a 2–3 step **Storm**: one modal
session where your first pick changes the second dilemma (a micro Mogul-Story using the
same option rows; `EventCardDef.next?: Record<'a'|'b'|'c', string>` pointing at step cards).
Bigger stakes, bigger payoffs, capped bounds (net swing ≤ ±4 min of income).

**3b. Gamble pity + odds honesty.** Gambles show rough odds ("60/40-ish") and track a
deterministic pity counter: two losses in a row upgrade the next gamble's outcome one band.
`EventCardsState.gambleStreak: number`. Losing streaks stop feeling like the game cheating.

**3c. Choice memory.** Track per-card counts (`choicesMade: Record<cardId, 'a'|'b'|'c'>` of
the LAST pick); the prompt gains a one-line echo ("Last time you sold the surplus…"). Pure
flavour, big "the game remembers" feel.

## Invariants (all phases)

- Deterministic — deck rotation, spawn-count chains, pity counters: **no RNG in the engine**.
- Bounded + transient — nothing touches the base curve; `balance.test` monotonicity holds.
- Player-resolved only → **harness byte-inert** (the bot ignores every card).
- All new state additive + tolerantly restored + declared in the persistence-policy test.
- 44px tap areas; the third option must fit 375px (three stacked option rows already do).

## Suggested build order

| Slice | Size | Ships alone? |
|---|---|---|
| 1a consequence beat | S | ✅ biggest feel-win per line of code |
| 1b staff-gated options (+5 cards' `c` options) | M | ✅ |
| 1c targeted effects (+6 new cards using them) | M | ✅ |
| 2 chains (+6 follow-up cards) | M/L | ✅ |
| 3a storms (2 storm arcs) | L | ✅ |
| 3b+3c pity + memory | S | ✅ |
