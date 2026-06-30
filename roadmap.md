# Tycoon Empire — Roadmap

Living roadmap, updated at the start of each development loop. Mobile-first
idle/incremental tycoon game (React + TypeScript + Vite), live on Vercel.

**Core flow:** Work shifts → wages → promotions → save capital → buy businesses
→ choose industry paths → hire employees → automate → build an empire.

---

## Current implemented features

**Core loop & economy**
- Work/Career early game (6 levels, wages/promotions) as the manual income bridge — players start here, **not** a Lemonade Stand. At max level the career "retires" into a **Senior Consultant** end-state: an optional over-time consulting bonus pool (capped) you Collect by tapping (`career.ts` + WorkCard strip).
- Geometric-cost businesses with Buy x1/x10/x100/Max; **32 businesses across 8 industries** (incl. the ultra-endgame Quantum Frontier + Dyson Sphere capstone); per-business milestones **(25→2000 owned)**. Quick-spend: "Spend Cash" (best-value) + "Buy all affordable" upgrades.
- **Balance overhaul (merged):** economy re-tuned for income-efficiency monotonicity — a pricier business is never a worse $/s-per-$ deal, both globally and within each industry ladder. Guarded by `src/content/balance.test.ts`.
- Industries visible from the start, gated only by cost-of-entry (no artificial unlock payments).
- 10 Hz fixed-timestep engine outside React; throttled view publish; manual→automated income pivot.
- Offline/away catch-up (cap 2h) with welcome-back banner.

**Employees** (note: shipped beyond the "4 roles only" MVP rule — see Known issues)
- 7 roles (Operator, Runner, Closer, Buyer + Gambler, Auditor, HR), 4 rarities, levels to 10, industry affinity.
- Assignment to business slots; Auto-Assign Best; morale, risk events, crit, traits, named synergies.
- L5 specialisations; employee fusion/promotion.

**Meta**
- Prestige/ascension → Empire Tokens; 17-talent tree; ascension milestones; 25-contract rotating board; Golden Deals / Time-Warp; 30 achievements (each grants difficulty-tiered Empire Tokens); 34 upgrades (ladder priced into the endgame).

**Legibility / feel**
- ⭐ Best-ROI reinvestment cue; ⏳ "time to afford" countdown on unaffordable businesses (derived from idle income); industry specialisation-bonus progress cue; rich Stats tab (economy/empire/progress + settings); haptics + floating-number toggles.

**Platform**
- Versioned localStorage save (`tycoon:save`) with tolerant load + migrate hook; autosave.
- **Cloud save + accounts (NEW, env-gated):** Supabase Auth (email+password) + `game_saves` table (RLS, anon key only). Account modal (login/signup/logout), HUD sync-status pill (Local/Syncing/Synced/Sync failed), debounced cloud upload on autosave, and a non-destructive local-vs-cloud conflict chooser on login. Fully disabled (anonymous local play) when `VITE_SUPABASE_*` are unset.
- **Art coverage now complete:** all 27 business icons, 7 industries (icon+banner+pattern), 14 upgrade icons, 7 role icons, and 17 employee portraits authored + registered (`artManifest.ts`); coverage test green.
- PWA: manifest + hand-rolled service worker (network-first nav, SWR art, cache-first hashed).
- Deployed static on Vercel (`npm run build` → `dist`), minimal `vercel.json` (sw.js no-cache). See `deploy-notes.md`. **Committed + pushed to `origin/main`** (`kaosjammo/work-to-mogul`) — auto-deploys.
- **181 tests / 30 files**; oxlint clean; production build verified booting.

## Current known issues / notes

- **Employee complexity exceeds the stated MVP rule.** The loop directive says
  "start with four roles only" and "do not add M4b complexity unless the core
  loop is already stable." The core loop **is** stable and these systems already
  shipped in prior loops — so this is documented as an intentional pre-existing
  state, not something to expand further this loop. No rollback (would break
  saves/tests); no further employee-depth additions while focusing on Goals 1–3.
- **Cloud save needs real Supabase creds for a full on-device test.** Code is
  built + env-gated; the **auth header handling is now verified** (publishable-key
  fetch patch confirmed via a fake-key build — login sends apikey only, no bad
  bearer). The reconcile → conflict chooser → sync paths are still code-reviewed
  only locally (no live backend). Provision Supabase (`supabase-notes.md`) + set
  Vercel env vars (`deploy-notes.md`) to exercise on-device. Use the **publishable**
  (`sb_publishable_…`) or legacy anon JWT key — never a secret/service_role key.
- **Bundle size grew** ~322 kB → ~539 kB raw (~98 kB → ~153 kB gzip) from
  bundling `@supabase/supabase-js`. Acceptable, but a deferred optimization is to
  code-split it (dynamic import) so anonymous/unconfigured builds stay lean.
- **Art gaps** — effectively none for gameplay content (full coverage); only the
  P2 emoji-based depth-system glyphs remain (intentional). See audit below.
- No separate `typecheck` script; `tsc -b` runs inside `npm run build`.

## Missing Art / Placeholder Audit

Full detail in [`art-missing.md`](art-missing.md); style/specs in
[`art-plan.md`](art-plan.md) + the implemented ledger in
[`docs/MISSING_ART.md`](docs/MISSING_ART.md). **No referenced-but-missing asset
ids** (coverage test green).

**Coverage is now complete for all gameplay content** (the P0/P1 gaps from
iteration 1 were generated + registered):

| Priority | Status |
|---|---|
| **P0** Business icons (27) + Industry icons (7) | ✅ all authored + registered |
| **P1** Industry banners + patterns (7×) | ✅ authored **and now rendered** — banner shows as a slim industry header (`IndustryBanner`), pattern as a faint texture on the entry box |
| **P1** Upgrade icons (14) | ✅ all authored |
| **P1** Employee portraits (17) | ✅ all authored (`ART_EMPLOYEES`, via `employeeArt()`) |
| **P2** Depth-system glyphs (talents, milestones, specs, contracts, golden, fusion badges, ✦ token) + the new ☁ account/sync pill | ⏳ intentionally emoji — optional polish |

**Placeholders in active use:** effectively none for shipped content — the
`fallback_*` SVGs remain only as safety nets for any future unmapped id.

**Recommended next art batch:** none required for gameplay. Optional **P2 brand
glyphs** only (Empire-Token ✦ mark, a cloud/sync icon for the account pill,
talent/contract node frames).

## Next highest-value task

Goals 1–3 (cloud save, art, mobile polish) are done. Now under the standing /goal
("deepest, most satisfying mobile idle mogul") — alternate **satisfying** (juice)
and **depth** (content/meta) increments, one validated commit at a time.

Cheap + safe depth is largely exhausted: the data-driven content systems
(upgrades/contracts/talents/achievements/milestones) are all expanded and don't
touch the harness/balance tests. Further content that DOES affect pacing
(businesses, industries, employees, milestones, synergies) must keep
`balance.test.ts` (efficiency monotonicity) and `harness.test.ts` green — size
carefully. Remaining satisfaction headroom: cash-HUD number animation, business-card
juice, celebration polish.

Operational: **provision Supabase** + set Vercel env vars to test login/sync on a
phone (`deploy-notes.md`); optional **code-split `@supabase/supabase-js`** to shrink
the anonymous bundle. A parallel Claude session also commits here — fetch/rebase and
stage only your own files before pushing.

## Deferred ideas

- Batches B–E of art (industry dressing, upgrade icons, employee portraits, brand glyphs).
- Real SVG authoring for P0/P1 art (out of scope this loop — docs only / optional lightweight placeholders).
- Daily/weekly time-gated contracts (need a wall-clock cadence design).
- Loadout presets (low value vs employee-wipe on ascension).
- Account features explicitly OUT of scope: profile pics, usernames, friends, leaderboards, payments, social.
- Native packaging (Electron/Tauri/Capacitor/Steam) — explicitly not now.

## Latest loop summary

**Goal-run — legibility, decision-support + meta/active depth.** On the standing /goal,
high-value increments (each build + 181 Vitest + oxlint + browser-verified on a throwaway
dev server, then fetch/rebase/pushed):
- **MEGA Golden Deals** — every 5th deal is now a deterministic jackpot worth 5× (75 min of
  idle income) with a hotter gradient, 🌟 icon, "MEGA" label + stronger buzz. No RNG (a spawn
  counter), so engine + harness stay reproducible; harness-safe (the bot never claims deals).
- **Achievements now reward Empire Tokens + show progress** — each grants difficulty-tiered
  tokens (1–5, ~85 total over the arc), spendable on talents (in the spirit of contracts +
  ascension milestones). The Ascend list shows each locked goal's ✦ bounty *and a progress
  bar* for countable goals (units/staff/industries/lifetime/ascensions/talents/upgrades);
  the unlock toast shows `+N ✦`. A v1→v2 save migration back-grants rewards for
  already-unlocked achievements (once, no double-grant). Harness-safe: the bot unlocks but
  never spends tokens, so pacing is unchanged.
- **"Saving toward" legibility, completed across all three surfaces** — (1) ⏳ "time to
  afford" countdown on every unaffordable business; (2) `Next ✦ at $X lifetime` progress on
  the Ascend screen (the "ascend now or wait?" decision); (3) the new-industry entry banner
  now reads `~About 5m away at your current income`. All derived from idle income via a
  coarse, flicker-free `formatEta()` (caps far-off goals at `10h+`).
- **Every choice now states its outcome** — upgrade cards lead with the effect (`×2 profit`,
  `−10% cost`); assigned staff slots show each member's contribution (`Lv N · <effect>`);
  and the marquee **Assign → +$/s** preview shows the exact idle-income gain before assigning
  a benched employee (computed in buildView against a non-mutating clone, gated to the open
  sheet). Plus a **"🏭 Welcome to <Industry>!"** celebration when you enter a new industry.
- **Fixed a stale Stats denominator** — "Industries entered" hardcoded `/7` but an 8th
  industry exists; now derived from `INDUSTRY_ORDER.length` so it can't drift again.
- **Save-compat regression guard** — a test locks in that saves written before newer
  businesses/industries existed gain them with defaults on load while preserving owned counts.
- Counts in this doc corrected to the real totals (30 achievements / 34 upgrades /
  25 contracts / 17 talents / 32 businesses across 8 industries).

**Goal-run — deep content + full feel layer (continued).** On the standing /goal,
~18 further validated commits (each build + 173 tests + lint + browser-verified, pushed):
- **8th industry — Quantum Frontier** (Quantum Computer → Antimatter → Wormhole →
  Multiverse Exchange) + a **Dyson Sphere** space capstone, all appended at the top of
  the cost curve so the monotonic-efficiency invariant holds with zero rank shifts;
  plus a Quantum-affinity gambler (Zeta Quark), 2 Quantum upgrades, the **Quantum Leap**
  synergy (2+ gamblers), 2 Quantum achievements, and ultra-endgame contracts (to $1Sx).
- **Per-business milestones extended to 2000 owned** (harness byte-identical).
- **Talent tree 10 → 17**: novel Golden Touch (Time-Warp value), Lucky Streak (Golden
  Deal frequency), Empire Training (scales all staff effects), + stackable tiers.
- **Full feel layer**: floating "+$" pops + haptics on every income source (work / tap /
  golden / offline / ascension); reactive founder mascot (scoped to the Business tab);
  cash-HUD magnitude tier-up pop; juicy celebration toasts; nav reward badges; ready-to-
  collect pulse; a **Settings** panel (haptics + FX toggles, persisted); a first-run hint;
  cloud-sync status shown in words.
- **Hardening/tests**: added num + spend formatting/behaviour tests; defensive talent
  folds; fixed a partial-state crash and an incomplete cooldown replace.

**Session — depth + "satisfaction" pass** (standing /goal: deepest, most satisfying
mobile idle mogul). Shipped in ~15 validated commits (each: `npm run build` + 165
Vitest + oxlint + browser-verified on a throwaway dev server, then pushed):
- **Pacing:** Food Truck unlocks in ~1 min (was ~80) — gentler cost-growth steepness
  + lower Food gates; income-efficiency monotonicity invariant intact.
- **Mobile cash HUD:** two-tier layout so cash is never truncated on a phone.
- **Staff UX:** HIRE-first (no list shift on hire), a Hire-staff path from a business's
  assignment sheet, self-documenting trait chips.
- **Quick-spend:** "Spend Cash" (best-value greedy) + "Buy all affordable" upgrades.
- **Depth:** achievements 14→28, upgrades 14→32 (endgame ladder to ~$1e21), contracts
  14→22, ascension milestones 5→10, talents 10→15 (incl. a novel **Golden Touch** that
  boosts Time-Warp payouts). All data-driven; harness/balance pacing unaffected.
- **Satisfaction/feel:** floating "+$" pops + profit-burst + haptics on taps / Golden
  Deals / rewards; reactive founder mascot (idle→working→excited); celebratory
  welcome-back; nav badges for claimable contracts + worthwhile ascension; idle
  "ready" pulse on manual businesses. A **Settings** section (Stats tab) toggles
  haptics + floating numbers (persisted).
- **Art:** integrated the generated money-themed layer (city backdrop, mascot poses,
  cash VFX/props) behind a non-interactive ambient layer.

**Bug fix — Supabase new publishable-key (`sb_publishable_…`) auth:** signup/login
was failing with "Failed to fetch" because supabase-js sent the publishable key as
`Authorization: Bearer …` (it's not a JWT). Fixed in `src/lib/supabase.ts` with a
`global.fetch` patch (`sanitizeAuthHeaders`) that strips the bad bearer for
publishable keys only — apikey-only request now; real access tokens + legacy `eyJ…`
anon JWTs untouched (cloud save after login still works). Added `supabase.test.ts`
(5 cases); docs clarify publishable vs anon vs never-secret. **lint ✓, 154 tests ✓,
build ✓; verified live** (login request sends `apikey: sb_publishable_…`,
`Authorization: null`).

**Merged balance overhaul + committed/pushed everything:** brought the
`happy-buck-3ad260` worktree (efficiency-monotonic economy re-tune + Senior
Consultant retirement end-state + `balance.test`) into `main` via a clean
zero-conflict 3-way merge (`d38a116`); **build ✓, lint ✓, 149 tests ✓**.
Committed the whole project (cloud save, art, polish, balance) and **pushed
`origin/main`** → Vercel auto-deploys. Worktree de-registered. This iteration:
reconciled the roadmap with the merged reality (Senior Consultant, balance
invariant, 149 tests, deployed). All three goals complete + live.

**Iteration 7 — empty-state illustrations (Goal 3):** committed the full snapshot
(`e1c5f23`), then wired two on-brand `state_empty_*` SVGs into the **Upgrades**
(all-owned) and **Staff** (no-staff) empty states via an `art` prop on
`Placeholder`. Build ✓, lint ✓, 146 tests ✓; assets serve 200. (3-file change
left uncommitted for the user to fold in.)

**Iteration 6 — art audit refresh (Goal 2):** confirmed all quality art is wired
+ rendering (icons, 17 portraits in roster *and* hire list, banners, patterns);
documented the remaining unused early **placeholder** assets (`states/*`,
prestige visuals, `ART_UI` glyphs) as intentional (emoji reads cleaner) and the
obsolete `artManifest.example.ts` as removable. No code change (avoided churn);
146 tests green. **Goals 1–3 substantially complete** — next high-value steps are
user-side: commit/push the untracked art, and provision Supabase for the live
sync test.

**Direct request — implemented newly-created artwork:** audited the generated art
vs what the UI actually shows. Icons (27 businesses, 7 industries, 14 upgrades)
and 17 employee portraits were already registered + rendered; the **7 industry
banners + 7 patterns were registered but never displayed**. Wired them in: a new
`IndustryBanner` slim header on the business screen (banner art + gradient + name)
and the industry pattern as a faint texture on the entry box. **Build ✓, lint ✓,
146 tests ✓**; browser-verified the banner/pattern swap per industry incl. the new
Space art, no console errors / no failed asset loads. (Untracked art files still
need a commit+push to deploy on Vercel.)

**Iteration 5 — Goal 3 UI polish (industry-entry affordance):** the not-owned
industry banner now shows a green "✓ You can afford to start — buy {first
business} below" when affordable (symmetric with the existing unaffordable
cue), clarifying the early-game industry-entry moment. **Build ✓, lint ✓, 146
tests ✓**; clean-boot verified. Goals 1–3 substantially complete — remaining
work is optional micro-polish + the user-side Supabase provisioning for the live
sync test.

**Iteration 4 — Goal 3 UI polish (overflow safety):** TopHUD made overflow-safe
(cash `min-w-0`+`truncate`, controls `shrink-0`) so cash + buy-modes + the new
account pill never overflow; WorkCard promotion line wraps gracefully. Confirmed
`Icon` already prevents layout shift and Upgrades already has an empty state.
**Build ✓, lint ✓, 146 tests ✓**; browser-verified at 360×740 (0 header/doc
overflow, pill on-screen, 44px tap). Goals 1–3 now substantially complete.

**Iteration 3 — Goal 3 UI polish (first pass, no redesign):** NavBar active tab
now has a tint + inset accent bar + bold label; IndustryTabs colors entry cost by
affordability (green ✓ when affordable, faint when not) and dims locked-out
industries; BuyButton gained a soft accent shadow + press-scale; Work-shift +
industry chips gained press feedback. Also fixed a repo-hygiene issue (vitest was
running a parallel worktree copy → excluded `**/.claude/**`, back to 146/26).
**Build ✓, lint ✓, 146 tests ✓**; verified the nav/industry styling via computed
styles before a self-inflicted preview service-worker glitch (CSS-only changes;
app code unaffected). Art coverage unchanged (complete). Remaining Goal-3 polish
queued for iteration 4. Full entry in `dev-progress.md`.

**Iteration 2 — Goal 1 (Supabase login + cloud save) implemented:** added
`@supabase/supabase-js`, `src/lib/supabase.ts` (env-gated client + `vite-env.d.ts`
typing), `src/save/cloud.ts` (game_saves upsert/fetch), save-layer cloud bridge
(`snapshotEnvelope`/`readLocalEnvelope`/`applyEnvelope`/`summarizeEnvelope` +
after-save hook), `src/store/accountStore.ts` (auth session, sync status,
non-destructive reconcile/conflict), and account UI (`AccountModal`,
`AccountButton` HUD pill); wired into HUD/App/main. Also (parallel work) **all
gameplay art was generated + registered** — coverage now complete; refreshed
`roadmap`/`art-missing` accordingly. **Build ✓, lint ✓, 146 tests ✓;
browser-verified anonymous play unaffected** (clean boot, "Local" pill,
not-configured modal). Configured login/sync paths await real Supabase creds.
Known issue: bundle ~153 kB gzip (Supabase) — code-split deferred. Next:
**Goal 3 UI polish**. Full entry in `dev-progress.md`.

**Iteration 1 — docs/foundation (zero runtime change):** baseline (build ✓,
lint ✓, 146 tests ✓). Created roadmap/dev-progress/art-missing/supabase-notes/
.env.example; updated .gitignore (env-ignore), art-plan (stale banner),
deploy-notes (env vars). Goal 2 art audit + Goal 1 foundation specced.
