# Dev Progress Log

Append-only log of development loops. Newest at top.

---

## Events: rarer but deeper (frequency rebalance + Momentum combo + meaningful choices)

User feedback: the three tap-to-collect events (Rush Hour, Golden Deal, Event Cards) are
"annoying/boring after a while" — too frequent and too shallow — while the richer beats
(Mogul Stories, Romance episodes) are too rare. Shipping in three slices: **(1)** rebalance
frequency both directions, **(2)** a Momentum "Hot Streak" combo that ties the now-rarer tap
events together, **(3)** meaningful two-option choices on Golden Deal + Rush Hour.

**Slice 1 — frequency rebalance.** Tap events made rarer: Golden Deal `2min → 4min`, Rush
Hour `3min → 6min`, Event Cards `5min → 9min`. Story beats made more frequent: Mogul Story
re-offer `30min → 14min`, first pitch `4min → 3min`, Romance next-date `15min → 8min`. Plus a
save-hardening fix found while verifying: `tolerantLoad` restored `angelDeal.cooldownMs` with
no ceiling, so an inflated/corrupt value (seen live at ~104 days) silently locked all Mogul
Stories — now clamped to ≤ 1h (directly serves "more frequent stories"). 409 tests
(+1 clamp), build + lint clean; new cadences confirmed live via the `window.__game` bridge.

## Automation managers (Executive Assistant + Chief of Staff) + stuck-celebration fix

Three user-directed items.

**A) Bug — the stuck "Startup Combinator: ×3 profit!" celebration.** A single Max buy of a
high-count business (the Combinator at ×410) crosses many milestone thresholds at once, and
`pushCelebrations` had no cap or de-dupe → the ~2.5s toasts piled into a minute-long backlog
that reads as "stuck". Fix: `engine/milestones.ts` `milestoneCelebrations()` collapses a
multi-threshold burst into ONE `"<Business>: N milestones!"` summary per business (used in
`buyBusiness` + `spendCash`); `uiStore.pushCelebrations` drops consecutive duplicates and
caps the queue at 5. Verified: single toasts still drain (8.8s), a 26-message flood collapses
to ≤5.

**B) Executive Assistant 🤖 (auto-reinvest)** and **C) Chief of Staff 👔 (auto hire/level/
assign)** — two opt-in managers configured from a **menu** (Stats tab → AUTOMATION →
Configure), all in `engine/automation.ts` (see [docs/automation-managers.md](docs/automation-managers.md)):
- **EA:** reinvests `cash × (1 − reserve%)` every `intervalSec` via a chosen **strategy**
  (Best ROI / Cheapest / Focus-one-industry). Reserve % is a rolling war-chest; strategy +
  interval + reserve are all set in the modal. Shows lifetime reinvested + units.
- **Chief:** within a `budgetPct`-of-cash budget, runs Auto-Assign-Best, hires to fill empty
  slots (**operators first**, to automate), and levels the roster cheapest-first. Each duty
  (Hire / Level / Assign) is a toggle. Shows lifetime spent + hires.
- **OFF by default → harness byte-inert** (the bot uses `initialGameState` → never triggers
  them; income byte-identical). Bounded (per-cycle caps + budget), deterministic (no RNG),
  online-only (cooldowns don't advance offline), and the config **persists through prestige**
  + save (tolerant, clamped, policy-registered). Runs in `applyTick` after income/upkeep,
  before `checkUnlocks`.

**Validation:** `tsc -b` + build clean, oxlint clean, **408 tests** (+16 automation: eligibility,
reinvest-within-budget for all 3 strategies, operator-first hiring, cheapest-level, cadence,
the disabled-tick byte-identity equivalence, clamps, save + prestige; +5 milestone-collapse).
Browser-verified 375px: the AUTOMATION Stats section, both config modals (strategy menu,
reserve/budget steppers, duty toggles), EA live-reinvested $996M / 57 units over 20s, the
Chief hired 10 + staffed 8 businesses + leveled over 40s; no overflow, no console errors.
Adversarially reviewed via a 4-lens find→verify workflow.

---

## "Lunch Rush" — a Vampire-Survivors mini-game + the Event Cards 2.0 plan

Two user-directed items: a plan for giving event cards "more meat" (they're "just a
decision between two choices"), and a VS-style mini-game ("food truck throwing hotdogs at
rabid fans").

**A) Event Cards 2.0 — PLAN ONLY** ([docs/event-cards-2.0-plan.md](docs/event-cards-2.0-plan.md)):
three shippable phases — (1) consequence beats + staff-gated third options + targeted
effect kinds (industry/morale/risk/golden), (2) deterministic event CHAINS (choices
schedule follow-up cards), (3) multi-step "Storm" crises + gamble pity/memory. All
deterministic, bounded, bot-inert.

**B) Lunch Rush — SHIPPED.** Your food truck goes viral; rabid fans (😋🏃🤩) swarm from
every direction; the tongs auto-throw 🌭 at the nearest hungry mouth; fed fans drop tips;
XP levels you up mid-run with a pick-1-of-3 upgrade overlay (the VS signature: Double Dogs,
Turbo Grill, Extra Mustard splash, Long Toss, Roller Skates, Big Dog pierce, Snack Magnet,
Combo Sauce). Survive to closing time without the mob draining your composure (5 ❤️).
- **3-tier campaign:** Lunch Rush (75s) → Dinner Rush (90s, superfan tanks) → Festival
  Night (105s, stampede rings). Clearing Festival Night = the permanent **🏆 Golden
  Spatula** (+10% Food, folds in `economy.ts` beside the salvage perks). Cleared tiers stay
  replayable for score + the timed Food buff (×1.5–2.0, 60–120s by band).
- **Bounded rewards:** idle-income-seconds × band with a flat floor (the Food Truck unlocks
  minutes into a fresh game — early players get a real prize). Failure never punishes.
- **Opportunity rotation from day one:** priority story > salvage > rush; the rush chip
  shares the salvage chip's screen slot (they can never coexist), has a "Not now" 30-min
  snooze, and buzzes once per distinct signal.
- **Plumbing:** `FoodFrenzyState` (campaign persists through prestige; buff transient +
  expires offline via `expireTransientsOffline`), tolerant restore (Spatula ⇔ campaign
  complete, repaired both directions), persistence-policy registered, emoji sprites (zero
  assets/licences), dev-only `window.__frenzy` bridge.

**Validation:** `tsc -b` + build clean, oxlint clean, **388 tests** (+16 frenzy: gating +
rotation incl. yields-to-salvage, snooze, bands, clear/advance/floor-cash/buff, Spatula
once-only, stale-replay no-op, fold Food-only + steady, buff decay, save round-trip +
corrupt repair, prestige). Browser-verified 375px by pumping the REAL rAF loop with
synthetic frames (rAF is throttled headless): chip + "Not now" → yields to salvage →
briefing (Nacho, CODE MUSTARD) → live swarm (84 fans fed over a full 75s shift) → LEVEL UP
overlay ×3 with working picks → outcome "LEGENDARY SERVICE" → tier cleared, ×1.8/90s Food
buff + cash banked, "Next up: Dinner Rush". The pump also caught a real design bug pre-ship
(XP only flowed from collected tips — a stationary player never leveled; feeding now grants
XP directly).

**Adversarial review (4-lens find→verify, 16 agents) confirmed 5 distinct defects — all
fixed pre-ship:**
1. *Dropped upgrade pick*: two level-ups in one update() pass overwrote the pending chooser
   → thresholds now process ONCE per frame at the top of update() (banked XP levels up
   frame-by-frame after each pick).
2. *Outcome-✕ stomped the resolution cooldown* (fail 4 min → 10 min = punished; clear 15 →
   10 = farmable) → the ✕ plain-closes on the outcome phase. **Mirror-fixed the identical
   latent bug in SpaceSalvageShooter** (the inherited pattern).
3. *Sub-44px header/briefing buttons* (misses fell through and yanked the truck) → explicit
   44px minimums on Close up / ✕ / Walk away.
4. *Chip band collision* (HIGH): the +78px slot overlapped the Food-gated Rush Hour pill at
   +70px (which routinely coexists) → BOTH mini-game chips moved to a clean **+132px band**.
5. *Phantom buzz behind z-[60] modals* (also consumed the once-per-signal latch) → both
   chips hide + skip the buzz while either mini-game is open.
Post-fix re-verified via the frame pump (level-up → pause → overlay → pick → resume) and
the full suite re-run green.

---

## Salvage Signal anti-nag + the Romance Arc (4 episodes) + marriage money-sink

Two user-directed features. (Note: the long-standing "no dating/life-sim" constraint was
explicitly lifted by the user for this feature on 2026-07-02.)

**A) Salvage Signal cadence (the "it keeps popping up" fix):**
- The chip had NO dismiss and walking out of a launch re-armed it in **60s** — a nag by
  construction. Now: a **"Not now"** button on the chip snoozes it **30 min**
  (`SHOOTER_SNOOZE_MS`, matching the story cadence; never shortens an existing cooldown),
  and aborting a launch re-arms after **10 min** (was 1).
- **Opportunity rotation:** a pending/active Mogul Story gets right-of-way —
  `spaceShooterOfferAvailable` yields while `angelDeal.offered || active`, so the rarer
  story beats stop being drowned out. (UI-only gate; the harness never reads it.)

**B) The Romance Arc — a lengthy love Mogul Story (4 episodes, 34 stages) + marriage sink:**
- **Quinn Harlow**, fictional rival mogul; enemies-to-lovers: **The Spark** (💘 auction
  meet-cute, 9), **The First Date** (🌹 diner test, 8), **The Getaway** (🏝️ storm weekend,
  8), **The Question** (💍 proposal, 9). Authored via a 4-agent parallel workflow from a
  shared story bible (continuity: the neon EAT sign, the ancient espresso machine, Priya).
- **Episodic eligibility** (`engine/romance.ts`): only the CURRENT episode offers
  (`romance.stage`), industry-free, cash floor $1M, never after marriage. great OR good
  advances; bad = recoverable setback; walking away = clean neutral (no discipline cash).
  A successful date shortens the next offer to 15 min (courtship momentum).
- **Marriage money-sink:** the proposal landing = married → a 💍 panel on the Stats tab.
  Each of 20 levels ("The Honeymoon" → "The Dynasty") costs ~10 min of income × level and
  adds **+1%/level of business income per second** in permanent upkeep — applied to each
  tick's business payout (proportional → never bankrupts; no offline drain; opt-in per
  level; `totalSpent` tracked as "Lavished so far").
- **Meta-progression:** `RomanceState` persists through prestige ("an ascension is not a
  divorce") and save/cloud round-trips with consistency guards.
- **Framework addition:** `MogulStory.hintCopy` — per-story hint flavour ("There's real
  chemistry here" instead of "The numbers hold up so far").
- **Fixed in passing:** `closeAngelOutcome` used to fire the "Startup Combinator founded"
  toast on ANY great outcome (latent since story #2) — now gated to the Angel story.
- **Harness-inert:** all player-triggered; the bot never dates → `married` false → the
  upkeep branch never runs → income byte-identical (harness/balance/progression unchanged).

**Adversarial review (4-lens find→verify workflow, 13 agents) confirmed 7 findings — all
fixed in the same change:**
1. *Post-prestige sink exploit*: marriage levels collapsed to the $25k floor after an
   ascension (income 0, marriage preserved) → cost is now also floored at **10% of current
   cash** (`MARRIAGE_COST_CASH_FRACTION`) — the lifestyle scales with the visible fortune.
2. *Momentum mis-slot*: the shortened 15-min "next date" cooldown often rotated to a
   NON-romance pitch → new `AngelDealState.nextIsDate` reserves the slot for the next
   episode (and never fires after the proposal — no next date once married).
3. *Save dead-end*: corrupt `{stage: 4, married: false}` bricked the arc forever → unmarried
   now clamps to "ready for the proposal" on load.
4. *Hit-area overlap* (empirically measured): "Not now"'s 44px `::before` overhung ~6px onto
   the Golden Deal chip's top → salvage stack raised to +78px with gap-2 (≥8px clearance).
5. *Haptic re-buzz*: story-yield visibility flips re-buzzed for an already-seen signal → buzz
   is now keyed per distinct signal (`SpaceShooterView.signalKey`).
6. *ETA dishonesty*: afford/entry ETAs + the Stats "Idle income" row ignored the drain (up to
   25% understatement at L20) → both now use income NET of marriage upkeep.
7. *Ep4 continuity inversion*: the proposal claimed QUINN won the EAT sign (eps 1–3: YOU won
   it; it hangs in Quinn's hallway) → rewritten as a Priya-assisted overnight heist of the
   sign from Quinn's hallway; "snowed in" → the rainstorm the getaway actually staged.
(One finding rejected on verification: lowercase "jumbotron" is a genericized dictionary word.)

**Validation:** `tsc -b` + build clean, oxlint clean, **345 tests** (+21: 3 salvage cadence,
18 romance engine/save/prestige/drain — incl. a live applyTick 10%-drain equivalence test,
the post-prestige pricing regression, the reserved-slot rotation test, and the dead-end
clamp; framework auto-covers the 4 new stories). Browser-verified 375px: the exact "Stage 2"
chip from the user's report now snoozes 30 min on "Not now"; salvage yields to a pending
story chip; The Spark plays (💘 · "Lot Seven · 1/9") with romance hints and zero deal-copy
leakage; proposal → "Yes. Obviously Yes." → married; Stats panel → Renew Vows Lv1 ("The
Honeymoon", $1.2T) → live drain measured at exactly 1% of business income; the hit-area
clearance re-measured ≥8px; no overflow, no console errors.

---

## Mogul Stories — distinct per-story icons (finishing polish)

A small presentational finish now that the 7-story set is complete: each story had been
sharing one generic 💼 in the floating offer + modal header. Gave each its own emoji.

- **Optional `icon?: string`** on the `MogulStory` type (defaults to 💼). Set per story:
  💼 Angel · 🏢 Lease · 👔 Poach · 📱 Gone Viral · 🏗️ Walkout · ⚛️ Inspection · 🚀 Scrub or Fly.
- **Rendered** in both the floating-offer button and the modal header
  (`ui/mogulStories/MogulStoryModal.tsx`) as `STORY.icon ?? '💼'` — no story-specific code,
  layout unchanged, 44px tap area preserved.
- **Test:** `mogulStories.test.ts` now asserts every registered story ships its own icon and
  that no two stories share one (guards against a future story forgetting one / colliding).

**Validation:** `tsc -b` + build clean, oxlint clean, **324 tests** (+1 icon test). Browser-
verified 375px: the Space offer + header show 🚀 (not 💼) and the Energy offer shows ⚛️, no
overflow, no console errors.

> **🏁 Mogul Stories: DONE + polished.** 7 stories (all industries), two bespoke rewards
> (Angel→Combinator, Space→empire-wide halo), distinct icons, generic negotiation resolution
> for the rest, save/cloud/harness-safe, documented. No further Mogul-Stories work is worth
> doing without a real user signal.

---

## Mogul Story #7 — "Scrub or Fly" (Space), the finale + a bespoke reward 🏁

The seventh and final industry story — and the first to use a **bespoke reward** beyond the
generic per-industry boost. **All 7 industries now have a Mogul Story.**

- **New story** `content/mogulStories/launchGamble.ts` — "Scrub or Fly" (`launch_meridian`,
  Space): a **9-stage `standard`** mission-control drama. A closing launch window, a twitchy
  valve sensor from a corner-cutting supplier (fictional *Halcyon Components*), a customer
  screaming to fly, and a young engineer brave enough to dissent. Read the telemetry the
  honest way (try to *disprove* your own GO case), resist the schedule pressure, honour the
  dissent — then make the GO/NO-GO call. FLY = commit (`invest`), SCRUB = walk (`walkaway`).
  Fictional flight director *Renn Okafor*. Registered in `index.ts`.
- **Bespoke cross-industry reward** (the framework's per-story freedom, finally exercised
  beyond Angel's Combinator): a **`great`** launch is a historic success whose halo lifts the
  **whole empire** — a bigger (×1.5), longer (120s) profit boost on **every** industry, not
  just Space. Wired via a new `EMPIRE_WIDE` (`'*'`) sentinel on `boostIndustryId` that
  `mogulStoryBoostMult` treats as matching all industries, gated on `storyId === LAUNCH.id` in
  `applyOutcome` (mirrors the Angel-Combinator gate). A `good` launch → the normal Space-only
  boost; a `bad` "fly on a hunch" → a Space dip; SCRUB → neutral.
- **Save-compatible** (`boostIndustryId` already persisted; `'*'` is just a value) and
  **harness-inert** (player-triggered; bot never accepts → boost always ×1 → income
  byte-identical; the boost is off the base curve so `balance.test` monotonicity holds).
- Length range across all 7: Angel 10 / **Launch 9** / Poach 8 / Walkout 8 / Inspection 8 /
  Lease 7 / Viral 5.

**Validation:** `tsc -b` + build clean, oxlint clean, **323 tests** (+4: Space eligibility,
great→EMPIRE-WIDE-boost-not-Combinator, scrub→neutral, and good→Space-only-not-empire; the
framework-integrity test auto-covers the new story; all prior stories + harness + balance +
progression unchanged). Browser-verified 375px: the decision stage renders "Scrub or Fly ·
**9/9**"; clicking FLY on great-tier scores → outcome `great`, `boostIndustryId === '*'`,
`boostMult 1.5`, the "Liftoff — Flawless / the whole empire is flying" outcome screen; a
clean-slice re-run confirms the Combinator stays locked; no overflow, no console errors.

> **🏁 Mogul Stories content-complete: all 7 industries covered.** The loop should now stop
> manufacturing stories; further Mogul-Stories work needs a real signal (a major/cross-industry
> flagship, a framework polish, or a UI nit) — not another per-industry story.
> _(Note: the main JS chunk is now >500 kB pre-gzip — cumulative story prose; ~152 kB gzip. A
> future optimisation could lazy-load story content, which is only needed when a rare story
> fires. Not a blocker.)_

---

## Mogul Story #6 — "The Inspection" (Energy), a compliance drama

Sixth story, content + registration only. **6 of 7 industry ideas shipped — only the Space
launch gamble remains.**

- **New story** `content/mogulStories/inspection.ts` — "The Inspection" (`inspection_voss`,
  Energy): an **8-stage `standard`** compliance drama. A regulator (fictional *Della Voss*)
  arrives unannounced; there's a real buried flaw — a three-week gap in the reactor's
  containment logs. Meet it with transparency + a concrete fix (and refuse the bribe) to turn
  her into an ally, or charm/lie/bribe your way toward a shutdown. Reuses the shared
  negotiation scores; registered in `index.ts`.
- **No new engine code:** auto-triggers via `storyEligible` (owns Energy + cash floor),
  rotates in, resolves through the shared resolution — a clean honest handling → cash + a
  timed **Energy** boost; a caught cover-up (lie / bribe / lowball) → an Energy dip; lawyer up
  and say nothing → neutral.
- **Harness-inert** (player-triggered). Length range: Angel 10 / Poach 8 / Walkout 8 /
  **Inspection 8** / Lease 7 / Viral 5.

**Validation:** `tsc -b` + build clean, oxlint clean, **319 tests** (+3: Energy eligibility,
clean-handling→Energy-boost-not-Combinator, lawyer-up→neutral; framework-integrity test
auto-covers the new story; all prior stories + harness + balance + progression unchanged).
Browser-verified 375px: Energy-owning state → "💼 …surprise reactor audit" offer → modal
renders *The Inspection* / "The Knock · **1/8**" → choice → consequence beat → Continue
advances to "· 2/8" with authored score deltas, no overflow, no console errors.

---

## Mogul Story #5 — "The Walkout" (Logistics), a labour negotiation

Fifth story, content + registration only again. Fills the mid-late timeline gap (Logistics
is the 5th industry).

- **New story** `content/mogulStories/dockDispute.ts` — "The Walkout" (`walkout_pier_nine`,
  Logistics): an **8-stage `standard`** labour negotiation. Peak season, a dawn strike vote,
  and one night to read the real grievance (it's rarely just pay), unbundle the cheap wins
  (safety winch, mandatory doubles, respect) from the expensive one (across-the-board pay),
  refuse the cheap union-busting trick, and keep the cargo moving. Fictional steward *Sal
  Rourke* over *Pier 9*. Reuses the shared negotiation scores; registered in `index.ts`.
- **No new engine code:** auto-triggers via `storyEligible` (owns Logistics + cash floor),
  rotates in, resolves through the shared resolution — a fair settlement → cash + a timed
  **Logistics** boost; a strike (threaten / split the crew / lowball) → a Logistics dip; let
  them walk → neutral.
- **Harness-inert** (player-triggered). Length range: Angel 10 / Poach 8 / **Walkout 8** /
  Lease 7 / Viral 5. **4 of 7 industry ideas shipped; Energy + Space remain.**

**Validation:** `tsc -b` + build clean, oxlint clean, **316 tests** (+3: Logistics
eligibility, settle→Logistics-boost-not-Combinator, walk→neutral; framework-integrity test
auto-covers the new story; all prior stories + harness + balance + progression unchanged).
Browser-verified 375px: Logistics-owning state → "💼 …threatening to strike" offer → modal
renders *Pier 9* / "The Threat · **1/8**" → choice → consequence beat → Continue advances to
"· 2/8" (Sal Rourke speaking) with authored score deltas, no overflow, no console errors.

---

## Mogul Story #4 — "Gone Viral" (Food), a crisis-opportunity beat

The fourth story — and the first non-negotiation one — still lands as **content +
registration only**. Food is the starting industry, so this reaches players earliest.

- **New story** `content/mogulStories/viralMoment.ts` — "Gone Viral" (`viral_copper_spoon`,
  Food): a punchy **5-stage `short`** crisis-opportunity. A clip of your diner's "Copper
  Melt" explodes overnight; ride the wave with grace (honest scarcity, grace under a
  backlash, a keeper dish) or squeeze it dry (shrinkflation, public brawls, flimsy merch) and
  torch the goodwill. Fictional influencer *Margo Vane* is the recurring foil. Reuses the
  shared negotiation scores (reframed as read-the-room / control-the-narrative / don't-
  overreach); registered in `index.ts`.
- **No new engine code:** auto-triggers via `storyEligible` (owns Food + cash floor), rotates
  into the offer queue, resolves through the shared resolution — a graceful finish → cash + a
  timed **Food** boost; a greedy fumble → a Food dip; let it fade → neutral. Proves the
  generic resolution isn't limited to literal negotiations.
- **Harness-inert** (player-triggered). Length range now spans Angel 10 / Poach 8 / Lease 7 /
  **Viral 5** (the short end).

**Validation:** `tsc -b` + build clean, oxlint clean, **313 tests** (+3: Food eligibility,
graceful→Food-boost-not-Combinator, fade→neutral; framework-integrity test auto-covers the new
story; all prior stories + harness + balance + progression unchanged). Browser-verified 375px:
Food-owning state → "💼 …make your diner blow up overnight" offer → modal renders *Gone Viral*
/ "The Spike · **1/5**" → choice → consequence beat → Continue advances to "· 2/5" (Margo Vane
speaking) with authored score deltas, no overflow, no console errors.

---

## Mogul Story #3 — "The Poach" (Tech), zero new resolution code

Proof that the generic runtime pays off: a third story shipped as **content + registration
only** — no engine changes at all.

- **New story** `content/mogulStories/enginePoach.ts` — "The Poach" (`poach_nakamura`, Tech):
  an **8-stage `standard`** retention drama. A rival lab (fictional "Vireo Labs") is poaching
  your star engineer *Kit Nakamura*; you have one conversation to keep them — by digging into
  *why* they're really leaving (growth, recognition) instead of just out-bidding into a
  ruinous war. Reuses the shared negotiation scores; registered in `index.ts`.
- **No new engine code:** it auto-triggers via the generic `storyEligible` (owns Tech + cash
  floor), rotates into the offer queue, and resolves through the shared negotiation
  resolution — a strong finish grants cash + a timed **Tech** profit boost (via
  `boostIndustryId`); a bidding-war blunder dips Tech; letting them go is a graceful neutral.
  Only Angel's `great` still founds the Combinator.
- **Harness-inert** (player-triggered; bot never accepts → income byte-identical). Demonstrates
  the intended length range: Angel 10 / Lease 7 / Poach 8.

**Validation:** `tsc -b` + build clean, oxlint clean, **310 tests** (+3: Tech eligibility,
great→Tech-boost-not-Combinator, walk→neutral; the framework-integrity test auto-covers the
new story; Angel/Lease + harness + balance + progression unchanged). Browser-verified 375px:
Tech-owning state → "💼 …poach your star engineer" offer → modal renders *The Counter-Offer* /
"The Rumour · **1/8**" → narrative (Kit / Vireo) → choice → consequence beat → Continue
advances to "· 2/8" with authored score deltas (+ operator roleBoost amplifying correctly),
no overflow, no console errors.

---

## Mogul Story #2 — "The Lease" (Retail), the first story on the generic runtime

Authored the second Mogul Story and generalised the resolution just enough to host it — a
new industry gets a hidden-narrative beat with almost no new engine code.

- **New story** `content/mogulStories/leaseShowdown.ts` — "The Lease" (`lease_thorne_plaza`,
  Retail): a **7-stage `short`** landlord showdown (vs Angel's 10) with landlord *Bianca
  Thorne* over the *Thorne Plaza* flagship unit — read the (expiring) footfall, hold terms,
  spot the demolition-clause / uncapped-percentage-rent trap, sign or walk. Reuses the shared
  6 negotiation scores; registered in `content/mogulStories/index.ts`.
- **Generic negotiation resolution** (no bespoke resolver needed): `storyEligible(state,
  story)` = owns the story's `industryId` + cash floor; `tickAngelDeal` now offers whichever
  registered story is eligible, **rotating by `completedCount`** so pitches vary; the timed
  reward boost is generalised from Finance-only to **any industry** via new
  `AngelDealState.boostIndustryId` (`angelFinanceBoostMult` → `mogulStoryBoostMult`). A great
  non-Angel finish gives strong cash + a boost on its own industry; only **Angel**'s great
  still founds the Combinator.
- **Save:** `boostIndustryId` persisted + tolerantly restored (default finance).
- **Harness-inert:** still fully player-triggered — the bot never accepts a pitch, so no
  boost is ever active (`mogulStoryBoostMult` = 1) and income stays byte-identical; the trigger
  only flips flags. `balance.test` monotonicity untouched (boost is off the base curve).
- **Docs:** `mogul-stories.md` ticks the Retail idea done + documents the shared negotiation
  resolution (so future business-deal stories are often "content + registration" only).

**Validation:** `tsc -b` + build clean, oxlint clean, **307 tests** (+4: lease eligibility,
Retail-only rotation offers the lease, great→Retail-boost-not-Combinator, walk→neutral; the
framework-integrity test auto-covers the new story's shape; Angel + harness + balance +
progression unchanged). Browser-verified 375px: Retail-owning state → "💼 …flagship lease"
offer → modal renders *Thorne Plaza* / *Bianca Thorne* / "The Offer · **1/7**" → choice →
consequence beat → Continue advances to "· 2/7" with the authored score deltas applied, no
overflow, no console errors.

---

## Mogul Stories — enabling refactor: the runtime now drives ANY story by id

Groundwork before authoring a second story: the shared session plumbing no longer hardcodes
the Angel story constant — it resolves whichever story the session references by id.

- **`AngelDealState.storyId`** (default `ANGEL_DEAL.id`) is the active Mogul Story id.
  `initialAngelDealState()` sets it; it's persisted and **round-trips through save**, with an
  **unregistered id dropped back to the default** on load (tolerant, never crashes).
- **`activeStory(a)`** (`engine/angelDeal.ts`) = `getMogulStory(a.storyId) ?? ANGEL_DEAL`.
  Stage navigation (`startAngelDeal` → `firstStage`, `chooseAngelChoice` → `stages` lookup +
  advance) now goes through it instead of the `ANGEL_DEAL` constant.
- **buildView** resolves the story by id for the "Stage N of M" counts and adds
  `AngelDealView.storyId`; **MogulStoryModal** replaced its module-level `const STORY =
  ANGEL_DEAL` with a per-render `getMogulStory(a.storyId) ?? ANGEL_DEAL`. No story-specific
  branch remains in the UI/view/stage-nav.
- **Behavior-preserving:** only Angel is registered, so `storyId` is always `angel_fridgemind`
  → identical play. What stays story-specific (by design) is the *resolution* (score→band +
  reward); a second story adds its own, reusing this shared offer/stage-nav/render plumbing.
- Docs: `mogul-stories.md` gains a "The active-story id (shared session seam)" section and the
  "add a story" UI step now points at `storyId`.

**Validation:** `tsc -b` + build clean, oxlint clean, **303 tests** (+4: story resolved by id,
unknown-id fallback, first stage via `activeStory`, `storyId` save round-trip incl. unknown-id
drop; Angel flow + balance + harness + progression unchanged). Browser-verified 375px: the
Angel offer → modal still renders from the `storyId` path (stage `pitch`, "Pitch · 1/10",
FridgeMind), no console errors, no overflow. (Rebased onto the parallel session's Space Salvage
Shooter commit `d406275` first; staged only my files.)

---

## Mogul Stories — formalised the hidden-narrative framework

Turned the one-off "Opportunity Mini-Game" (Angel Investment) into a **named, reusable,
documented framework**: *Mogul Stories* — rare, optional, industry-specific mini visual
novels. Naming/architecture/docs pass, deliberately not overbuilt.

- **Shared vocabulary** (`src/content/mogulStories/types.ts`): `MogulStory`,
  `MogulStoryStage`, `MogulStoryChoice`, `MogulStoryScores`, `MogulStoryOutcomeBand`,
  `MogulStoryOutcomeCopy`, `MogulStoryRoleBoost`, `MogulStoryLength`. Only the *shape* is
  shared — each story owns its hidden score variables, tone, outcome→band logic, and rewards
  (full creative freedom). **Variable length** is first-class: short 5–7 / standard ~10 /
  major 15–20+ (a hint, drives no logic; the progress chip renders any `order.length`).
- **Registry** (`src/content/mogulStories/index.ts`): `MOGUL_STORIES`, `MOGUL_STORY_BY_ID`,
  `getMogulStory(id)`.
- **Angel migrated safely** — its content moved to `mogulStories/angelInvestment.ts`
  (speaker `founder`→`protagonist`, added `hook`/`subject`/`length` + per-band outcome copy;
  the Combinator reveal is now just the story's `outcome.great.line`, no UI special-case).
  `content/angelDeal.ts` is now a **one-line re-export shim** so every existing importer
  (engine/save/buildView/modal) keeps working unchanged. Typed `Scores` (Record<ScoreKey,…>)
  preserved for the Angel engine.
- **Reusable UI** (`src/ui/mogulStories/MogulStoryModal.tsx`, renamed from `AngelDealModal`):
  a generic mobile visual-novel modal that renders ANY `MogulStory` def — floating offer →
  typewriter narrative → consequence beat → 2–4 choices + Walk Away → per-band outcome
  screen. **No story-specific logic** remains in the UI. `AngelDealModal.tsx` deleted.
- **Docs:** new [`docs/mogul-stories.md`](docs/mogul-stories.md) — what they are, naming,
  the content/runtime/reward split, variable length, hidden scoring, Walk Away rules, outcome
  bands, trigger/cooldown, save/cloud/harness safety, and a step-by-step "add a new story"
  guide + future story ideas (one per industry).
- **Save/cloud/harness unchanged:** ordinary game state in the same versioned envelope
  (cloud-safe, no secrets); load stays tolerant (an in-progress session on an unknown stage
  cancels cleanly); the whole system is player-triggered so it's byte-inert for the sim bot.

**Validation:** `tsc -b` + build clean, oxlint clean, **277 tests** (+3 framework-integrity
tests in `mogulStories.test.ts`: registry/unique-ids, every story well-formed + walkable +
all four outcome bands, registry keying; Angel + balance + harness + progression unchanged).
Browser-verified 375px: the offer appears, accepting opens the Angel story through the new
generic modal (stage `pitch`, "Pitch · 1/10", FridgeMind), no console errors, no overflow.

---

## Startup Combinator — now a real standalone business with "exit" jackpots

Upgraded the Angel Deal great-outcome reward from a permanent ×1.15 multiplier placeholder into an
actual business you found and own.

- **New `startup_combinator` business** (`content/businesses.ts`): icon 🚀, industry `tech`
  (Finance/Tech hybrid flavour), `autoRun: true` (a fund — runs without an Operator; new
  `BusinessDef.autoRun` + `resolveBusiness` honours it). Deliberately **NOT** in `BUSINESS_ORDER`
  or any industry's `businessIds`, so it's excluded from `balance.test`'s efficiency-monotonicity
  ladder and the normal industry lists; never auto-unlocks (self-referential gate). `initialState`
  now iterates all of `BUSINESSES` so its state exists (starts locked, owned 0).
- **Great outcome** now `unlocked = true; owned = max(1, owned)` (you found it) instead of the old
  multiplier fold, which was **removed** from `economy.ts` (the timed Finance boost/debuff stays).
- **Exit payouts** (`engine/angelDeal.ts`): every ~2 min the Combinator "exits" for a lump =
  N seconds of its income on a deterministic, occasionally-MASSIVE sequence (`[75,180,45,420,120,
  900,60,240]` — 900s ≈ a 15-min jackpot). No RNG. Fires in `simulate` only when owned. Offline is
  safe: catch-up is closed-form (`automatedIncomePerSec × seconds`), so steady income is credited
  but exits don't fire offline (no windfall exploit).
- **UI:** `CombinatorCard` (a prized green card at the top of the Business screen when unlocked —
  name/owned/pps + Buy + an exit-countdown bar) and an always-mounted `CombinatorExitWatcher` so
  the exit celebration fires on any tab.
- **Harness byte-identical:** the sim bot never wins the deal → never owns the Combinator → the
  exit tick + income are inert for it; `BUSINESS_ORDER` excludes it so the bot never buys it.

**Validation:** `tsc -b` + build clean, oxlint clean, **274 tests** (+2 exit-payout tests; balance +
harness + progression all unchanged). Browser-verified 375px: card renders/fits, steady income
accrues (auto-run), exits fire ($450B then $1.08T — varying), no overflow/errors.

---

## Opportunity Mini-Game #1 — Angel Investment Deal (FridgeMind)

A full, decently-lengthy visual-novel negotiation built into the Finance industry — the first
entry in a small, reusable Opportunity Mini-Game framework.

**How it works.** When you own a Finance business and have ≥ $1M, a rare pitch is offered (~4 min
of eligible time; a long ~30-min cooldown between pitches, so it stays rare). A floating "💼 A
founder wants to pitch you" prompt appears; tapping opens a 10-stage VN (The Pitch → First
Impression → Product Demo → Market → Founder Pressure → Financials → Red Flag → Valuation →
Final Terms → Decision). Each stage types its text out one character at a time (tap to skip),
offers 2–4 real choices plus a **Walk Away** that’s always available, and shows qualitative
flavour hints (never raw numbers). Choices move six HIDDEN scores — confidence, leverage,
dueDiligence, founderTrust, risk, valuationDiscipline — with genuine trade-offs (hype raises trust
but tanks diligence + raises risk; calling the red flag cuts risk but costs trust; hardball raises
leverage/discipline but annoys the founder). If the player has matching employees, a choice’s
effect is lightly amplified (Closer→negotiation, Buyer→valuation, Operator→diligence, Runner→timing).

**Outcome bands** (from `dealQuality = dueDiligence + valuationDiscipline + leverage + conf/2 +
trust/2 − risk`): **Great** (q≥9, risk≤2, dd≥6) → +3× the cheque **and unlocks the Startup
Combinator** (a permanent ×1.15 Finance **and** Tech profit fold); **Good** (q≥3, risk≤6) →
+0.75× cheque + a 90s Finance ×1.4 boost; **Neutral** (walk away) → nothing, or a tiny discipline
bonus if you dodged a clearly bad deal (q<0 or risk≥6); **Bad** → lose the cheque (bounded to 12%
of cash — never ruinous) + a 60s Finance ×0.75 "bad press" debuff.

**Persistence.** Durable meta (combinatorUnlocked, completedCount, cooldown, timed boost) always
saves; the in-progress session (stage + hidden scores) restores too, but is **safely cancelled**
if the stage id is unknown (content changed) — never breaks load. Cloud save unaffected.

**Harness-safe by construction:** the whole mini-game is player-triggered — the greedy sim bot
never opens or resolves it, so the Combinator/boost economy folds stay ×1 and Finance/Tech income
is byte-identical in the harness/balance/progression sims.

**Files:** +`content/angelDeal.ts` (framework + FridgeMind script), +`engine/angelDeal.ts`
(+`.test.ts`, 20 cases), +`ui/opportunities/AngelDealModal.tsx`; ~`types/domain.ts`,
`store/{initialState,buildView,gameStore,actions}.ts`, `save/serialize.ts`,
`engine/{simulate,economy}.ts`, `App.tsx`.

**Validation:** `tsc -b` + build clean, oxlint clean, **272 tests** (+20). Browser-verified at
375px: floating offer → accept → typewriter stages → choices (64px option rows + 32px walk-away,
all ≥44px tap) → decision → invest → GREAT outcome screen (+$360B payout, Combinator unlocked),
no overflow, no console errors.

**Known limitations / next.** The Startup Combinator is a *permanent multiplier* unlock, not yet a
standalone business with random "exit payout" bursts (a safe placeholder — the business version is
a follow-up). Employee amplification is light (any hired role of the type). Next opportunity
mini-games to consider: a Retail "Franchise Buyout" haggle, a Tech "Acquisition Offer" (sell vs.
hold), a Logistics "Port Strike" crisis negotiation — all reusing this stage/choice/outcome model.

---

## Space Salvage Shooter — a 5-stage arcade Easter-egg campaign (NEW)

A rare **Space-industry opportunity mini-game**: an old-school vertical scrolling shooter hidden
inside the idle loop. Manually pilot a salvage ship through alien fleets + debris, shoot, collect
salvage, survive to extraction, earn bounded rewards. It is a **5-stage recurring campaign** with
over-the-top Central Command dialogue, not a one-off.

**Stages** (only the next incomplete one triggers; a cooldown gates the next): 1 *Strange Signal* →
2 *The Debris Has Opinions* → 3 *Hostile Acquisition* → 4 *Board Meeting In Orbit* → 5 *The Pilot Is
Obsolete*. Difficulty ramps (more debris → more enemies → faster hazards → boss dreadnoughts → chaos).
Passing **Stage 5 unlocks the AI Salvage Pilot**: manual stages stop triggering and salvage resolves
automatically (a modest bounded cash drip).

**Assets:** Foozle **Void** packs (CC0), copied OUT of the throwaway `dist/` into
`public/assets/arcade/foozle/` (25 PNGs) — player hull (4 damage states), 3 enemy fleets
(Kla'ed/Nairan/Nautolan) + dreadnought bosses, enemy bullet, spinning salvage/shield pickups,
asteroid. Every sprite falls back to a drawn shape if it fails to load. See `arcade-assets.md` +
`CREDITS.md`. Manifest + on-disk test in `src/content/arcadeManifest*.ts`.

**Architecture (clean seams, no idle-loop interference):**
- `content/spaceShooter.ts` — stage defs, difficulty, rewards, all dialogue (pure data).
- `engine/spaceShooter.ts` — pure campaign engine: offer gating, timed-buff + AI-salvage tick,
  outcome bands (great/good/pass/failed), **bounded** reward application (cash = idle-income-seconds ×
  band, like event cards; a Space-only timed profit buff; permanent Yard/AI-pilot perks). Harness-safe
  (the bot never plays → never advances → AI branch never fires).
- Persisted campaign progress added to `GameState.spaceShooter` (additive → **no migration, no save-
  version bump**); `serialize.tolerantLoad` overlays only the progress subset (transient buff stays
  fresh, like golden/eventCards); **survives prestige** (`prestige.ts`, like achievements/contracts);
  rides the cloud envelope untouched (`sameSave` only compares cash/lifetime → no spurious conflicts).
- Economy hook: `spaceSalvageProfitMult` folded into `economyMultipliers` for Space only (mirrors
  the `dispatch`/`rush` industry-scoped buffs).
- UI: `FloatingSalvageSignal` chip (mirrors the Golden Deal chip) + fullscreen `SpaceSalvageShooter`
  modal with its **own rAF loop** (briefing → canvas play → outcome). Desktop arrows/WASD + Space;
  mobile drag + auto-fire. Mid-mission state is **never persisted** (a refresh just closes the modal,
  UI-only flag; the signal remains). Walking away / ejecting = re-arm, no progress.

**Validation:** `tsc` + build clean, **oxlint clean, 274 tests** (40 files) incl. 18 engine +
3 manifest tests (progression, failure-no-advance, cooldown, AI-pilot unlock, reward bounds,
save round-trip + old-save defaults, prestige survival). **Browser-verified @375px (dev2):** signal
chip appears when Space is owned → briefing dialogue → live canvas (Foozle sprites rendering, auto-fire,
scrolling starfield, HUD) → GOOD/GREAT outcome → **+$ reward banked, campaign advanced 0→1**, modal
closes and idle game resumes; no console errors. Fixed a live bug where the outcome pinned to the next
stage instead of the played stage (now pins to `playIndex`, captured at launch).

**Files:** +`content/spaceShooter.ts`, +`content/arcadeManifest.ts`(+test), +`engine/spaceShooter.ts`
(+test), +`ui/shared/SpaceSalvageShooter.tsx`, +`ui/shared/FloatingSalvageSignal.tsx`, +`arcade-assets.md`,
+`CREDITS.md`; ~`types/domain.ts`, `store/{initialState,buildView,gameStore,uiStore,actions}.ts`,
`engine/{economy,simulate,prestige}.ts`, `save/serialize.ts`, `App.tsx`, `public/assets/arcade/foozle/*`.

**Known limits / future polish:** desktop layout stretches full-width (mobile-first; could cap
content max-width); explosions use particles (the `asteroid-explode` sheet is copied + reserved);
player projectiles are drawn shapes (Void projectile art ships as wide anim strips).

---

## UI REDESIGN Phase 3 — FULL game-world juice (cash-burst) — redesign COMPLETE

The last cross-cutting piece of the user-picked "FULL" game-world. Reactive mascot poses were
already wired (`WealthStage` swaps founderExcited/Working/Idle by celebrating/earning/idle state),
so this slice adds the **cash-burst**: the floating "+$" payoff pop now plays the authored 8-frame
`ART_GENERATED.vfx.cashBurstFrames` sequence (`FloatingProfitLayer` steps the frames ~55ms each,
then holds the last while the +$ rises) instead of a single static burst image. Same payoff
moments — nicer punch, so it *concentrates* juice rather than adding more. Reduced-motion-safe (the
float self-removes near-instantly under `prefers-reduced-motion`, so only the first frame shows).

**Validation:** build + oxlint clean, 252 tests. **Browser-verified at 375px:** spawned floats load
the real burst frames (`cash_burst_08.png`, complete + naturalWidth 155 — no 404), cycle through the
sequence, and the "+$" amounts render; no console errors.

**Files:** ~`ui/shared/FloatingProfitLayer.tsx`, `docs/UI_REDESIGN.md`.

**→ The full UI redesign (Phases 0 → 3) is delivered:** one flat/dense/game-like design system, a
consistent small-button scale (no more giant bars), massively fewer boxes, both audit bugs fixed,
the cloud-conflict nag fixed, and the reactive-mascot + cash-burst game-world. Optional follow-ups:
flatten the founder-perk choice cards; Stats still ~5 boxes; retire remaining emoji-as-labels for art.

---

## UI REDESIGN Phase 1b-ii + 2 + 3-structural — parallel screen rewrites

User asked to "finish the next few phases all in one go." Implemented via a 9-agent parallel
workflow (one agent per screen, disjoint files, all following the Phase-0 design system + the
shipped Phase-1 row/chip patterns), then integrated + verified + fixed by hand.

- **Phase 1b-ii:** WorkCard → borderless accent-stripe strip + a content-hug 48px Work Shift (was
  a full-width 56px slab); IndustryTabs → theme-filled pills (44px tap); IndustryBanner →
  borderless; TopHUD collapsed to a **single tier** (120→**73px**), the buy-mode segmented control
  **moved to a slim `.btn-sm` row on the Business tab** (freeing the HUD); `--hud-h` 120→80.
- **Phase 2:** StatsScreen / UpgradesScreen / EmployeesScreen → flat divider-separated lists with
  the small `.btn` scale (no per-row boxes). **Fixed both audit bugs:** AssignmentSheet passed an
  industry *id string* as a CSS border color (affinity highlight was dead) → now
  `var(--industry-${id})`; the Bench button lacked a 44px min → now `.btn-ghost`.
- **Phase 3 (structural):** PrestigeScreen → slim borderless hero + accent-stripe talent/milestone/
  achievement rows; **one shared `Overlay` shell** (`ui/shared/Overlay.tsx`) now backs EventCard /
  DailyBonus / Ascension / WelcomeBack (confirms `.btn-lg .btn-block`, dismiss `.btn-ghost`;
  EventCard options → accent-stripe rows).
- **Hand fixes after integration:** IndustryTabs pills 40→44px tap; EventCard option rows given a
  44px min; `--hud-h` set to 80.

**Validation:** `tsc -b` + build clean (JS 402→**398 kB**), oxlint clean, **252 tests** (+8 from
the new `sameSave` test). **Browser-verified at 375px on every tab:** no horizontal overflow,
**zero ≥54px "bar" buttons** (hero actions 48px; only the 4 founder-perk *choice cards* + the
Ascend hero remain tall), **all interactive controls ≥44px tap**, bordered boxes down to ~1–5 per
screen (was many). No console errors.

**Files:** ~13 `ui/` components + `tokens.css`; +`ui/shared/Overlay.tsx`.

**Follow-ups (queued):** the cross-cutting **FULL game-world juice** (reactive mascot poses +
`cash_burst` on hero actions) — I'm doing that next as its own slice; flatten the founder-perk
choice cards; Stats still has ~5 boxes.

---

## Fix — spurious cloud-save conflicts (widen sameSave tolerance)

`sameSave()` in accountStore required EXACT cash/lifetime equality, so the idle game (cash ticks
every 100ms) surfaced a spurious cloud-save conflict on nearly every login. Now exported and
widened: two saves match if `savedAt` within 3s AND cash/lifetime within a 2% relative tolerance
(0===0); genuine cross-device divergence still surfaces a conflict. Added `store/accountStore.test.ts`
(identical → same; 1s/+0.5% idle drift → same; 2× cash → not same; far-apart savedAt → not same).
**252 tests green** (+8). Independent of the UI redesign.

---

## UI REDESIGN Phase 1b-i — collapse the Business-screen cue boxes

Continues the de-boxing on the Business screen (above the list). Before: a fresh industry
stacked an onboarding box, then the industry-bonus box, then one of the Finance/Quantum/Logistics
signature boxes, then an entry-cost box, then a full-width Spend-Cash box.

- **4 cue boxes → ONE borderless `IndustrySignatureStrip`.** IndustryBonusCue + FinanceCompoundCue
  + QuantumSuperpositionCue + LogisticsDispatchCue are deleted; one flat strip (2px accent left
  stripe + a thin bonus-progress baseline) shows the ⭐ industry specialisation bonus on the left
  and the *active* signature on the right — Finance "📈 +N%", Quantum "⚛️ ×9!/stable", or the
  Logistics Dispatch chip (`.btn-sm`, still fully functional). Only one signature is ever active.
- **Spend-Cash** → a `.btn-secondary .btn-sm` chip inside a new "Businesses" `.section` header
  (was a full-width bordered box button).
- **Onboarding hint + entry-cost** → borderless accent-left-stripe callouts (were bordered boxes;
  dropped the industry-pattern background too).

**Validation:** `tsc -b` + build clean (JS 405→402 kB — 4 components removed), oxlint clean,
**244 tests green**. **Browser-verified at 375px:** full-border boxes in `main` dropped from ~7 to
**3** (WorkCard + banner + list — those are the next slices); the strip renders correctly for a
signature industry (Logistics shows the 32px Dispatch chip) and a plain one (Space shows just the
bonus, no right chip); Spend-cash + Dispatch chips 32px; no horizontal overflow.

**Files:** ~`ui/business/BusinessesScreen.tsx`; ~`docs/UI_REDESIGN.md`.

**Next (Phase 1b-ii):** WorkCard → accent-stripe strip; IndustryTabs/Banner → pills + borderless
banner; single-tier HUD + slim Business-tab buy-mode row.

---

## UI REDESIGN Phase 1a — business list → flat dense rows

**The core visible transformation** of the redesign (the mockup the user approved): the Business
screen's list of big bordered/elevated cards becomes a flat, dense list of divider-separated rows.

- **BuyButton** → a content-hugging `.btn-md` chip (40px, single line "Buy ×N · $cost"), gold when
  affordable else neutral-dim (was a 56px, 104px-min, two-line gold slab).
- **BusinessCard** → a flat `.list-row` (~60px): 40px icon well (tap-ready glow when idle), 2-line
  body (name + ×owned; then rate + one status micro — auto / tap-to-run / ⚠️ / ⏳ ETA / ★ milestone),
  a ghost staff chip, best-ROI as a 2px accent LEFT stripe (not a pill), and a thin progress
  baseline along the bottom. Manual businesses run a cycle on row tap (keeps the +$ float + haptic).
  The multi-emoji stat dump (profit%/speed%/crit%/focus%) moved off the row (belongs in the sheet).
- **LockedBusinessCard** → a matching dimmed row.
- **BusinessesScreen** list → one flat `.card overflow-hidden` holding the divider-separated rows
  (was a `grid gap-3` of N separate cards). Big box-count drop: N business boxes → 1.

**Validation:** `tsc -b` + build clean (JS actually −2 kB), oxlint clean, **244 tests green**.
**Browser-verified at 375px:** rows ~60px, 5 visible (was ~2), Buy chip 40px visual with a **44px
tap area** (the `.btn::before` hit-expander), the busiest row (staff chip + Buy chip + stripe) fits
at rowRight 362 ≤ 375, no horizontal overflow, no console errors.

**Files:** ~`ui/business/BuyButton.tsx`, `BusinessCard.tsx`, `LockedBusinessCard.tsx`,
`BusinessesScreen.tsx`; ~`docs/UI_REDESIGN.md`.

**Next (Phase 1b):** collapse the stacked cue boxes into one themed strip, then WorkCard →
accent-stripe strip, IndustryTabs/Banner → pills + borderless banner, and the single-tier HUD with
the slim Business-tab buy-mode row.

---

## UI REDESIGN Phase 0 — foundation (flat, dense, one button system)

**Context:** user called the UI hectic/boxy with "giant bar" buttons and asked for a real
redesign (fewer/no boxes, consistent smaller buttons, density, game-like). A multi-agent design
analysis produced the plan (see [`docs/UI_REDESIGN.md`](docs/UI_REDESIGN.md)); the user picked
dense ~64px business rows, a slim full-width buy-mode row (Business tab only), and the FULL
game-world treatment. Presented with a before/after mockup and approved.

**Phase 0 (this commit) — the reusable foundation everything else pulls from:**
- `tokens.css`: control scale `--ctrl-sm/md/lg` (32/40/48px visual), `--ctrl-radius`, `--gap-sm`,
  and `--divider`; kept `--tap:44px` as the immutable TOUCH floor.
- `global.css`: one `.btn` system (`-primary/-secondary/-ghost`, `-sm/-md/-lg`, `-block`,
  `-icon`) whose `::before` expands the tap area to ≥44px so a 32px button is still fully
  tappable; plus `.list-row` (hairline-`--divider`-separated, borderless) and `.section`
  (uppercase label) as the flat grouping vocabulary that replaces nested boxes.
- **Dialed back the recent elevation/frost pass** (it worked against the goal): `.card` is now
  FLAT (dropped the shadow-card + top-lit gradient + hairline — reserved for genuine objects
  only); the frosted HUD/nav kept the cheap blur but **lost the heavy directional shadow**,
  separating from content by their existing 1px hairline instead of floating.

**Validation:** `tsc -b` + build clean (CSS 27.3→28.8kB from the utilities), oxlint clean, 244
tests green (presentation-only). **Browser-verified at 375px** via computed styles: `.card`
box-shadow + gradient now `none`; HUD box-shadow `none` with `backdrop-filter: blur(14px)` kept.
New `.btn`/`.list-row`/`.section` utilities are latent until Phase 1 adopts them.

**Files:** ~`ui/styles/tokens.css`, `ui/styles/global.css`; +`docs/UI_REDESIGN.md`.

**Next:** Phase 1 — rebuild the Business screen (flat rows + small chips + collapsed cues).

---

## HOTFIX — cloud-save conflict chooser was un-clickable (deadlock)

**Reported (user, with screenshot):** stuck on the "Which save do you want?" cloud-conflict modal
— *neither* "Use This device" nor "Use Cloud save" could be clicked.

**Root cause (pre-existing, not from recent work):** `accountStore.reconcile()` set
`status: 'syncing'` at the *same time* it surfaced the conflict. The `ConflictChooser` passes
`busy={status === 'syncing'}` to both `SaveOption` buttons as their `disabled` prop — so both
choice buttons were **disabled the instant the modal appeared**, with no path out (the modal also
blocks escape/outside-click while a conflict is pending). A hard deadlock.

**Fix (one line + rationale comment):** when surfacing the conflict, set `status: 'local'`
instead of `'syncing'`. `'local'` is accurate (not yet synced; local play continues), and the
autosave-upload callback already no-ops while a conflict is pending (it guards on `s.conflict`),
so nothing uploads meanwhile. `resolveConflict` still sets `'syncing'` once the player actually
picks (by then the chooser has unmounted).

**Verified live at 375px** (dev preview, forcing the conflict via a new dev-only `__game.account`
bridge): with the old `status:'syncing'` both buttons read `disabled:[true,true]` (reproduces the
bug); with the fix `disabled:[false,false]`; clicking "Use This device" fired `resolveConflict`,
cleared the conflict, and closed the modal. `tsc`+build clean, oxlint clean, **244 tests green**.

**Also added:** `import.meta.env.DEV`-only `window.__game.account` (the account store) to the debug
bridge — stripped from production; used to verify this and to debug future sync/conflict flows.

**Follow-up noted (not in this hotfix):** `sameSave()` requires **exact** cash/lifetime equality,
so an idle game (cash ticks every 100ms) surfaces a spurious conflict on almost every login even
when the saves are effectively identical (the screenshot's two saves were 1s apart, same displayed
figures). Widen it to a small relative tolerance within the savedAt window — queued as a considered
follow-up (a conflict-detection behavior change deserves its own careful pass + a `sameSave` unit test).

**Files:** ~`store/accountStore.ts`, `main.tsx`.

---

## UI uplift #2 — frosted + elevated shell chrome (HUD + NavBar)

**Slice #2 from [`docs/UI_UPLIFT_BACKLOG.md`](docs/UI_UPLIFT_BACKLOG.md)** — a reusable lever
visible on *every* screen. The audit flagged the two fixed chrome bars as the flattest, most
static parts of an otherwise juicy app: opaque `var(--surface)` with only a hairline border, so
they read as coplanar with the content rather than as chrome floating above it.

**Implemented (presentation-only, progressive enhancement):**
- `tokens.css`: frosted-chrome tokens — `--surface-frost` (`color-mix` → 80% `--surface`, 20%
  transparent), `--frost-blur` (`blur(14px) saturate(1.4)`), and directional elevation
  `--shadow-hud` (down) / `--shadow-nav` (up).
- `global.css`: reusable `.chrome` + `.chrome-hud`/`.chrome-nav` utilities. **Progressive
  enhancement**: opaque `--surface` by default so legibility *never* regresses, with the
  translucent blur applied only inside `@supports (backdrop-filter…)`.
- Applied `.chrome chrome-hud` to `TopHUD` and `.chrome chrome-nav` to `NavBar`, dropping their
  inline opaque `background` so the frost takes over. Borders + safe-area paddings kept.

Now the HUD/nav read as premium glass floating over the city backdrop, with a soft shadow
separating chrome from content — a native-feeling layer on every tab.

**Validation:** `tsc -b` + build clean (supabase still split; CSS 24.4→27.3kB from the
`@supports` block), oxlint clean, **244 tests green** (presentation-only). **Browser-verified at
375px** via computed styles: both bars carry `backdrop-filter: blur(14px) saturate(1.4)`, an
80%-opaque translucent surface, and the directional shadows (HUD `0 6px 20px`, nav `0 -6px 20px`);
text styling untouched; no layout overflow; no console errors. (Screenshot hit the known rAF
timeout; computed-style measurement is the definitive proof.)

**Files:** ~`ui/styles/tokens.css`, `ui/styles/global.css`, `ui/shell/TopHUD.tsx`,
`ui/shell/NavBar.tsx`; ~`docs/UI_UPLIFT_BACKLOG.md`.

**Next (from the backlog):** the typographic scale (#3 lever), then the two real bugs — the dead
AssignmentSheet affinity border (#4) and the sub-44px Bench button (#29).

---

## UI uplift #1 — elevation + shared `.card` token layer (depth that lifts every screen)

**Context (user-directed):** the user redirected the loop to focus on **UI uplift**. Ran a
multi-agent audit (6 senior-designer agents, one per UI surface, + adversarial synthesis) to
ground the pass. Verdict: excellent bones (disciplined tokens, 44px tap targets, tabular-nums,
a real reduced-motion-gated juice library) but a ceiling of **uniform flatness** — every
card/panel/HUD/nav/modal is the identical flat `var(--surface)` + 1px border + `rounded-2xl`,
with **no elevation/shadow token, no type scale, no motion tokens** (and dead `--radius` tokens
with zero consumers). Full ranked plan saved to [`docs/UI_UPLIFT_BACKLOG.md`](docs/UI_UPLIFT_BACKLOG.md).

**Implemented the #1 lever (highest impact-per-risk, reusable, presentation-only):**
- `tokens.css`: an **elevation scale** (`--shadow-sm/-card/-pop`), a **warmed card surface**
  (`--surface-card` = a whisper of top-lit gradient over `--surface`) + `--hairline-top` inset
  highlight; and reconciled the dead radius tokens to honest values (`--radius` 14→16px,
  `--radius-sm` 10→12px, added `--radius-pill`) so they match the shipping `rounded-2xl/-xl`.
- `global.css`: one shared **`.card`** utility (surface gradient + border + 16px radius + card
  shadow + hairline) — no padding/gap, so callers keep controlling spacing. Every screen can
  adopt it in later iterations; it also consolidates ~10 ad-hoc inline shadows.
- Applied to the two most-visible surfaces first: `BusinessCard` (dropped its duplicated inline
  `background`/`border` → `.card`) and `WorkCard` (both the main card and the retired Board-Advisor
  strip). WorkCard's **blue accent border is preserved** via an inline `border` override (wins over
  `.card`) — a deliberate adaptation of the plan so its identity isn't regressed.

**Validation:** `tsc -b` + build clean (supabase still split; CSS 24.0→24.4kB), oxlint clean,
**244 tests green** (unchanged — presentation only). **Browser-verified at 375px** via computed
styles: cards now carry `box-shadow: rgba(0,0,0,0.38) 0 4px 14px + hairline`, a surface gradient,
and 16px radius; **no layout shift** (cards still 351px at left 12, no overflow); WorkCard keeps
its `rgba(106,169,255,0.33)` accent border while BusinessCard uses neutral `--border`; no console
errors. (Screenshot hit the known rAF timeout; computed-style measurement is the definitive proof.)

**Files:** ~`ui/styles/tokens.css`, `ui/styles/global.css`, `ui/business/BusinessCard.tsx`,
`ui/work/WorkCard.tsx`; +`docs/UI_UPLIFT_BACKLOG.md`.

**Next (from the backlog):** frost+elevate the shell chrome (HUD+NavBar), then the typographic
scale — both high-impact reusable levers. Two real bugs also queued: AssignmentSheet's dead
affinity-match border (#4) and a sub-44px Bench button (#29).

---

## Industry identity — Logistics "Just-In-Time Dispatch" (a 4th distinct mechanic)

**Analysed (user-directed):** with the roadmap's buildable list delivered, the user chose (via
an explicit decision prompt) to extend the proven Food/Finance/Quantum "felt mechanic" pattern
to a flat late-tier industry — overriding the reviewer's *defer* on the 5 remaining flat
industries. Picked **Logistics**, whose `just_in_time: speed ×2` was a literal duplicate of
Food's `rush_hour: speed ×2` (the most egregious sameness), and it's a dampened late tier where
players linger (the reviewer's own "prioritise the dampened late tiers" steer).

**Designed a genuinely distinct shape.** The existing three: Food = catch-the-ephemeral-window
(active), Finance = slow passive ramp, Quantum = passive auto-oscillation. Logistics gets the
missing **active bank-and-release timing decision**: cargo "load" accrues while Logistics is
owned (fills over ~2.5 min, caps at 100%); once past 25% the player taps **Dispatch** to release
it for a Logistics **profit** surge (30s) that **scales with how full the load was** (+up to
80%). The decision — dispatch small-and-often vs. bank for a bigger shipment — is new. This also
closes the roadmap's noted gap ("2 of 3 mechanics are passive; only Food is active") by adding a
**2nd active decision**. Keeps the `speed ×2` baseline (Logistics' "lean/fast" identity, per the
reviewer's keep-the-baseline exception); the active layer is a modest, opt-in PROFIT bonus on top.

**Harness byte-identical by construction.** The greedy sim bot never dispatches, so `surgeMsLeft`
stays 0 and `logisticsDispatchProfitMult` is always 1 — Logistics income is unchanged in the sim
(the load meter accrues but is inert until released). The flat perk is untouched. Deterministic,
no RNG. **Confirmed:** `harness.test`/`balance.test`/`progressionLoop.test` all pass unchanged.

**Implemented (finished vertical slice, mirrors the Rush Hour wiring exactly):**
- `engine/logistics.ts` (new, +`logistics.test.ts` 8 cases): `tickLogistics`, `claimDispatch`,
  `canDispatch`, load/surge accessors, load-scaled `dispatchMultAt`.
- Wired: `simulate.ts` tick, `economy.ts` profit fold (Logistics-only, ×1 unless surging),
  `domain.ts` `LogisticsState` (transient), `initialState.ts`, `buildView.ts` `LogisticsView` +
  `useLogistics`, `actions.ts` `dispatchCargo` (haptic + `tap` sound + 🚚 toast).
- UI: an **inline** `LogisticsDispatchCue` on the Logistics business screen (mirrors the
  Finance/Quantum cues, not a 3rd floating button — the load persists, so no urgency): a load bar,
  a Dispatch button (**44px tap target**), and a live "🚀 +N% profit (Ns)" surge countdown.

**Validation:** `tsc -b` + build clean (supabase still split), oxlint clean, **244 tests green**
(+8). **Browser-verified at 375px:** cue renders with no overflow; at 80% load the button reads
"🚚 Dispatch cargo → +64% profit" (1 + 0.8×0.8 ✓) and is enabled; clicking it set the engine
surge (mult 1.765 at ~95% load, load reset to 0) and the cue switched to "🚀 +76% profit (20s)".
No console errors.

**Files:** +`engine/logistics.ts` (+`.test.ts`); ~`types/domain.ts`, `engine/simulate.ts`,
`engine/economy.ts`, `store/initialState.ts`, `store/buildView.ts`, `store/gameStore.ts`,
`store/actions.ts`, `ui/business/BusinessesScreen.tsx`.

**Roadmap status:** 4th distinct industry mechanic; 4 of 8 industries now play differently
(Food/Finance/Quantum/Logistics). Left `roadmap.md` for the reviewer (parallel-session hygiene).

---

## Mobile QA — completed the app-wide 375px tap-target audit (no change warranted)

**Analysed:** the prior tap-target passes covered action buttons on
AssignmentSheet/EmployeesScreen/UpgradesScreen (`da223e9`) and the two overlay dismiss buttons
(`9ecf504`). Two screens had **never** been tap-target audited — **Prestige/Ascend and Stats** —
and those carry real *action* buttons (talent buys, founder-perk picks, contract Claim). Closed
that gap by measuring every visible interactive control on both screens (plus a re-sweep of the
main Business screen) at 375px via DOM `getBoundingClientRect`.

**Result — the app is tap-target-clean under the documented policy:**
- **Business screen:** 22 of 23 controls ≥44px. Prestige/Ascend: **0** undersized. Stats: **0**
  undersized. Combined with `da223e9` + `9ecf504`, **every screen and overlay is now audited.**
- **The lone sub-44px element anywhere is the BusinessCard staff info-chip** (94×30px). Left
  **unchanged, deliberately** — this is the exact case the documented policy from `da223e9`
  excludes ("dense secondary chips left as-is"): it's a compact pill packing 👤count + ⚙️ +
  profit%/speed%/crit%/focus%/synergy, the plan mandates "ONE **compact** staff chip" on the
  card, it carries a full `aria-label` (`938dd54`), and it has larger redundant paths (the Staff
  tab always; the "Assign an Operator" button on manual cards). Forcing 44px would either bloat
  the compact card or create a hit-area overlapping the dense info rows directly below it (★
  milestone / ⏳ affordability) — a usability regression. Flagged here for the reviewer rather
  than changed, since overriding documented design intent is a reviewer call.

**Validation:** verification-only — no code touched, 236 tests still green, build/lint unaffected.
This entry records the completed audit so the thread is closed and the staff-chip decision isn't
re-litigated by a future loop.

**Files:** none (audit + decision log only).

---

## Mobile QA — 375px overlay audit + two sub-44px tap-target fixes

**Analysed:** the reviewer left two overlays flagged for a 375px device check they couldn't
pixel-measure earlier (ascension celebration — roadmap "just a 375px device check when
convenient"; event-card modal — "worth a visible-tab layout check next time the server's up").
The dev server is up, so I discharged that verification rigorously via DOM measurement (more
reliable than the flaky rAF screenshots) at 375×812.

**Findings:**
- **AscensionCelebration** — clean. No horizontal overflow (scrollWidth == 375), card centered
  at 351px with 12px gutters, fits vertically, "Rise again" 56px, even a large "+1.23M Empire
  Tokens" line doesn't overflow (0 overflowing elements).
- **EventCardModal** — otherwise clean (no overflow, card fits, option buttons 68px) **but the
  "Ignore" dismiss button measured 40px tall — under the project's own 44px tap-target minimum**
  (the standard enforced in `da223e9`). Real accessibility miss.
- **Swept the sibling return/decision overlays** for the same pattern: **DailyBonusModal's
  "Later" button had the identical bug** (`text-xs` + no `minHeight` → ~20px). WelcomeBackBanner's
  only button already uses `--tap-lg` (fine); MilestoneCelebration is a toast, not a tap target.

**Fixed (presentation-only):** added `minHeight: 'var(--tap)'` (the 44px token) to both secondary
dismiss buttons — EventCardModal "Ignore" and DailyBonusModal "Later". Primary actions keep
`--tap-lg` (56px); only the under-sized secondaries were bumped to the 44px floor.

**Validation:** oxlint clean, `tsc -b` + build clean (chunks unchanged — supabase still split at
51.79 kB gzip, eager 119.10 kB gzip), **236 tests green** (no logic touched). **Browser-verified
at 375px:** "Ignore" 40 → **44px**, "Later" ~20 → **44px**, every button in all three overlays
now ≥44px, zero horizontal overflow, cards fit vertically.

**Files:** ~`ui/shared/EventCardModal.tsx`, `ui/shared/DailyBonusModal.tsx`.

**Roadmap status:** discharges the reviewer's outstanding 375px checks on both flagged overlays
and closes two real (if small) mobile tap-target regressions in the process. No new system —
mobile-readability polish, exactly the reviewer's "respect mobile portrait readability" bar.

---

## Perf — code-split `@supabase/supabase-js` (mobile D1 first-load win)

**Analysed:** the roadmap's one concrete *buildable* backlog item that isn't padding or new
content. The whole app shipped as a **single 606.67 kB / 170.55 kB-gzip JS chunk** (rolldown
even warned about it). `@supabase/supabase-js` (~50 kB gzip) sat in that eager chunk via the
one static value-import (`createClient`) in `lib/supabase.ts`, imported from `main.tsx`'s
startup graph (`accountStore.init()`) — so **every** player downloaded it, including the
anonymous majority who never configure cloud save. Verified the eager path + the monolithic
chunk with a baseline `npm run build` before touching anything.

**Implemented (finished vertical slice, no behaviour change):** converted the single static
`createClient` value-import into a **lazy `getSupabase(): Promise<SupabaseClient | null>`**
that dynamic-imports the library on first cloud use and memoises the client (one shared auth
instance). Only the *type* import stays static (erased at build). All the synchronous config
exports (`isSupabaseConfigured`, `configError`, `supabaseHost`, `isPublishable`,
`sanitizeAuthHeaders`) stay eager, so the account UI still knows cloud is available (and shows
"Account — Local") without paying for the library. Consumers now `await getSupabase()`:
`save/cloud.ts` (`fetchCloudSave`/`uploadCloudSave` — already async) and `store/accountStore.ts`
(`init` wraps the auth-listener setup in `getSupabase().then(...)` behind a sync
`isSupabaseConfigured` gate; `signUp`/`signIn`/`signOut`/`syncNow`/`reconcile` each await it).
The unconfigured guard changed from `!supabase` (truthiness of the old eager const) to the
equivalent sync `!isSupabaseConfigured || configError`, so semantics are byte-identical.

**Result (measured `npm run build`):** eager JS chunk **606.67 → 404.06 kB** (gzip **170.55 →
119.09 kB, a ~30% cut** to initial download); `@supabase/supabase-js` split into its own
lazily-loaded `dist-*.js` (202.56 kB / **51.79 kB gzip**) that anonymous play never fetches.
The >500 kB chunk-size warning is gone.

**Validation:** `tsc -b` clean (no type errors), oxlint clean, **236 tests green** (unchanged —
no engine/harness touched; the pure `supabase.test.ts` helpers are untouched). Browser-verified
at the dev preview: app boots with **no console errors**, renders fully, "Account — Local"
still shows (sync config gate intact), and no supabase network/console diagnostic fires on the
anonymous path (`getSupabase()` never called).

**Files:** ~`lib/supabase.ts` (lazy `getSupabase`), `save/cloud.ts`, `store/accountStore.ts`.

**Roadmap status:** clears the "Code-split `@supabase/supabase-js`" backlog item (roadmap
Backlog + Known-issues). Left `roadmap.md` for the reviewer (parallel-session hygiene). No new
game system — a strict Pareto perf win serving the mobile-first D1 first-load edge.

---

## Task 6 (feel) — ascension celebration (the last clear feel gap)

**Analysed:** reviewer flagged this as the one remaining clear polish — prestige is the
game's biggest beat but the run reset *quietly* (just toasts + the new prestige sound). A
brief full-screen moment makes the reset feel earned.

**Implemented (finished vertical slice, UI-only):** on a successful ascend the `prestige`
action now fires a full-screen `AscensionCelebration` — "✦ Empire Ascended! · +N Empire
Tokens" with the founder mascot + profit-burst art, a "Rise again" one-tap dismiss (or tap
backdrop). Reuses the Welcome-Back overlay pattern (verified-clean at 375px) + the existing
`prestige` sound + haptic(45) that already fire. New transient `ascension` UI state
(`setAscension`/`dismissAscension`, not persisted); the old "Empire ascended!" toast is
replaced by the modal, while ascension-milestone toasts still ride the queue.

**Validation:** 236 tests (unchanged — presentation only), build + lint clean. **Harness
inert by construction:** the sim calls `prestigeReset` directly, never the action, so
`setAscension` never fires in `harness`/`progressionLoop`. Browser-verified: the celebration
shows "Empire Ascended! · +7 Empire Tokens", "Rise again" dismisses it, no console errors.

**Files:** +`ui/shared/AscensionCelebration.tsx`; ~`store/uiStore.ts`, `store/actions.ts`,
`App.tsx`.

**Roadmap status:** with this, the reviewer's one remaining clear polish is done — the
retention roadmap + all its depth/polish follow-ups are delivered. Everything left in the
backlog (brand glyphs, late-tier industry mechanics, supabase code-split, active-duty XP) is
optional; the real next lever is **live player signal**, beyond this docs loop.

---

## Task 6 (feel) — sound layer (the last feel gap)

**Analysed:** reviewer promoted a restrained SFX layer as the one clearly-missing feel
element (haptics + visual FX exist; the game was silent).

**Implemented (finished vertical slice, no deps):** `lib/sound.ts` — synthesized Web-Audio
tones (zero assets, zero library dep): each sound is a tiny oscillator envelope
(`coin`/`buy`/`chime`/`tap`/`prestige`). Gated on a new persisted `sound` setting **default
OFF (opt-in)** — mobile players often play muted. Unlock-aware: `App` resumes the
`AudioContext` on the first `pointerdown`; `playSound` no-ops silently (no console noise)
before unlock / when unsupported (jsdom, older browsers), and **throttles** on the audio
clock (50 ms) so a mass-buy can't machine-gun blips. Wired only to MEANINGFUL beats (reusing
the existing haptic points) — purchase/upgrade (`buy`), Golden Deal + daily + welcome-back
collect (`coin`), Rush Hour + event-card resolve (`tap`), milestone/industry/fusion/contract
(`chime`), prestige (`prestige`) — never per-cycle income. A Sound toggle sits in Settings
between Haptics and Floating-numbers.

**Validation:** 236 tests (+3: default-off, safe no-op with no AudioContext, toggle
flip+persist), build + lint clean. Engine/harness untouched (UI-only). Browser-verified at
390px: Sound toggle renders default-off, flips on + persists to localStorage; a gesture then
a Buy fires `playSound('buy')` with NO console errors (audio can't be *heard* headless, but
the layer runs clean).

**Files:** +`lib/sound.ts` (+`.test.ts`); ~`store/settingsStore.ts`, `store/actions.ts`,
`App.tsx`, `ui/stats/StatsScreen.tsx`, `ui/shared/WelcomeBackBanner.tsx`.

**Roadmap status:** the retention roadmap (Tasks 1–7) + the D7 streak depth + this sound
layer are all delivered. The game is **retention-feature-complete**; remaining backlog
(ascension celebration, brand glyphs, late-tier industry mechanics, supabase code-split) is
optional. The real next lever is live player signal (out of scope for this docs loop).

---

## D7 depth — daily-streak milestones (turn "I claimed" into "don't break my streak")

**Analysed:** reviewer promoted streak milestones next. The daily streak was a hidden
counter with no payoff; milestone rewards make it a *goal* — the strongest D7 mechanic.

**Implemented (finished vertical slice, harness-safe):** streak milestones at Day 3/7/14/30
(`content/dailyMilestones.ts`), each a one-off on top of the normal daily — reusing existing
systems only (income-scaled cash multiples, or a modest chunk of Empire Tokens; NO new
currency, NO RNG). Because the streak advances by exactly 1 per real day (once-per-day
guarded), a milestone fires exactly when `streak === milestone.day` — **no new persisted
state**, and it re-earns on a fresh streak-run after a break (the break pressure). `claimDaily`
now returns `{ cash, milestone }` and grants the reward; the celebration calls out the
milestone. The streak is now *visible*: a shared `DailyStreakProgress` ("🔥 N-day streak ·
next: {reward} · Day M" + a thin progress bar) on all three daily surfaces (return modal,
merged Welcome-Back section, Stats claim row).

**Validation:** 233 tests (+2: milestone fires at its day w/ cash then tokens; content guard
that milestones ascend + every reward is wired), build + lint clean. **Harness + progressionLoop
byte-identical** ($4.08Qi / 156m; cum 60 at run #6) — player-triggered, bot never claims, so
milestone cash/tokens never leak into the sim's economy. Browser-verified at 390px: card shows
"2-day streak · next: +6× bonus cash · Day 3"; claiming reached Day 3 and paid daily + 6× bonus.

**Files:** +`content/dailyMilestones.ts`, +`ui/shared/DailyStreakProgress.tsx`;
~`engine/daily.ts` (+`.test.ts`), `content/content.test.ts`, `store/{actions,buildView}.ts`,
`ui/shared/{DailyBonusModal,WelcomeBackBanner}.tsx`, `ui/stats/StatsScreen.tsx`.

**Next:** Task 6 feel polish (sound behind the FX toggle / ascension celebration) — the last
incremental track — per the next roadmap review.

---

## UX follow-up — merge the doubled return moment (Welcome-Back + Daily Bonus)

**Analysed:** reviewer's one follow-up after the roadmap delivered — the D7 daily shipped
as a separate `DailyBonusModal` rendered alongside `WelcomeBackBanner`, so a daily cold
return stacked TWO full-screen overlays ("Welcome back, +$X" → then "Daily Bonus"). The
mechanic is right; the *return moment* was doubled. This is the most-hit retention surface.

**Implemented (presentation-only, no mechanic/test change):** ONE return moment. When a
Welcome-Back is showing, the daily bonus folds into it as a "🎁 Daily Bonus · 🔥 Day N"
section and the single button reads "Collect all" — claiming both (offline earnings are
already applied on load; Collect also runs `claimDailyBonus`). The standalone
`DailyBonusModal` now returns null while a Welcome-Back is present, so the two never stack;
it still covers the no-offline case (a new day reached mid-session). Tidied the standalone
copy so the two surfaces read distinctly (dropped its redundant "Welcome back!").

**Validation:** 231 tests (unchanged — presentation only), build + lint clean. Browser-
verified at 390px: both-available → exactly ONE overlay (merged card, "Collect all" grants
cash + stamps the day + dismisses); daily-only (no offline) → the standalone modal still
shows. Harness untouched.

**Files:** ~`ui/shared/WelcomeBackBanner.tsx`, `ui/shared/DailyBonusModal.tsx`.

**Roadmap status:** the full 7-task retention roadmap + this UX follow-up are now delivered.
Remaining is Task 6 (incremental polish) + the optional daily streak-multiplier tuning pass.

---

## Task 7 (D7) — daily return hook (the last untouched retention lever)

**Analysed:** reviewer confirmed D1 reveal-cue done; D7 (a wall-clock return reason) is the
last real lever — all recurring content refreshed on play-time, so nothing pulled a lapsed
player back tomorrow. Built the de-risked spec.

**Implemented (finished vertical slice):** a once-per-real-day **Daily Bonus** worth ~2h of
current idle income (`engine/daily.ts`, reusing `automatedIncomePerSec` so it auto-scales
across prestige tiers). Day-bucketing via a persisted `dailyClaimDay` (local-day index);
`claimDaily(state, now)` takes an explicit `now` so it's unit-testable without real time. A
`dailyStreak` counter tracks consecutive days (shown as "🔥 Day N"); the streak *multiplier*
is the documented fast-follow (shipped flat first per spec). Claim gated on having idle
income (so the reward is meaningful, like Golden Deals). Surfaces: a `DailyBonusModal` on
open (Welcome-Back-style, one-tap Claim + Later), a claim row on the Stats tab, and a nav
badge on Stats (reuses `navBadges`).

**Validation:** 231 tests (+4: day-bucketing, no-claim-without-income, once-per-day +
no-double-claim, streak advance/reset), build + lint clean. **Save-safe:** old saves default
`dailyClaimDay = -1` (claimable next open), `dailyStreak = 0`. **Harness byte-identical**
($4.08Qi / 156m) — player-triggered + the bot never advances wall-clock, so it's inert in
the sims (same class as Golden Deals). Browser-verified: modal shows the reward → Claim
grants cash, sets the day + streak, modal dismisses, not re-claimable same day.

**Anti-abuse:** accepts minor clock-change exploitation (no server); never grants
retroactive/multiple days.

**Files:** +`engine/daily.ts` (+`.test.ts`), +`ui/shared/DailyBonusModal.tsx`;
~`types/domain.ts`, `store/{initialState,actions,buildView,gameStore}.ts`, `save/serialize.ts`,
`ui/stats/StatsScreen.tsx`, `App.tsx`.

**Task 7 (D1 + D7) complete.** Next: streak-multiplier fast-follow, or Task 6 incremental
polish — per the next roadmap review. The original 6-task roadmap + the D1/D7 frontier are
now all shipped.

---

## Task 7 (D1 onboarding) — "new tab" reveal cue

**Analysed:** reviewer pivoted to Task 7 (D1 first-session + D7 daily hook), do D1 first.
Playtested a FRESH-save first 5 minutes on 390px via `__game`: the arc is actually
well-guided — the "👋 New here? Tap Work Shift → buy a business" hint, a clear Work card,
industry tabs with entry costs, only the Business tab shown, then buying Lemonade reveals
the Staff tab and the card shows "▶ RUN STORE" + "💡 Assign an Operator ⚙️ to automate" +
staff chip. The one real gap: when Staff/Upgrades/Ascend **reveal**, the nav gave **no
attention cue** — a new player may not notice a section unlocked ("introduced when
relevant, but not *noticed*").

**Implemented (finished vertical slice):** a freshly-revealed but unvisited tab now pulses
a "new" dot in the nav; opening it clears the dot. New persisted `visitedTabs` (set in
`initialGameState` to `['business']`; `setActiveTab` appends the opened tab). `buildView`
derives `newTabs = revealed && !visited`; `NavBar` renders an `animate-pulse` dot.
**Save-safe:** old saves (no field) default `visitedTabs` to ALL tabs, so an existing
player never sees a false "new" (tested); unknown ids filtered.

**Validation:** 227 tests (+2 serialize: old-save default + unknown-id drop), build + lint
clean. **Harness byte-identical** ($4.08Qi / 156m) — UI/state-only, no economy touch.
Browser-verified on 390px: buying the first business shows "new" dots on Staff + Stats;
tapping Staff clears only its dot.

**Next (Task 7 remainder):** D7 daily return hook — a once-per-real-day claimable using
`Date`-based day-bucketing persisted in the save, harness-safe (bot never advances
wall-clock). Per the next roadmap review.

**Files:** ~`types/domain.ts`, `store/{initialState,actions,buildView,gameStore}.ts`,
`save/serialize.ts` (+`serialize.test.ts`), `ui/shell/NavBar.tsx`.

---

## Task 5 — Business event cards (the active-decision layer)

**Analysed:** reviewer pivoted to Task 5 after the Task 4 slice. Diagnosis: the game's
mechanics are now 2/3 passive — between set-up moments the player mostly watches. Event
cards add the missing recurring "a decision is waiting" hook across all industries.

**Implemented (finished vertical slice):** a periodic **event card** with a genuine
2-option trade-off. `content/eventCards.ts` = a data-driven deck of 4 cards (2
opportunities, 1 crisis, 1 gamble), each option carrying BOUNDED, TRANSIENT effects
(one-off cash priced in seconds of idle income, or a short timed profit/speed multiplier).
`engine/eventCards.ts` drives a DETERMINISTIC cadence (golden.ts tick-counter; the deck
rotates by `nextIndex` like the contract board — no RNG) and applies effects on resolve;
timed buffs fold into `economyMultipliers` (profit/speed) like the Golden-Deal frenzy —
nothing touches the base curve. `EventCardModal` is a dismissible mobile modal (two
full-width option buttons + effect text + Ignore); the idle loop runs behind it. New
transient `EventCardsState` (fresh on load/prestige → no save migration).

**Validation:** 225 tests (+7: cadence/deck-rotation, no-spawn-without-income, auto-decline,
resolve applies cash+timed buff then expires, decline is a no-op; + content.test dead-option
guard), build + lint clean. **Harness byte-identical** ($4.08Qi / 156m / 7 industries) —
harness-safe by construction: the greedy bot never resolves a card (auto-declines), so no
effect ever activates and pacing is unmoved. Browser-verified: "Supply Glut" modal → tap
"Stockpile" → cash cost + ×1.6 profit buff (60s) applied, modal dismissed.

**Files:** +`content/eventCards.ts`, +`engine/eventCards.ts` (+`.test.ts`),
+`ui/shared/EventCardModal.tsx`; ~`types/domain.ts`, `engine/economy.ts`, `engine/simulate.ts`,
`store/{initialState,actions,buildView,gameStore}.ts`, `content/content.test.ts`, `App.tsx`.

**Next:** tune card cadence/effects to taste (playtest), or extend the deck / add
industry-scoped cards; per the next roadmap review (Task 6 polish is the remaining backlog).

---

## Task 4 (industry identity) — Quantum "Superposition" (3rd mechanic; slice complete)

**Analysed:** reviewer confirmed Quantum is the last slice piece — it was still sharing
Space's `moonshot`, so the 8th industry had no identity of its own.

**Implemented (finished vertical slice):** Quantum's `superposition` — profit sits at ×1
but on a DETERMINISTIC cadence "collapses" into a ×9 jackpot for a 7.5s window every 60s
(mean ≈ the old moonshot ×2 → no creep; no RNG). It REPLACES the shared moonshot for
Quantum (`industries.ts` signaturePerkId `moonshot` → `superposition`; Space keeps
moonshot); `industryMultipliers` skips it in the flat 500-owned block, applying the
collapse mult instead. Transient `quantumPhaseMs` oscillator (wraps each cycle in
`applyTick` while Quantum owned; no save migration). A `⚛️ Superposition` cue on the
Quantum tab flips between "stable ×1" and "💥 COLLAPSE ×9". This is the THIRD distinct
mechanic *shape*: Food tap-window (active) · Finance slow ramp (passive-dynamic) ·
Quantum fast oscillation (auto-jackpot).

**Validation:** 218 tests (+3: collapse/stable, Quantum-only fold w/ Space untouched,
mean ≈ its SIGNATURE_PERKS value), build + lint + content.test green. **Harness
byte-identical** ($4.08Qi / 156m / 7 industries) — harness-safe by construction (the bot
never reaches Quantum, entry $10Qi). Browser-verified: cue reads "💥 COLLAPSE ×9" then
"stable ×1".

**Task 4 slice COMPLETE** (Food + Finance + Quantum = three industries, three distinct
felt mechanic shapes). Remaining Task 4 industries (Retail/Tech/Logistics/Energy/Space)
are backlog — the pattern is proven; extend when prioritised.

**Files:** ~`types/domain.ts`, `engine/economy.ts` (+`economy.test.ts`), `engine/simulate.ts`,
`content/industries.ts`, `store/{initialState,buildView,gameStore}.ts`, `ui/business/BusinessesScreen.tsx`.

**Next:** Task 5 (business event cards) or extend Task 4 to more industries — per the
next roadmap review.

---

## Task 4 (industry identity) — Finance "Compound Interest" (2nd mechanic, passive-dynamic)

**Analysed:** reviewer's firm "layer-vs-replace" recommendation — the felt mechanic should
*replace* the flat perk (mean-preserving, no creep), and the second one should be a
*different shape* (passive-dynamic curve) from Food's tap-window.

**Implemented (finished vertical slice):** Finance income now *actually compounds* — a
profit multiplier that ramps ×1.0 → ×2.0 over ~90 min of Finance runtime, then holds
(`financeCompoundMult` in `economy.ts`, deterministic/time-accumulated). It **replaces**
the old flat `compound_interest: ×1.5` perk: `industryMultipliers` skips it in the flat
500-owned block, and the ramp cap is read from `SIGNATURE_PERKS.compound_interest` so the
table stays the source of truth (content.test's dead-perk guard still passes). New
persisted `financeCompoundMs` (accrues in `applyTick` while Finance owned; resets on
prestige; save round-trip + old-save-default tested). A `📈 Compound Interest +X%` cue on
the Finance tab (`BusinessesScreen`) with a ramp bar + "grows the longer Finance runs".

**Validation:** 215 tests (+3: compound ramp/fold + save round-trip), build + lint clean,
content.test green. **Harness measured** (Finance is late, so early landmarks unchanged;
this is a bot-visible boost since it replaces a perk the bot never reached): first business
10s / prestige 156m (was 179m, in-band) / final $4.08Qi (was $2.83Qi). progressionLoop
green — cum tokens at #6 **54 → 60** (Mastery-sink margin *widened*), slope still climbs.
Browser-verified: cue reads "+50% profit" at half-ramp.

**Design note:** the +44% single-run boost overstates real play (players prestige and reset
the compound); the 4h-per-run sim shows ~+30%. Net still ~-35% vs pre-dampener, and the
reviewer frames dampener + differentiation as complementary. Cap/ramp are two constants for
a playtest tune.

**Files:** ~`types/domain.ts`, `engine/economy.ts` (+`economy.test.ts`), `engine/simulate.ts`,
`store/{initialState,buildView,gameStore}.ts`, `save/serialize.ts` (+`serialize.test.ts`),
`ui/business/BusinessesScreen.tsx`.

**Next:** Task 4's third — give Quantum its own signature (stop sharing Space's `moonshot`),
a high-variance deterministic mechanic; harness-safe since the bot never reaches Quantum.

---

## Task 4 (industry identity) — Food "Rush Hour" felt mechanic (engine/depth track)

**Analysed:** roadmap Task 4 flagged "build now" — the 8 industries are 2 reskinned
multipliers that *look* distinct but *play* identically. Reviewer pre-pointed at reusing
`golden.ts`'s deterministic spawn-counter for a Food "rush hour" window.

**Implemented (finished vertical slice):** Food's signature mechanic — a recurring,
tappable **Rush Hour** window on a deterministic cadence (`engine/rushHour.ts`, mirrors
`golden.ts`; no RNG). Tapping starts a 25s **×3 Food speed surge**, folded into
`economyMultipliers` for the Food industry only. New `RushHourState` (transient, like
golden — no save migration), `tickRushHour` in `applyTick`, `claimRush` action,
`RushHourView` + `useRushHour`, and `FloatingRushHour` HUD (mirrors the Golden-Deal
button, stacked one row higher; shows a surge countdown pill). Tap-activated, so the
greedy bot never triggers it.

**Validation:** 213 tests (+5 `rushHour.test.ts`), build + lint clean. **Harness
byte-identical** (first business 10s / prestige 179m / final $2.83Qi / 7 industries —
unchanged), confirming harness-safety; `progressionLoop` Mastery margin intact (cum 54
clears ~50). Browser-verified on dev2: window button → tap → surge → countdown pill, no
console errors.

**Also this session (prior commits):** prestige slope re-tune validation, employee
Mastery spec slot + legibility, mobile polish (prestige collapse, roster grouping), and
the late-game dampener (`722c386`, -55% 10h lifetime, invariant-safe).

**Files:** +`engine/rushHour.ts`, +`engine/rushHour.test.ts`, +`ui/shared/FloatingRushHour.tsx`;
~`types/domain.ts`, `engine/economy.ts`, `engine/simulate.ts`, `store/{initialState,actions,buildView,gameStore}.ts`, `App.tsx`.

**Next:** extend the felt-mechanic pattern to a second industry (Finance compound /
Quantum signature) per Task 4's "2-3 industries" slice. Magnitude of the late-game
dampener still wants a playtest feel-check.

---

## Confirmed root cause + login error polish — Supabase outage

**Root cause confirmed by the user's Supabase status page:** an active incident,
"Project status change failures in multiple regions" (project creation/resize/
restart failing in ap-northeast-2, ap-south-1, eu-north-1). A free-tier project
resume/restart failing during the incident leaves the API/auth edge down → the
0-auth-logs + "Failed to fetch" symptom. **Not a code/config bug** — resolves when
Supabase restores capacity. Code is verified (publishable-key fix + 158 tests).

**Polish (Goal 1 error handling):** `authErrorMessage` (accountStore) now tells the
user, on a network failure, that **Supabase may be temporarily down (check
status.supabase.com)** or the URL/key may be misconfigured, and reassures that
**local progress is saved** — turning a vague failure into an actionable message.
`npm run lint` ✓, `npm run test` ✓ (158), `npm run build` ✓.

---

## Debugging aid — Supabase config self-diagnosis ("Failed to fetch" still seen)

**Context:** after the publishable-key fix, login still showed "Couldn't reach the
sign-in server" on the live site. User's Supabase **Logs** screenshot: **Auth log
type = 0** (the request never reaches GoTrue) while Postgres connections are fine,
**plus** a Supabase platform incident banner ("investigating a technical issue").
So it's either the Supabase incident (transient) or the request hitting the
wrong/blocked URL — both produce a browser-level "Failed to fetch" + zero auth logs.

**Added (self-diagnosis, all safe/small):**
- `src/lib/supabase.ts`: `cleanEnv()` strips accidental surrounding quotes/whitespace
  from both env vars + a trailing slash on the URL (the #1 paste mistake);
  `supabaseUrlError()` (exported, tested) flags a missing / non-https / unparseable
  URL; `configError` + `supabaseHost` exported. Client is created only when the URL
  is valid. Startup `console` diagnostic logs **host + key KIND only** (never the key).
- `src/store/accountStore.ts`: exposes `configError` + `host`.
- `src/ui/account/AccountModal.tsx`: a **Config-problem** view (shows the exact URL
  error) and the **target host** under the sign-in form / account view, so the user
  can confirm which project the build targets.
- `src/lib/supabase.test.ts`: +4 URL-validation cases.

**Commands / results:** `npm run lint` ✓; `npm run test` ✓ **158/28**; `npm run build` ✓.

**Conclusion for the user:** 0 auth logs ⇒ the request isn't reaching Supabase. Check
(1) the Supabase status incident (retry after it clears), (2) `VITE_SUPABASE_URL` is
exactly `https://<ref>.supabase.co` (no quotes/slash) — the modal now shows the host
it's using, (3) project not paused. No code bug indicated by the logs.

---

## Bug fix — Supabase new publishable-key format ("Failed to fetch" on login)

**Problem:** with a new `sb_publishable_…` key, `@supabase/supabase-js` put the
project key in BOTH `apikey` AND `Authorization: Bearer …` on unauthenticated
requests. Publishable keys are not JWTs, so GoTrue rejected the bad bearer →
signup/login failed with "Failed to fetch".

**Fix (smallest safe change — kept supabase-js, no auth/cloud rewrite):**
- `src/lib/supabase.ts`: pass `global.fetch = apiKeySafeFetch`, which calls a pure,
  exported `sanitizeAuthHeaders(headers, key)` that — **only for `sb_publishable_`
  keys** — strips `Authorization` when it equals `Bearer <key>` (anon role then comes
  from the `apikey` header). Real user access tokens (after login) and legacy `eyJ…`
  anon JWTs are left untouched, so cloud-save requests still send
  `Authorization: Bearer <access_token>`. `isPublishable()` helper added. DEV-only
  safe diagnostic logs the key KIND, never the value.
- `src/store/accountStore.ts`: `authErrorMessage()` maps network/fetch failures to a
  clear message + a key-free `console.warn` diagnostic (req 7).
- Docs: `supabase-notes.md` + `deploy-notes.md` clarify — frontend uses the
  **publishable** (`sb_publishable_`) **or** legacy **anon JWT** (`eyJ…`) key;
  **never** a secret/service_role key; publishable keys are sent as `apikey`, never
  as a bearer.

**Files changed**
- `src/lib/supabase.ts`, `src/store/accountStore.ts`, new `src/lib/supabase.test.ts`,
  `supabase-notes.md`, `deploy-notes.md`.

**Commands run / results**
- `npm run lint` ✓; `npm run test` ✓ **154/28** (+5 sanitiser tests); `npm run build` ✓.

**Verified (acceptance criteria)**
- Built a configured client with a fake `sb_publishable_` key + a fetch spy:
  `POST /auth/v1/token?grant_type=password` now sends **`apikey: sb_publishable_…`**
  and **`Authorization: null`** (the `Bearer sb_publishable_…` bug is gone). Unit
  tests confirm access tokens / legacy JWTs are left intact (cloud save after login
  still works). Anonymous local play unaffected (supabase `null` when unconfigured).
  No secret/service_role key anywhere.

---

## Loop (current session) — Iteration 8: post-merge reconciliation + deploy

**Analysed / done**
- Committed remaining empty-state polish (`6d8c839`) and **pushed `main` → `origin/main`** (`07a09b4..6d8c839`) — Vercel auto-deploys the full stack (balance overhaul + cloud save + art + polish). No secrets pushed.
- Verified the merged **Senior Consultant** end-state is fully wired (career.ts logic, `buildView` `consultingValue/Fraction/Full`, WorkCard strip + Collect, `consult()` action, `consultingMs` persisted) and the balance re-tune holds — **build ✓, lint ✓, 149 tests ✓**.
- **Roadmap reconciled** with merged reality: added the balance-overhaul (efficiency-monotonic economy + `balance.test`) and Senior Consultant to implemented features, bumped to 149 tests / 27 files, noted committed+pushed/deployed.

**Files changed**
- `roadmap.md`, `dev-progress.md` (docs only).

**Results / status**
- All three goals complete and **live on Vercel**. Highest-value remaining work is user-side: set `VITE_SUPABASE_*` in Vercel to enable cloud login; delete the OS-locked leftover worktree folder when free.

---

## Direct request — Merge the balance-overhaul worktree into main

**Analysed**
- The `.claude/worktrees/happy-buck-3ad260` worktree held an uncommitted **balance overhaul** ("Target B": income-efficiency monotonicity so a pricier business is never a worse $/s-per-$ deal) + career/Senior-Consultant tuning + WorkCard changes + a new `src/content/balance.test.ts`, built on the old base commit while `main` had moved far ahead.
- Risk assessment: the balance-core files (`businesses.ts`, `industries.ts`, `career.ts`, `economy.ts`, `harness.ts`, `balance.test.ts`) were untouched by my work → clean; overlap only in `buildView.ts`/`WorkCard.tsx`/`domain.ts`/`actions.ts`/`serialize.ts` + some tests.

**Done**
- Committed the worktree's work onto its branch (`3805e20`), then `git merge --no-ff` into `main` → **merged cleanly with ZERO conflicts** (ort 3-way; my feature changes and the balance changes occupied different regions). Merge commit `d38a116`.
- De-registered the worktree (`git worktree remove` + `prune`); leftover folder is OS-locked (OneDrive) but harmless — no longer a git worktree, excluded from vitest.

**Commands run / results**
- `npm run build` ✓; `npm run lint` ✓; `npm run test` ✓ — **149 tests / 27 files** (was 146/26; +`balance.test.ts` with 3 monotonicity invariants). The economy re-tune + new career/consulting code integrate correctly with cloud save / art / polish.

**Known issues / notes**
- Merge is committed locally on `main` (`d38a116`); **not pushed**. The iteration-7 empty-state polish (`Placeholder`/`UpgradesScreen`/`EmployeesScreen`) + these docs remain uncommitted.

---

## Loop (current session) — Iteration 7: empty-state illustrations + commit

**Analysed**
- Working tree is now **committed** (commit `e1c5f23` — cloud save + full art set + polish; 85 files). Baseline 146 tests green. Reviewed the early `state_empty_*` SVGs — they're clean/on-brand (dark `#181b22` + accent shapes), nicer than a bare emoji.

**UI improvements made (Goal 3 — better empty states, using committed art)**
- `Placeholder` now accepts an optional `art` illustration path (renders an `<img>` with reserved 120×90 dims, `aria-hidden`) and falls back to the emoji `icon`.
- **Upgrades** all-owned state uses `state_empty_upgrades.svg`.
- **Staff** empty state now shows `state_empty_staff.svg` above the hire hint.

**Missing art callouts (Goal 2)**
- Two more previously-unused placeholder SVGs (`state_empty_staff/upgrades`) are now wired into empty states. Remaining unused: `state_locked`/`state_unaffordable`, prestige visuals, `ART_UI` glyphs (still intentionally unused — emoji/text reads fine).

**Files changed**
- `src/ui/shared/Placeholder.tsx`, `src/ui/upgrades/UpgradesScreen.tsx`, `src/ui/employees/EmployeesScreen.tsx`.

**Commands run**
- `npm run build` ✓; `npm run lint` ✓; `npm run test` ✓ (146/26).

**Results**
- All green. Verified clean boot + both state SVGs serve `200`. (The empty-state screens are behind progression-gated tabs, so couldn't be reached directly in the prod preview without cash; the `img` addition is trivial + build-validated.)

**Known issues / notes**
- This iteration's 3-file change is **uncommitted** (left for the user to fold into a commit/push, consistent with "commit when asked"). Bundle ~153 kB gzip (Supabase) still deferred for code-split.

**Recommended next action**
- Commit + push this small polish if wanted; otherwise the loop is in optional-polish tail. User-side: push `main` to deploy, provision Supabase for live sync.

---

## Loop (current session) — Iteration 6: art audit refresh + honest status

**Analysed**
- Baseline green (146 tests). Audited remaining unused art after the banner/pattern wiring: confirmed the Hire list already uses `employeeArt(o.templateId)` (portraits shown both in roster and hire list). The only unused assets left are the early **placeholder-grade** set (`states/*`, prestige visuals, `ART_UI` glyphs) — emoji/text reads cleaner than these, so intentionally not wired. Verified nothing in `src` imports the obsolete `artManifest.example.ts`.

**Roadmap / art updates (Goal 2)**
- Updated `art-missing.md`: added a **rendering status** section (icons/portraits/banners/patterns are now all actually displayed, banners/patterns wired this session), plus a **"generated-but-intentionally-unused (placeholder set)"** section and a note that `artManifest.example.ts` is obsolete/removable.
- Updated roadmap latest summary.

**Features / UI**
- None this iteration (deliberate). No high-value, low-risk code change remains that doesn't need user input (commit art / provision Supabase) or a riskier refactor (Supabase code-split, documented as deferred). Avoided manufacturing churn.

**Files changed**
- `art-missing.md`, `dev-progress.md`, `roadmap.md`.

**Commands run**
- `npm run test` ✓ (146/26). No code changed since the banner pass (already build/lint/test green), so the tree stays green.

**Results / status**
- **All three goals substantially complete.** Cloud save (built + reviewed + hardened, env-gated), art (all quality art generated + wired + rendering), UI polish (nav/affordability/buttons/overflow/entry cues/industry banner). Highest-value remaining work is **user-side**: (1) commit + push the untracked `public/assets/**` art so it deploys; (2) provision Supabase + set Vercel env vars to test live sync on a phone.

**Recommended next action**
- Commit the new art + wiring (offered; awaiting go-ahead), then user-side Supabase provisioning. Otherwise the loop is in optional-polish tail.

---

## Direct request — Implement newly-created artwork (industry banners + patterns)

**Analysed**
- Inventoried `git status` untracked art vs `artManifest.ts` registrations vs UI usage. The new generated art = 12 Logistics/Energy/Space **business icons**, 3 **industry icons**, 10 **upgrade icons**, 17 **employee portraits**, 3 **industry banners**, 3 **patterns**.
- Found that icons + portraits were already registered **and rendered** (`businessArt`/`industryArt`/`employeeArt`/upgrade `iconSrc`). But `industryBanner()` / `industryPattern()` were referenced **only by the coverage test** — all 7 industry banners + 7 patterns were generated + registered but **never displayed**. That was the gap.

**Implemented (the unused art → now rendered)**
- New `src/ui/business/IndustryBanner.tsx`: a slim (64px) industry header that shows the active industry's **banner** art with a dark gradient scrim + the industry name (real text) + owned count. Decorative bg is `aria-hidden`; renders nothing if no banner (graceful).
- `BusinessesScreen`: mounts `<IndustryBanner>` after the industry tabs, and wires the industry **pattern** as a faint (`opacity 0.6` × the SVG's baked ~0.1) tiled background behind the "Cost of entry" box (content wrapped in a `relative` layer so text stays on top).

**Files changed**
- Created `src/ui/business/IndustryBanner.tsx`; edited `src/ui/business/BusinessesScreen.tsx`.

**Commands run**
- `npm run build` ✓; `npm run lint` ✓; `npm run test` ✓ (146/26).

**Results**
- All green. Browser-verified: banner renders for Food ("Food & Hospitality", 64px) and updates on industry switch to the **new** art — Space shows `industry_space.svg` + "Space & Frontier" and the entry box shows `pattern_space.svg`. **No console errors, no failed asset requests** (banners/patterns load fine). All 7 industries' banner + pattern art is now actually displayed; icons/portraits confirmed already wired.

**Known issues**
- Untracked art files are not yet committed (Vercel builds from source — they'll deploy once committed/pushed). Bundle size unchanged (art is static `public/` files, not bundled).

---

## Loop (current session) — Iteration 5: Goal 3 UI polish (industry-entry affordance)

**Analysed**
- Baseline green (146 tests). Read `BusinessesScreen` not-owned-industry banner: it showed entry cost + first business + a "earn more capital" line only when unaffordable, with **no positive cue when affordable**.

**Roadmap updates**
- Recorded the entry-affordance cue; remaining polish is genuinely optional now (goals 1–3 substantially complete).

**Missing art callouts (Goal 2)**
- No change — coverage complete; only P2 emoji glyphs remain (intentional).

**UI improvements made (Goal 3, no redesign)**
- **BusinessesScreen** industry-entry banner: when you can afford to enter an unowned industry, it now shows a green **"✓ You can afford to start — buy {firstBusiness} below."** (symmetric with the existing unaffordable "earn more capital" line). Clarifies the key early-game "I can enter this industry now" moment.

**Files changed**
- `src/ui/business/BusinessesScreen.tsx`, `roadmap.md`, `dev-progress.md`.

**Commands run**
- `npm run build` ✓; `npm run lint` ✓; `npm run test` ✓ (146/26).

**Results**
- All green. Clean boot verified (no SW hacking): entry banner renders ("Cost of entry" / "First business" / unaffordable cue at $0). The affordable ✓ branch is a trivial symmetric ternary (`entryAffordable ? … : …`), code-confirmed — couldn't reach cash in the prod preview (no dev bridge; the rAF loop is paused while the preview tab is hidden, and the localStorage-seed trick wedges the SW).

**Known issues**
- Bundle ~153 kB gzip (Supabase) — code-split deferred. Configured cloud paths still need real creds for an on-device test.

**Recommended next action**
- Goals 1–3 are substantially complete. Further changes are optional micro-polish. Highest-value remaining action is **user-side**: provision Supabase + set Vercel env vars to test live login/sync on a phone (`supabase-notes.md` + `deploy-notes.md`).

---

## Loop (current session) — Iteration 4: Goal 3 UI polish (overflow safety)

**Analysed**
- Baseline green (146 tests). Reviewed `Icon.tsx` (already sets `width`/`height` attrs → no layout shift; nothing to do), `UpgradesScreen` (already has an "All upgrades owned" empty state via `Placeholder`), and `TopHUD` (cash + 4 buy-modes + new account pill → crowding risk on narrow phones).

**Roadmap updates**
- Recorded the overflow-safety pass; remaining Goal-3 items unchanged (business-card layout, deeper Work/Career hierarchy, more empty states) for a later loop.

**Missing art callouts (Goal 2)**
- No change — coverage complete (verified iteration 2). Only P2 emoji glyphs remain (intentional).

**UI improvements made (Goal 3, no redesign)**
- **TopHUD overflow safety:** cash column `min-w-0` + `truncate`; right control group `shrink-0`. Prevents the cash readout / buy-modes / account pill from overflowing on small screens.
- **WorkCard** promotion/next line: `flex-wrap` + `gap-x/gap-y` so it wraps gracefully instead of clipping on narrow widths.

**Files changed**
- `src/ui/shell/TopHUD.tsx`, `src/ui/work/WorkCard.tsx`, `roadmap.md`, `dev-progress.md`.

**Commands run**
- `npm run build` ✓; `npm run lint` ✓; `npm run test` ✓ (146/26).

**Results**
- All green. Clean browser verification at **360×740**: header overflow `0`, document overflow `0`, account pill fully on-screen, pill tap height `44px`. (Used `preview_resize` + computed metrics — no localStorage/SW hacking this time, so no preview wedging.)

**Known issues**
- Bundle ~153 kB gzip (Supabase) — code-split deferred. Configured cloud paths still need real creds for an on-device test.

**Recommended next action (iteration 5)**
- Optional further Goal-3 polish (business-card layout around the Run-store button; section-header consistency on Stats/Prestige) — or pause polish: the three goals are now substantially complete. Then provision Supabase + set Vercel env vars for the on-device login/sync test.

---

## Loop (current session) — Iteration 3: Goal 3 UI polish (first pass)

**Analysed**
- Baseline re-validated (146 tests, lint clean). Read the polish targets: `NavBar`, `BuyButton`, `WorkCard`, `IndustryTabs`, and noted the parallel `BusinessCard` "▶ Run store" manual button.

**Roadmap updates**
- Recorded the polish pass + remaining Goal-3 items (iteration 4); art coverage unchanged (complete).

**Missing art callouts (Goal 2)**
- No change this loop — coverage is complete (verified iteration 2 against `artManifest.ts`; coverage test green). `art-missing.md` / `docs/MISSING_ART.md` already reflect the generated ledger. Only P2 emoji glyphs remain (intentional), incl. the new ☁ account pill.

**UI improvements made (Goal 3, no redesign)**
- **NavBar** active tab: subtle `rgba(245,197,24,0.08)` tint + inset top accent bar + bold label (clearer active state; tap target unchanged).
- **IndustryTabs**: entry cost now colored by affordability — green **✓**+cost when affordable, faint when not; locked-out (unowned + unaffordable) chips dimmed; press feedback. Directly addresses "clearer industry entry costs / unaffordable states".
- **BuyButton**: soft accent shadow when affordable + `active:scale-[0.97]` press feedback (stronger buy affordance).
- **WorkCard** shift button: press feedback.

**Files changed**
- `src/ui/shell/NavBar.tsx`, `src/ui/business/IndustryTabs.tsx`, `src/ui/business/BuyButton.tsx`, `src/ui/work/WorkCard.tsx`, `vite.config.ts` (vitest exclude `**/.claude/**`), `roadmap.md`, `dev-progress.md`.

**Commands run**
- `npm run build` ✓; `npm run lint` ✓; `npm run test` ✓ (146/26).

**Results**
- All green. Verified the nav active styling (bg `rgba(245,197,24,0.08)`, inset accent bar) and industry cost colors (unaffordable = faint `rgb(107,114,128)`, active = white) via computed styles on the rendered app. The affordable green-✓ branch is a trivial conditional (`entryAffordable ? '✓' : ''`), confirmed by code (couldn't seed cash on the prod preview — `pagehide` re-save + the service worker fought the localStorage injection and wedged that preview tab; app code is unaffected and CSS-only).

**Known issues**
- Bundle ~153 kB gzip (Supabase) — code-split deferred. Configured cloud paths still need real creds to test on-device. Preview SW can wedge if you hand-clear its caches mid-session (dev-tooling only; no user impact).

**Recommended next action (iteration 4)**
- Continue Goal 3 polish (Work/Career hierarchy, business-card layout around the Run-store button, empty states, account pill spacing), then provision Supabase + set Vercel env vars for the on-device login/sync test.

---

## Loop (current session) — Iteration 2: Goal 1 cloud save implemented

**Analysed**
- Re-ran validation baseline (build ✓, lint ✓, 146 tests ✓).
- Read save layer (`saveManager.ts`, `serialize.ts` envelope `{version,savedAt,state}`), Dialog pattern (`AssignmentSheet`), HUD, uiStore.
- Noted intentional parallel edits: `BusinessCard` now uses a "▶ Run store" manual button; `employeeArt` + `ART_EMPLOYEES` added; **all gameplay art generated + registered** (manifest now covers 27 businesses, 7 industries icon/banner/pattern, 14 upgrades, 7 roles, 17 portraits).

**Roadmap updates**
- Marked cloud save + complete art coverage as implemented; moved bundle-size + "needs real creds to test" into Known issues; replaced the stale Missing-Art gap table with a "coverage complete (P2 emoji only)" table; set next task = Goal 3 UI polish; added the iteration-2 loop summary.

**Missing art callouts** (Goal 2)
- Art is now **complete for all gameplay content** (verified against the updated `artManifest.ts`; coverage test green). `art-missing.md` + `docs/MISSING_ART.md` already reflect the generated ledger (parallel work). Only **P2 emoji** glyphs remain (talents, milestones, specs, contracts, golden, fusion badges, ✦ token, + the new ☁ account pill) — intentional, optional.

**Features implemented (Goal 1 — Supabase login + cloud save, env-gated)**
- `src/lib/supabase.ts` — client built only when `VITE_SUPABASE_*` set; `isSupabaseConfigured`. `src/vite-env.d.ts` types the vars.
- `src/save/cloud.ts` — `fetchCloudSave` / `uploadCloudSave` upsert against `game_saves` (anon key + RLS).
- `src/save/saveManager.ts` — cloud bridge: `snapshotEnvelope`, `readLocalEnvelope`, `applyEnvelope`, `summarizeEnvelope`, `SaveSummary`, + an after-save hook for debounced upload. `serialize.ts` exports `SaveEnvelope`.
- `src/store/accountStore.ts` — auth session (getSession + onAuthStateChange), sign up/in/out, sync status (`local`/`syncing`/`synced`/`error`), debounced upload on autosave (≥25 s gap), and **non-destructive reconcile**: only-local → upload; only-cloud → download; both+differ → conflict chooser; identical → skip; never silent overwrite.
- `src/ui/account/AccountModal.tsx` (login / signed-in / not-configured / **conflict chooser** with timestamps + cash/lifetime) + `src/ui/account/AccountButton.tsx` (HUD ☁ pill + status dot).
- Wired: `uiStore` (accountOpen), `TopHUD` (button), `App` (modal), `main.tsx` (`init()`).

**UI improvements made**
- Added the account/sync status pill to the HUD (part of Goal 3's "sync/account status UI"). Broader polish deferred to iteration 3.

**Files changed / created**
- Created: `src/vite-env.d.ts`, `src/lib/supabase.ts`, `src/save/cloud.ts`, `src/store/accountStore.ts`, `src/ui/account/AccountButton.tsx`, `src/ui/account/AccountModal.tsx`.
- Edited: `src/save/serialize.ts`, `src/save/saveManager.ts`, `src/store/uiStore.ts`, `src/ui/shell/TopHUD.tsx`, `src/App.tsx`, `src/main.tsx`, `package.json`/`package-lock.json` (supabase dep), `roadmap.md`, `dev-progress.md`.

**Commands run**
- `npm install @supabase/supabase-js`; `npm run build` ✓; `npm run lint` ✓; `npm run test` ✓ (146/26).

**Results**
- Build/lint/test all green. Browser-verified the production bundle: clean boot, no console errors, anonymous play intact, account pill shows "Local", account modal shows the friendly not-configured message. Configured login/sync/conflict paths reviewed in code (can't run without real Supabase creds).

**Known issues**
- Bundle ~539 kB raw / ~153 kB gzip (Supabase) — code-split deferred. Configured cloud paths untested locally (no creds). Employee complexity still exceeds MVP rule (documented; not expanding).

**Post-implementation adversarial review (subagent) + fixes**
- Review verdict: secret handling, anonymous-play safety, no-silent-overwrite, and data-integrity all sound; 3 SHOULD-FIX items, no blockers. Applied all:
  1. **Overlapping reconcile guard** — `getSession` + `onAuthStateChange` (and token-refresh events) could double-run `reconcile()`; added a `reconciling` in-flight flag + per-user `reconciledUserId` dedupe (reset on signout/error), and `reconcile(userId)` now takes the id explicitly.
  2. **`applyEnvelope` `false` now handled** on both cloud-load paths (reconcile cloud-only + resolveConflict 'cloud') → sets `status:'error'` instead of falsely reporting "Synced" while keeping stale local state.
  3. **`signUp` feedback** — when email-confirmation is on (`data.user && !data.session`), surfaces "check your email" via new `authNotice`; rendered in the modal; auth messages clear on input edit; signout resets the upload throttle.
- **Repo-hygiene fix:** a parallel agent's git worktree (`.claude/worktrees/happy-buck-3ad260/`) was doubling the vitest suite (52 files / 292 tests). Added a vitest `exclude` for `**/.claude/**` in `vite.config.ts` (now imports `defineConfig` from `vitest/config`) → back to **26 files / 146 tests**. Build unaffected.
- Re-validated: **build ✓, lint ✓, 146 tests ✓**; anonymous boot re-verified clean (no console errors, "Local" pill).

**Recommended next action (iteration 3)**
- Goal 3 mobile-first UI polish (Work/Career card → industry entry costs/unaffordable → business card/buy button → nav/empty states), no redesign. Then provision Supabase + set Vercel env vars to test login/sync on a phone.

---

## Loop (current session) — Iteration 1: docs + Goal-1 foundation (no runtime change)

**Analysed**
- Repo + `package.json` scripts: `dev`, `build` (`tsc -b && vite build`), `lint` (oxlint), `preview`, `test` (vitest). No `typecheck` script (tsc runs in build).
- Existing docs found: `README.md`, `deploy-notes.md`, `docs/MISSING_ART.md`, and a pre-existing **stale** `art-plan.md`. No `roadmap.md` / `dev-progress.md` / `art-missing.md` yet.
- Art coverage: `artManifest.ts` vs content catalogs vs `public/assets/` (see callouts).

**Validation (baseline, before changes)**
- `npm run build` → ✅ pass (`dist/` generated; JS ~322 kB / ~98 kB gzip).
- `npm run lint` (oxlint) → ✅ no errors.
- `npm run test` (vitest) → ✅ 146 tests / 26 files.

**Roadmap updates**
- Created `roadmap.md` with implemented features, known issues, **Missing Art / Placeholder Audit**, next highest-value task, deferred ideas, latest loop summary.
- Flagged a known divergence: employee systems already exceed the "4 roles only / no M4b" MVP rule (shipped in prior loops; core loop is stable) — documented as intentional pre-existing state; not expanding further while on Goals 1–3.

**Missing art callouts** (Goal 2 — complete this iteration)
- Created `art-missing.md`: P0 = 3 industry icons + 12 Logistics/Energy/Space business icons (currently emoji/fallback); P1 = 6 industry banners/patterns, 10 unauthored upgrade icons, 17 employee portraits; P2 = depth-system emoji (fine).
- **No referenced-but-missing asset ids** — coverage test (`artManifest.test.ts`) is green.
- Updated stale `art-plan.md` non-destructively with a current-status banner (kept its house-style guide + prompt pack).

**Features implemented**
- None at runtime (deliberate). Goal-1 **foundation** only:
  - `supabase-notes.md` — `game_saves` table SQL, RLS policies, anon-key-only guidance, conflict strategy.
  - `.env.example` — `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` placeholders.
  - `.gitignore` — ignore `.env` / `.env.*`, keep `.env.example` tracked (prevents committing secrets).

**UI improvements made**
- None this iteration (Goal 3 scheduled after Goal 1 code lands).

**Files changed / created**
- Created: `roadmap.md`, `dev-progress.md`, `art-missing.md`, `supabase-notes.md`, `.env.example`.
- Updated: `.gitignore` (env-ignore block), `art-plan.md` (stale-status banner), `deploy-notes.md` (Supabase env-var section).

**Commands run**
- `npm run build`, `npm run lint`, `npm run test` (all green, see baseline above).

**Results**
- All validation green; no code touched, so anonymous local play is unaffected and the app remains deployable as-is.

**Known issues**
- Cloud save not yet wired (Goal 1 code is next). Art gaps per audit (non-blocking). Employee complexity exceeds MVP rule (documented, not expanding).

**Recommended next action (iteration 2)**
- Implement Supabase code, env-gated: `src/lib/supabase.ts` + `isSupabaseConfigured`, auth state, minimal account modal (email+password, logout, sync-status indicator), cloud upload/download against `game_saves`, and the local-vs-cloud conflict chooser. Re-run build/lint/test. Verify anonymous play still works when env vars are absent.
