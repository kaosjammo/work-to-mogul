# UI Uplift Backlog

Ranked plan from a multi-agent UI/UX audit (6 senior-designer agents, one per surface, +
adversarial synthesis) run 2026-07-01. The game's bones are excellent (disciplined CSS-var
tokens, rigorous 44px tap targets, tabular-nums everywhere, a real reduced-motion-gated juice
library). The ceiling problem is **uniform flatness**: every card/panel/HUD/nav/modal is the
identical flat `var(--surface)` + 1px border + `rounded-2xl`, with no elevation, no type scale,
no motion tokens.

**Work one finished vertical slice per loop iteration, best-first. Presentation only** — no
engine/economy/logic changes. Hard constraints: mobile-first 375px portrait, dark theme, tap
targets ≥44px, no stack change, no rewrite, keep playable.

## Biggest cross-screen levers (do these first — they lift many screens at once)
1. ✅ **Elevation + `.card` token layer** — shadow scale + warmed surface gradient + hairline.
2. **Typographic scale** (`--fs-*` / `.t-title`/`.t-meta`) — no scale today; card titles == cue labels.
3. **Frost + elevate the shell chrome** (TopHUD + NavBar) — translucent blur + shadow tokens.
4. **Motion tokens** (`--dur-*`, `--ease-*`) + one `.press` active-scale utility.

## Ranked backlog

| # | Slice | Impact | Effort | Risk | Status |
|---|-------|--------|--------|------|--------|
| 1 | Elevation + card-surface token layer + shared `.card` (BusinessCard, WorkCard first) | high | M | low | ✅ DONE (`457ecf4`+this) |
| 2 | Frost + elevate shell chrome (TopHUD + NavBar): translucent blur + `--shadow-hud/-nav` | high | S | low | todo |
| 3 | Typographic scale tokens/utilities → card titles/rates/meta | high | M | low | todo |
| 4 | **Fix dead affinity-match border in AssignmentSheet (real bug** — passes `industryId` string as a CSS color → affinity highlight never shows; map to `var(--industry-${id})`) | high | S | low | todo |
| 5 | Per-industry accent identity on owned BusinessCards (accent edge/wash + tinted icon tile) | high | M | low | todo |
| 6 | Modal entrance animation + backdrop-blur `--scrim` token across all overlays | high | S | low | todo |
| 7 | Motion tokens (`--dur-*`, `--ease-*`) + canonical `.press` utility | medium | M | low | todo |
| 8 | Rarity as a first-class frame on EmployeeRow (border/glow + tinted tile; tokenize RARITY_COLOR) | high | M | low | todo |
| 9 | Give the Ascend hero card real presence (gradient, gold ring, `--shadow-pop`, profitBurst art) | high | M | low | todo |
| 10 | Tame EmployeeRow density (name bump, status→chip, hairline divider, cap trait chips to 2 +N) | high | M | med | todo |
| 11 | Hire/assign/level-up/fuse juice (reuse spawnFloat + haptic + celebrate/count-pop) | high | M | low | todo |
| 12 | Animate NavBar tab selection (icon lift + sliding accent bar + optional haptic) | high | S | low | todo |
| 13 | Extract shared ProgressBar (thickness prop) → replace 5+ inline meta-screen bars | high | M | low | todo |
| 14 | Extract shared ModalShell (scrim + card + entrance + backdrop-tap) | medium | M | med | todo |
| 15 | Shared SectionHeader primitive for meta-screens | medium | M | low | todo |
| 16 | Nudge `--text-faint` one step for AA legibility (~#868e9c) | medium | S | low | todo |
| 17 | Redesign locked/empty states from "broken" to "aspirational" (LockedBusinessCard, milestones, achievements) | medium | M | low | todo |
| 18 | Consolidate the cue-panel/chip recipe into `.cue-panel` + `.chip` utilities | medium | M | low | todo |
| 19 | Skeleton/shimmer loading primitive + richer Placeholder empty state | medium | M | low | todo |
| 20 | AssignmentSheet stat-strip hierarchy + slide-up sheet entrance + slot affordances | medium | M | low | todo |
| 21 | ProgressBar lit-fill gradient + running shimmer while active (reduced-motion gated) | medium | S | low | todo |
| 22 | IndustryTabs → legible segmented rail (scroll fade-mask + active glow) | medium | S | low | todo |
| 23 | Claim/affordable juice on meta-screens (golden-pulse/tap-ready/count-pop reuse) | medium | M | low | todo |
| 24 | Tokenize frenzy/hot color + strengthen HUD subline hierarchy | medium | S | low | todo |
| 25 | Reconcile `--hud-h` with the real (variable) header height for overlay pinning | medium | S | low | todo |
| 26 | Employee level-progress affordance (rarity-tinted bar or Lv pips) | medium | M | med | todo |
| 27 | Differentiate MEGA Golden Deal motion + enlarge Golden/Rush countdown text | medium | S | low | todo |
| 28 | EventCard countdown → visible depleting per-kind-accent timer bar | medium | M | low | todo |
| 29 | Unify EmployeeRow button-rail + **enforce 44px on Bench (tap-target gap)** | medium | S | low | todo |
| 30 | Elevate Fuse into a celebratory rarity-transition CTA | medium | S | low | todo |
| 31 | Hierarchy + light iconography on flat Stats rows | medium | M | low | todo |
| 32 | Unify meta-screen iconography via the Icon component (SVG + fallback) | medium | L | med | todo |
| 33 | Crisp inline-SVG/masked nav glyphs (active inherits currentColor) | medium | L | med | todo |
| 34 | Tighten Upgrades owned-state (accent bar + Owned chip vs blanket opacity) | low | S | low | todo |
| 35 | Polish Account modal button grouping + reuse AccountButton status dot | low | M | low | todo |

Notes: #4 and #29 are **real bugs** surfaced by the audit (dead affinity highlight; a sub-44px
Bench button), not just polish — prioritise when picking. Reusable primitives (#2/#3/#7/#13/#14/#18)
pay off repeatedly, so prefer them before one-off screen tweaks.
