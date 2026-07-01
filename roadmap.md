# Tycoon Empire — Roadmap

Living roadmap, updated at the start of each development loop. Mobile-first
idle/incremental tycoon game (React + TypeScript + Vite), live on Vercel.

**Core flow:** Work shifts → wages → promotions → save capital → buy businesses
→ choose industry paths → hire employees → automate → prestige → spend Empire
Tokens → run again, faster.

> Reviewer-maintained. The main dev session builds from the **Prioritised retention
> roadmap** + **Acceptance criteria** below. Full loop-by-loop history lives in
> [`dev-progress.md`](dev-progress.md).

---

## Current state (verified this pass)

- **231 tests / 35 files green** (`npx vitest run`, verified this pass), oxlint clean, production build boots.
- **On-device playtest ✅ (this pass, dev server + `__game` bridge @ 375px):** the game boots clean (no console errors) and all **3 industry mechanics render legible mobile cues with no overflow** — 🍔 Rush Hour (tappable 238×53px), 📈 Compound Interest (+50% at mid-ramp), ⚛️ Superposition (💥 ×9 spike). Industry differentiation is real and *visible*, not just on paper.
- Deployed static on Vercel; committed + pushed to `origin/main` (`kaosjammo/work-to-mogul`), auto-deploys. A **parallel Claude dev session also commits here** — fetch/rebase and stage only your own files before pushing.
- **Prestige economy converged (`c038473` → `673dbdc` → `748d3c1`):** the token yield went sqrt (exploded, 1.48B overnight) → fifth-root `0.2` (over-corrected, flat loop) → **`0.26` + ~2× talent strength** (the measured middle ground). The harness now shows run output climbing run-over-run and the Mastery sink reachable, with no blowup (see the balance-pass section). **The prestige balance question is resolved.**
- **Late-game pacing dampener — landed (`722c386`, `economy.ts`):** a runtime profit multiplier (`lateGameDampen`, ×0.85 compounding from tier 3 / Logistics onward) that slows the mid/late game per a "slow it down significantly" steer. Cleanly layered on top (base curve untouched, so `balance.test` monotonicity holds). **Verified harness-safe this pass:** first-run landmarks still in-band (7 industries, prestige unlock ~3h) and the prestige slope still climbs ($10.2Qi at run #6, no plateau) with the Mastery sink still reachable; full suite green at 208. ⚠️ But it shrank the token margin over that sink (cum 67 → 54 at #6) — see Risks.

**What exists (inventory — do not re-build):**

- **Core loop & economy:** Work/Career early game (6 levels) → Senior Consultant retirement end-state; 32 businesses / 8 industries, geometric cost, Buy x1/x10/x100/Max, per-business milestones to 2000 owned; income-efficiency **monotonicity invariant** guarded by `balance.test.ts`; 10 Hz fixed-timestep engine; offline catch-up (cap 2h).
- **Employees:** 7 roles, 4 rarities, levels to 10, industry affinity, slot assignment + Auto-Assign Best, morale/risk/crit/traits, named synergies, L5 specialisations, fusion/promotion.
- **Meta:** Prestige → Empire Tokens; **20-talent tree** (incl. 3 deep rank-50 "Mastery" sinks); 10 ascension milestones; 25-contract rotating board; 30 achievements (token-rewarding); 34 upgrades; Golden Deals / MEGA jackpots / Time-Warp / Profit Rush.
- **Legibility/feel:** ⭐ best-ROI cue, ⏳ time-to-afford countdowns, `Next ✦ at $X` prestige cue, floating "+$" pops + haptics, reactive mascot, celebration toasts, nav badges, Settings (FX/haptics toggles), Stats tab.
- **Platform:** versioned localStorage save + migrate hook; env-gated Supabase cloud save + accounts; complete gameplay art coverage; PWA (manifest + service worker).
- **Art created this pass:** filled the real manifest gaps introduced by the endgame expansion: Quantum Frontier icon/banner/pattern, Dyson Sphere + Quantum business icons, 20 expanded-upgrade icons, and the Zeta Quark portrait. `artManifest.test.ts` now fails on future business/industry/upgrade/employee art gaps instead of only logging them.

**Known issues / notes**

- Employee systems already exceed the old "4 roles only" MVP rule — intentional pre-existing state, stable. Don't *add* roles; **do** deepen the existing ones (see Task 3).
- Cloud save needs real Supabase creds for an on-device test (code verified, env-gated, anonymous play unaffected). `@supabase/supabase-js` adds ~153 kB gzip — deferred code-split.
- No standalone `typecheck` script; `tsc -b` runs inside `npm run build`. Art coverage complete for 32 businesses / 8 industries / 34 upgrades / 18 employee portraits; only optional P2 emoji depth-glyphs remain.

---

## Retention diagnosis (what's actually limiting D1/D7)

All six core systems are now built. The **mid-to-late game is deep, differentiated, and
decision-rich** — the earlier gaps are closed:

1. ✅ **Prestige loop** — rewarding (slope re-tune `748d3c1`) *and* varied (founder perks `79ecc94`), harness-guarded.
2. ✅ **Employees** — the L10 "which two?" spec build is a real ongoing choice (`3b2daf4`).
3. ✅ **Industry identity** — 3-mechanic slice (Food/Finance/Quantum) *plays* differently, playtested on-device (`ffc8fe5`/`f09ef29`/`5cea210`).
4. ✅ **Active decisions** — event cards add a recurring "a decision is waiting" beat across all industries (`6d5c394`).

**The gap has moved from *depth* to the *edges of the session* — D1 and D7:**
- **D1 (first session): solid now.** Clear first-moment hint (tap Work Shift → buy a business), a staged tab reveal (Staff/Stats after the 1st business, Upgrades at $10k, Ascend at prestige), and — new this iteration — a "new" pulse dot so those reveals get *noticed* (`aa4e2b5`). The onboarding arc is guided end-to-end.
- **D7 (return reason): built + polished (`2ceff30` + `8e0a762`).** A once-per-real-day Daily Bonus (~2h idle income) with a "🔥 Day N" streak, folded into a single clean return moment. Gives a wall-clock reason to return. **The one thing that would deepen it: streak *milestones* (Day 7/30 rewards)** so the streak is a goal, not just a multiplier (see Next task).

Diagnosis in one line: **every retention lever the roadmap set out to build now exists and is
polished — depth (prestige/employees), identity (industries), active decisions (events),
onboarding (D1), a daily return reason (D7). The only *net-new* retention gain left is streak
milestones (make the daily a goal); everything else is incremental feel (Task 6).**

---

## Prioritised retention roadmap

| # | Task | Why it matters for retention | Status |
|---|---|---|---|
| **1** | **Progression harness v2 ✅ + prestige *slope* balance pass ✅** | Harness (`673dbdc`) + slope re-tune (`748d3c1`) fixed the flat loop — run output now climbs run-over-run, Mastery sink reachable | **✅ DONE** |
| **2** | **Prestige v1: founder perk choices** | Gives each ascension divergent flavour → reason to start run #2, #3… (the core idle retention loop) | **✅ DONE** (`79ecc94`; harness-wiring closed `8e91e5d`) |
| **3** | **Employee depth v2: spec-fork build decision** | Turns the signature mechanic from "hire & forget" into ongoing choices | **✅ DONE** (`3b2daf4`, 206 tests) — active-duty XP deferred to 3b |
| **4** | **Stronger industry identity / unique mechanics** | Differentiates the mid-late game beyond numbers | **✅ SLICE DONE** — Food (`ffc8fe5`) + Finance (`f09ef29`) + Quantum (`5cea210`), all cued; 5 flat industries deferred |
| **5** | **Business event cards (opportunities / crises / choices)** | Active-play decision beats between idle stretches | **✅ DONE** (`6d5c394`, 225 tests) — 4 trade-off cards, deterministic, harness byte-identical, modal playtested |
| 6 | Mobile polish, art callouts, celebrations, sound/haptics | Feel — already strong; diminishing returns | Incremental (ongoing) |
| **7** | **Daily return hook (D7) + D1 onboarding** | The whole session arc now has hooks: D1 reveal-cue (`aa4e2b5`) + D7 daily bonus w/ streak (`2ceff30`) | **✅ DONE** (231 tests) — ⚠️ daily + welcome-back are two stacked modals; merge (next task below) |

**The original 6-task roadmap is essentially complete** (1–5 done, 6 is ongoing polish).
Do **not** add a 9th industry / raw content tier. The next retention gains are D1/D7, not
more mid-game systems — see the new "Next highest-value task".

---

## Task 1 ✅ DONE — Progression harness v2 (`673dbdc`)

`harness.ts` now has `simulateProgression()` + `progressionLoop.test.ts`: drives the
greedy bot through 6 ascensions (4h/run), banks tokens, spends them cheapest-rank-first
on the base tree, and asserts the meta-economy stays sane. **It validated the fifth-root
cut — run #1 banks 1 token, no ascension explodes** (the 1.48B-overnight class of bug is
now a CI guard). It also exposed the *opposite* problem — the new top priority below.

---

## Prestige slope balance pass ✅ DONE (`748d3c1`)

The re-tune landed and the harness confirms it fixed the flat loop.
Levers: `PRESTIGE_YIELD_EXP` 0.2 → **0.26** + base talent profit effects ~doubled
(Magnate 0.12 → 0.25, etc.). Before → after, same sim (`npx vitest run progressionLoop`):

| run | before (flat) | after (re-tuned) |
|---|---|---|
| #1 | $2.43Qa · cum 1 · 22% | $2.43Qa · cum 1 · 22% |
| #3 | $6.51Qi · cum 10 · 33% | **$13.1Qi · cum 23 · 37%** |
| #6 | $7.06Qi · cum 26 · 41% | **$24.2Qi · cum 67 · 50%** |

Achieved: run lifetime now **climbs run-over-run** (no plateau — #6 ≈ 4.7× #2 in the same
wall-clock), yield grows to +16/run, the **Mastery sink is reachable** (cum 67 > ~50), and
run #1 still banks 1 token (no blowup; steps +10/+12/+13/+15/+16 are smooth). Hits the
target band; base tree at 50% by #6 (vs the 60–80% goal — fine, a genuine journey).
**Both halves of Task 1 are now done** (`748d3c1` re-baselined `progressionLoop.test.ts`).

Follow-ups — both now ✅: the harness-perk gap is closed (`8e91e5d` makes
`simulateProgression` pick a Founder Perk each ascension + adds re-measured assertions),
and `progressionLoop.test.ts` bounds are re-baselined to the new band. Task 1 is fully
sealed.

---

## Task 3 ✅ DONE — Employee depth v2 (spec-fork slice) (`3b2daf4` + `963f586`)

The dev shipped the *specialisation-fork* slice and met every acceptance criterion: a
**second spec slot at level 10** (`specialisation2`) so an employee holds two of its role's
three specs — a genuine "which two?" build decision whose **leftover spec is the real
opportunity cost**, making levels 6–10 a goal and letting same-role employees diverge. Plus
per-role **Mastery capstones**. Shipped *with* `specialisations.test.ts` (+52, the slot-2
guard), `serialize.ts` save migration, and the `EmployeesScreen.tsx` two-slot picker. Full
suite green at **206**. The roster label now reflects an employee's full build (`963f586`).

**Remaining (deferred, not blocking):** active-duty XP — use-based levels distinct from
cash-bought levels (the "stay attached to *this* employee" hook). **Demoted to optional
(Task 3b in backlog):** employees already carry three progression axes (cash-levels +
2 specs + capstone); a 4th risks bloat for a system that already exceeds the original MVP
rule. Only add it if a *cheap* attachment hook is wanted — differentiating the industries
(below) is the higher-value retention lever now.

---

## Task 4 ✅ SLICE DONE — Industry identity & unique mechanics

**Original finding — the 8 industries were not meaningfully differentiated.**
Their flavourful "signature perks" are really just **two multipliers reskinned**
(`SIGNATURE_PERKS` in `economy.ts`):

| perk | effect | industries |
|---|---|---|
| `rush_hour`, `just_in_time` | **speed ×2** | Food, Logistics (identical) |
| `franchise`, `compound_interest`, `grid_surge` | **profit ×1.5** | Retail, Finance, Energy (identical) |
| `network_effect` | profit ×1.25 | Tech |
| `moonshot` | profit ×2 | **Space *and* Quantum (shared — Quantum has no identity of its own)** |

So Finance doesn't *compound*, Space/Quantum aren't *volatile*, "rush hour" isn't a
*window* — they're flat passive bonuses with evocative names. This is the top remaining
"same-but-numbers" flatness (the loop directive's bar: *don't expand content unless
existing systems feel meaningfully different* — these don't). Replacing two of these with a
**felt mechanic** is higher replayability value than any new content.

**Why now (the dampener raises this):** the late-game dampener (`722c386`) deliberately
makes players **linger longer** in tiers 3+ (Logistics → Energy → Space → Quantum) — which
are exactly the interchangeable industries. Slowing the climb buys engagement time, but a
*longer* climb through samey content is a churn risk, not a win. So the dampener and Task 4
are complementary: the slowdown only pays off in retention if the industries you now dwell
in feel genuinely different. Differentiate **before** slowing further.

**✅ Shipped (`ffc8fe5`): Food "Rush Hour" — the first felt mechanic.** Design review —
strong, exactly to spec: `rushHour.ts` opens a 12s **tappable window** every ~3 min that
grants a 25s **×3 Food speed surge**, on the deterministic `golden.ts` tick-counter cadence
(no RNG), with `FloatingRushHour.tsx` as the countdown cue. State is transient (not
persisted → no save migration). Harness-safe by construction (the bot never claims, so
`surgeMsLeft` stays 0 and first-run landmarks don't move); 14 tests green across
rushHour/harness/balance.

**⚠️ Balance + design call — reviewer recommendation.** The Rush Hour surge **stacks on**
Food's passive `rush_hour: speed ×2` (still in `SIGNATURE_PERKS`), so a claimed window =
**×6 Food speed** for 25s. Bounded/opt-in, so fine for Food. But for the rest, **recommend:
the felt mechanic *replaces* the flat perk, tuned so its *average* value ≈ the old
multiplier** — e.g. Finance's `compound_interest` becomes a profit that ramps ~×1.0→×2.0 the
longer it runs (mean ≈ the old flat ×1.5), *not* a new bonus on top of ×1.5. Why replace:
(a) no power creep compounding across 8 industries; (b) `balance.test` monotonicity is
trivially safe if the mean is preserved; (c) the perk table stays meaningful instead of
vestigial. **Exception — keep-the-baseline:** where the flat perk *is* the identity (Food's
"fast-cycle" ×2), layer the active bonus on top but keep it modest, so idle players still
get the baseline and active players get the spike. Apply this rule consistently.

**Finance "Compound Interest" ✅ DONE (`f09ef29`) — with the cue.** The dev took the
`replace-and-preserve-mean` recommendation exactly: `financeCompoundMult` ramps profit
**1.0 → ×2 over ~90 min of Finance runtime** (mean ≈ the old flat ×1.5, cap read from
`SIGNATURE_PERKS`), **replaces** the flat perk, accrues only while Finance is owned, is
persisted + resets on prestige, deterministic — a genuinely *different shape* from Food's
tap-window. **And they closed the legibility gap I flagged**: a `FinanceCompoundCue`
("📈 Compound Interest" + live %) on the Business screen, driven by `buildView.financeCompound`.
Shipped with mechanic + save-migration tests; full suite green at **215**. Two mechanic
shapes (active window, passive ramp) now proven, both visible.

**3-mechanic slice ✅ COMPLETE** — three distinct industry *feels*, all deterministic,
mean-preserving, cued, and tested (218 green):
- [x] **Food "Rush Hour"** — active tap window on speed (`FloatingRushHour`). ✅ (`ffc8fe5`).
- [x] **Finance "Compound Interest"** — passive profit ramp (`FinanceCompoundCue`). ✅ (`f09ef29`).
- [x] **Quantum "Superposition"** — deterministic collapse *spike* on profit, its own signature (Space keeps `moonshot`), `QuantumSuperpositionCue`. ✅ (`5cea210`).

*Note:* Quantum shipped **passive** (auto-collapse on a deterministic cadence), not the
tap-to-lock decision I floated — fine for an ultra-endgame idle industry. But it means **2 of
3 mechanics are passive; only Food adds an active decision.** That gap is the cleanest bridge
to the next task (below).

**Deferred within Task 4 (do NOT grind out now):** 5 industries (Retail, Tech, Logistics,
Energy, Space) still have flat perks. The slice already breaks the "same-but-numbers"
flatness meaningfully; more bespoke per-industry mechanics are diminishing returns + more
balance/UI surface. Backlog it — and if a device playtest shows the mid/late game still feels
flat, prioritise the **dampened late tiers** (Logistics→Space) since that's where players
linger, not early Retail/Tech.

---

## Task 5 ✅ DONE — Business event cards (`6d5c394`)

The active-decision layer shipped to spec: **4 cards** (Supply Glut, Investor Offer, Surprise
Audit, Viral Moment — opportunity/crisis/gamble/trade), on a deterministic 5-min cadence
(golden.ts tick-counter + `nextIndex` deck rotation, **no RNG**), gated on `automatedIncome > 0`
(no decision offered before there's income worth deciding over), bounded transient effects
layered on top (base curve untouched), data-driven `eventCards.ts` + a `content.test` guard,
and an `EventCardModal`. **Harness byte-identical** (the dev verified $4.08Qi / 156m / 7
industries unchanged); suite green at **225**.

**Modal playtested on-device (dev bridge):** forcing `supply_glut` renders "Supply Glut ·
OPPORTUNITY · 15s" with flavor + two genuine trade-off options — *Stockpile* (pay 30s income
→ +60% profit 60s) vs *Sell* (+40s income → −30% speed 60s), no dominant pick. Clicking
Stockpile applied `profitMult 1.6` for 60s and cleared the offer. ✅ (Couldn't pixel-measure
the modal at 375px — the preview tab went `hidden` (0×0 viewport) mid-session — but content +
resolution are correct and the layout is `w-full` buttons in a `max-w-sm` card. Worth a
visible-tab layout check next time the server's up.)

---

## Task 7 ✅ DONE — Onboarding (D1) + daily return hook (D7)

**The 6-task roadmap is essentially built** (1–5 done; 6 is ongoing polish). The remaining
retention frontier is the *edges of the session* — D1 and D7. **Onboarding audit this pass
(code-level; a fresh-save live run was blocked by the hidden-preview-tab reload issue):**

**D1 onboarding is in better shape than assumed — mostly done:**
- ✅ **First-moment hint** (`BusinessesScreen.tsx`): before the first business, "👋 New here? Tap **Work Shift** below to earn your first cash, then buy a business" — clear, actionable, auto-dismisses. Starts broke ($0), Work is the obvious first action.
- ✅ **Staged tab reveal** (`buildView.ts` `revealedTabs`): Business always; **Staff + Stats** appear after the 1st business; **Upgrades** at $10k lifetime; **Ascend** at prestige-unlock. Genuine progressive disclosure — not dumped at once.
- ✅ Food is the tuned onboarding industry (lower gates); harness confirms 1st business <2 min, 2nd <5 min.
- ⚠️ **The gap:** the *first* beat is hinted, but the **subsequent staged reveals are silent** — when Staff/Upgrades/Ascend tabs appear, nothing tells the player *why* to tap them. A new tab quietly appearing is easy to miss.

**D7 is a true zero — the bigger lever.** All recurring content (contracts, golden deals,
event cards) refreshes on **play-time**, not wall-clock, so **nothing pulls a lapsed player
back tomorrow.** No daily hook exists at all.

**Acceptance criteria**
- [x] **D1 — reveal cue ✅ DONE (`aa4e2b5`).** A newly-revealed-but-unvisited tab pulses a "new" dot in the nav; opening it clears it (persisted `visitedTabs`, save-migrated so veterans see no false "new", tested + browser-verified at 390px). A lighter touch than a per-reveal hint, but it works alongside the existing card guidance ("💡 Assign an Operator to automate"). D1 onboarding is now solid end-to-end.
- [x] **D7 — daily return hook ✅ DONE (`2ceff30`).** A once-per-real-day **Daily Bonus** worth ~2h of idle income (offline-value math, so it scales across prestige tiers), a `dailyStreak` "🔥 Day N" counter with a streak multiplier, `dailyClaimDay` local-day bucketing, `claimDaily(state, now)` with the `now` param (unit-testable), save-migrated (old saves → claimable next open), **harness byte-identical**. 231 tests. Followed the de-risking spec on reward/streak/testability/harness — **all met except the modal integration** (see follow-up).

**Task 7 complete → the whole roadmap (1–7) is delivered.** One concrete UX follow-up and
Task 6 remain; both are polish, not new systems.

## Return-moment merge ✅ DONE (`8e0a762`)

Fixed cleanly: `WelcomeBackBanner` now **folds the daily bonus in** as a distinct gold
"🎁 Daily Bonus · 🔥 Day N +$X" section, and Collect becomes **"Collect all"** (claims offline
+ daily in one tap); `DailyBonusModal` gates on `if (welcomeBack) return null` so it only shows
standalone (no automated income to catch up) — **never two stacked overlays**. One satisfying
return beat. 231 tests (presentation-only).

---

## Task: Streak long-term payoff (D7 depth) — 🔨 in progress (uncommitted)

**Design review of the WIP — strong and to-spec.** `dailyMilestones.ts` adds **4 milestones
(Day 3/7/14/30)** mixing income-scaled cash (6× / 40× the daily) and modest Empire Tokens
(3 / 12) — **no new currency, no RNG**, with `nextMilestone`/`prevMilestoneDay` helpers for a
progress cue. Granted inside `claimDaily(state, now)` (player-triggered).

**Status of the acceptance criteria**
- [x] Milestone rewards at Day 3/7/14/30, reusing cash + Empire Tokens (no new currency). ✅
- [x] **No double-grant, cleanly** — fires only when `dailyStreak` *exactly* equals a milestone day, and `claimDaily` stamps `dailyClaimDay` (once per real day). No separate claimed-set needed — a simpler correct approach than I suggested. Re-earns on a fresh streak after a break (intended).
- [x] **Harness-safe** — the token/cash grant is inside `claimDaily`, which only the *player* calls; the bot never claims dailies → `harness`/`progressionLoop` untouched (same class as Golden Deals). ✅
- [x] **Balance-aware** — token amounts sized "so the daily can't out-earn a prestige run's yield" (≈3 tokens/week ceiling even farming break-rebuild) — doesn't undermine the tuned prestige economy. Good instinct.
- [ ] ⚠️ **Add a milestone test before commit** — `daily.test.ts` has none yet. Cover: a milestone fires at exactly its day; a token milestone adds to `prestige.totalPoints`; a cash milestone adds N× the daily; re-earn after a streak break; no fire on non-milestone days.
- [ ] **Visible progress cue** — `buildView.ts` is in the change set; confirm the daily card shows "🔥 Day 3 · next reward at Day 7" + a thin progress bar (the helpers exist for it). Verify at 375px.

Scope guard holding: 4 milestones, existing reward types, no new currency. Good.

**Then → Task 6 feel polish** (the last open, incremental track): a **sound layer** behind the
FX toggle (biggest remaining feel gap), an **ascension celebration**, brand glyphs. Not blocking.

*Balance watch carried forward:* Quantum's ×9 collapse flash is dramatic (mean is
test-guarded) — keep an eye it reads as a signature, not a slot machine.

---

## Task 2 ✅ DONE (`79ecc94`, harness-wiring `8e91e5d`): Prestige v1 — founder perk choices

On ascend the player picks 1 of N founder perks that re-flavour the whole run (not just
+stats). **Design review of the shipped work (197 tests green) — it's good:**
`founderPerks.ts` ships
4 *divergent trade-offs* — Industrialist (×1.5 profit / ×0.78 speed), Sprinter (×1.6
speed / ×0.8 profit), Speculator (×2 Golden / ×0.9 profit), Homebody (×2 offline / ×0.92
profit) — each with a real downside, data-driven (`FOUNDER_PERKS` + `FOUNDER_PERK_ORDER`),
with a `founderPerks.test.ts` guard. That matches the spec well.

**Status of the acceptance criteria**
- [x] Pick 1 of N *divergent* perks, each with a downside so the choice is real.
- [x] Data-driven table + a wired-effect test guard (no dead-perk repeat).
- [ ] **Confirm per-run lifecycle:** the perk persists for the run, shows in HUD/Stats, and is **re-chosen each ascension** (wiped on reset) — verify in `prestige.ts`/`actions.ts`.
- [ ] **Save migration:** existing saves load with **no perk** (neutral) until their next ascension; add a regression test (the diff touches `serialize.ts`/`initialState.ts`/`domain.ts` — make sure old saves don't crash).
- [ ] **Wire perks into `simulateProgression` (low-impact fidelity, still do it).** `harness.ts` doesn't pick a perk, so the prestige-loop sim measures the economy without the perk every player has. Downgraded from critical: perks are net ~neutral, so the slope re-tune (done without it) isn't materially distorted. Add a round-robin perk pick when convenient so the guard reflects real play.
- [ ] **Mobile:** the ascend confirm flow shows the perks with one-line effect text, one-tap choose, at 375px / 44px targets.

> **Coordination note (reviewer):** perks are landing *before* the slope re-tune, and
> they're **net-sideways trade-offs** (≈ +15–28% net value each) — they add *variety*,
> not a power curve. So the flat-slope problem (run output plateaus, ~5 tok/run, Mastery
> sink unreachable) **is not fixed by this** — the balance pass above is still required,
> and now more urgent: variety without a rising power feel still churns. Re-run
> `progressionLoop` *with perks active* before setting the new target band.

---

## Backlog (the roadmap is feature-complete — these are polish + marginal gains)

*Ordered by retention value. The **next task** (merge the two return modals) is above; after
that:*

- **Streak long-term payoff** — now the **Next highest-value task** (promoted; see above).
- **Sound layer (biggest Task-6 feel gap):** haptics + visual FX exist, but there's no audio — a satisfying "cha-ching" on income/claim, behind the existing FX/settings toggle (respect silent mode). The single most-noticeable feel upgrade left.
- **Ascension celebration moment:** prestige is a big beat but resets quietly; a short celebration (reuse the milestone/celebration components) would mark it.
- **Task 3b — active-duty XP (optional attachment hook):** employees gain a little XP from active duty. **Watch for bloat** — they already carry cash-levels + 2 specs + capstone; only if it's a *light* touch (feeds the existing level, not a parallel track).
- **Extend industry mechanics to the dampened late tiers** (Logistics→Space) *if* a playtest shows the mid/late game still feels flat — else leave the 5 flat industries (the 3-mechanic slice already broke the worst sameness).
- **Code-split `@supabase/supabase-js`** so anonymous builds stay lean (~153 kB gzip win).

## Deferred ideas

- 9th industry / raw content tier — **explicitly not now**; differentiate the 8 existing first.
- Prestige-2 / second meta currency — no longer blocked (the first loop is now measured + decision-rich), but still lower-value than differentiating the industries; revisit only if players exhaust the talent tree + Mastery sink.
- Economy rescale (re-pricing upgrades/employees onto the post-overhaul scale) — acceptable, not broken; risky churn for low payoff.
- Loadout presets (low value vs employee-wipe on ascension).
- Out of scope per /goal: dating/life-sim, major rewrites, new stack, secrets, backend changes, native packaging, social/leaderboards/payments.

---

## Risks, balancing & UX notes for the main dev

- **Prestige economy is now converged — keep it that way.** The full arc sqrt → `0.2` → `0.26` is done and guarded by `progressionLoop.test.ts` (no ascension > 20× the prior; tree a journey; Mastery sink reachable). Any future change touching token yield, talent strength, or employee power must re-run that sim and stay inside the band — it's the trip-wire on both ends (blowup *and* flat).
- **⚠️ Dampener ↔ Mastery-sink coupling (new).** The late-game dampener feeds lifetime → tokens, so it lowered cumulative tokens at run #6 from **67 → 54** (the Mastery sink needs ~50). The margin is now only **+4**. The dampener comment says it's "tunable — raise the rate / lower the start for more": **any further dampening must re-run `progressionLoop` and confirm cum tokens still clear ~50**, or the deep Mastery talents become unreachable dead content again (the exact bug from earlier passes). If they go aggressive on the slowdown, also lower the Mastery `costBase` to compensate.
- **Task 4 industry mechanics must be deterministic + monotonic.** Felt mechanics (rush-hour windows, compounding) change pps, so: (a) **no RNG** in the income fold — use a spawn-counter cadence like Golden Deals so `harness`/`balance` tests stay stable; (b) preserve `balance.test.ts`'s income-efficiency monotonicity (a pricier business stays a better $/s-per-$); (c) re-run `harness.test.ts` + `progressionLoop` and re-baseline bounds in the same commit if pps shifts.
- **Two-spec employee power ceiling (`3b2daf4`).** Two specs + a Mastery capstone ≈ doubles an employee's effect ceiling. The harness bot likely doesn't reach L10 staff, so the sim didn't move — but watch that hand-optimised late rosters don't trivialise pps; if a balance complaint surfaces, it's the first place to look.
- **Save safety:** every new field (Task 4 industry state, any 3b XP) needs a default-on-load migration + a regression test — the spec-fork slice did this right (`serialize.ts` + `specialisations.test.ts`); follow that pattern.
- **Parallel-session hygiene:** another Claude session commits to `main`. Fetch/rebase before pushing; stage only files you changed. Docs-only commits (this reviewer loop) should never collide with engine commits.
- **Mobile-first:** any new ascension/perk UI must work at 375px width with 44px tap targets and no doc overflow — the bars we just fixed (Golden Deal, fixed overlays) are easy to regress.
