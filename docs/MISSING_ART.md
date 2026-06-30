# Missing Art - Tycoon Empire

This document is now a generated/implemented art ledger. It keeps the original
missing-art punch list visible, but marks each generated item instead of
deleting the record.

The authored art registry lives in `src/content/artManifest.ts`. The coverage
test `src/content/artManifest.test.ts` verifies that every registered path
exists and that registry keys point at real content ids.

## Current Broken References

**None.** Every path currently referenced by the art manifest exists on disk.

## Previously Missing, Now Generated and Implemented

### Business Icons

Path format: `public/assets/icons/businesses/business_<id>.svg`.

| Industry | Ids | Status |
|---|---|---|
| Logistics | `courier`, `trucking`, `cargo_port`, `air_freight` | Generated and registered |
| Energy | `solar_farm`, `wind_park`, `hydro_dam`, `fusion_plant` | Generated and registered |
| Space | `satellite`, `rocket_pad`, `asteroid_mine`, `mars_colony` | Generated and registered |

### Industry Assets

Path formats:

- Icon: `public/assets/icons/industries/industry_<id>.svg`
- Banner: `public/assets/banners/industries/industry_<id>.svg`
- Pattern: `public/assets/patterns/pattern_<id>.svg`

| Industry ids | Status |
|---|---|
| `logistics`, `energy`, `space` | Icons, banners, and patterns generated and registered |

### Upgrade Icons

Path format: `public/assets/icons/upgrades/upgrade_<id>.svg`.

| Id | Status |
|---|---|
| `retail_profit_2x` | Generated and registered |
| `logistics_profit_2x` | Generated and registered |
| `finance_profit_2x` | Generated and registered |
| `energy_profit_2x` | Generated and registered |
| `space_profit_2x` | Generated and registered |
| `food_speed_2x` | Generated and registered |
| `tech_speed_2x` | Generated and registered |
| `global_profit_2x` | Generated and registered |
| `global_speed_2x` | Generated and registered |
| `global_profit_3x` | Generated and registered |

### Employee Portraits

Path format: `public/assets/portraits/employees/<templateId>.svg`.

All current employee templates have generated portraits and are registered in
`ART_EMPLOYEES`. The Staff and Hire UI now renders portraits through
`employeeArt(templateId)`.

### Generated Raster Polish

These PNG assets were generated, cleaned up, registered in `ART_GENERATED`, and
the ambient background/mascot/money props are wired through the app shell.

| Group | Paths | Status |
|---|---|---|
| Background | `public/assets/generated/backgrounds/tycoon_city_background.png` | Generated, registered, and wired |
| Founder mascot | `public/assets/generated/mascot/*.png` | Four poses plus source sheet generated and registered |
| Money props | `public/assets/generated/props/*.png` | Six props plus source sheet generated and registered |
| Cash burst VFX | `public/assets/generated/vfx/*.png` | Eight animation frames plus source sheet generated and registered |

## Still Optional / Emoji-Based

The post-launch depth features remain intentionally emoji-based and introduce no
current SVG gaps:

- Prestige talents.
- Ascension milestones.
- L5 specialisations.
- Golden Deals / Time-Warp.
- Contracts board.
- Employee fusion and rarity badges.

Future art passes can add branded SVGs for these, but they are optional polish,
not current missing-art blockers.
