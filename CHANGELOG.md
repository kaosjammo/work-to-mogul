# Changelog

## Unreleased

### Bug fixes (economy, persistence, UI)

- Offline catch-up now prices the away span at a steady rate (short buffs excluded, Quantum's oscillator at its mean) and expires timed buffs/offers by the elapsed wall time — closing the "leave with a 20s buff active, get 2h credited at the buffed rate, buff still running on return" exploit family. All "N seconds of income" rewards (daily bonus, Time Warp, event cards, career pay, salvage) use the steady rate too.
- `quantumPhaseMs` is persisted (phase 0 sat inside the ×9 collapse window → refresh-spam held the jackpot); an exhausted contracts board no longer resurrects its whole token pool on reload; daily claim/streak survive an ascension; Buy Max counts with the discounted price actually charged; `localDayIndex` is calendar-derived (UTC+13/DST off-by-one); fusion can't duplicate a spec across both slots; replayed space-shooter submits are true no-ops.
- Single-active-tab guard: the newest tab takes over, older tabs pause behind a blocking overlay (two live tabs were clobbering one save and double-crediting offline time). Frame gaps ≥1s route through wall-clock catch-up (long stalls were dropped; tab-return double-paid a slice). Cloud restore no longer floods dozens of stale achievement toasts.
- Honest tap feedback ("+$" floats only when the engine actually did something), HoldToConfirm timer cleared on unmount, daily-bonus modal re-shows on a new day in long-lived sessions, hours in `formatDuration`, keyboard/AT semantics on the manual-cycle row.
- A persistence-policy test now forces every `GameState` field to declare whether it survives a reload — the whole "field silently resets" bug class fails loudly.

### Features

- **Desktop-compact controls** — `--tap`/`--tap-lg`/`--nav-h` shrink behind `@media (pointer: fine) and (min-width: 1024px)`; mobile keeps the 44px touch floor (the roadmap's active task).
- **Executive Programs** — three repeatable, endlessly-buyable global upgrades (profit/speed per rank, steep geometric costs) so the Upgrades tab never dead-ends; run-scoped like one-shots, harness-inert.
- **Event-card deck expanded 4 → 14** — ten new bounded trade-off cards (crises, opportunities, gambles) so the active-decision beat repeats far less often.
- **Sound nudge** — a one-time dismissible "chimes on the big moments?" pill once the player is invested (sound previously shipped off with its toggle buried in Stats).

- Added `art-plan.md` with a current asset inventory, MVP asset list, style direction, naming convention, manifest proposal, prompt templates, placeholder strategy, and safe implementation notes.
- Expanded `art-plan.md` with visual-system and background-pattern planning, added reusable art prompt templates, added an unwired art manifest example, and added lightweight placeholder SVG assets.
- Completed the lightweight SVG placeholder asset set for current MVP content, including brand, UI, industry, business, role, upgrade, milestone, prestige, state, banner, portrait fallback, and pattern assets.
- Generated and registered the remaining live missing-art batch: Logistics, Energy, and Space industry assets, their business icons, missing upgrade icons, and employee portraits.
- Generated and wired raster polish assets: a tycoon city background, founder mascot poses, money prop sheet, and cash-burst animation frames.
