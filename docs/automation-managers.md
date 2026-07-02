# Automation Managers — Executive Assistant + Chief of Staff

*User-requested (2026-07-02): "a staff hiring manager … auto hire, level up and optimise
staff" + "an executive assistant … auto reinvest your money … discuss (open a menu) your
investment strategy and set specific parameters."*

Two opt-in managers that play the busywork for you, both configured from a menu on the
**Stats tab → AUTOMATION**. Everything lives in [`engine/automation.ts`](../src/engine/automation.ts)
(pure over `GameState`); the config UI is [`ui/shared/AutomationModal.tsx`](../src/ui/shared/AutomationModal.tsx).

## Executive Assistant 🤖 — auto-reinvest

Periodically pours your **spare cash** into new business units.

- **Reserve** (`reservePct`, 0–90%): a rolling war-chest kept back each cycle so you always
  have cash for manual buys / opportunities. Each cycle spends `cash × (1 − reserve%)`.
- **Strategy**:
  - **Best ROI** (default) — buys whatever adds the most income per dollar (the same greedy
    the "Spend cash" button + the balancing harness use).
  - **Cheapest** — buys the lowest-priced units first (fast unit count + milestone progress).
  - **Focus** — pours everything into one chosen industry.
- **Act every** (`intervalSec`, 3–60s): cadence.
- Shows lifetime cash reinvested + units bought.

## Chief of Staff 👔 — auto hire / level / assign

Builds and optimises your roster within a **budget** (`budgetPct`, 0–90% of cash per cycle).

- **Hire** — fills empty slots on owned businesses, **operators first** (to automate an
  un-automated business — the biggest single win), then the cheapest available staff.
- **Level** — levels the roster **cheapest-first** (most level-ups for the budget).
- **Assign** — runs **Auto-Assign Best** so nobody sits benched.
- Each duty is a toggle; the manager only ever spends within the budget, and hiring stops
  once every slot is filled.

## Design invariants

- **OFF by default.** `initialAutomationState()` sets both `enabled: false`, so the greedy
  sim **harness never triggers them** → idle pacing stays byte-identical in
  `harness`/`balance`/`progressionLoop` (verified by an automation-off applyTick equivalence
  test). Nothing touches the base curve; the managers only make purchases/hires a player
  could make by hand.
- **Bounded + deterministic.** Per-cycle action caps (200 buys / 8 hires / 25 level-ups) and
  the budget ceiling keep a tick cheap and terminating; no RNG.
- **Available once you own a business** (`automationEligible`) — nothing to reinvest in or
  staff before that. Surfaced on the Stats tab only when eligible.
- **Runs in `applyTick`** after income + marriage upkeep (so it spends the tick's earnings)
  and **before `checkUnlocks`** (so auto-bought units flip unlocks the same tick).
- **Online only.** The internal `cooldownMs` fields do **not** advance offline (they aren't
  `*MsLeft`), so automation simply pauses while away and offline income stays closed-form.
- **Meta-progression.** The whole config + lifetime stats **persist through prestige** (a
  set-and-forget convenience; the managers resume in the new empire with a fresh cooldown)
  and round-trip tolerantly through save/cloud (every field clamped; `automation` declared in
  the persistence-policy trip-wire test).

## The stuck-celebration fix (shipped alongside)

A single **Max buy of a high-count business** (e.g. the Startup Combinator at ×410) crosses
*many* milestone thresholds at once. Each queued one toast (~2.5s) → the celebration overlay
looked permanently stuck on "Startup Combinator: ×3 profit!". Two guards:
- **Source** — `milestoneCelebrations()` collapses a multi-threshold burst into a single
  `"<Business>: N milestones!"` summary (per business).
- **Store** — `pushCelebrations` now drops consecutive duplicates and **caps the queue at 5**
  (keeping the currently-showing toast + the most-recent tail), so any flood (buys + exits +
  achievements) clears in seconds, never a minute.
