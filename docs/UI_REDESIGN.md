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
- **Phase 1 — Flagship Business screen.** BuyButton → content-hug `.btn-primary .btn-md` chip; BusinessCard → flat `.list-row` (icon + baseline progress, 2-line body, Buy/Run chip, ghost staff chip, best-ROI left stripe); BusinessesScreen → collapse the 4 cue boxes + IndustryBonusCue into one themed strip, Spend-Cash → header `.btn-sm` chip, onboarding/entry-cost → borderless accent-stripe callouts; IndustryTabs/Banner → 40px pills + borderless banner; WorkCard → borderless accent-stripe strip + `.btn-lg` Work Shift; TopHUD → single tier, buy-mode moves to a slim Business-tab row, cut `--hud-h` toward ~80px.
- **Phase 2 — Meta screens.** Stats/Upgrades/Employees → flat divided lists + new control scale. Fold in the two audit bugs: AssignmentSheet dead affinity border (use `var(--industry-${id})` / stripe); sub-44px Bench button (`.btn-ghost`).
- **Phase 3 — Prestige + overlays + FULL game-world.** Slim Prestige hero + de-boxed talent/milestone rows; one shared `Overlay` shell for the modals; gold-vs-neutral-vs-theme color hierarchy + retire emoji labels; reactive mascot poses above the fold + wire `cash_burst` into FloatingProfitLayer on hero actions; concentrate juice (gentler tap-ready, count-pop at milestones only). Keep `prefers-reduced-motion`.

## Guardrails
Presentation-only; keep the game playable; 44px tap areas; keep build/test green; commit+push each slice; verify at 375px (computed styles — screenshots time out due to the rAF loop).
