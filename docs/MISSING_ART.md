# Missing Art — Tycoon Empire

The 77 SVGs under `public/assets/` cover the **original 4-industry / 15-business** scope. The content has since grown to **7 industries / 27 businesses / 14 upgrades**, so some assets are not yet authored. The game degrades gracefully (emoji fallback for businesses, `fallback_industry.svg` for industries, `milestone_*` icons for upgrades) via `src/content/artManifest.ts` + `src/ui/shared/art.ts`. This doc is the authoring punch-list.

**Coverage is enforced by a test:** `src/content/artManifest.test.ts` validates that every manifest path exists on disk, that registry keys reference real content ids, and prints the current gap list. After adding an asset, register it in `src/content/artManifest.ts` (`ART_BUSINESSES`, `ART_INDUSTRIES`, or `ART_UPGRADES`) and the icon shows automatically.

## House style (match the existing assets)

- **Container chrome:** rounded-rect background `fill="#20242d"` with `rx="14"` (business 64px) / `rx="12"` (role/industry 48px).
- **Palette:** ink `#0f1115` / `#181b22` / `#20242d` / `#2a2f3a`; accent gold `#f5c518`; text `#e7e9ee`. Use the **industry accent** as the primary hue per asset.
- **Accessibility:** every SVG has `role="img"` + a descriptive `aria-label`.
- **Format:** flat, 2–4 shapes, no gradients/filters; viewBox matches width/height.

| Industry | accent var | hex |
|---|---|---|
| Logistics & Transport | `--industry-logistics` | `#f59e0b` (amber) |
| Energy & Power | `--industry-energy` | `#a3e635` (lime) |
| Space & Frontier | `--industry-space` | `#d946ef` (fuchsia) |

---

## 1. Business icons — **12 missing** (64×64)

Path: `public/assets/icons/businesses/business_<id>.svg`. Current emoji fallback shown for reference.

**Logistics** (`#f59e0b`)
- `business_courier.svg` — 🛵 scooter / parcel
- `business_trucking.svg` — 🚛 box truck
- `business_cargo_port.svg` — 🚢 container ship / crane
- `business_air_freight.svg` — ✈️ cargo plane

**Energy** (`#a3e635`)
- `business_solar_farm.svg` — ☀️ solar panels under a sun
- `business_wind_park.svg` — 🌬️ wind turbine
- `business_hydro_dam.svg` — 🌊 dam wall + water
- `business_fusion_plant.svg` — ⚛️ reactor / atom

**Space** (`#d946ef`)
- `business_satellite.svg` — 🛰️ satellite + dish
- `business_rocket_pad.svg` — 🚀 rocket on a pad
- `business_asteroid_mine.svg` — ☄️ asteroid + drill
- `business_mars_colony.svg` — 🪐 domed colony / planet

## 2. Industry assets — **9 missing** (3 each for Logistics / Energy / Space)

- **Icon** (48×48): `public/assets/icons/industries/industry_<id>.svg` — a single emblem in the accent hue.
- **Banner** (1024×384): `public/assets/banners/industries/industry_<id>.svg` — low-opacity scene used as the industry header band (match `industry_food.svg`: dark base + accent waves/shapes at ~0.18 opacity).
- **Pattern** (48×48, tileable): `public/assets/patterns/pattern_<id>.svg` — subtle repeating motif (logistics: route lines/arrows; energy: bolts/grid; space: stars/orbits).

ids: `logistics`, `energy`, `space`.

## 3. Upgrade icons — **10 missing** (optional; 48×48)

Path: `public/assets/icons/upgrades/upgrade_<id>.svg`. **Not blocking** — they fall back to `milestone_profit.svg` / `milestone_speed.svg` by the upgrade's `effect.kind`. Author for extra polish.

`retail_profit_2x`, `logistics_profit_2x`, `finance_profit_2x`, `energy_profit_2x`, `space_profit_2x`, `food_speed_2x`, `tech_speed_2x`, `global_profit_2x`, `global_speed_2x`, `global_profit_3x`.

## 4. Optional polish

- **Raster app icons** `app_icon_192.png` + `app_icon_512.png` (export from `brand/app_icon.svg`) for cleaner PWA install on iOS/Windows; then add them to `public/manifest.webmanifest`. (SVG icon works on Android Chrome today.)
- **Employee portraits** — only `employee_fallback.svg` exists; per-archetype portraits (`portraits/employees/<templateId>.svg`) would enrich the roster/recruitment UI.
- **New employee role icons** if future roles are added beyond the current 7 (all 7 are covered).

## 5. Depth systems (Tiers 1–5) — no art required

The post-launch depth features are intentionally **emoji-based** and introduce **no new SVG gaps**: prestige **talents** (📈💵🏷️🔥🎓🧲🧑‍🏫⏱️🌙✦), **ascension milestones** (🔁🔥♾️🌌👑), L5 **specialisations** (🌙📋💨📦🌧️🎯…), **Golden Deals / Time-Warp** (⚡), the **contracts** board (🏪🧑‍💼⚙️…), and employee **fusion** (✨ rarity badges). If a later art pass wants to brand these, the natural targets are: a talent-tree node frame, an Empire-Token (✦) glyph, a Golden-Deal coin, and rarity-tier ribbons for fused employees — all optional polish, none blocking.

---

_Update this file and `src/content/artManifest.ts` together as assets land; the manifest test will confirm coverage._
