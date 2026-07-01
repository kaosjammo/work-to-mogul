# Arcade assets — Space Salvage Shooter (Foozle "Void" packs)

Runtime art for the **Space Salvage Shooter** mini-game (see `dev-progress.md` /
`roadmap.md`). Sourced from six Foozle **Void** sprite packs the user provided as
zips under `art-prompts/`. Only the useful still-frame runtime files were copied
into a **source-controlled** public path; the game never reads from `dist/`.

## License

**CC0 1.0 (Creative Commons Zero — public domain).** Confirmed from the `Readme.txt`
shipped inside every pack: *"Void — <pack> (1.0). Commissioned from Baldur. Distributed
by Foozle (www.foozle.io). License: Creative Commons Zero, CC0 … free to use and modify
for all projects, including commercial projects. Attribution not required."* Attribution
is given anyway in [`CREDITS.md`](CREDITS.md). No other third-party art is used.

## Packs found (all CC0, all imported)

| Pack (zip in `art-prompts/`) | Content | Used for |
| --- | --- | --- |
| `Foozle_2DS0011_Void_MainShip` | Player ship: bases, engines, shields, weapons, projectiles | **Player ship** (4 damage states) |
| `Foozle_2DS0012_Void_FleetPack_1` | Kla'ed fleet (8 ship types + projectiles) | **Fleet 1** enemies + enemy bullet |
| `Foozle_2DS0013_Void_FleetPack_2` | Nairan fleet | **Fleet 2** enemies |
| `Foozle_2DS0014_Void_FleetPack_3` | Nautolan fleet | **Fleet 3** enemies |
| `Foozle_2DS0015_Void_EnvironmentPack` | Backgrounds, asteroids, planets | **Asteroid debris** |
| `Foozle_2DS0016_Void_PickupsPack` | Weapon / shield / engine pickup icons | **Salvage + shield pickups** |

## Copied runtime files (25 PNGs) → `public/assets/arcade/foozle/`

All paths are registered in `src/content/arcadeManifest.ts`; a test
(`src/content/arcadeManifest.test.ts`) asserts every one exists on disk.

```
public/assets/arcade/foozle/
├── main-ship/     ship-full.png, ship-slight.png, ship-damaged.png, ship-critical.png   (48×48)
├── fleet-1/       fighter/scout/frigate/bomber.png (64×64), dreadnought.png (128×128), bullet.png (16×16)
├── fleet-2/       fighter/scout/frigate/bomber.png (64×64), dreadnought.png (128×128)
├── fleet-3/       fighter/scout/frigate/bomber.png (64×64), dreadnought.png (128×128)
├── pickups/       salvage-weapon.png, salvage-core.png, shield.png   (480×32 — 15-frame spin sheets)
└── environment/   asteroid.png (96×96), asteroid-explode.png (768×96 — 8-frame sheet, reserved)
```

### In-game role of each asset

| Element | Asset | Notes |
| --- | --- | --- |
| Player ship | `main-ship/ship-*.png` | Hull swaps by shields left (full → critical) |
| Enemies | `fleet-{1,2,3}/{fighter,scout,frigate,bomber}.png` | Drawn rotated 180° (Void ships face up) |
| Bosses | `fleet-{1,2,3}/dreadnought.png` | 128×128, appear in Stages 4–5 |
| Enemy fire | `fleet-1/bullet.png` | Only single-frame enemy projectile shipped |
| Player fire | *drawn shape* (cyan bolt) | Source projectiles are wide anim strips |
| Salvage pickups | `pickups/salvage-weapon.png`, `salvage-core.png` | Spinning; give score + cash |
| Shield pickup | `pickups/shield.png` | Restores a shield |
| Debris | `environment/asteroid.png` | Rotating hazard, destructible |
| Background | *procedural starfield* | Vertical scroll (see skipped notes) |
| Explosions | *procedural particles* | `asteroid-explode.png` reserved for future polish |

## Skipped files (intentionally not copied)

- **`.aseprite` sources & `.gif` previews** — editor/source art, not runtime.
- **Engine / destruction / shield / weapon spritesheets** per ship — animation
  strips; the game uses single "Base" frames + procedural FX to stay simple/robust.
- **Projectile anim strips** (Auto-cannon 128×32, Big Space Gun 320×32, etc.) —
  player shots are drawn as shapes; only the single-frame Kla'ed bullet is used.
- **Background parallax layers** (`Starry background … 5760×360`) & **planet**
  (`Earth-Like planet 7392×96`) — these tile **horizontally**, wrong for a
  **vertical** scroller, so the starfield is drawn procedurally instead (correct
  scroll direction, zero asset risk). Documented as a deliberate choice.
- Extra fleet ship types (battlecruiser, support, torpedo) beyond the 5 used.

## Safety / fallback

Every sprite is loaded async and drawn via a helper that returns `false` if the
image isn't loaded; the renderer then draws a simple shape (triangle ship, red
diamond enemy, grey asteroid, coloured pickup). A missing or blocked file therefore
degrades to shapes — it never breaks the mini-game. Nothing at runtime references
`dist/`; the throwaway `dist/assets/Arcade assets/` folder (which a `vite build`
wipes) is not used.
