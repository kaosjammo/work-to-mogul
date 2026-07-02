// ============================================================
//  Arcade asset manifest — runtime paths for the Space Salvage Shooter.
//  Mirrors content/artManifest.ts: maps logical ids to files under
//  /public/assets/arcade/foozle. These are Foozle "Void" packs (CC0) copied
//  OUT of the throwaway dist/ build folder into a source-controlled public path
//  (see arcade-assets.md + CREDITS.md). The shooter preloads these and falls
//  back to drawn shapes if any image fails to load, so a missing/blocked file
//  never breaks the mini-game. A dev-time test asserts every path exists.
// ============================================================

const BASE = '/assets/arcade/foozle'

/** A still sprite (single frame). */
export interface SpriteRef {
  src: string
  w: number
  h: number
}

/** A horizontal spritesheet (frames laid out left→right, each `frameW` wide). */
export interface SheetRef {
  src: string
  frameW: number
  frameH: number
  frames: number
}

export const ARCADE_PLAYER: { hull: SpriteRef[] } = {
  // Damage states, healthiest → most damaged. The shooter picks by shield %.
  hull: [
    { src: `${BASE}/main-ship/ship-full.png`, w: 48, h: 48 },
    { src: `${BASE}/main-ship/ship-slight.png`, w: 48, h: 48 },
    { src: `${BASE}/main-ship/ship-damaged.png`, w: 48, h: 48 },
    { src: `${BASE}/main-ship/ship-critical.png`, w: 48, h: 48 },
  ],
}

export interface FleetArt {
  fighter: SpriteRef
  scout: SpriteRef
  frigate: SpriteRef
  bomber: SpriteRef
  dreadnought: SpriteRef // 128×128 "boss"
}

const fleetArt = (dir: string): FleetArt => ({
  fighter: { src: `${BASE}/${dir}/fighter.png`, w: 64, h: 64 },
  scout: { src: `${BASE}/${dir}/scout.png`, w: 64, h: 64 },
  frigate: { src: `${BASE}/${dir}/frigate.png`, w: 64, h: 64 },
  bomber: { src: `${BASE}/${dir}/bomber.png`, w: 64, h: 64 },
  dreadnought: { src: `${BASE}/${dir}/dreadnought.png`, w: 128, h: 128 },
})

// Fleet 1 = Kla'ed, Fleet 2 = Nairan, Fleet 3 = Nautolan (Foozle Void packs).
export const ARCADE_FLEETS: Record<1 | 2 | 3, FleetArt> = {
  1: fleetArt('fleet-1'),
  2: fleetArt('fleet-2'),
  3: fleetArt('fleet-3'),
}

/** Single-frame enemy projectile (only fleet-1 shipped a still bullet frame). */
export const ARCADE_ENEMY_BULLET: SpriteRef = {
  src: `${BASE}/fleet-1/bullet.png`,
  w: 16,
  h: 16,
}

// Pickups are 15-frame spin sheets (480×32). The shooter animates the spin.
// 'weapon' (salvage-weapon.png) grants a temporary firepower tier on pickup —
// previously mislabeled 'salvage' and treated as a third flavour of plain
// currency identical to 'core', despite shipping its own distinct sprite.
export const ARCADE_PICKUPS: Record<'weapon' | 'core' | 'shield', SheetRef> = {
  weapon: { src: `${BASE}/pickups/salvage-weapon.png`, frameW: 32, frameH: 32, frames: 15 },
  core: { src: `${BASE}/pickups/salvage-core.png`, frameW: 32, frameH: 32, frames: 15 },
  shield: { src: `${BASE}/pickups/shield.png`, frameW: 32, frameH: 32, frames: 15 },
}

export const ARCADE_ENV: { asteroid: SpriteRef; asteroidExplode: SheetRef } = {
  asteroid: { src: `${BASE}/environment/asteroid.png`, w: 96, h: 96 },
  // 8-frame explosion strip (768×96).
  asteroidExplode: {
    src: `${BASE}/environment/asteroid-explode.png`,
    frameW: 96,
    frameH: 96,
    frames: 8,
  },
}

/** Flat list of every arcade image path (for preloading + the manifest test). */
export function allArcadePaths(): string[] {
  const out: string[] = []
  for (const s of ARCADE_PLAYER.hull) out.push(s.src)
  for (const f of Object.values(ARCADE_FLEETS)) {
    for (const s of Object.values(f)) out.push(s.src)
  }
  out.push(ARCADE_ENEMY_BULLET.src)
  for (const p of Object.values(ARCADE_PICKUPS)) out.push(p.src)
  out.push(ARCADE_ENV.asteroid.src, ARCADE_ENV.asteroidExplode.src)
  return out
}
