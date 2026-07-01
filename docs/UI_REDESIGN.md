# UI Redesign — flat, dense, game-like (user-directed)

Supersedes the incremental `UI_UPLIFT_BACKLOG.md`. From direct user feedback: *"so hectic,
doesn't look like a game, buttons look like giant bars, consistent smaller buttons, no wasting
real estate, reduce / no boxes."* Plan produced by a multi-agent design analysis (2026-07-01).

**Diagnosis:** the app has one presentation primitive — a bordered/elevated box — and every atom
uses it, so a single industry stacks 8–11 boxes before the fold. Buttons are all one size
(`--tap-lg` 56px) and mostly full-width, so every action is a giant gold bar with no hierarchy.
Reads like a dark settings form, not a game. (The recent `.card` elevation + frosted-chrome pass
made this worse and is being dialed back.)

## User decisions (locked)
- **Business rows: dense (~64px)** — icon + name/owned + rate + small Buy chip; milestone/ETA/risk in one micro-line.
- **Buy-mode control: slim full-width row, ~32px, Business tab only** — frees the HUD for cash.
- **Game world: FULL** — reactive mascot poses (idle/working/excited by state) + a cash-burst effect on hero actions.

## Design system
- **One button system** (`.btn` + `-primary/-secondary/-ghost` + `-sm/-md/-lg` + `-block`/`-icon`): visual heights 32/40/48px; 44px TOUCH floor preserved by the `.btn::before` hit-area expander. Gold = money + the one hero action per view; everything else neutral/ghost. Full-width is opt-in only.
- **De-box**: `.card` is flat and reserved for genuine objects (business tile, overlay). Everything else groups via `.list-row` (hairline `--divider` between rows) + `.section` (uppercase label header). No nested bordered boxes.
- **Density**: 8/12 spacing rhythm; ~5 businesses visible at 375px (was ~2).
- **Game feel**: per-industry `--industry-*` accent carries context; a 2px accent LEFT stripe is the status language (best-ROI, owned, reached); retire emoji-as-labels for the authored art; concentrate juice into a few money beats.

## Phased plan (one shippable, playable, 375px-verified slice per commit)
- **Phase 0 — Foundation ✅ DONE.** `--ctrl-*`/`--divider`/`--gap-sm` tokens; `.btn` family + `.list-row`/`.section` utilities; demoted `.card` to flat; softened chrome shadow to a hairline (kept frost blur).
- **Phase 1 — Flagship Business screen.** (partly done)
  - ✅ **1a — business list.** BuyButton → content-hug `.btn-md` chip (40px, gold when affordable else neutral-dim); BusinessCard → flat `.list-row` (40px icon well + tap-ready glow when idle, 2-line body: name/×owned then rate + one status micro, ghost staff chip, best-ROI 2px accent left stripe, thin progress baseline, manual businesses run on row tap); LockedBusinessCard → matching dimmed row; BusinessesScreen list → one flat `.card overflow-hidden` holding divider-separated rows (was a grid of N cards). Verified 375px: ~60px rows, 5 visible, chips 40px w/ 44px tap area, no overflow.
  - ✅ **1b-i — Business screen chrome.** 4 cue boxes → ONE borderless `IndustrySignatureStrip`; Spend-Cash → chip; onboarding/entry → borderless stripes. (`48a13bf`)
  - ✅ **1b-ii — WorkCard/tabs/HUD.** WorkCard → borderless accent-stripe strip + content-hug Work Shift; IndustryTabs → theme-filled pills (44px tap); IndustryBanner → borderless; TopHUD → single tier (73px measured), buy-mode → slim `.btn-sm` segmented row on the Business tab; `--hud-h` 120→80px.
- **Phase 2 — Meta screens ✅.** Stats/Upgrades/Employees → flat divider-separated lists + the `.btn` scale. Fixed both audit bugs: AssignmentSheet affinity border now `var(--industry-${id})`; Bench button → `.btn-ghost` (44px).
- **Phase 3 ✅.** ✅ Slim Prestige hero + accent-stripe talent/milestone rows; ✅ ONE shared `Overlay` shell for EventCard/DailyBonus/Ascension/WelcomeBack. ✅ **FULL game-world:** reactive mascot poses already wired (`WealthStage` swaps idle/working/excited by state); the floating "+$" pop now plays the authored 8-frame `cashBurstFrames` sequence (replaces the static burst — same moments, nicer punch; reduced-motion-safe). All four phases delivered.

**Verified (whole push, 375px):** every tab — no horizontal overflow, ZERO ≥54px "bar" buttons (hero actions 48px; the only tall items left are the 4 founder-perk *choice cards* + the Ascend hero), all tap targets ≥44px, ~1–5 bordered boxes/screen (was many). Build/lint/tsc clean, 252 tests. Follow-ups: flatten the founder-perk choice cards; Stats still ~5 boxes.

## Guardrails
Presentation-only; keep the game playable; 44px tap areas; keep build/test green; commit+push each slice; verify at 375px (computed styles — screenshots time out due to the rAF loop).
