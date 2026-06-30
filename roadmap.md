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

- **187 tests / 30 files green** (`npx vitest run`), oxlint clean, production build boots.
- Deployed static on Vercel; committed + pushed to `origin/main` (`kaosjammo/work-to-mogul`), auto-deploys. A **parallel Claude dev session also commits here** — fetch/rebase and stage only your own files before pushing.
- **Latest balance change (`c038473`, just landed):** prestige token yield re-tuned `sqrt → fifth-root` (`PRESTIGE_YIELD_EXP = 0.2`), a ~100,000× cut at the high end, after the user minted **1.48B tokens overnight**. This was a *reactive, eyeballed* fix — **not yet validated by any multi-ascension simulation** (see Risks). This is the single biggest open balance question.

**What exists (inventory — do not re-build):**

- **Core loop & economy:** Work/Career early game (6 levels) → Senior Consultant retirement end-state; 32 businesses / 8 industries, geometric cost, Buy x1/x10/x100/Max, per-business milestones to 2000 owned; income-efficiency **monotonicity invariant** guarded by `balance.test.ts`; 10 Hz fixed-timestep engine; offline catch-up (cap 2h).
- **Employees:** 7 roles, 4 rarities, levels to 10, industry affinity, slot assignment + Auto-Assign Best, morale/risk/crit/traits, named synergies, L5 specialisations, fusion/promotion.
- **Meta:** Prestige → Empire Tokens; **20-talent tree** (incl. 3 deep rank-50 "Mastery" sinks); 10 ascension milestones; 25-contract rotating board; 30 achievements (token-rewarding); 34 upgrades; Golden Deals / MEGA jackpots / Time-Warp / Profit Rush.
- **Legibility/feel:** ⭐ best-ROI cue, ⏳ time-to-afford countdowns, `Next ✦ at $X` prestige cue, floating "+$" pops + haptics, reactive mascot, celebration toasts, nav badges, Settings (FX/haptics toggles), Stats tab.
- **Platform:** versioned localStorage save + migrate hook; env-gated Supabase cloud save + accounts; complete gameplay art coverage; PWA (manifest + service worker).

**Known issues / notes**

- Employee systems already exceed the old "4 roles only" MVP rule — intentional pre-existing state, stable. Don't *add* roles; **do** deepen the existing ones (see Task 3).
- Cloud save needs real Supabase creds for an on-device test (code verified, env-gated, anonymous play unaffected). `@supabase/supabase-js` adds ~153 kB gzip — deferred code-split.
- No standalone `typecheck` script; `tsc -b` runs inside `npm run build`. Art coverage complete; only optional P2 emoji depth-glyphs remain.

---

## Retention diagnosis (what's actually limiting D1/D7)

The game has a **rich first run and a thin second run.** Everything that makes a
mogul idle game sticky long-term lives in the *prestige loop*, and that loop is the
weakest, least-validated part of the game:

1. **The prestige loop is balance-blind.** The harness (`harness.ts`) simulates one
   greedy 10h *first run* and stops — the bot never ascends, spends tokens, or claims
   Golden Deals. So the entire economy *after* the first prestige is untested by CI.
   The 1.48B-token overnight blowup is the direct symptom: a balance regression in the
   meta-loop was invisible until a human played it. **Until a simulation drives
   ascensions, every prestige-balance change is a guess.** This is why it's Task 1.
2. **Prestige offers no *decisions*, only accumulation.** Empire Tokens buy a flat,
   buy-everything-eventually talent shop. There's no "this run I'll be a fast-money
   speculator vs. a slow industrial juggernaut" choice — so a second run *feels
   identical* to the first, just faster. Idle players churn when ascension #2 has no
   new flavour. Roadmap item #2 (**founder perk choices**) is the fix and the highest
   *retention* lever once the loop is measurable.
3. **The token sink and token supply were tuned in separate commits and never
   reconciled.** Deep Mastery talents (rank-50, growth 1.55) were sized as a
   "bottomless sink" *before* the 100,000× token cut — they may now be unreachable
   dead content, or the base tree may now take too many ascensions to fill. Unknown
   without #1.

Diagnosis in one line: **make the prestige loop measurable (Task 1), then make it a
decision (Task 2). Everything else is secondary until those land.**

---

## Prioritised retention roadmap

| # | Task | Why it matters for retention | Status |
|---|---|---|---|
| **1** | **Progression harness v2 + prestige balance pass** | Converts the "1.48B overnight" class of bug into a failing test; unblocks all meta tuning | **NEXT — build now** |
| **2** | **Prestige v1: founder perk choices** | Gives each ascension divergent flavour → reason to start run #2, #3… (the core idle retention loop) | Ready after #1 |
| **3** | **Employee depth v2: XP / traits / specialisation decisions** | Turns the signature mechanic from "hire & forget" into ongoing choices | Backlog |
| 4 | Stronger industry identity / unique mechanics | Differentiates the 8 industries beyond numbers | Backlog |
| 5 | Business event cards (opportunities / crises / choices) | Active-play decision beats between idle stretches | Backlog |
| 6 | Mobile polish, art callouts, celebrations, sound/haptics | Feel — already strong; diminishing returns | Backlog (incremental) |

Do **not** add a 9th industry / raw content tier — the existing systems aren't yet
*differentiated* enough to justify more of them (see Deferred).

---

## Next highest-value task → Task 1: Progression harness v2 + prestige balance pass

Extend the existing deterministic harness so the **prestige loop** is simulated and
pacing-asserted, then use it to validate (or correct) the just-landed token re-tune.
Pure-engine work, no UI — lowest-risk way to make the meta-loop safe to iterate.

**Acceptance criteria**
- [ ] `harness.ts` gains a **multi-ascension mode**: the bot ascends when `prestigePending` ≥ a sensible threshold (e.g. would gain ≥ 1 token AND lifetime past the next band), then **spends banked tokens** on talents via a documented greedy policy (cheapest-rank-first across the base tree), and continues for **N ascensions** (param, default ≥ 5) or a wall-clock budget.
- [ ] New `SimResult` fields: `ascensions`, `tokensPerAscension[]`, `cumulativeTokens`, `talentRanksFilled`, and `runLifetimes[]` (lifetime earned per run).
- [ ] A new test file (e.g. `progressionLoop.test.ts`) prints the per-ascension curve (like `harness.test.ts` does for run 1) **and** asserts pacing invariants:
  - [ ] Tokens earned at ascension #1 is small (single digits) and **`tokensPerAscension` grows sub-exponentially** — no single ascension mints more than a bounded multiple (e.g. ≤ 50×) of the previous (catches the sqrt-style blowup).
  - [ ] After N ascensions the **base talent tree is not 100% filled** (multi-ascension journey intact) **and** is not ~0% filled (tokens aren't uselessly scarce). Pick concrete bounds from the printed curve and lock them in.
  - [ ] Each run's lifetime earnings **increases run-over-run** (talents compound) but stays within a sane band (no instant-max).
- [ ] Document the chosen bot ascension/spend policy in a comment — it encodes "reasonable player" assumptions and must be legible for future tuning.
- [ ] If the curve shows the deep **Mastery sink is unreachable** (first rank never affordable within N ascensions) **or** the base tree fills in < 3 ascensions, file the finding in `dev-progress.md` and propose a one-line constant tweak — but **balance changes are a separate, explicit follow-up commit**, not bundled into the harness commit.
- [ ] `npm run build` ✓, `npm run lint` ✓, full suite green (≥ 187 + new tests). No save-format change.

**Out of scope for Task 1:** any UI, any new currency, founder perks (that's Task 2).
Keep it a pure measurement tool + at most one isolated balance-constant follow-up.

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

- **The token re-tune is unproven.** `c038473` cut yield ~100,000× by eyeball. Task 1 exists specifically to verify it. Do **not** layer Task 2's perks on top until the loop curve is printed and bounded — a perk that multiplies token yield could re-open the blowup.
- **In-flight dev work (uncommitted, watch for landmark drift):** a parallel session is dampening the late milestone curve (`defaultMilestones.ts`: 500→2000-owned tiers cut to ×1.5 / smaller ×2) and registering new quantum/space art (`artManifest.ts` +~28 assets). The milestone dampening **lowers late first-run income**, which can push `harness.test.ts`'s landmarks later (`prestigeEligible`) or below their floors (`industriesEntered ≥ 7`, `secondIndustry`). Whoever commits it must re-run the harness and **re-baseline those bounds in the same commit** — don't let a balance change silently break the pacing guard. This also confirms the value of Task 1: first-run pacing is guarded; the *prestige* loop still isn't.
- **Sink/supply mismatch is live.** Deep Mastery talents (`industrialist`/`grandmaster`/`overclock`, rank-50, growth 1.55) were sized for the *old* token flood. After Task 1 prints `cumulativeTokens` over N ascensions, decide: are they reachable? If not, either lower `costBase`/`costGrowth` or accept them as a true infinity-sink and say so in a comment.
- **Harness fidelity caveat:** the current bot never claims Golden Deals or spends tokens, so its pacing intentionally ignores those. Task 1's bot adds token-spend; keep Golden-Deal claiming out (or deterministic) so `balance.test.ts`'s first-run invariants don't shift.
- **Save safety:** Tasks 2–3 touch the save shape. Every new field needs a default-on-load migration + a regression test (we already have a save-compat guard pattern — extend it).
- **Parallel-session hygiene:** another Claude session commits to `main`. Fetch/rebase before pushing; stage only files you changed. Docs-only commits (this reviewer loop) should never collide with engine commits.
- **Mobile-first:** any new ascension/perk UI must work at 375px width with 44px tap targets and no doc overflow — the bars we just fixed (Golden Deal, fixed overlays) are easy to regress.
