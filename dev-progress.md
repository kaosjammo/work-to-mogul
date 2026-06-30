# Dev Progress Log

Append-only log of development loops. Newest at top.

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
