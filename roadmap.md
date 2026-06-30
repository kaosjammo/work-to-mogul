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

- **192 tests / 31 files green** (`npm.cmd test`), oxlint clean, production build boots.
- Deployed static on Vercel; committed + pushed to `origin/main` (`kaosjammo/work-to-mogul`), auto-deploys. A **parallel Claude dev session also commits here** — fetch/rebase and stage only your own files before pushing.
- **Prestige token cut validated — and found over-corrected (`c038473` + `673dbdc`):** the `sqrt → fifth-root` re-tune (`PRESTIGE_YIELD_EXP = 0.2`) is now confirmed by the new multi-ascension sim to *not* explode (run #1 banks 1 token, no ascension blows up — the 1.48B-overnight bug is a CI guard). But the **same sim shows it over-shot**: the prestige loop is now too flat to reward repeated ascensions (see Next task + Risks). **The live balance question flipped from "too much" to "too little."**

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
| **1** | **Progression harness v2 ✅ + prestige *slope* balance pass** | Harness landed (`673dbdc`) — proved the cut is non-exploding but **over-corrected to a flat loop**; the power-curve re-tune is the live work | **harness DONE · re-tune NEXT** |
| **2** | **Prestige v1: founder perk choices** | Gives each ascension divergent flavour → reason to start run #2, #3… (the core idle retention loop) | Ready after the re-tune |
| **3** | **Employee depth v2: XP / traits / specialisation decisions** | Turns the signature mechanic from "hire & forget" into ongoing choices | Backlog |
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

## Next highest-value task → Prestige slope balance pass

**The harness proved the token cut over-corrected.** Measured curve (seed 7, 6
ascensions, 4h/run — reproduce with `npx vitest run progressionLoop`):

| run | run lifetime | tokens banked | cumulative | base tree |
|---|---|---|---|---|
| #1 | $2.43Qa | +1 | 1 | 22% |
| #2 | $2.78Qi | +4 | 5 | 30% |
| #3 | $6.51Qi | +5 | 10 | 33% |
| #4 | $6.83Qi | +5 | 15 | 36% |
| #5 | $7.06Qi | +5 | 20 | 39% |
| #6 | $7.06Qi | +6 | 26 | 41% |

The prestige loop is **too flat to be rewarding**:
1. **Run output plateaus** — lifetime is basically flat from run #3 ($6.5Qi → $7.06Qi, +8% across three more ascensions) despite banking 16 more tokens. Talents barely move the run, so "ascend → next run is dramatically faster" doesn't happen.
2. **Yield stuck at ~5/run, tree crawls** (+3%/ascension → ~20 ascensions to fill). Ascension #4+ gives almost nothing new.
3. **Mastery sink unreachable** — 26 cumulative tokens vs ~50 for one Mastery rank; dead content at realistic yields.

**Goal:** re-tune so each ascension *visibly* accelerates the next run and the tree is a
satisfying — not glacial — journey, **without** re-opening the 1.48B blowup. The new
harness is the guard: tighten its bounds to lock the target band.

**Acceptance criteria**
- [ ] Change **one lever at a time** and re-run the sim. Likely levers: (a) **stronger talent effects** so run lifetime climbs run-over-run instead of plateauing; (b) a **modest yield bump** between fifth-root and sqrt (e.g. raise `PRESTIGE_YIELD_EXP` toward ~0.25–0.3, or add a small per-ascension term).
- [ ] Target curve (tune to taste, then lock as test bounds): by ascension #6, **run lifetime ≥ ~3× run #1's** (talents compound visibly), cumulative tokens reach **at/near the first Mastery rank** (sink reachable, not instant), and the base tree hits **~60–80%** by run #6 (a journey, still not maxed).
- [ ] Keep the existing invariants green: run #1 still banks < 100 tokens; no single ascension mints > 20× the previous. **Update `progressionLoop.test.ts` bounds to the new target band in the same commit.**
- [ ] Decide the Mastery sink explicitly: if still unreachable after the bump, lower `costBase`/`costGrowth` so rank 1 is affordable within ~3–4 ascensions, OR re-label it an "infinity sink for whales" in a code comment and accept it.
- [ ] `npm run build` ✓, lint ✓, full suite green. No save-format change (pure constants).

**Then → Task 2: founder perk choices** (below) — perks add the *decision*, this pass
adds the *power curve*. They're complementary: founder perks on a flat slope still feel
weak, so do the slope first.

---

## Task 2 (next): Prestige v1 — founder perk choices

When the player ascends, present **one choice of 3 founder perks** that re-flavours the
coming run (not just +stats). The talent shop stays; this adds the *decision* on top.

**Acceptance criteria (draft — refine after Task 1 lands)**
- [ ] On ascend, the player picks 1 of 3 perks (e.g. **Industrialist** — businesses cheaper but slower; **Speculator** — Golden Deals/Time-Warp supercharged; **Taskmaster** — staff effects amplified). Perks are *divergent*, ideally with a downside, so the choice is real.
- [ ] The chosen perk persists for the run, is visible in the HUD/Stats, and is **wiped on the next ascension** (re-chosen each run) — distinct from permanent talents.
- [ ] Perks are **data-driven** (a `FOUNDER_PERKS` table like `talents.ts`) with a `content.test`-style guard that every perk's effect is actually wired (we've shipped dead-perk bugs before — don't repeat).
- [ ] Save migration: existing saves load with **no perk selected** (neutral) until their next ascension; no data loss.
- [ ] The **harness v2 bot picks a perk** (e.g. fixed or round-robin) so prestige-loop pacing stays measured with perks active.
- [ ] Surfaced clearly on mobile: the ascend confirm flow shows the 3 perks with one-line effect text; choosing is one tap. Build/lint/tests green.

---

## Task 3 (backlog): Employee depth v2

Deepen the *existing* roster into ongoing decisions rather than adding roles.
Candidates (pick a thin slice, don't build all): per-employee **XP from active duty**
that diverges from bought levels; **trait re-rolls / training** as a token/cash sink;
**specialisation as a branching choice** (already have L5 specs — make it a fork, not
a unlock). Acceptance criteria to be written when Task 2 is close.

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
