# Dev Progress Log

Append-only log of development loops. Newest at top.

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
