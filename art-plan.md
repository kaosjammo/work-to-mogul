# Art Asset Plan

> ## ⚠️ Status update — current loop (sections 1–3 below are partly STALE)
>
> This document was written during an early art pass and its inventory/priority
> tables predate a lot of shipped work. The **authoritative generated/implemented art ledger is now
> [`art-missing.md`](art-missing.md)**; this file is kept for its house-style
> guide (§5), naming convention (§6), and the image-generation **prompt pack**
> (§8–9), which are all still valid. What changed since this was written:
>
> - **All screens are real**, not placeholders: Business, **Staff/Employees**,
>   **Upgrades**, **Ascend/Prestige**, and **Stats** are fully built.
> - **27 businesses across 7 industries** now exist (this doc lists only the
>   original 15 / 4 industries). The newer **Logistics, Energy, Space**
>   industries and their 12 businesses have now been generated and registered.
> - The art **manifest is wired** (`src/content/artManifest.ts`, not an
>   "example"), `ui/shared/Icon.tsx` renders it with emoji/SVG fallback, and a
>   coverage test (`artManifest.test.ts`) guards it. Emoji business icons are
>   **no longer** read from `businesses.ts` for arted ids.
> - A first proper raster polish batch now exists: generated tycoon city
>   background, founder mascot poses, money props, and cash-burst VFX frames.
>   The background, mascot, and money props are wired into the app shell.
> - Validation now: **146 tests / 26 files** (this doc's "33 tests" is old), and
>   `tsc -b` runs inside `npm run build` (still no separate `typecheck` script).
> - Newer **depth systems** (talents, ascension milestones, L5 specialisations,
>   contracts, Golden Deals) ship emoji-only by design — see `art-missing.md` §P2.
>
> Treat the per-asset tables in §1–§3 as historical. Use `art-missing.md` for
> the current generated/implemented status and any future optional art targets.

---

This plan is based on the current mobile-first React, TypeScript, and Vite idle tycoon project. It reflects the content and UI that exist now: Work/Career definitions are present, businesses and industries are present, employee role types are present, and Staff, Upgrades, and Ascend screens are still placeholders.

This file started before final raster artwork existed. The project now includes a first generated raster polish batch under `public/assets/generated/`; the older tables below are retained mainly as planning history and style guidance.

## 1. Current Asset Inventory

| Path | Apparent use | Status | Recommendation |
| --- | --- | --- | --- |
| `public/favicon.svg` | Browser favicon and the only PWA manifest icon. It is the default Vite lightning-style mark, not tycoon-specific. | Placeholder | Replace with Tycoon Empire app icon before release. |
| `public/icons.svg` | Starter SVG symbol sheet with social/documentation icons. No current game UI usage found. | Placeholder or unused | Remove later if still unused, or replace with a game-specific sprite sheet. |
| `public/manifest.webmanifest` | PWA metadata for "Tycoon Empire"; references `/favicon.svg`. | Functional metadata, placeholder icon | Keep and expand with final app icons. |
| `src/assets/hero.png` | Starter layered tile image. No active app import found. | Placeholder or unused | Replace with brand/app art or remove when starter assets are cleaned. |
| `src/assets/react.svg` | React starter logo. No active app usage found. | Placeholder or unused | Remove when starter assets are cleaned. |
| `src/assets/vite.svg` | Vite starter logo. No active app usage found. | Placeholder or unused | Remove when starter assets are cleaned. |
| `src/content/businesses.ts` emoji icons | Business card icons for all current businesses. | Useful placeholders | Keep until manifest-driven icons are wired. |
| `src/ui/work/WorkCard.tsx` briefcase emoji | Work/Career leading icon. `WorkCard` exists, but is not currently routed into the app shell. | Useful placeholder | Keep until Work/Career art is wired. |
| `src/ui/shell/NavBar.tsx` emoji icons | Bottom nav icons for Business, Staff, Upgrades, and Ascend. | Useful placeholders | Replace with UI SVG icons when polishing navigation. |
| `src/ui/shared/Placeholder.tsx` caller emoji | Staff, Upgrades, and Ascend placeholder screen icons. | Useful placeholders | Replace after each system has real UI. |
| `src/ui/styles/tokens.css` | Dark UI tokens, money accent, industry accents, layout sizes, safe area variables. | Real visual foundation | Keep and expand carefully. |
| `public/assets/icons/ui/*.svg` | Lightweight placeholder UI icons added by this pass. | Placeholder | Safe fallback layer, not final art. |
| `public/assets/icons/work/*.svg` | Lightweight Work/Career placeholder icons added by this pass. | Placeholder | Safe fallback layer, not final art. |
| `public/assets/icons/roles/*.svg` | Lightweight Operator, Runner, Closer, Buyer role badge placeholders added by this pass. | Placeholder | Safe for upcoming employee UI. |
| `public/assets/patterns/*.svg` | Low-contrast tileable background pattern placeholders added by this pass. | Placeholder | Use later as decorative layers only. |
| `public/assets/brand/*.svg` | Generated app icon and mono brand mark placeholders. | Placeholder | Replace with final brand art later if desired. |
| `public/assets/icons/industries/*.svg` | Generated industry icon placeholders for all four current industries. | Placeholder | Safe to wire through a manifest later. |
| `public/assets/icons/businesses/*.svg` | Generated business icon placeholders for all fifteen current businesses. | Placeholder | Safe to wire through a manifest later. |
| `public/assets/banners/industries/*.svg` | Generated low-detail industry banner placeholders. | Placeholder | Keep subtle; use only if the UI grows a header/banner area. |
| `public/assets/icons/upgrades/*.svg` | Generated upgrade icon placeholders for all four current upgrades. | Placeholder | Safe for the future Upgrades screen. |
| `public/assets/icons/milestones/*.svg` | Generated milestone icon placeholders for profit, speed, and cost effects. | Placeholder | Safe for future milestone toasts/hints. |
| `public/assets/icons/prestige/*.svg` and `public/assets/visuals/prestige/*.svg` | Generated Prestige/Ascend placeholders. | Placeholder | Safe for future Prestige UI. |
| `public/assets/states/*.svg` | Generated empty, locked, and unaffordable state illustrations. | Placeholder | Use only where text contrast remains clear. |
| `public/assets/portraits/employees/employee_fallback.svg` | Generated generic employee fallback portrait. | Placeholder | Use until named employee templates exist. |

There is now a complete lightweight SVG placeholder set for the current MVP content. There are still no final raster illustrations, named employee portraits, event illustrations, lifestyle reward images, or wired asset-manifest references.

## 2. Current Visual System Inventory

| Area | Current state |
| --- | --- |
| Colour tokens | `src/ui/styles/tokens.css` defines a dark-first palette: `--bg`, `--surface`, `--surface-2`, `--surface-3`, `--border`, `--text`, `--text-dim`, `--text-faint`. Money/brand uses gold `--accent`, with `--good`, `--bad`, and `--warn` status colours. |
| Industry accents | Four CSS variables exist: `--industry-food: #e2502b`, `--industry-retail: #2bb3e2`, `--industry-tech: #8b5cf6`, `--industry-finance: #2bd47a`. These are used through industry definitions and card/tab accents. |
| CSS variables | Layout variables include tap target sizes, radii, gaps, safe-area insets, HUD height, and nav height. They are already mobile-focused. |
| Tailwind usage | Components use Tailwind utility classes directly for spacing, flex layout, typography, rounded corners, and sizing. Theme customisation is not the main visual system; CSS variables carry most colours. |
| Gradients | No meaningful game gradients are currently defined. Existing styling is mostly flat dark surfaces plus accent fills. |
| Emoji usage | Emoji are the current icon layer for businesses, nav tabs, staff count, automation status, locks, milestones, Work/Career, and placeholder screens. |
| Icon libraries | No Lucide dependency is installed. Do not assume Lucide unless it is added deliberately later. |
| Card styles | Cards use rounded `rounded-2xl`, dark `var(--surface)`, borders from `var(--border)`, compact spacing, and 44px icon boxes. |
| Backgrounds | The app uses a plain dark `--bg`. No active background patterns or decorative background images are wired. |
| Patterns | None existed before this pass. New SVG pattern placeholders are intentionally unwired. |
| Motion | Progress bars use transform-based fills; `framer-motion` is installed but not needed for this art layer. |

Assumption: the visual direction should build on the current dark, compact, phone-shaped UI rather than introduce a new landing-page or illustration-heavy structure.

## 3. Required MVP Art Assets

Priority guide: P0 = needed for MVP clarity or repeated UI use; P1 = improves polish but can use placeholders; P2 = later/future flavour.

### App Identity

| Asset id | Suggested filename | Entity | Usage | Format / dimensions | Priority | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `app_icon` | `public/assets/brand/app_icon.svg` | Tycoon Empire | Favicon and manifest icon | SVG source plus 192/512 PNG exports later | P0 | Replace the Vite favicon with a generic tycoon mark: coin stack, skyline, or upward tile. |
| `app_icon_maskable` | `public/assets/brand/app_icon_maskable.png` | Tycoon Empire | PWA maskable icon | 512x512 PNG | P1 | Needed for install polish, not gameplay. |
| `brand_mark_mono` | `public/assets/brand/brand_mark_mono.svg` | Tycoon Empire | Loading/settings/about later | SVG | P2 | Keep optional; no current brand header exists. |

### UI Icons

| Asset id | Suggested filename | Entity | Usage | Format / dimensions | Priority | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `ui_cash` | `public/assets/icons/ui/icon_cash.svg` | Cash | HUD, prices, rewards | SVG, 24px grid | P0 | Placeholder added. |
| `ui_upgrade` | `public/assets/icons/ui/icon_upgrade.svg` | Upgrades | Nav and future upgrade cards | SVG, 24px grid | P0 | Placeholder added. |
| `ui_milestone` | `public/assets/icons/ui/icon_milestone.svg` | Milestones | Business milestone hints and future toasts | SVG, 24px grid | P0 | Placeholder added. |
| `ui_ascend` | `public/assets/icons/ui/icon_ascend.svg` | Ascend | Nav and Prestige screen | SVG, 24px grid | P0 | Placeholder added. |
| `ui_locked` | `public/assets/icons/ui/icon_locked.svg` | Locked states | Locked business/industry cards | SVG, 24px grid | P0 | Still recommended; not added in this pass. |
| `ui_staff` | `public/assets/icons/ui/icon_staff.svg` | Staff slots | Business staff chip and Staff tab | SVG, 24px grid | P0 | Still recommended; role icons cover part of this. |
| `ui_fallback_business` | `public/assets/icons/ui/fallback_business.svg` | Missing business icon | Fallback when business art is missing | SVG, 64px artboard | P0 | Placeholder added. |
| `ui_fallback_industry` | `public/assets/icons/ui/fallback_industry.svg` | Missing industry icon | Fallback when industry art is missing | SVG, 64px artboard | P0 | Placeholder added. |

### Work / Career

| Asset id | Suggested filename | Entity | Usage | Format / dimensions | Priority | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `work_shift` | `public/assets/icons/work/work_shift.svg` | Work Shift | WorkCard leading icon | SVG, 64px artboard | P0 | Placeholder added. WorkCard exists but is not currently routed into the shell. |
| `work_promotion` | `public/assets/icons/work/work_promotion.svg` | Promotion | Career progress/toast later | SVG, 64px artboard | P1 | Placeholder added. |
| `career_level_badges` | `public/assets/icons/work/work_level_[level].svg` | Career levels | Future level badge variants | SVG, 64px artboard | P2 | Current levels are text-only: Casual Worker through Regional Manager. |

### Industries

| Asset id | Suggested filename | Entity | Usage | Format / dimensions | Priority | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `industry_food` | `public/assets/icons/industries/industry_food.svg` | Food & Hospitality | Industry tab/header later | SVG, 64px artboard | P0 | Actual id: `food`. |
| `industry_retail` | `public/assets/icons/industries/industry_retail.svg` | Retail & Services | Industry tab/header later | SVG, 64px artboard | P0 | Actual id: `retail`. |
| `industry_tech` | `public/assets/icons/industries/industry_tech.svg` | Tech & Media | Industry tab/header later | SVG, 64px artboard | P0 | Actual id: `tech`. |
| `industry_finance` | `public/assets/icons/industries/industry_finance.svg` | Finance & Property | Industry tab/header later | SVG, 64px artboard | P0 | Actual id: `finance`. |
| `industry_food_pattern` | `public/assets/patterns/pattern_food.svg` | Food & Hospitality | Future subtle card/header layer | SVG tile or CSS gradient | P1 | Can derive from generic coin/dot patterns first. |
| `industry_retail_pattern` | `public/assets/patterns/pattern_retail.svg` | Retail & Services | Future subtle card/header layer | SVG tile or CSS gradient | P1 |  |
| `industry_tech_pattern` | `public/assets/patterns/pattern_tech.svg` | Tech & Media | Future subtle card/header layer | SVG tile or CSS gradient | P1 |  |
| `industry_finance_pattern` | `public/assets/patterns/pattern_finance.svg` | Finance & Property | Future subtle card/header layer | SVG tile or CSS gradient | P1 |  |

### Businesses

Current business ids: `lemonade`, `food_truck`, `pizzeria`, `sushi_bar`, `corner_shop`, `barbershop`, `gym`, `department_store`, `mobile_app`, `streaming`, `saas`, `ai_lab`, `apartments`, `fund`, `skyscraper`.

| Asset id | Suggested filename | Entity | Usage | Format / dimensions | Priority | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `business_lemonade` | `public/assets/icons/businesses/business_lemonade.svg` | Lemonade Stand | Business card icon | SVG or 256x256 WebP later | P0 | First purchase path after Work income. |
| `business_food_truck` | `public/assets/icons/businesses/business_food_truck.svg` | Food Truck | Business card icon | SVG or 256x256 WebP later | P0 |  |
| `business_pizzeria` | `public/assets/icons/businesses/business_pizzeria.svg` | Pizzeria | Business card icon | SVG or 256x256 WebP later | P0 |  |
| `business_sushi_bar` | `public/assets/icons/businesses/business_sushi_bar.svg` | Sushi Bar | Business card icon | SVG or 256x256 WebP later | P0 |  |
| `business_corner_shop` | `public/assets/icons/businesses/business_corner_shop.svg` | Corner Shop | Business card icon | SVG or 256x256 WebP later | P0 |  |
| `business_barbershop` | `public/assets/icons/businesses/business_barbershop.svg` | Barbershop | Business card icon | SVG or 256x256 WebP later | P0 |  |
| `business_gym` | `public/assets/icons/businesses/business_gym.svg` | Gym Franchise | Business card icon | SVG or 256x256 WebP later | P0 |  |
| `business_department_store` | `public/assets/icons/businesses/business_department_store.svg` | Department Store | Business card icon | SVG or 256x256 WebP later | P0 |  |
| `business_mobile_app` | `public/assets/icons/businesses/business_mobile_app.svg` | Mobile App | Business card icon | SVG or 256x256 WebP later | P0 |  |
| `business_streaming` | `public/assets/icons/businesses/business_streaming.svg` | Streaming Channel | Business card icon | SVG or 256x256 WebP later | P0 |  |
| `business_saas` | `public/assets/icons/businesses/business_saas.svg` | SaaS Platform | Business card icon | SVG or 256x256 WebP later | P0 |  |
| `business_ai_lab` | `public/assets/icons/businesses/business_ai_lab.svg` | AI Lab | Business card icon | SVG or 256x256 WebP later | P0 | Avoid implying real AI brands. |
| `business_apartments` | `public/assets/icons/businesses/business_apartments.svg` | Rental Apartments | Business card icon | SVG or 256x256 WebP later | P0 |  |
| `business_fund` | `public/assets/icons/businesses/business_fund.svg` | Investment Fund | Business card icon | SVG or 256x256 WebP later | P0 | No real stock-market logos. |
| `business_skyscraper` | `public/assets/icons/businesses/business_skyscraper.svg` | Skyscraper | Business card icon | SVG or 256x256 WebP later | P0 |  |

### Employees / Roles

The type layer contains roles `operator`, `runner`, `closer`, `buyer`, `gambler`, `auditor`, and `hr`. The request context says Operator, Runner, Closer, and Buyer are next. There are no current employee templates or named roster members.

| Asset id | Suggested filename | Entity | Usage | Format / dimensions | Priority | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `role_operator` | `public/assets/icons/roles/role_operator.svg` | Operator | Role badge, future hire/assignment UI | SVG, 48px grid | P0 | Placeholder added. |
| `role_runner` | `public/assets/icons/roles/role_runner.svg` | Runner | Role badge, future hire/assignment UI | SVG, 48px grid | P0 | Placeholder added. |
| `role_closer` | `public/assets/icons/roles/role_closer.svg` | Closer | Role badge, future hire/assignment UI | SVG, 48px grid | P0 | Placeholder added. |
| `role_buyer` | `public/assets/icons/roles/role_buyer.svg` | Buyer | Role badge, future hire/assignment UI | SVG, 48px grid | P0 | Placeholder added. |
| `role_gambler` | `public/assets/icons/roles/role_gambler.svg` | Gambler | Later risk role | SVG, 48px grid | P2 | Type exists, not next MVP context. |
| `role_auditor` | `public/assets/icons/roles/role_auditor.svg` | Auditor | Later risk role | SVG, 48px grid | P2 | Type exists, not next MVP context. |
| `role_hr` | `public/assets/icons/roles/role_hr.svg` | HR | Later morale role | SVG, 48px grid | P2 | Type exists, not next MVP context. |
| `employee_fallback` | `public/assets/portraits/employees/employee_fallback.webp` | Generic employee | Future roster fallback portrait | 512x512 WebP | P1 | Defer until roster templates exist. |

### Upgrades

Current upgrade ids: `lemonade_2x`, `food_industry_25`, `global_speed_15`, `tech_profit_2x`. The screen is currently a placeholder.

| Asset id | Suggested filename | Entity | Usage | Format / dimensions | Priority | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `upgrade_lemonade_2x` | `public/assets/icons/upgrades/upgrade_lemonade_2x.svg` | Premium Lemons | Future upgrade card icon | SVG, 64px artboard | P1 |  |
| `upgrade_food_industry_25` | `public/assets/icons/upgrades/upgrade_food_industry_25.svg` | Celebrity Chef | Future upgrade card icon | SVG, 64px artboard | P1 | No real chef likeness. |
| `upgrade_global_speed_15` | `public/assets/icons/upgrades/upgrade_global_speed_15.svg` | Logistics Overhaul | Future upgrade card icon | SVG, 64px artboard | P1 |  |
| `upgrade_tech_profit_2x` | `public/assets/icons/upgrades/upgrade_tech_profit_2x.svg` | Viral Algorithm | Future upgrade card icon | SVG, 64px artboard | P1 | Abstract network, no platform logos. |
| `upgrade_fallback` | `public/assets/icons/ui/icon_upgrade.svg` | Generic upgrade | Placeholder/fallback icon | SVG, 24px grid | P0 | Placeholder added. |

### Milestones / Celebrations

Current milestone effects are mostly `profitMult` and `speedMult`, with type support for `costReduction`.

| Asset id | Suggested filename | Entity | Usage | Format / dimensions | Priority | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `milestone_profit` | `public/assets/icons/milestones/milestone_profit.svg` | Profit milestone | Business hint/toast later | SVG, 64px artboard | P0 | Can reuse `icon_milestone.svg` initially. |
| `milestone_speed` | `public/assets/icons/milestones/milestone_speed.svg` | Speed milestone | Business hint/toast later | SVG, 64px artboard | P0 |  |
| `milestone_cost` | `public/assets/icons/milestones/milestone_cost.svg` | Cost reduction milestone | Future milestone support | SVG, 64px artboard | P1 | No current default milestone uses this. |
| `celebration_static` | `public/assets/icons/ui/icon_milestone.svg` | Generic celebration | Promotion/milestone lightweight visual | SVG, 24/64px | P1 | Static or CSS-only; no canvas/heavy animation. |

### Prestige / Ascend

| Asset id | Suggested filename | Entity | Usage | Format / dimensions | Priority | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `ascend_icon` | `public/assets/icons/ui/icon_ascend.svg` | Ascend | Nav, Prestige screen, fallback | SVG, 24px grid | P0 | Placeholder added. |
| `prestige_point` | `public/assets/icons/prestige/prestige_point.svg` | Prestige points | Future currency/status | SVG, 32px grid | P1 | Defer until Prestige UI is functional. |
| `prestige_visual` | `public/assets/visuals/prestige/prestige_empire_reset.svg` | Prestige reset | Future Prestige screen visual | SVG, 160px artboard | P2 | No current functional prestige screen art needed. |

### Empty / Locked / Unaffordable States

| Asset id | Suggested filename | Entity | Usage | Format / dimensions | Priority | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `state_locked` | `public/assets/icons/ui/icon_locked.svg` | Locked card/screen | Locked business and future locked panels | SVG, 24px grid | P0 | Recommended next placeholder. |
| `state_unaffordable` | `public/assets/icons/ui/icon_unaffordable.svg` | Not enough cash | Disabled buy hint later | SVG, 24px grid | P1 | Current disabled buttons already communicate state. |
| `state_empty_staff` | `public/assets/icons/ui/fallback_role.svg` | Empty Staff screen | Placeholder screen | SVG, 64px artboard | P1 | Add when Staff screen becomes real. |
| `state_empty_business` | `public/assets/icons/ui/fallback_business.svg` | Empty/missing business | Fallback | SVG, 64px artboard | P0 | Placeholder added. |
| `state_empty_industry` | `public/assets/icons/ui/fallback_industry.svg` | Missing industry | Fallback | SVG, 64px artboard | P0 | Placeholder added. |

### Backgrounds and Decorative UI Elements

| Asset id | Suggested filename | Entity | Usage | Format / dimensions | Priority | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `pattern_coin_grid` | `public/assets/patterns/pattern_coin_grid.svg` | Money/neutral | HUD/card background layer later | Tileable SVG | P1 | Placeholder added. Keep opacity low. |
| `pattern_chart_lines` | `public/assets/patterns/pattern_chart_lines.svg` | Growth/progress | Finance, milestones, upgrades | Tileable SVG | P1 | Placeholder added. |
| `pattern_office_grid` | `public/assets/patterns/pattern_office_grid.svg` | Buildings/work | Career, retail, property | Tileable SVG | P1 | Placeholder added. |
| `pattern_subtle_dots` | `public/assets/patterns/pattern_subtle_dots.svg` | Generic UI | Empty screens, banners | Tileable SVG | P1 | Placeholder added. |

### Future

List separately when gameplay exists: founder avatar, named employee portraits, networking events, awards night, lifestyle rewards, cars, property purchases, gala invitations, media appearances, office upgrades, private island, risk event scenes, and mogul-style scene cards.

## 4. Background Patterns and Decorative UI

| Pattern | Suggested filename | Usage | SVG or CSS recommendation | Priority | Readability notes |
| --- | --- | --- | --- | --- | --- |
| Tiny coin grid | `public/assets/patterns/pattern_coin_grid.svg` | Money panels, reward backgrounds, high-value upgrade cards | Tileable SVG | P1 | Use at 4-8% opacity over dark surfaces; never behind small numeric text unless contrast is tested. |
| Upward chart lines | `public/assets/patterns/pattern_chart_lines.svg` | Finance, milestones, growth summaries | Tileable SVG | P1 | Keep strokes thin and low contrast; avoid looking like real financial advice charts. |
| City block pattern | `public/assets/patterns/pattern_city_blocks.svg` | Industry overview or Prestige later | Tileable SVG or CSS linear gradients | P2 | Best for larger empty panels; too busy for business cards. |
| Office window grid | `public/assets/patterns/pattern_office_grid.svg` | Work/Career, property, staff panels | Tileable SVG | P1 | Works in phone portrait if grid spacing is large enough. |
| Subtle dots | `public/assets/patterns/pattern_subtle_dots.svg` | Generic empty states and modal backing | Tileable SVG | P1 | Safest reusable pattern; must stay very faint. |
| Diagonal business-card stripes | `public/assets/patterns/pattern_diagonal_stripes.svg` | Selected states, premium cards | CSS repeating-linear-gradient | P2 | Use sparingly; can create visual noise on dense cards. |
| Finance ledger lines | `public/assets/patterns/pattern_ledger_lines.svg` | Finance/property cards, audit/risk later | Tileable SVG | P2 | Low contrast horizontal lines only; avoid resembling form fields. |
| Food micro-pattern | `public/assets/patterns/pattern_food.svg` | Food industry decorative layer | SVG or CSS radial motifs | P2 | Use simple dots/lemon-slice arcs; avoid busy food wallpaper. |
| Retail micro-pattern | `public/assets/patterns/pattern_retail.svg` | Retail industry decorative layer | SVG or CSS grid | P2 | Tiny bags/tags can become clutter; abstract shapes are safer. |
| Tech micro-pattern | `public/assets/patterns/pattern_tech.svg` | Tech industry decorative layer | SVG | P2 | Node-line motifs must not compete with progress bars. |
| Finance micro-pattern | `public/assets/patterns/pattern_finance.svg` | Finance industry decorative layer | SVG | P2 | Chart/ledger hints only, very low contrast. |

Patterns should be decorative and removable. Use them as background layers with `aria-hidden` containers or CSS backgrounds, keep them out of layout calculations, and verify phone portrait readability before shipping them.

## 5. Recommended Art Style

**Mood:** Polished modern tycoon with a wink: aspirational, compact, business-themed, slightly satirical, but not childish or meme-heavy.

**Colour direction:** Preserve the dark UI and gold money accent. Let each industry own one highlight colour from existing tokens. Use off-white highlights and charcoal shadows for readability.

**Line/rendering style:** Chunky semi-flat vector or light 3D render style, with clear silhouettes, soft bevels, and restrained detail. Icons should survive at 44px.

**Icon style:** One central metaphor per icon, one accent colour, transparent or simple dark rounded-square background. Avoid tiny scenes inside icons.

**Portrait style:** Fictional professional bust portraits, friendly and expressive, with role cues from accessories/posture. No real people, no celebrity references, no company marks.

**Background style:** Low-contrast abstract business patterns, dark gradients, and simple city/office motifs. Backgrounds should support numbers and buttons, never compete with them.

**UI decoration style:** Small, repeatable accents: badge shapes, subtle patterns, status marks, and industry colour strips. Avoid full decorative frames around every card.

**Avoid:** realistic corporate stock art, over-detailed miniatures, copyrighted brands, recognisable logos, real-person likenesses, embedded text in generated images, muddy low-contrast art, noisy backgrounds, and heavy animation or canvas rendering.

## 6. Asset Naming Convention

Use stable paths under `public/assets/` so assets are replaceable without changing the build pipeline.

```text
public/assets/brand/app_icon.svg
public/assets/icons/ui/icon_cash.svg
public/assets/icons/ui/icon_upgrade.svg
public/assets/icons/ui/fallback_business.svg
public/assets/icons/work/work_shift.svg
public/assets/icons/work/work_promotion.svg
public/assets/icons/industries/industry_food.svg
public/assets/icons/businesses/business_food_truck.svg
public/assets/icons/roles/role_operator.svg
public/assets/icons/upgrades/upgrade_tech_profit_2x.svg
public/assets/patterns/pattern_coin_grid.svg
public/assets/portraits/employees/employee_operator_01.webp
```

Rules:

- Prefix by asset family: `icon_`, `fallback_`, `work_`, `industry_`, `business_`, `role_`, `upgrade_`, `pattern_`, `employee_`.
- Match content ids exactly where practical: `food_truck`, `tech_profit_2x`, `operator`.
- Use SVG for placeholder and simple system icons.
- Use WebP or PNG only for final richer portraits or illustrations.
- Do not encode state such as affordability, level, or owned count into filenames.

## 7. Art Manifest Proposal

The real manifest should not be wired until components are ready to read optional image paths. An unwired example has been added at `src/content/artManifest.example.ts`.

Proposed shape:

```ts
export const artManifest = {
  fallback: {
    businessIcon: '/assets/icons/ui/fallback_business.svg',
    industryIcon: '/assets/icons/ui/fallback_industry.svg',
    roleIcon: '/assets/icons/ui/fallback_role.svg',
  },
  brand: {
    appIcon: '/assets/brand/app_icon.svg',
  },
  ui: {
    cash: '/assets/icons/ui/icon_cash.svg',
    upgrade: '/assets/icons/ui/icon_upgrade.svg',
    milestone: '/assets/icons/ui/icon_milestone.svg',
    ascend: '/assets/icons/ui/icon_ascend.svg',
  },
  work: {
    shift: '/assets/icons/work/work_shift.svg',
    promotion: '/assets/icons/work/work_promotion.svg',
  },
  industries: {
    food: {
      icon: '/assets/icons/industries/industry_food.svg',
      banner: '/assets/banners/industries/industry_food.webp',
      pattern: '/assets/patterns/pattern_coin_grid.svg',
    },
    retail: {
      icon: '/assets/icons/industries/industry_retail.svg',
      banner: '/assets/banners/industries/industry_retail.webp',
      pattern: '/assets/patterns/pattern_office_grid.svg',
    },
    tech: {
      icon: '/assets/icons/industries/industry_tech.svg',
      banner: '/assets/banners/industries/industry_tech.webp',
      pattern: '/assets/patterns/pattern_chart_lines.svg',
    },
    finance: {
      icon: '/assets/icons/industries/industry_finance.svg',
      banner: '/assets/banners/industries/industry_finance.webp',
      pattern: '/assets/patterns/pattern_chart_lines.svg',
    },
  },
  businesses: {
    lemonade: { icon: '/assets/icons/businesses/business_lemonade.svg' },
    food_truck: { icon: '/assets/icons/businesses/business_food_truck.svg' },
    pizzeria: { icon: '/assets/icons/businesses/business_pizzeria.svg' },
    sushi_bar: { icon: '/assets/icons/businesses/business_sushi_bar.svg' },
    corner_shop: { icon: '/assets/icons/businesses/business_corner_shop.svg' },
    barbershop: { icon: '/assets/icons/businesses/business_barbershop.svg' },
    gym: { icon: '/assets/icons/businesses/business_gym.svg' },
    department_store: { icon: '/assets/icons/businesses/business_department_store.svg' },
    mobile_app: { icon: '/assets/icons/businesses/business_mobile_app.svg' },
    streaming: { icon: '/assets/icons/businesses/business_streaming.svg' },
    saas: { icon: '/assets/icons/businesses/business_saas.svg' },
    ai_lab: { icon: '/assets/icons/businesses/business_ai_lab.svg' },
    apartments: { icon: '/assets/icons/businesses/business_apartments.svg' },
    fund: { icon: '/assets/icons/businesses/business_fund.svg' },
    skyscraper: { icon: '/assets/icons/businesses/business_skyscraper.svg' },
  },
  roles: {
    operator: { icon: '/assets/icons/roles/role_operator.svg' },
    runner: { icon: '/assets/icons/roles/role_runner.svg' },
    closer: { icon: '/assets/icons/roles/role_closer.svg' },
    buyer: { icon: '/assets/icons/roles/role_buyer.svg' },
  },
  employees: {
    fallback: { portrait: '/assets/portraits/employees/employee_fallback.webp' },
  },
  upgrades: {
    lemonade_2x: { icon: '/assets/icons/upgrades/upgrade_lemonade_2x.svg' },
    food_industry_25: { icon: '/assets/icons/upgrades/upgrade_food_industry_25.svg' },
    global_speed_15: { icon: '/assets/icons/upgrades/upgrade_global_speed_15.svg' },
    tech_profit_2x: { icon: '/assets/icons/upgrades/upgrade_tech_profit_2x.svg' },
  },
  prestige: {
    ascend: '/assets/icons/ui/icon_ascend.svg',
    point: '/assets/icons/prestige/prestige_point.svg',
  },
} as const
```

## 8. Image-Generation Prompt Pack

Prompt templates are also copied to `art-prompts/README.md`.

### Industry Icon

```text
Modern mobile tycoon game industry icon for [INDUSTRY_NAME]. Polished semi-flat vector-like 3D style, chunky readable silhouette, one strong central business symbol and one small supporting object, transparent or simple dark rounded-square background, [INDUSTRY_ACCENT] accent colour. Slightly satirical but polished, not childish. No text, no logos, no copyrighted brands, no recognisable real people. Must remain readable at 44px on a dark phone UI.
```

### Business Icon

```text
Modern mobile tycoon game business icon for [BUSINESS_NAME] in [INDUSTRY_NAME]. One clear object or storefront metaphor, polished semi-flat vector-like 3D rendering, strong silhouette, restrained detail, transparent or simple dark rounded-square background, [INDUSTRY_ACCENT] highlight. No text, no logos, no brands, no real people. Designed for 44px mobile business cards.
```

### Work / Career Icon

```text
Work/Career icon for a mobile idle tycoon game: [CAREER_CONCEPT]. Briefcase, wage, promotion, or time-card metaphor, polished vector style, compact silhouette, blue and gold accents, transparent background. No text, no logos, no real people. Readable at 44px in a dark phone UI.
```

### Employee Portrait

```text
Fictional employee portrait for a modern mobile tycoon game: [ROLE_NAME], [ROLE_TRAITS]. Bust portrait, friendly professional, stylised semi-flat rendering, simple dark gradient background, clear role cue through clothing/accessory/posture, no text, no logos, no copyrighted brands, no real-person likeness. Readable at 64px and polished at 512px.
```

### Role Icon

```text
Role badge icon for [ROLE_NAME] in a business tycoon game. Simple SVG-like vector symbol representing [ROLE_FUNCTION], bold rounded strokes, transparent background, [ROLE_ACCENT] plus off-white, no text, no logos, no brands. Readable at 24px and consistent with a dark mobile UI.
```

### Upgrade Icon

```text
Upgrade icon for [UPGRADE_NAME] in a mobile tycoon game. Polished vector-like icon, compact metaphor for [UPGRADE_EFFECT], centred on transparent or simple dark rounded-square background, gold accent plus optional [INDUSTRY_ACCENT]. No text, no logos, no brands, no real people. Readable at 44px.
```

### Milestone / Celebration Icon

```text
Milestone celebration icon for [MILESTONE_EFFECT] in a mobile tycoon game. Static polished vector style, trophy/star/coin/speed motif, gold accent, transparent background, no text, no logos, no confetti clutter. Readable at 32px and suitable for lightweight toasts or card hints.
```

### Event Card Illustration

```text
Event card illustration for a modern tycoon game: [EVENT_CONCEPT]. Wide mobile card composition, 16:9 crop safe, simplified business-world scene, polished semi-flat rendering, dark UI-friendly background, clear focal point, quiet edges for UI overlay. Slightly satirical but premium. No readable text, no logos, no copyrighted brands, no recognisable real people.
```

### Founder Lifestyle / Status Reward Image

```text
Founder lifestyle/status reward image for a mobile tycoon game: [REWARD_CONCEPT]. Aspirational but tasteful success scene, polished semi-flat 3D/vector-like rendering, strong central reward object, simple premium background, mobile-first composition. No luxury brand logos, no real locations, no recognisable real people, no text.
```

### Background Pattern

```text
Tileable subtle background pattern for a dark mobile tycoon UI: [PATTERN_CONCEPT]. Very low contrast, simple geometric business motif, no text, no logos, no brands, no characters. Must not reduce text readability, must work in phone portrait, lightweight SVG-friendly shapes only.
```

## 9. Specific Prompts for Current Content

### Industries

```text
Modern mobile tycoon game industry icon for Food & Hospitality. Central cloche and lemonade glass, warm red-orange accent, polished semi-flat vector-like 3D style, transparent or simple dark rounded-square background. No text, no logos, no brands, readable at 44px.
```

```text
Modern mobile tycoon game industry icon for Retail & Services. Storefront awning and small shopping bag, cyan accent, polished semi-flat vector-like 3D style, transparent or simple dark rounded-square background. No text, no logos, readable at 44px.
```

```text
Modern mobile tycoon game industry icon for Tech & Media. Smartphone with abstract play/network nodes, purple accent, polished semi-flat vector-like 3D style, transparent or simple dark rounded-square background. No text, no logos, readable at 44px.
```

```text
Modern mobile tycoon game industry icon for Finance & Property. Office tower with coin and upward abstract chart motif, green accent, polished semi-flat vector-like 3D style, transparent or simple dark rounded-square background. No text, no logos, readable at 44px.
```

### Businesses

```text
Mobile tycoon business icon for Lemonade Stand. Small lemonade counter with pitcher and lemons, warm red-orange highlight, polished semi-flat 3D icon, transparent or simple dark rounded-square background, no text, no logos, readable at 44px.
```

```text
Mobile tycoon business icon for Food Truck. Compact food truck silhouette with serving window and steam cue, warm red-orange highlight, polished semi-flat 3D icon, no text, no logos, readable at 44px.
```

```text
Mobile tycoon business icon for Pizzeria. Pizza oven and one pizza slice as central shapes, warm red-orange highlight, polished semi-flat 3D icon, no text, no logos, readable at 44px.
```

```text
Mobile tycoon business icon for Sushi Bar. Sushi board with two rolls and chopsticks, warm red-orange highlight, polished semi-flat 3D icon, no text, no logos, readable at 44px.
```

```text
Mobile tycoon business icon for Corner Shop. Small storefront with awning and grocery bag, cyan retail accent, polished semi-flat 3D icon, no text, no logos, readable at 44px.
```

```text
Mobile tycoon business icon for Barbershop. Barber chair and simple pole shape without text, cyan retail accent, polished semi-flat 3D icon, no logos, readable at 44px.
```

```text
Mobile tycoon business icon for Gym Franchise. Dumbbell with compact storefront or gym mat, cyan retail accent, polished semi-flat 3D icon, no text, no logos, readable at 44px.
```

```text
Mobile tycoon business icon for Department Store. Multi-level shop building with display windows and shopping bag, cyan retail accent, polished semi-flat 3D icon, no text, no logos, readable at 44px.
```

```text
Mobile tycoon business icon for Mobile App. Smartphone with abstract app tiles and coin spark, purple tech accent, polished semi-flat 3D icon, no text, no logos, readable at 44px.
```

```text
Mobile tycoon business icon for Streaming Channel. Monitor with generic play symbol and broadcast waves, purple tech accent, polished semi-flat 3D icon, no platform logos, no text, readable at 44px.
```

```text
Mobile tycoon business icon for SaaS Platform. Cloud server stack with connected nodes, purple tech accent, polished semi-flat 3D icon, no text, no logos, readable at 44px.
```

```text
Mobile tycoon business icon for AI Lab. Lab desk with abstract neural chip and robot arm silhouette, purple tech accent, polished semi-flat 3D icon, no text, no logos, readable at 44px.
```

```text
Mobile tycoon business icon for Rental Apartments. Compact apartment building with key and coin motif, green finance/property accent, polished semi-flat 3D icon, no text, no logos, readable at 44px.
```

```text
Mobile tycoon business icon for Investment Fund. Portfolio folder, coin stack, and upward abstract chart, green finance accent, polished semi-flat 3D icon, no text, no logos, readable at 44px.
```

```text
Mobile tycoon business icon for Skyscraper. Tall modern skyscraper with small gold crown light, green finance/property accent, polished semi-flat 3D icon, no text, no logos, readable at 44px.
```

### Work / Career

```text
Work shift icon for a mobile tycoon game. Briefcase with time card and small coin, blue and gold accents, polished vector style, transparent background, no text, no logos, readable at 44px.
```

```text
Promotion icon for a mobile tycoon career ladder. Upward arrow over a briefcase badge with small gold sparkle, polished vector style, transparent background, no text, no logos, readable at 44px.
```

### Roles

```text
Role badge icon for Operator. Control panel toggle with circular automation arrow, bold rounded vector strokes, blue-gold accent, transparent background, no text, no logos, readable at 24px.
```

```text
Role badge icon for Runner. Fast delivery arrow and small package, bold rounded vector strokes, orange-gold accent, transparent background, no text, no logos, readable at 24px.
```

```text
Role badge icon for Closer. Handshake and closing checkmark, bold rounded vector strokes, green-gold accent, transparent background, no text, no logos, readable at 24px.
```

```text
Role badge icon for Buyer. Price tag and downward cost arrow, bold rounded vector strokes, cyan-gold accent, transparent background, no text, no logos, readable at 24px.
```

### Upgrades

```text
Upgrade icon for Premium Lemons. Glossy lemons with small gold multiplier spark, polished vector-like icon, simple dark rounded-square background, no text, no logos, readable at 44px.
```

```text
Upgrade icon for Celebrity Chef. Chef hat with gold star and cloche, polished vector-like icon, no real-person likeness, no text, no logos, readable at 44px.
```

```text
Upgrade icon for Logistics Overhaul. Route arrows around compact delivery truck and clock, gold and blue accents, polished vector-like icon, no text, no logos, readable at 44px.
```

```text
Upgrade icon for Viral Algorithm. Abstract network graph with upward signal burst, purple and gold accents, polished vector-like icon, no text, no platform logos, readable at 44px.
```

### Background Patterns

```text
Tileable tiny coin grid pattern for a dark mobile tycoon UI. Very low contrast gold circles and tiny highlights, simple SVG-friendly shapes, no text, no logos, must not reduce readability.
```

```text
Tileable upward chart lines pattern for a dark mobile tycoon UI. Very low contrast thin green lines and small nodes, simple SVG-friendly shapes, no text, no logos, must not reduce readability.
```

```text
Tileable office window grid pattern for a dark mobile tycoon UI. Very low contrast blue-gray window rectangles, simple geometric SVG shapes, no text, no logos, must remain subtle behind cards.
```

### Future / Deferred Asset Prompts

- Founder avatar: fictional founder portrait with no real-person likeness.
- Networking event: wide mobile event card with fictional professionals and no readable sponsor logos.
- Awards night: trophy/stage card with no real awards branding.
- Luxury car: generic premium vehicle silhouette with no brand marks.
- Property purchase: stylised building key and skyline, no real locations.
- Gala invitation: abstract invitation card, no readable text.
- Media appearance: generic studio lights and microphone, no network logos.
- Office upgrade: premium office desk and city view, no brand devices.
- Private island: tasteful status reward scene, no real place or logos.
- Mogul lifestyle scene: aspirational but satirical business success vignette, no real people.

## 10. Placeholder Strategy

- Keep emoji business icons in `src/content/businesses.ts` until UI cards read from a manifest.
- Use the lightweight SVG placeholders under `public/assets/icons/` for future wiring, not as final art.
- Use role SVG badges for Operator, Runner, Closer, and Buyer before generating employee portraits.
- Keep Work/Career using the existing emoji until `WorkCard` is fully integrated and image fallback handling exists.
- Use CSS gradients or the new tileable SVG patterns for industry decoration, but only after checking text contrast.
- Use fixed icon boxes: 44x44 for business cards/tabs, 64x64 for larger placeholder panels, 512x512 for final portraits.
- Add an image fallback path before replacing emoji broadly.
- Mark decorative pattern layers `aria-hidden`.
- Do not block gameplay or employee implementation on final art.

## 11. Optional Lightweight Placeholder Assets

Created in this pass:

| Path | Purpose |
| --- | --- |
| `public/assets/icons/ui/fallback_business.svg` | Generic business fallback. |
| `public/assets/icons/ui/fallback_industry.svg` | Generic industry fallback. |
| `public/assets/icons/ui/fallback_role.svg` | Generic role fallback. |
| `public/assets/icons/ui/icon_cash.svg` | Cash/HUD placeholder. |
| `public/assets/icons/ui/icon_buy.svg` | Buy action placeholder. |
| `public/assets/icons/ui/icon_income_rate.svg` | Income-rate placeholder. |
| `public/assets/icons/ui/icon_locked.svg` | Locked-state placeholder. |
| `public/assets/icons/ui/icon_staff.svg` | Staff placeholder. |
| `public/assets/icons/ui/icon_unaffordable.svg` | Unaffordable-state placeholder. |
| `public/assets/icons/ui/icon_upgrade.svg` | Upgrade placeholder. |
| `public/assets/icons/ui/icon_milestone.svg` | Milestone/celebration placeholder. |
| `public/assets/icons/ui/icon_ascend.svg` | Ascend/prestige placeholder. |
| `public/assets/icons/work/work_shift.svg` | Work shift placeholder. |
| `public/assets/icons/work/work_promotion.svg` | Promotion placeholder. |
| `public/assets/icons/industries/*.svg` | One generated placeholder for each current industry. |
| `public/assets/icons/businesses/*.svg` | One generated placeholder for each current business. |
| `public/assets/banners/industries/*.svg` | One generated banner placeholder for each current industry. |
| `public/assets/icons/roles/role_operator.svg` | Operator role placeholder. |
| `public/assets/icons/roles/role_runner.svg` | Runner role placeholder. |
| `public/assets/icons/roles/role_closer.svg` | Closer role placeholder. |
| `public/assets/icons/roles/role_buyer.svg` | Buyer role placeholder. |
| `public/assets/icons/roles/role_gambler.svg` | Deferred Gambler role placeholder. |
| `public/assets/icons/roles/role_auditor.svg` | Deferred Auditor role placeholder. |
| `public/assets/icons/roles/role_hr.svg` | Deferred HR role placeholder. |
| `public/assets/icons/upgrades/*.svg` | One generated placeholder for each current upgrade. |
| `public/assets/icons/milestones/*.svg` | Generated profit, speed, and cost milestone placeholders. |
| `public/assets/icons/prestige/*.svg` | Prestige point and reset badge placeholders. |
| `public/assets/states/*.svg` | Empty, locked, and unaffordable state placeholders. |
| `public/assets/portraits/employees/employee_fallback.svg` | Generic employee fallback portrait. |
| `public/assets/visuals/prestige/prestige_empire_reset.svg` | Prestige visual placeholder. |
| `public/assets/patterns/pattern_coin_grid.svg` | Tileable coin pattern placeholder. |
| `public/assets/patterns/pattern_chart_lines.svg` | Tileable chart-line pattern placeholder. |
| `public/assets/patterns/pattern_office_grid.svg` | Tileable office-window pattern placeholder. |
| `public/assets/patterns/pattern_subtle_dots.svg` | Tileable subtle dot pattern placeholder. |
| `public/assets/patterns/pattern_city_blocks.svg` | Tileable city block pattern placeholder. |
| `public/assets/patterns/pattern_diagonal_stripes.svg` | Tileable diagonal stripe pattern placeholder. |
| `public/assets/patterns/pattern_ledger_lines.svg` | Tileable ledger-line pattern placeholder. |
| `public/assets/patterns/pattern_food.svg` | Food industry micro-pattern placeholder. |
| `public/assets/patterns/pattern_retail.svg` | Retail industry micro-pattern placeholder. |
| `public/assets/patterns/pattern_tech.svg` | Tech industry micro-pattern placeholder. |
| `public/assets/patterns/pattern_finance.svg` | Finance industry micro-pattern placeholder. |

These files are intentionally unwired. They do not modify gameplay, save/load, economy, employee, career, or business logic.

## 12. Implementation Notes

1. Keep art files under `public/assets/` unless a component needs bundler-managed imports.
2. Promote `src/content/artManifest.example.ts` to `src/content/artManifest.ts` only when UI components are ready for optional image paths.
3. Update cards/components to prefer manifest assets, then fall back to current emoji.
4. Keep alt text tied to content names, such as `alt="Food Truck"`.
5. Use empty `alt=""` or `aria-hidden` for purely decorative patterns.
6. Reserve dimensions in CSS to avoid layout shift while images load.
7. Add `onError` fallback handling before relying on external path strings.
8. Keep mobile density high: icons should help scanning, not expand card height.
9. Test narrow phone widths before replacing emoji with larger image assets.
10. Keep decorative patterns low contrast and removable.
11. Avoid broad refactors and do not put asset choices into economy or state logic.
12. Update this plan as employee templates, event systems, and prestige UI become real content.

## Validation Note

Commands run after this update:

- `npm.cmd run lint` - passed.
- `npm.cmd test` - passed, 26 test files and 146 tests.
- `npm.cmd run build` - passed.
- `npm run typecheck` was not run because `package.json` does not define a `typecheck` script; the build command runs `tsc -b`.
- Manifest asset-path check - passed, including registered generated PNG assets.
- SVG XML parse check - passed, 121 generated SVG files parse as XML.
- The real manifest now registers all current industries, businesses, upgrades, roles, employee portraits, generated background, mascot poses, money props, and cash-burst VFX frames.

Files created:

- `art-prompts/README.md`
- `src/content/artManifest.example.ts`
- `public/assets/brand/app_icon.svg`
- `public/assets/brand/brand_mark_mono.svg`
- `public/assets/banners/industries/industry_food.svg`
- `public/assets/banners/industries/industry_retail.svg`
- `public/assets/banners/industries/industry_tech.svg`
- `public/assets/banners/industries/industry_finance.svg`
- `public/assets/icons/businesses/business_lemonade.svg`
- `public/assets/icons/businesses/business_food_truck.svg`
- `public/assets/icons/businesses/business_pizzeria.svg`
- `public/assets/icons/businesses/business_sushi_bar.svg`
- `public/assets/icons/businesses/business_corner_shop.svg`
- `public/assets/icons/businesses/business_barbershop.svg`
- `public/assets/icons/businesses/business_gym.svg`
- `public/assets/icons/businesses/business_department_store.svg`
- `public/assets/icons/businesses/business_mobile_app.svg`
- `public/assets/icons/businesses/business_streaming.svg`
- `public/assets/icons/businesses/business_saas.svg`
- `public/assets/icons/businesses/business_ai_lab.svg`
- `public/assets/icons/businesses/business_apartments.svg`
- `public/assets/icons/businesses/business_fund.svg`
- `public/assets/icons/businesses/business_skyscraper.svg`
- `public/assets/icons/industries/industry_food.svg`
- `public/assets/icons/industries/industry_retail.svg`
- `public/assets/icons/industries/industry_tech.svg`
- `public/assets/icons/industries/industry_finance.svg`
- `public/assets/icons/milestones/milestone_profit.svg`
- `public/assets/icons/milestones/milestone_speed.svg`
- `public/assets/icons/milestones/milestone_cost.svg`
- `public/assets/icons/prestige/prestige_point.svg`
- `public/assets/icons/prestige/prestige_reset_badge.svg`
- `public/assets/icons/ui/fallback_business.svg`
- `public/assets/icons/ui/fallback_industry.svg`
- `public/assets/icons/ui/fallback_role.svg`
- `public/assets/icons/ui/icon_buy.svg`
- `public/assets/icons/ui/icon_cash.svg`
- `public/assets/icons/ui/icon_income_rate.svg`
- `public/assets/icons/ui/icon_locked.svg`
- `public/assets/icons/ui/icon_staff.svg`
- `public/assets/icons/ui/icon_unaffordable.svg`
- `public/assets/icons/ui/icon_upgrade.svg`
- `public/assets/icons/ui/icon_milestone.svg`
- `public/assets/icons/ui/icon_ascend.svg`
- `public/assets/icons/work/work_shift.svg`
- `public/assets/icons/work/work_promotion.svg`
- `public/assets/icons/roles/role_auditor.svg`
- `public/assets/icons/roles/role_operator.svg`
- `public/assets/icons/roles/role_runner.svg`
- `public/assets/icons/roles/role_closer.svg`
- `public/assets/icons/roles/role_buyer.svg`
- `public/assets/icons/roles/role_gambler.svg`
- `public/assets/icons/roles/role_hr.svg`
- `public/assets/icons/upgrades/upgrade_lemonade_2x.svg`
- `public/assets/icons/upgrades/upgrade_food_industry_25.svg`
- `public/assets/icons/upgrades/upgrade_global_speed_15.svg`
- `public/assets/icons/upgrades/upgrade_tech_profit_2x.svg`
- `public/assets/patterns/pattern_coin_grid.svg`
- `public/assets/patterns/pattern_chart_lines.svg`
- `public/assets/patterns/pattern_city_blocks.svg`
- `public/assets/patterns/pattern_diagonal_stripes.svg`
- `public/assets/patterns/pattern_finance.svg`
- `public/assets/patterns/pattern_food.svg`
- `public/assets/patterns/pattern_ledger_lines.svg`
- `public/assets/patterns/pattern_office_grid.svg`
- `public/assets/patterns/pattern_retail.svg`
- `public/assets/patterns/pattern_subtle_dots.svg`
- `public/assets/patterns/pattern_tech.svg`
- `public/assets/portraits/employees/employee_fallback.svg`
- `public/assets/states/state_empty_prestige.svg`
- `public/assets/states/state_empty_staff.svg`
- `public/assets/states/state_empty_upgrades.svg`
- `public/assets/states/state_locked.svg`
- `public/assets/states/state_unaffordable.svg`
- `public/assets/visuals/prestige/prestige_empire_reset.svg`
- `public/assets/generated/backgrounds/tycoon_city_background.png`
- `public/assets/generated/mascot/*.png`
- `public/assets/generated/props/*.png`
- `public/assets/generated/vfx/*.png`

Files changed:

- `art-plan.md`
- `CHANGELOG.md`
- `art-missing.md`
- `docs/MISSING_ART.md`
- `src/content/artManifest.ts`
- `src/content/artManifest.test.ts`
- `src/store/buildView.ts`
- `src/ui/employees/EmployeesScreen.tsx`
- `src/ui/shared/art.ts`
- `src/App.tsx`
- `src/ui/styles/global.css`

Blockers and assumptions:

- Newly generated business, industry, upgrade, and employee portrait SVGs are registered in `src/content/artManifest.ts`; employee portraits are used in the Staff and Hire UI.
- Generated PNG background, mascot poses, money props, and VFX frames are registered in `src/content/artManifest.ts`; the background, founder pose, money bag, and cash stack are used in the app shell ambient layer.
- No gameplay, economy, save/load, career, or business logic was changed.
