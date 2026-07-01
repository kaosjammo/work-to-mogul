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

- **208 tests / 32 files green** (`npx vitest run`, verified this pass — incl. the uncommitted dampener WIP), oxlint clean, production build boots.
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

The prestige loop and employee depth — the two big gaps from earlier passes — are now
**addressed**. What's left limiting long-term stickiness is **horizontal sameness**:

1. ✅ **Prestige loop — fixed.** Now both *rewarding* (the slope re-tune: run output
   climbs run-over-run, Mastery sink reachable, `748d3c1`) and *varied* (founder perks:
   a real per-run trade-off decision, `79ecc94`), all guarded by the multi-ascension
   harness. The "thin second run" is no longer thin. Stay vigilant via `progressionLoop`.
2. ✅ **Employees — now a decision.** The L10 second-spec "which two?" build with an
   opportunity cost (`3b2daf4`) turns "hire & forget" into an ongoing choice.
3. ⬅ **Industries are still "same-but-numbers" — the new top gap.** All 8 share just two
   reskinned multipliers (speed ×2 / profit ×1.5 — see Next task). The mid-late game is
   a long stretch through industries that *look* distinct (rush hour, compound interest,
   moonshot) but *play* identically. That flatness is what now caps replayability — a
   prestige run feels the same not because the meta is shallow (it isn't anymore) but
   because the *businesses you climb through* don't differ in how they play.

Diagnosis in one line: **the vertical depth (prestige, employees) is now solid; the
horizontal flatness (8 interchangeable industries) is the next retention ceiling —
give 2–3 industries a felt, name-matching mechanic before adding any more content.**

---

## Prioritised retention roadmap

| # | Task | Why it matters for retention | Status |
|---|---|---|---|
| **1** | **Progression harness v2 ✅ + prestige *slope* balance pass ✅** | Harness (`673dbdc`) + slope re-tune (`748d3c1`) fixed the flat loop — run output now climbs run-over-run, Mastery sink reachable | **✅ DONE** |
| **2** | **Prestige v1: founder perk choices** | Gives each ascension divergent flavour → reason to start run #2, #3… (the core idle retention loop) | **✅ DONE** (`79ecc94`; harness-wiring closed `8e91e5d`) |
| **3** | **Employee depth v2: spec-fork build decision** | Turns the signature mechanic from "hire & forget" into ongoing choices | **✅ DONE** (`3b2daf4`, 206 tests) — active-duty XP deferred to 3b |
| **4** | **Stronger industry identity / unique mechanics** | The 8 industries are still "same-but-numbers" (2 reskinned multipliers) — felt mechanics differentiate the whole mid-late game | **🔨 IN PROGRESS** — Food "Rush Hour" shipped (`ffc8fe5`, 1st of ~3); Finance compounding + Quantum signature next |
| 5 | Business event cards (opportunities / crises / choices) | Active-play decision beats between idle stretches | Backlog |
| 6 | Mobile polish, art callouts, celebrations, sound/haptics | Feel — already strong; diminishing returns | Backlog (incremental) |

Do **not** add a 9th industry / raw content tier — the existing systems aren't yet
*differentiated* enough to justify more of them (see Deferred).

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

## Next highest-value task → Task 4: Industry identity & unique mechanics

**Concrete finding this pass — the 8 industries are not meaningfully differentiated.**
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

**Acceptance criteria — remaining**
- [x] An **active-window** mechanic (Food/`rush_hour`), deterministic + harness-safe + mobile cue. ✅ in flight.
- [ ] A **mechanically *different*** second one — e.g. Finance/`compound_interest`: income that *actually compounds* (grows the longer Finance runs uninterrupted / auto-reinvests a %). Important that it's a *different shape* from Food's tap-window (a passive-but-dynamic curve), to prove the pattern generalises beyond "another tappable thing".
- [ ] **Give Quantum its own signature** (stop sharing Space's `moonshot`) — e.g. a high-variance "superposition" crit mechanic — so the 8th industry has identity.
- [ ] **Data-driven + tested:** a `content.test`-style guard that each industry's signature actually fires (we've shipped dead industry perks before — `1ee29c1`).
- [ ] **Harness + balance safe** for each: keep `balance.test.ts` monotonicity, re-run `harness.test.ts` + `progressionLoop`, re-baseline if pps shifts. Deterministic only.
- [ ] **Mobile-legible:** each signature shown on its banner/entry in one line; active mechanics get an on-screen cue + countdown at 375px (Rush Hour already does).

Scope guard: 2–3 industries as a slice, not all 8 at once. Rush Hour proves the *active*
shape — make the next one *passive-dynamic* (compounding) so the slice shows two distinct
mechanic types, then the rest follow.

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

## Backlog (post Task 4)

- **Task 3b — active-duty XP (optional attachment hook):** employees gain a little XP from active duty (assigned + producing), nudging toward a "Lv-up!" moment without spending. **Watch for bloat** — employees already carry cash-levels + 2 specs + capstone; only add if it stays a *light* touch (e.g. XP feeds the existing level, not a parallel track).
- **Business event cards (Task 5):** lightweight opportunity/crisis cards with a 2-option choice during idle stretches; deterministic spawn (reuse the Golden Deal spawn-counter pattern, not RNG, to stay harness-safe).
- **Daily/weekly time-gated contracts:** needs a wall-clock cadence design (the long-standing blocker).
- **Mobile/feel polish:** optional P2 brand glyphs (✦ Empire-Token mark, sync icon), sound layer behind the existing FX toggle, ascension celebration moment.
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
