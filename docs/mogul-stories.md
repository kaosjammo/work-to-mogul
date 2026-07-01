# Mogul Stories

*A light, reusable framework for the hidden narrative opportunities in Tycoon Empire.*

## What a Mogul Story is

A **Mogul Story** is a rare, optional, industry-specific mini **visual novel** hidden in the
game. It appears as a floating "offer" the player can accept or ignore; accepting opens a
short, choice-driven scene (a negotiation, a rivalry, a discovery) with **hidden scoring**
and a payoff that depends on how the player played it.

Mogul Stories are a *reward layer*, never a gate. Ignoring every one of them costs the
player nothing structural — the greedy sim bot never touches them, so they're
harness/balance-inert by construction (see "Save/load & harness safety").

The reference story is **Angel Investment** (`angel_fridgemind`) — a Finance-industry
negotiation with the fictional startup *FridgeMind* and its founder *Dex Callahan*. A
`great` outcome founds the **Startup Combinator**, a standalone business with periodic
"exit" jackpots.

## Naming

The vocabulary lives in [`src/content/mogulStories/types.ts`](../src/content/mogulStories/types.ts):

| Type | Role |
|---|---|
| `MogulStory` | one whole story: id, industry, title/hook, stages, outcome copy |
| `MogulStoryStage` | one scene: title, speaker, narrative text, 2–4 choices |
| `MogulStoryChoice` | one option: label, optional consequence line, score effects, `next` |
| `MogulStoryScores` | the story's hidden variables (`Record<string, number>`) |
| `MogulStoryOutcomeBand` | `'great' | 'good' | 'neutral' | 'bad'` |
| `MogulStoryOutcomeCopy` | per-band result screen copy (`title` + `line`) |
| `MogulStoryRoleBoost` | employee role that amplifies a matching choice |
| `MogulStoryLength` | `'short' | 'standard' | 'major'` (authoring hint only) |

Story **content** lives under [`src/content/mogulStories/`](../src/content/mogulStories/);
register each story in [`index.ts`](../src/content/mogulStories/index.ts). The reusable
**UI** is [`src/ui/mogulStories/MogulStoryModal.tsx`](../src/ui/mogulStories/MogulStoryModal.tsx).

## Architecture: content is data, logic is the story's own

The framework separates three concerns so stories keep **full creative freedom**:

1. **Content** (`MogulStory` data) — stages, choices, speaker, narrative, outcome copy.
   Pure data, no engine code. This is all `types.ts` constrains.
2. **Runtime** (offer → cooldown → stage navigation → score accumulation) — shared plumbing.
   For Angel it lives in [`src/engine/angelDeal.ts`](../src/engine/angelDeal.ts), operating
   on `AngelDealState` in `GameState`.
3. **Outcome logic + rewards** — **each story's own.** How hidden scores map to a band
   (`investedBand`), what "walking away disciplined" means (`avoidedBadDeal`), and what a
   band *does* (cash delta, unlocks, timed buffs) are story-specific and deliberately
   **not** in the shared types. A new story writes its own.

This is why the modal is generic: it renders any `MogulStory` def (stages, speaker →
`protagonist` name, per-band outcome copy) from the session view, with **no** story-specific
branches. The Combinator reveal, for instance, is just the Angel story's `outcome.great.line`
text — not a special case in the UI.

### The active-story id (shared session seam)

The session state carries a **`storyId`** (`AngelDealState.storyId`, default `ANGEL_DEAL.id`).
The engine's stage navigation, the built view (`AngelDealView.storyId` + the "Stage N of M"
counts), and the modal all resolve the running story through `getMogulStory(storyId)` (see
`activeStory()` in [`engine/angelDeal.ts`](../src/engine/angelDeal.ts)) rather than a
hardcoded constant — so the **shared runtime drives whichever story the session references**,
falling back to Angel if the id is ever unknown (old/corrupt save). `storyId` round-trips
through save and an unregistered id is dropped back to the default on load.

What remains story-specific (by design) is the **resolution** — the score→band mapping and
the reward side-effects (Angel's `investedBand` / `applyOutcome`, the Combinator, the timed
Finance buff). A second live story adds its own resolution (and, if it needs bespoke reward
state, its own state fields); the offer/stage-nav/render plumbing above is already shared.

### The re-export shim

`src/content/angelDeal.ts` is now a one-line shim:
`export * from './mogulStories/angelInvestment'`. Angel's content moved into the framework
folder while every existing importer (`engine/angelDeal`, `save/serialize`, `store/buildView`,
the modal) keeps working unchanged — a low-risk migration.

## Variable length

Stories are **not** forced to a fixed stage count. `MogulStoryLength` is a documentation hint:

- **short** — 5–7 stages (a quick beat: a supplier ultimatum, a viral moment)
- **standard** — ~10 stages (Angel Investment is 10)
- **major** — 15–20+ stages (a multi-act saga)

Length drives no logic. The progress chip reads `stage.title · N/M` where `M = order.length`,
so any count renders correctly. `firstStage` + `order` + `stages` are validated to agree
(see the framework test).

## Hidden scoring

Each story names its own hidden variables (Angel uses `confidence`, `leverage`,
`dueDiligence`, `founderTrust`, `risk`, `valuationDiscipline`). They are **never shown as raw
numbers** — the UI surfaces optional flavour *hints* instead. Each `MogulStoryChoice` carries
`effects` (partial deltas) that accumulate as the player moves through stages. A choice may
declare a `roleBoost`; if the player has ≥1 employee of that role, the effect is lightly
amplified (~50%) — a nudge that rewards a built-out roster without ever being required.

At a terminal choice the accumulated scores map to a band via the story's own logic.

## Walk Away

Every story must be **walkable**: at least one choice is marked `walkAway: true`. Walking
away is always available and always safe (it resolves to `neutral`). A story may grant a
small **discipline bonus** when walking away actually dodged a bad deal (Angel: negative
deal quality or high risk) — so bailing on a rotten deal feels smart, but bailing early on a
fine one is just neutral. The framework test asserts every registered story has a walk-away.

## Outcome bands

Four standard bands, each with authored `title` + `line` copy in `story.outcome`:

| Band | Meaning (Angel reference) | Reward shape |
|---|---|---|
| `great` | played it expertly, invested | big cash + a permanent unlock (Combinator) |
| `good` | solid deal, invested | modest cash gain + a short timed Finance boost |
| `neutral` | walked away | nothing, or a small discipline bonus |
| `bad` | invested into a rotten deal | cash loss + a short timed Finance debuff |

A story may use only a subset conceptually, but must supply copy for all four (the test
enforces this; unused bands can share tone).

## Triggers & cooldowns

A story is **offered** when its trigger conditions hold and its cooldown has elapsed. Angel's
runtime (`tickAngelDeal`) offers a pitch when the player **owns a Finance business** and has
**≥ $1M cash**, after a ~4-min first-offer delay, then re-offers on a long ~30-min cooldown
(rare by design). Triggers are **deterministic** (no RNG) so the sim harness stays
reproducible and the feature stays bot-inert. Declining resets to the cooldown; the offer is
never nagging.

## Save / load & harness safety

- **Session state persists.** Angel's `AngelDealState` (unlock flags, cooldowns, an
  in-progress stage, accumulated scores, timed-boost timers, exit-jackpot timers) is
  serialized and restored by [`save/serialize.ts`](../src/save/serialize.ts). Load is
  **tolerant**: an in-progress session referencing an unknown stage is safely cancelled back
  to the offer/cooldown state rather than crashing.
- **Cloud-safe.** No secrets, no service keys, no server logic — it's ordinary game state in
  the same versioned save envelope, so cloud save/restore treats it like everything else.
- **Harness-inert.** The whole system is *player-triggered*. The greedy sim bot never accepts
  an offer, never resolves a story, and never owns the Combinator, so every unlock flag stays
  false and every timed multiplier stays ×1 → business income is byte-identical in
  `harness.test` / `balance.test` / `progressionLoop.test`. **Verify this invariant after any
  change** to a story's rewards or economy folds.
- **Offline caveat.** Offline catch-up is closed-form (`automatedIncomePerSec × seconds`), not
  a real tick, so periodic story mechanics (e.g. Combinator exits) correctly do **not** fire
  while away — no offline exploit.

## How to add a new story

1. **Author the content** — create `src/content/mogulStories/<yourStory>.ts` exporting a
   `MogulStory` (see `angelInvestment.ts` as the template). Pick an `industryId`, a `hook`,
   a `subject`/`protagonist`, your stages (each with 2–4 choices, one `walkAway`), and the
   four `outcome` copy blocks. Choose your own hidden score names.
2. **Register it** — add it to `MOGUL_STORIES` in
   [`index.ts`](../src/content/mogulStories/index.ts).
3. **Write its logic** — decide the trigger/cooldown, the score→band mapping, and what each
   band rewards. Follow the Angel engine pattern (a pure module over `GameState`). Keep it
   **deterministic** and **player-triggered** so it stays harness-safe.
4. **Wire state + save** — if the story needs its own session state, add a typed slice to
   `GameState`, initialise it, and restore it tolerantly in `serialize.ts`.
5. **Reuse the UI** — the generic `MogulStoryModal` renders any registered story, resolved
   from the session's `storyId` (the offer/stage-nav/render plumbing is shared; see "The
   active-story id" above). Set `storyId` when your story is offered so the modal renders it.
6. **Test** — the framework test (`mogulStories.test.ts`) validates every registered story's
   shape automatically. Add story-specific tests for its scoring→band + reward logic.
7. **Guard the invariant** — run the harness/balance tests and confirm income is unchanged.

## Future story ideas

- ✅ **Retail** — a landlord lease showdown at a flagship store. *(Shipped: "The Lease",
  `lease_thorne_plaza`, a 7-stage `short` story — `content/mogulStories/leaseShowdown.ts`.)*
- ✅ **Tech** — a rival poaching your star engineer (retention negotiation). *(Shipped: "The
  Poach", `poach_nakamura`, an 8-stage `standard` story — `content/mogulStories/enginePoach.ts`.)*
- ✅ **Logistics** — a dockworkers' dispute during peak season. *(Shipped: "The Walkout",
  `walkout_pier_nine`, an 8-stage `standard` labour negotiation —
  `content/mogulStories/dockDispute.ts`.)*
- ✅ **Energy** — a regulator's inspection with a buried compliance flaw. *(Shipped: "The
  Inspection", `inspection_voss`, an 8-stage `standard` compliance drama —
  `content/mogulStories/inspection.ts`.)*
- ✅ **Space** — a launch-window gamble with a flaky supplier ("scrub or fly"). *(Shipped:
  "Scrub or Fly", `launch_meridian`, a 9-stage `standard` launch drama with a **bespoke
  cross-industry reward** — `content/mogulStories/launchGamble.ts`.)*
- ✅ **Food** — a viral-review moment that can make or sink a location. *(Shipped: "Gone
  Viral", `viral_copper_spoon`, a 5-stage `short` crisis-opportunity —
  `content/mogulStories/viralMoment.ts`.)*

**🏁 All 7 industries covered** (Finance / Retail / Tech / Food / Logistics / Energy / Space).

Each can pick its own length, score variables, tone, outcome logic, and reward — the
framework only asks that they conform to the `MogulStory` shape and stay bot-inert.

### The empire-wide reward (bespoke resolver example)

The Space finale is the reference for a **bespoke** reward. A `great` "fly" doesn't just boost
Space — it applies a bigger, longer profit halo to **every** industry, via an `EMPIRE_WIDE`
(`'*'`) sentinel on `AngelDealState.boostIndustryId` that `mogulStoryBoostMult` treats as
matching all industries (`engine/angelDeal.ts`). It's gated on `storyId === LAUNCH.id` in
`applyOutcome`, exactly like Angel's `great` founds the Combinator — the two examples of a
per-story reward that departs from the generic single-industry boost. Still deterministic,
player-triggered, and bot-inert (income byte-identical in the harness; the boost is off the
base curve so `balance.test` monotonicity holds).

### Shared "negotiation" resolution (what "The Lease" reuses)

Business-deal stories don't need a bespoke resolver. The Angel runtime's resolution
generalises: **eligibility** is "owns the story's `industryId` + a modest cash floor"
(`storyEligible`), the **trigger** rotates deterministically across whatever's eligible
(`eligibleStories` + `completedCount % n` in `tickAngelDeal`), and the **reward** is a
bounded cash swing (`payoutFor`) plus a timed profit boost/debuff on the story's own
industry (`AngelDealState.boostIndustryId` → `mogulStoryBoostMult`). A great non-Angel
finish gives the strong cash + boost; only the **Angel** story's `great` additionally founds
the Combinator. So a new negotiation story is often just **content + registration** — reach
for a bespoke resolver only when the reward genuinely differs (a unique unlock, a
non-industry effect).
