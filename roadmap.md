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

- **197 tests / 32 files green** (`npx vitest run`, verified this pass), oxlint clean, production build boots.
- Deployed static on Vercel; committed + pushed to `origin/main` (`kaosjammo/work-to-mogul`), auto-deploys. A **parallel Claude dev session also commits here** — fetch/rebase and stage only your own files before pushing.
- **Prestige economy converged (`c038473` → `673dbdc` → slope re-tune, uncommitted):** the token yield went sqrt (exploded, 1.48B overnight) → fifth-root `0.2` (over-corrected, flat loop) → **`0.26` + ~2× talent strength** (the measured middle ground). The harness now shows run output climbing run-over-run and the Mastery sink reachable, with no blowup (see the balance-pass section). **The prestige balance question is resolved pending commit.**

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

The game has a **rich first run and a thin second run.** Everything that makes a
mogul idle game sticky long-term lives in the *prestige loop*, and that loop is the
weakest, least-validated part of the game:

1. **The prestige loop was balance-blind — now measured, and it's too flat.**
   `harness.ts`'s new `simulateProgression()` (`673dbdc`) drives 6 ascensions and
   asserts the meta-economy. It confirmed the fifth-root cut stopped the 1.48B blowup
   (run #1 banks 1 token) — **but the same curve shows ascending stopped feeling
   powerful**: run lifetime plateaus from ascension #3 (~$7Qi, only +8% over three more
   runs) while yield sticks at ~5 tokens/run. The core idle promise — "ascend → the
   next run is dramatically faster" — isn't being delivered. *Measuring it turned the
   open question into a concrete tuning target (see Next task).*
2. **Prestige offers no *decisions*, only accumulation.** Empire Tokens buy a flat,
   buy-everything-eventually talent shop. There's no "this run I'll be a fast-money
   speculator vs. a slow industrial juggernaut" choice — so a second run *feels
   identical* to the first, just faster. Idle players churn when ascension #2 has no
   new flavour. Roadmap item #2 (**founder perk choices**) adds that decision — but
   note perks on a *flat* slope still feel weak, so the slope re-tune comes first.
3. **Sink/supply mismatch confirmed live.** The deep Mastery sink needs ~50 tokens for
   rank 1, but the bot banks only **26 across 6 ascensions** — it's **dead content** at
   realistic yields. The base tree also crawls (41% filled after 6 ascensions, ~+3%
   each). The cut over-shot; the fix is a power-curve re-tune, not more content.

Diagnosis in one line: **the loop is now measurable and it failed the eye-test — the
slope is too flat. Re-tune the power curve (next), then add the founder-perk decision
(Task 2). Everything else is secondary until those land.**

---

## Prioritised retention roadmap

| # | Task | Why it matters for retention | Status |
|---|---|---|---|
| **1** | **Progression harness v2 ✅ + prestige *slope* balance pass ✅** | Harness landed (`673dbdc`); the slope re-tune (uncommitted) fixed the flat loop — run output now climbs run-over-run, Mastery sink reachable | **harness ✅ · re-tune ✅ (uncommitted, validated)** |
| **2** | **Prestige v1: founder perk choices** | Gives each ascension divergent flavour → reason to start run #2, #3… (the core idle retention loop) | **✅ SHIPPED** (`79ecc94`, 197 tests) — perks live; ⚠️ harness-wiring + slope re-tune still open |
| **3** | **Employee depth v2: XP / traits / specialisation decisions** | Turns the signature mechanic from "hire & forget" into ongoing choices | **NEXT — build now** (criteria below) |
| 4 | Stronger industry identity / unique mechanics | Differentiates the 8 industries beyond numbers | Backlog |
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

## Prestige slope balance pass ✅ validated (uncommitted — re-tune in flight)

The re-tune is in the working tree and the harness confirms it fixed the flat loop.
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
**When committed, both halves of Task 1 are done.**

Two small open follow-ups (not blockers):
- **Harness still doesn't pick a perk** (`harness.ts` unchanged). Low impact — perks net
  ~neutral so slope tuning isn't materially distorted — but wire a round-robin perk pick
  into `simulateProgression` so the guard reflects real play.
- Re-baseline `progressionLoop.test.ts` bounds to the new band (the diff already touches it).

---

## Next highest-value task → Task 3: Employee depth v2

With the prestige loop now both *rewarding* (slope) and *varied* (founder perks), the
next retention lever is the **signature mechanic** — employees — which today is "hire →
Auto-Assign → forget." Make staffing an **ongoing decision**, not one-time setup. Deepen
the *existing* roster (do **not** add roles); ship a thin slice.

**Acceptance criteria (data-driven + harness-safe; pick the slice)**
- [ ] **Active-duty XP** — an employee assigned to a business earns XP over time and gains
  *use-levels* distinct from the cash-bought levels, so keeping a specific employee
  assigned (vs churning) pays off. Surfaces a "Lv-up!" moment — the classic attachment
  hook. XP curve data-driven; offline/catch-up grants it too (cap-safe).
- [ ] **A divergent choice at a milestone** — at an XP/level milestone the employee forks
  (e.g. a Closer → "Rainmaker" big-crit vs "Steady Hand" morale/consistency). Two
  same-role employees should end up *different*. Reuse the L5-specialisation data pattern;
  make it a 1-of-N **choice**, not an auto-unlock.
- [ ] **Save migration + guard:** new fields default cleanly on old saves (xp 0, no fork);
  a regression test like the existing save-compat guard, plus a `content.test`-style check
  that every fork effect is wired (no dead-perk repeat).
- [ ] **Harness-safe:** the greedy bot keeps working; if XP changes automated pps, re-run
  `harness.test.ts` + `progressionLoop` and re-baseline bounds in the same commit.
- [ ] **Mobile-legible:** XP progress + the fork choice read clearly at 375px / 44px; the
  choice is one tap from the roster or assignment sheet.

Scope guard: one thin slice (XP + one fork axis), not a full RPG. If it sprawls, ship
active-duty XP alone first and add the fork next.

---

## Task 2 (✅ shipped `79ecc94` — follow-ups open): Prestige v1 — founder perk choices

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

## Backlog (post Task 1–3)

- **Stronger industry identity:** give each of the 8 industries one *mechanical* signature (not just a number) — e.g. Finance compounds, Food has rush-hour windows. Reuse the existing signature-perk data table.
- **Business event cards:** lightweight opportunity/crisis cards with a 2-option choice during idle stretches; deterministic spawn (reuse the Golden Deal spawn-counter pattern, not RNG, to stay harness-safe).
- **Daily/weekly time-gated contracts:** needs a wall-clock cadence design (the long-standing blocker).
- **Mobile/feel polish:** optional P2 brand glyphs (✦ Empire-Token mark, sync icon), sound layer behind the existing FX toggle, ascension celebration moment.
- **Code-split `@supabase/supabase-js`** so anonymous builds stay lean (~153 kB gzip win).

## Deferred ideas

- 9th industry / raw content tier — **explicitly not now**; differentiate the 8 existing first.
- Prestige-2 / second meta currency — premature until the *first* prestige loop is measured (Task 1) and given decisions (Task 2).
- Economy rescale (re-pricing upgrades/employees onto the post-overhaul scale) — acceptable, not broken; risky churn for low payoff.
- Loadout presets (low value vs employee-wipe on ascension).
- Out of scope per /goal: dating/life-sim, major rewrites, new stack, secrets, backend changes, native packaging, social/leaderboards/payments.

---

## Risks, balancing & UX notes for the main dev

- **The token re-tune is proven non-exploding, but over-corrected.** `673dbdc`'s sim confirms `c038473` killed the blowup (run #1 = 1 token, no ascension > 20× the prior). The new risk is the *opposite*: the slope is too flat (run output plateaus by ascension #3). The Next-task re-tune must lift the slope **without** crossing back over the blowup line — the sub-exponential-yield assertion in `progressionLoop.test.ts` is the trip-wire; keep it green while raising the target band.
- **Late-game dampening landed (`17e9bdb`), harness held.** A parallel session cut the high-owned milestone + industry-tier multipliers (`defaultMilestones.ts` 500→2000-owned tiers to ×1.5 / smaller ×2, plus `economy.ts`) to slow the late first run. Verified this pass: it did **not** touch `harness.test.ts` and the harness is still green (6/6) — the landmarks stayed in-band, so no re-baseline was needed. General guard for the *next* such change: any balance edit that moves late-run income must re-run the harness and re-baseline `harness.test.ts` bounds **in the same commit** if landmarks shift. (Quantum/space art registration is now complete and covered by `artManifest.test.ts` — doesn't affect balance.) This reinforces Task 1: first-run pacing is guarded; the *prestige* loop still isn't.
- **Sink/supply mismatch confirmed (not hypothetical).** The sim banks **26 cumulative tokens over 6 ascensions** vs ~50 for a single Mastery rank — the deep Mastery talents (`industrialist`/`grandmaster`/`overclock`, rank-50, growth 1.55) are **unreachable dead content** at current yields. Resolve it as part of the slope re-tune: either the yield bump lifts cumulative tokens into Mastery range, or lower `costBase`/`costGrowth`, or explicitly re-label it a whale-only infinity sink in a comment. Don't leave it ambiguous.
- **Harness fidelity caveat:** the current bot never claims Golden Deals or spends tokens, so its pacing intentionally ignores those. Task 1's bot adds token-spend; keep Golden-Deal claiming out (or deterministic) so `balance.test.ts`'s first-run invariants don't shift.
- **Save safety:** Tasks 2–3 touch the save shape. Every new field needs a default-on-load migration + a regression test (we already have a save-compat guard pattern — extend it).
- **Parallel-session hygiene:** another Claude session commits to `main`. Fetch/rebase before pushing; stage only files you changed. Docs-only commits (this reviewer loop) should never collide with engine commits.
- **Mobile-first:** any new ascension/perk UI must work at 375px width with 44px tap targets and no doc overflow — the bars we just fixed (Golden Deal, fixed overlays) are easy to regress.
