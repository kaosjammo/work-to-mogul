// ============================================================
//  Space Salvage Shooter — the fullscreen canvas mini-game (UI only).
//  A self-contained old-school vertical shooter with its OWN requestAnimationFrame
//  loop, fully isolated from the idle game's loop (which keeps ticking behind it).
//  It reads campaign state via the view store, runs a mission on <canvas>, and on
//  finish hands the FINAL METRICS to completeSpaceMission() — the engine applies
//  bounded rewards + advances the campaign. No mid-mission state is ever persisted:
//  a refresh mid-run simply closes the modal (UI-only flag) and the signal remains.
//
//  Controls — desktop: arrows/WASD to move, Space also fires. Mobile: drag to move,
//  auto-fire is always on. Assets are the Foozle Void packs (see arcadeManifest);
//  every sprite falls back to a drawn shape if its image fails to load.
// ============================================================
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSpaceShooter } from '../../store/gameStore'
import { useUiStore } from '../../store/uiStore'
import { completeSpaceMission, abortSpaceMission } from '../../store/actions'
import { haptic } from '../../lib/haptics'
import { money } from '../../engine/num'
import type { MissionResult, MissionMetrics } from '../../engine/spaceShooter'
import {
  SPACE_SHOOTER_STAGE_BY_INDEX,
  SPACE_SHOOTER_FAIL_LINES,
  type SpaceShooterStageDef,
} from '../../content/spaceShooter'
import {
  ARCADE_PLAYER,
  ARCADE_FLEETS,
  ARCADE_ENEMY_BULLET,
  ARCADE_PICKUPS,
  ARCADE_ENV,
} from '../../content/arcadeManifest'

// ---------- tiny image bank (async; shape fallback until/if loaded) ----------
interface Loaded {
  img: HTMLImageElement
  ok: boolean
}
function loadImg(src: string): Loaded {
  const img = new Image()
  const rec: Loaded = { img, ok: false }
  img.onload = () => {
    rec.ok = true
  }
  img.onerror = () => {
    rec.ok = false
  }
  img.src = src
  return rec
}
function makeBank(fleetId: 1 | 2 | 3) {
  const f = ARCADE_FLEETS[fleetId]
  return {
    hull: ARCADE_PLAYER.hull.map((s) => loadImg(s.src)),
    enemies: [f.fighter, f.scout, f.frigate, f.bomber].map((s) => loadImg(s.src)),
    boss: loadImg(f.dreadnought.src),
    bullet: loadImg(ARCADE_ENEMY_BULLET.src),
    weapon: loadImg(ARCADE_PICKUPS.weapon.src),
    core: loadImg(ARCADE_PICKUPS.core.src),
    shield: loadImg(ARCADE_PICKUPS.shield.src),
    asteroid: loadImg(ARCADE_ENV.asteroid.src),
    // Was preloaded but never actually drawn — kills just spawned generic circle
    // particles. Wired into spawnBoom()/render() below for a real impact frame.
    explosion: loadImg(ARCADE_ENV.asteroidExplode.src),
  }
}
type Bank = ReturnType<typeof makeBank>

// Draw a sprite centered at (x,y), optionally rotated. Returns false if not loaded
// (caller draws a shape fallback instead).
function drawSprite(
  ctx: CanvasRenderingContext2D,
  rec: Loaded,
  x: number,
  y: number,
  w: number,
  h: number,
  rot = 0,
): boolean {
  if (!rec.ok) return false
  ctx.save()
  ctx.translate(x, y)
  if (rot) ctx.rotate(rot)
  ctx.drawImage(rec.img, -w / 2, -h / 2, w, h)
  ctx.restore()
  return true
}
// Draw one 32×32 frame of a spinning pickup sheet (or false if not loaded).
function drawSpin(
  ctx: CanvasRenderingContext2D,
  rec: Loaded,
  frame: number,
  x: number,
  y: number,
  size: number,
): boolean {
  if (!rec.ok) return false
  const fw = 32
  const sx = (frame % 15) * fw
  ctx.drawImage(rec.img, sx, 0, fw, fw, x - size / 2, y - size / 2, size, size)
  return true
}
// Draw one 96×96 frame of the (non-looping) 8-frame explosion strip.
function drawExplosionFrame(
  ctx: CanvasRenderingContext2D,
  rec: Loaded,
  frame: number,
  x: number,
  y: number,
  size: number,
): boolean {
  if (!rec.ok) return false
  const fw = 96
  const f = Math.max(0, Math.min(7, frame))
  ctx.drawImage(rec.img, f * fw, 0, fw, fw, x - size / 2, y - size / 2, size, size)
  return true
}

/**
 * The player's shot — a short glowing "warped" energy bolt (gradient + soft
 * blur), color/width escalating with weapon tier. Procedural stand-in for a
 * future bespoke sprite: swap by adding an ARCADE_PLAYER_BULLET sheet to the
 * manifest and blitting it here, same fallback pattern as everywhere else in
 * this file. Each tier is PRE-RENDERED once to a tiny offscreen canvas —
 * shadowBlur is one of the most expensive canvas ops, and paying it per
 * bullet per frame would chug on low-end phones.
 */
const BOLT_STYLE: { core: string; edge: string; w: number; len: number }[] = [
  { core: '#ffffff', edge: '#6ee7ff', w: 5, len: 16 }, // tier 0
  { core: '#ffffff', edge: '#22d3ee', w: 6, len: 20 }, // tier 1 — twin
  { core: '#fff7d6', edge: '#ffd24a', w: 7, len: 24 }, // tier 2 — triple
]
const BOLT_PAD = 8 // room for the glow around the shape
interface BoltSprite {
  canvas: HTMLCanvasElement
  w: number // logical (CSS px) size — the canvas itself is scaled by dpr
  h: number
}
function makeBoltSprites(dpr: number): BoltSprite[] {
  return BOLT_STYLE.map((s) => {
    const w = s.w + BOLT_PAD * 2
    const h = s.len + BOLT_PAD * 2
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(w * dpr)
    canvas.height = Math.ceil(h * dpr)
    const ctx = canvas.getContext('2d')
    if (!ctx) return { canvas, w, h }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    // Draw centered: bolt tip toward the top, tail toward the bottom.
    const cx = w / 2
    const top = BOLT_PAD
    const bottom = BOLT_PAD + s.len
    ctx.shadowColor = s.edge
    ctx.shadowBlur = 7
    const grad = ctx.createLinearGradient(cx, bottom, cx, top)
    grad.addColorStop(0, 'rgba(255,255,255,0)')
    grad.addColorStop(0.55, s.edge)
    grad.addColorStop(1, s.core)
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.moveTo(cx - s.w / 2, bottom)
    ctx.lineTo(cx - s.w / 2, top + s.len * 0.3)
    ctx.quadraticCurveTo(cx, top, cx + s.w / 2, top + s.len * 0.3)
    ctx.lineTo(cx + s.w / 2, bottom)
    ctx.closePath()
    ctx.fill()
    return { canvas, w, h }
  })
}
function drawBolt(ctx: CanvasRenderingContext2D, sprites: BoltSprite[], x: number, y: number, tier: number) {
  const s = sprites[Math.min(2, tier)]
  // Anchor roughly where the old rect bolt sat: centered on x, tip above y.
  ctx.drawImage(s.canvas, x - s.w / 2, y - s.h * 0.6, s.w, s.h)
}

// ---------- entity types (plain objects held in refs, never React state) ----------
interface P { x: number; y: number; vx: number; vy: number }
interface Bullet extends P { r: number }
/** Player shot — remembers the weapon tier it was FIRED at, so an in-flight
 *  bolt keeps its look when the pickup expires mid-flight. */
interface PlayerBullet extends Bullet { tier: number }
interface Enemy extends P { r: number; hp: number; kind: number; fires: boolean; fireMs: number; boss: boolean; score: number; maxHp?: number }
interface Pickup extends P { r: number; kind: 'weapon' | 'core' | 'shield' }
interface Debris extends P { r: number; hp: number; spin: number; rot: number }
interface Particle extends P { life: number; max: number; color: string; r: number }
interface Boom extends P { r: number; t: number; dur: number }
interface Star { x: number; y: number; z: number }

const rand = (a: number, b: number) => a + Math.random() * (b - a)

// Temporary firepower tier from a weapon pickup: renews on pickup (doesn't
// stack duration), decays to base abruptly when it runs out (a clear, readable
// countdown rather than a fiddly per-tier fade).
const WEAPON_DURATION_MS = 8000
const WEAPON_FIRE_MS = [180, 150, 130] // faster reload each tier
// A short kill streak within this window builds a score multiplier — skill
// expression only (score never feeds the band/reward calc — see computeBand in
// engine/spaceShooter.ts — so this is purely cosmetic/bragging-rights safe).
const COMBO_WINDOW_MS = 1400
function comboMult(combo: number): number {
  return combo >= 15 ? 3 : combo >= 8 ? 2 : combo >= 4 ? 1.5 : 1
}

// ---------- the canvas game (own rAF loop; mounts only while playing) ----------
function ShooterCanvas({
  stage,
  onEnd,
}: {
  stage: SpaceShooterStageDef
  onEnd: (m: MissionMetrics) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const d = stage.difficulty
    const bank: Bank = makeBank(stage.fleet)
    const maxShields = d.bossAtSec ? 4 : 3

    let W = 0
    let H = 0
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const boltSprites = makeBoltSprites(dpr)
    function resize() {
      const rect = canvas!.getBoundingClientRect()
      W = Math.max(1, rect.width)
      H = Math.max(1, rect.height)
      canvas!.width = Math.floor(W * dpr)
      canvas!.height = Math.floor(H * dpr)
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    // world
    const player = { x: W / 2, y: H - 74, r: 16, shields: maxShields, invMs: 0, fireMs: 0, flash: 0, weaponTier: 0, weaponMs: 0 }
    const bullets: PlayerBullet[] = []
    const enemies: Enemy[] = []
    const eBullets: Bullet[] = []
    const debris: Debris[] = []
    const pickups: Pickup[] = []
    const parts: Particle[] = []
    const booms: Boom[] = []
    const stars: Star[] = Array.from({ length: 80 }, () => ({ x: rand(0, W), y: rand(0, H), z: rand(0.3, 1) }))

    let elapsed = 0
    let enemyT = 400
    let debrisT = 900
    let salvageT = 1500
    let bossSpawned = false
    let score = 0
    let enemiesDestroyed = 0
    let salvageCollected = 0
    let finished = false

    // combo + juice state
    let combo = 0
    let comboMs = 0
    let shakeMs = 0
    let shakeDur = 0
    let shakeMag = 0
    let hitStopMs = 0

    function addShake(ms: number, mag: number) {
      shakeMs = ms
      shakeDur = ms
      shakeMag = mag
    }
    function addHitStop(ms: number) {
      hitStopMs = Math.max(hitStopMs, ms)
    }
    function spawnBoom(x: number, y: number, r: number) {
      booms.push({ x, y, vx: 0, vy: 0, r, t: 0, dur: 0.42 })
    }
    function registerKill(): number {
      // Returns the multiplier for THIS kill's score, then extends the streak.
      const mult = comboMult(combo)
      combo += 1
      comboMs = COMBO_WINDOW_MS
      return mult
    }

    // input
    const keys = new Set<string>()
    let pointerActive = false
    let pTargetX = player.x
    let pTargetY = player.y
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' ', 'a', 'w', 's', 'd'].includes(k)) e.preventDefault()
      keys.add(k)
    }
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase())
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    const pointFromEvent = (e: PointerEvent) => {
      const rect = canvas!.getBoundingClientRect()
      pTargetX = e.clientX - rect.left
      pTargetY = e.clientY - rect.top
    }
    const onPointerDown = (e: PointerEvent) => {
      pointerActive = true
      pointFromEvent(e)
    }
    const onPointerMove = (e: PointerEvent) => {
      if (pointerActive) pointFromEvent(e)
    }
    const onPointerUp = () => {
      pointerActive = false
    }
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    canvas.style.touchAction = 'none'

    function spawnParticles(x: number, y: number, color: string, n: number) {
      for (let i = 0; i < n; i++) {
        const a = rand(0, Math.PI * 2)
        const sp = rand(40, 200)
        parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: rand(0.3, 0.7), color, r: rand(1.5, 3.5) })
      }
    }
    function hurtPlayer() {
      if (player.invMs > 0) return
      player.shields -= 1
      player.invMs = 1100
      player.flash = 1
      haptic(30)
      spawnParticles(player.x, player.y, '#6ee7ff', 14)
      addShake(180, 6)
      addHitStop(70)
      combo = 0 // a hit breaks the streak — mirrors the shield-loss stakes
      comboMs = 0
      if (player.shields <= 0) end(false)
    }
    function end(survived: boolean) {
      if (finished) return
      finished = true
      const shieldBonus = Math.max(0, player.shields) * 200
      const survivalBonus = survived ? 800 : Math.round((elapsed / d.durationSec) * 300)
      const finalScore = Math.round(score + shieldBonus + survivalBonus)
      onEnd({
        survived,
        enemiesDestroyed,
        salvageCollected,
        shieldsRemaining: Math.max(0, player.shields),
        maxShields,
        score: finalScore,
      })
    }

    function spawnEnemy() {
      const kind = Math.floor(rand(0, 4))
      const r = 20
      enemies.push({
        x: rand(r + 8, W - r - 8),
        y: -r,
        vx: rand(-30, 30),
        vy: d.fallSpeed * rand(0.85, 1.15),
        r,
        hp: d.enemyHp,
        kind,
        fires: d.enemyFires && Math.random() < 0.6,
        fireMs: rand(600, 1600),
        boss: false,
        score: 100,
      })
    }
    function spawnBoss() {
      const hp = 18 + stage.number * 4
      enemies.push({
        x: W / 2,
        y: -70,
        vx: 40,
        vy: d.fallSpeed * 0.35,
        r: 48,
        hp,
        maxHp: hp,
        kind: 0,
        fires: true,
        fireMs: 800,
        boss: true,
        score: 2500,
      })
    }
    function spawnDebris() {
      const r = rand(16, 30)
      debris.push({ x: rand(r, W - r), y: -r, vx: rand(-20, 20), vy: d.fallSpeed * rand(0.7, 1), r, hp: 3, spin: rand(-2, 2), rot: 0 })
    }
    function spawnPickup() {
      const roll = Math.random()
      const kind: Pickup['kind'] = roll < 0.25 ? 'shield' : roll < 0.6 ? 'core' : 'weapon'
      const r = 14
      pickups.push({ x: rand(r, W - r), y: -r, vx: 0, vy: 70, r, kind })
    }

    function update(dt: number) {
      elapsed += dt
      const dtm = dt * 1000

      // combo decay
      if (comboMs > 0) {
        comboMs -= dtm
        if (comboMs <= 0) combo = 0
      }
      // screen-shake decay
      if (shakeMs > 0) shakeMs = Math.max(0, shakeMs - dtm)
      // weapon tier countdown — abrupt drop to base once it runs out (a fresh
      // pickup is always required to keep firepower up, so it stays a choice).
      if (player.weaponTier > 0) {
        player.weaponMs -= dtm
        if (player.weaponMs <= 0) {
          player.weaponTier = 0
          player.weaponMs = 0
        }
      }

      // stars
      for (const s of stars) {
        s.y += (30 + s.z * 90) * dt
        if (s.y > H) {
          s.y = 0
          s.x = rand(0, W)
        }
      }
      // spawns (timers in ms)
      enemyT -= dtm
      if (enemyT <= 0) {
        spawnEnemy()
        enemyT = d.enemyEveryMs * rand(0.8, 1.2)
      }
      debrisT -= dtm
      if (debrisT <= 0) {
        spawnDebris()
        debrisT = d.debrisEveryMs * rand(0.8, 1.2)
      }
      salvageT -= dtm
      if (salvageT <= 0) {
        spawnPickup()
        salvageT = d.salvageEveryMs * rand(0.8, 1.2)
      }
      if (d.bossAtSec && !bossSpawned && elapsed >= d.bossAtSec) {
        bossSpawned = true
        spawnBoss()
      }

      // player movement
      const speed = 340
      let mvx = 0
      let mvy = 0
      if (keys.has('arrowleft') || keys.has('a')) mvx -= 1
      if (keys.has('arrowright') || keys.has('d')) mvx += 1
      if (keys.has('arrowup') || keys.has('w')) mvy -= 1
      if (keys.has('arrowdown') || keys.has('s')) mvy += 1
      if (pointerActive) {
        player.x += (pTargetX - player.x) * Math.min(1, dt * 12)
        player.y += (pTargetY - player.y) * Math.min(1, dt * 12)
      } else if (mvx || mvy) {
        const len = Math.hypot(mvx, mvy) || 1
        player.x += (mvx / len) * speed * dt
        player.y += (mvy / len) * speed * dt
      }
      player.x = Math.max(player.r, Math.min(W - player.r, player.x))
      player.y = Math.max(H * 0.32, Math.min(H - player.r - 6, player.y))
      if (player.invMs > 0) player.invMs -= dtm
      if (player.flash > 0) player.flash = Math.max(0, player.flash - dt * 3)

      // auto-fire (always on; Space also counts as held) — bullet count + spread
      // scale with weapon tier (0 = single, 1 = twin, 2 = triple spread).
      player.fireMs -= dtm
      if (player.fireMs <= 0) {
        const tier = player.weaponTier
        const y0 = player.y - player.r - 2
        if (tier === 0) {
          bullets.push({ x: player.x, y: y0, vx: 0, vy: -560, r: 4, tier })
        } else if (tier === 1) {
          bullets.push({ x: player.x - 6, y: y0, vx: 0, vy: -560, r: 4, tier })
          bullets.push({ x: player.x + 6, y: y0, vx: 0, vy: -560, r: 4, tier })
        } else {
          bullets.push({ x: player.x, y: y0, vx: 0, vy: -580, r: 4, tier })
          bullets.push({ x: player.x - 7, y: y0, vx: -70, vy: -550, r: 4, tier })
          bullets.push({ x: player.x + 7, y: y0, vx: 70, vy: -550, r: 4, tier })
        }
        player.fireMs = WEAPON_FIRE_MS[Math.min(2, tier)]
      }

      // player bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i]
        b.x += b.vx * dt
        b.y += b.vy * dt
        if (b.y < -10) {
          bullets.splice(i, 1)
          continue
        }
        // vs enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
          const e = enemies[j]
          if (Math.hypot(b.x - e.x, b.y - e.y) < e.r + b.r) {
            e.hp -= 1
            bullets.splice(i, 1)
            spawnParticles(b.x, b.y, '#ffd24a', 3)
            if (e.hp <= 0) {
              const mult = registerKill()
              spawnParticles(e.x, e.y, e.boss ? '#ff7a18' : '#ff4d6d', e.boss ? 20 : 8)
              spawnBoom(e.x, e.y, e.boss ? e.r * 3.2 : e.r * 2.4)
              enemies.splice(j, 1)
              enemiesDestroyed += 1
              score += Math.round(e.score * mult)
              if (e.boss) {
                haptic(45)
                addShake(260, 10)
                addHitStop(140)
              }
            }
            break
          }
        }
      }
      // player bullets vs debris
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i]
        for (let j = debris.length - 1; j >= 0; j--) {
          const a = debris[j]
          if (Math.hypot(b.x - a.x, b.y - a.y) < a.r + b.r) {
            a.hp -= 1
            bullets.splice(i, 1)
            spawnParticles(b.x, b.y, '#cbd5e1', 3)
            if (a.hp <= 0) {
              const mult = registerKill()
              spawnParticles(a.x, a.y, '#94a3b8', 8)
              spawnBoom(a.x, a.y, a.r * 2.2)
              debris.splice(j, 1)
              score += Math.round(40 * mult)
            }
            break
          }
        }
      }

      // enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i]
        e.x += e.vx * dt
        e.y += e.vy * dt
        if (e.boss) {
          if (e.x < e.r || e.x > W - e.r) e.vx *= -1
          if (e.y > H * 0.3) e.vy = 0 // boss holds an upper lane
        }
        if (e.x < e.r || e.x > W - e.r) e.vx = Math.abs(e.vx) * (e.x < e.r ? 1 : -1)
        if (e.fires) {
          e.fireMs -= dtm
          if (e.fireMs <= 0) {
            e.fireMs = e.boss ? 520 : rand(900, 1800)
            const shots = e.boss ? 3 : 1
            for (let s = 0; s < shots; s++) {
              const spread = (s - (shots - 1) / 2) * 0.3
              eBullets.push({ x: e.x, y: e.y + e.r, vx: Math.sin(spread) * 160, vy: 220, r: 6 })
            }
          }
        }
        if (e.y - e.r > H) {
          enemies.splice(i, 1)
          continue
        }
        if (player.invMs <= 0 && Math.hypot(e.x - player.x, e.y - player.y) < e.r + player.r) {
          if (!e.boss) {
            spawnParticles(e.x, e.y, '#ff4d6d', 10)
            enemies.splice(i, 1)
          }
          hurtPlayer()
        }
      }

      // enemy bullets
      for (let i = eBullets.length - 1; i >= 0; i--) {
        const b = eBullets[i]
        b.x += b.vx * dt
        b.y += b.vy * dt
        if (b.y > H + 10 || b.x < -10 || b.x > W + 10) {
          eBullets.splice(i, 1)
          continue
        }
        if (player.invMs <= 0 && Math.hypot(b.x - player.x, b.y - player.y) < b.r + player.r * 0.8) {
          eBullets.splice(i, 1)
          hurtPlayer()
        }
      }

      // debris
      for (let i = debris.length - 1; i >= 0; i--) {
        const a = debris[i]
        a.x += a.vx * dt
        a.y += a.vy * dt
        a.rot += a.spin * dt
        if (a.y - a.r > H) {
          debris.splice(i, 1)
          continue
        }
        if (player.invMs <= 0 && Math.hypot(a.x - player.x, a.y - player.y) < a.r + player.r) {
          hurtPlayer()
        }
      }

      // pickups
      for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i]
        p.y += p.vy * dt
        if (p.y - p.r > H) {
          pickups.splice(i, 1)
          continue
        }
        if (Math.hypot(p.x - player.x, p.y - player.y) < p.r + player.r) {
          pickups.splice(i, 1)
          if (p.kind === 'shield') {
            if (player.shields < maxShields) player.shields += 1
            spawnParticles(p.x, p.y, '#46d369', 12)
          } else if (p.kind === 'weapon') {
            // Renews (doesn't stack duration) and bumps the tier by one, capped
            // at 2 — repeat pickups keep firepower topped up, not infinite.
            player.weaponTier = Math.min(2, player.weaponTier + 1)
            player.weaponMs = WEAPON_DURATION_MS
            salvageCollected += 1
            score += 80
            spawnParticles(p.x, p.y, '#ffd24a', 14)
            haptic(18)
          } else {
            salvageCollected += 1
            score += 180
            spawnParticles(p.x, p.y, '#ffd24a', 10)
          }
          if (p.kind !== 'weapon') haptic(12)
        }
      }

      // explosion animations (one-shot, not looping)
      for (let i = booms.length - 1; i >= 0; i--) {
        const b = booms[i]
        b.t += dt
        if (b.t >= b.dur) booms.splice(i, 1)
      }

      // particles
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]
        p.life += dt
        if (p.life >= p.max) {
          parts.splice(i, 1)
          continue
        }
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.vx *= 0.94
        p.vy *= 0.94
      }

      if (!finished && elapsed >= d.durationSec) end(true)
    }

    function render() {
      // background
      ctx!.fillStyle = '#070b1a'
      ctx!.fillRect(0, 0, W, H)

      // World layer: everything that should shake gets drawn inside this
      // save/translate/restore pair. HUD (below) is drawn AFTER restore so it
      // stays pinned and readable even during a big hit/boss-kill shake.
      ctx!.save()
      if (shakeMs > 0) {
        const k = shakeDur > 0 ? shakeMs / shakeDur : 0
        ctx!.translate((Math.random() * 2 - 1) * shakeMag * k, (Math.random() * 2 - 1) * shakeMag * k)
      }

      ctx!.fillStyle = '#9fb4e0'
      for (const s of stars) {
        ctx!.globalAlpha = 0.4 + s.z * 0.6
        ctx!.fillRect(s.x, s.y, s.z * 2, s.z * 2)
      }
      ctx!.globalAlpha = 1

      // pickups (spinning salvage)
      const frame = Math.floor(elapsed * 12)
      for (const p of pickups) {
        const rec = p.kind === 'shield' ? bank.shield : p.kind === 'core' ? bank.core : bank.weapon
        if (!drawSpin(ctx!, rec, frame, p.x, p.y, p.r * 2.2)) {
          ctx!.fillStyle = p.kind === 'shield' ? '#46d369' : p.kind === 'weapon' ? '#ff9f1c' : '#ffd24a'
          ctx!.beginPath()
          ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2)
          ctx!.fill()
        }
      }

      // debris (asteroids)
      for (const a of debris) {
        if (!drawSprite(ctx!, bank.asteroid, a.x, a.y, a.r * 2.1, a.r * 2.1, a.rot)) {
          ctx!.fillStyle = '#94a3b8'
          ctx!.beginPath()
          ctx!.arc(a.x, a.y, a.r, 0, Math.PI * 2)
          ctx!.fill()
        }
      }

      // enemies (drawn facing DOWN — rotate the up-facing sprites 180°)
      for (const e of enemies) {
        const rec = e.boss ? bank.boss : bank.enemies[e.kind] ?? bank.enemies[0]
        const size = e.boss ? e.r * 2 : e.r * 2.2
        if (!drawSprite(ctx!, rec, e.x, e.y, size, size, Math.PI)) {
          ctx!.fillStyle = e.boss ? '#ff7a18' : '#ff4d6d'
          ctx!.beginPath()
          ctx!.moveTo(e.x, e.y + e.r)
          ctx!.lineTo(e.x - e.r, e.y - e.r)
          ctx!.lineTo(e.x + e.r, e.y - e.r)
          ctx!.closePath()
          ctx!.fill()
        }
      }

      // enemy bullets
      for (const b of eBullets) {
        if (!drawSprite(ctx!, bank.bullet, b.x, b.y, b.r * 2.4, b.r * 2.4)) {
          ctx!.fillStyle = '#ff6b6b'
          ctx!.beginPath()
          ctx!.arc(b.x, b.y, b.r, 0, Math.PI * 2)
          ctx!.fill()
        }
      }

      // player bullets — glowing "warped" bolts, escalating with weapon tier
      // (each bolt keeps the tier it was fired at — see PlayerBullet)
      for (const b of bullets) {
        drawBolt(ctx!, boltSprites, b.x, b.y, b.tier)
      }

      // player (hull damage state by shields left)
      const hullIdx =
        player.shields <= 1 ? 3 : player.shields === 2 ? 2 : player.shields < maxShields ? 1 : 0
      const blink = player.invMs > 0 && Math.floor(elapsed * 20) % 2 === 0
      if (!blink) {
        const psize = player.r * 2.6
        if (!drawSprite(ctx!, bank.hull[hullIdx] ?? bank.hull[0], player.x, player.y, psize, psize)) {
          ctx!.fillStyle = '#6ee7ff'
          ctx!.beginPath()
          ctx!.moveTo(player.x, player.y - player.r)
          ctx!.lineTo(player.x - player.r, player.y + player.r)
          ctx!.lineTo(player.x + player.r, player.y + player.r)
          ctx!.closePath()
          ctx!.fill()
        }
      }

      // explosion animations (drawn over the wreckage they came from). No shape
      // fallback needed on a failed asset load — spawnParticles() already fires
      // at the same moment, so the kill still reads.
      for (const b of booms) {
        const t = Math.min(1, b.t / b.dur)
        const frame = Math.floor(t * 8)
        const size = b.r * (1 + t * 0.25) // a touch of expansion reads as punchier
        drawExplosionFrame(ctx!, bank.explosion, frame, b.x, b.y, size)
      }

      // particles
      for (const p of parts) {
        ctx!.globalAlpha = Math.max(0, 1 - p.life / p.max)
        ctx!.fillStyle = p.color
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx!.fill()
      }
      ctx!.globalAlpha = 1

      ctx!.restore() // end world/shake layer — HUD below is always screen-locked

      // ---------- HUD ----------
      // extraction progress bar (top)
      const pct = Math.min(1, elapsed / d.durationSec)
      ctx!.fillStyle = 'rgba(255,255,255,0.12)'
      ctx!.fillRect(10, 10, W - 20, 8)
      ctx!.fillStyle = '#6ee7ff'
      ctx!.fillRect(10, 10, (W - 20) * pct, 8)
      ctx!.fillStyle = '#cbd5e1'
      ctx!.font = '600 11px system-ui, sans-serif'
      ctx!.textAlign = 'center'
      ctx!.fillText(`EXTRACTION ${Math.floor(pct * 100)}%`, W / 2, 32)

      // boss health bar (only while a boss is alive) — readability for the
      // stage 4/5 set-piece fights, which previously had zero HP feedback.
      const boss = enemies.find((e) => e.boss)
      if (boss && boss.maxHp) {
        const bpct = Math.max(0, boss.hp / boss.maxHp)
        ctx!.fillStyle = '#cbd5e1'
        ctx!.font = '700 10px system-ui, sans-serif'
        ctx!.textAlign = 'center'
        ctx!.fillText('DREADNOUGHT', W / 2, 46)
        ctx!.fillStyle = 'rgba(255,255,255,0.12)'
        ctx!.fillRect(W / 2 - 70, 50, 140, 5)
        ctx!.fillStyle = bpct > 0.3 ? '#ff7a18' : '#f43f5e'
        ctx!.fillRect(W / 2 - 70, 50, 140 * bpct, 5)
      }

      // shields (top-left pips)
      ctx!.textAlign = 'left'
      for (let i = 0; i < maxShields; i++) {
        ctx!.fillStyle = i < player.shields ? '#6ee7ff' : 'rgba(255,255,255,0.18)'
        ctx!.beginPath()
        ctx!.arc(18 + i * 16, 46, 5, 0, Math.PI * 2)
        ctx!.fill()
      }
      // weapon tier (below shields) — only while a pickup is active
      if (player.weaponTier > 0) {
        const label = player.weaponTier === 1 ? 'WPN II' : 'WPN III'
        ctx!.fillStyle = '#ff9f1c'
        ctx!.font = '700 9px system-ui, sans-serif'
        ctx!.fillText(label, 18, 66)
        const wfrac = Math.max(0, player.weaponMs / WEAPON_DURATION_MS)
        ctx!.fillStyle = 'rgba(255,255,255,0.15)'
        ctx!.fillRect(18, 70, 46, 3)
        ctx!.fillStyle = '#ff9f1c'
        ctx!.fillRect(18, 70, 46 * wfrac, 3)
      }

      // score (top-right) + combo streak just under it
      ctx!.textAlign = 'right'
      ctx!.fillStyle = '#ffd24a'
      ctx!.font = '700 14px system-ui, sans-serif'
      ctx!.fillText(String(score), W - 12, 50)
      if (combo >= 4) {
        const mult = comboMult(combo)
        ctx!.fillStyle = '#ff9f1c'
        ctx!.font = '700 11px system-ui, sans-serif'
        ctx!.fillText(`${combo} STREAK ×${mult}`, W - 12, 66)
      }

      // one-time control hint
      if (elapsed < 3) {
        ctx!.globalAlpha = Math.max(0, 1 - elapsed / 3)
        ctx!.fillStyle = '#e8f0ff'
        ctx!.font = '600 12px system-ui, sans-serif'
        ctx!.textAlign = 'center'
        ctx!.fillText('Drag to move · auto-fire on · grab weapon crates', W / 2, H - 18)
        ctx!.globalAlpha = 1
      }
    }

    let raf = 0
    let last = performance.now()
    function frame(now: number) {
      if (finished) return
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (hitStopMs > 0) {
        // A brief freeze-frame on big impacts (boss kill, taking a hit) — the
        // world holds still for a beat instead of everything updating through
        // it, which reads as much punchier than a plain particle burst alone.
        hitStopMs -= dt * 1000
        render()
        raf = requestAnimationFrame(frame)
        return
      }
      update(dt)
      if (!finished) render()
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      finished = true
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
    }
  }, [stage, onEnd])

  return <canvas ref={canvasRef} className="h-full w-full" style={{ display: 'block' }} />
}

// ---------- band → label/accent ----------
const BAND_META: Record<string, { label: string; accent: string; emoji: string }> = {
  great: { label: 'GREAT RUN', accent: '#46d369', emoji: '🌟' },
  good: { label: 'GOOD RUN', accent: '#6ee7ff', emoji: '✨' },
  pass: { label: 'SALVAGE SECURED', accent: '#ffd24a', emoji: '🛰️' },
  failed: { label: 'SHIELDS DOWN', accent: '#f43f5e', emoji: '💥' },
}

// ---------- the outer modal (briefing → playing → outcome) ----------
type Phase = 'briefing' | 'playing' | 'outcome'

export function SpaceSalvageShooter() {
  const open = useUiStore((s) => s.spaceShooterOpen)
  const replay = useUiStore((s) => s.shooterReplay) // number | null — a chosen cleared stage to practice
  const ss = useSpaceShooter()
  const [phase, setPhase] = useState<Phase>('briefing')
  const [result, setResult] = useState<MissionResult | null>(null)
  // The stage index actually launched — pinned at launch so the play/outcome screens
  // don't jump when a PASS advances ss.stageIndex (or drives it to -1 after Stage 5).
  const [playIndex, setPlayIndex] = useState(-1)

  // Reset to the briefing whenever the modal (re)opens.
  useEffect(() => {
    if (open) {
      setPhase('briefing')
      setResult(null)
    }
  }, [open])

  // Briefing targets a REPLAY stage when the Log launched one, else the next incomplete
  // stage; play/outcome stay pinned to playIndex.
  const briefIndex = replay ?? ss.stageIndex
  const briefStage = briefIndex >= 0 ? SPACE_SHOOTER_STAGE_BY_INDEX[briefIndex] : undefined
  const playedStage = playIndex >= 0 ? SPACE_SHOOTER_STAGE_BY_INDEX[playIndex] : undefined
  const stage = phase === 'briefing' ? briefStage : playedStage

  const handleEnd = useCallback(
    (metrics: MissionMetrics) => {
      const r = completeSpaceMission(playIndex, metrics, replay != null)
      setResult(r)
      setPhase('outcome')
    },
    [playIndex, replay],
  )

  if (!open || !stage) return null

  const close = () => useUiStore.getState().closeSpaceShooter()
  // A practice replay has no campaign stakes — backing out is a pure close (never re-arms
  // the live salvage-signal cooldown). Only a real campaign run walks away with a cooldown.
  const walkAway = () => {
    if (replay == null) abortSpaceMission() // re-arm later, no progress
    close()
  }
  const eject = () => {
    if (replay == null) abortSpaceMission() // bailing mid-run counts as walking away (no fail, no reward)
    close()
  }
  const launch = () => {
    setPlayIndex(briefIndex) // pin the stage being played before ss can advance
    setPhase('playing')
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: 'radial-gradient(120% 90% at 50% 0%, #0b1030, #05070f 70%)', color: '#e8f0ff' }}>
      {/* header */}
      <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+10px)] pb-2">
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6ee7ff' }}>
            Space Salvage · Stage {stage.number}/{ss.totalStages}{replay != null ? ' · Replay' : ''}
          </div>
          <div className="truncate text-lg font-black">{stage.title}</div>
        </div>
        {phase === 'playing' ? (
          <button type="button" onClick={eject} className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)' }}>
            Eject ⏏
          </button>
        ) : (
          <button
            type="button"
            // On the OUTCOME screen the mission is already resolved — closing must not
            // abort (that would stomp the resolution cooldown either direction).
            onClick={phase === 'outcome' ? close : walkAway}
            aria-label="Close"
            className="rounded-full px-3 py-1 text-lg leading-none"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            ✕
          </button>
        )}
      </div>

      {/* body */}
      {phase === 'briefing' && (
        <BriefingScreen stage={stage} best={ss.bestScore} onStart={launch} onWalkAway={walkAway} />
      )}

      {phase === 'playing' && playedStage && (
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <ShooterCanvas stage={playedStage} onEnd={handleEnd} />
        </div>
      )}

      {phase === 'outcome' && result && playedStage && (
        <OutcomeScreen stage={playedStage} result={result} campaignComplete={result.campaignComplete} onDone={close} />
      )}
    </div>
  )
}

function DialoguePanel({ lines }: { lines: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      {lines.map((line, i) => (
        <div key={i} className="rounded-[var(--ctrl-radius,10px)] p-3 text-sm leading-snug" style={{ background: 'rgba(110,231,255,0.08)', borderLeft: '2px solid #6ee7ff' }}>
          {line}
        </div>
      ))}
    </div>
  )
}

function BriefingScreen({ stage, best, onStart, onWalkAway }: { stage: SpaceShooterStageDef; best: number; onStart: () => void; onWalkAway: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
      <div className="mb-1 text-[11px] font-bold uppercase tracking-wider" style={{ color: '#9fb4e0' }}>
        📡 Central Command · {stage.codename}
      </div>
      <DialoguePanel lines={stage.briefing} />
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]" style={{ color: '#9fb4e0' }}>
        <div className="rounded-lg py-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="text-base font-black" style={{ color: '#e8f0ff' }}>{stage.difficulty.durationSec}s</div>
          extraction
        </div>
        <div className="rounded-lg py-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="text-base font-black" style={{ color: '#e8f0ff' }}>{stage.difficulty.bossAtSec ? 'Boss' : stage.difficulty.enemyFires ? 'Armed' : 'Recon'}</div>
          threat
        </div>
        <div className="rounded-lg py-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="text-base font-black" style={{ color: '#e8f0ff' }}>{best > 0 ? best : '—'}</div>
          best
        </div>
      </div>
      <div className="mt-auto flex flex-col gap-2 pt-4">
        <button type="button" onClick={onStart} className="rounded-full py-3 text-base font-black" style={{ background: 'linear-gradient(135deg,#0e7490,#6ee7ff)', color: '#04121a' }}>
          🚀 Launch Mission
        </button>
        <button type="button" onClick={onWalkAway} className="rounded-full py-2 text-sm font-semibold" style={{ background: 'transparent', color: '#9fb4e0', border: '1px solid rgba(255,255,255,0.18)' }}>
          Walk away (signal returns later)
        </button>
      </div>
    </div>
  )
}

function OutcomeScreen({ stage, result, campaignComplete, onDone }: { stage: SpaceShooterStageDef; result: MissionResult; campaignComplete: boolean; onDone: () => void }) {
  const meta = BAND_META[result.band] ?? BAND_META.pass
  const passed = result.band !== 'failed'
  const lines = passed ? stage.debrief : SPACE_SHOOTER_FAIL_LINES
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] text-center">
      <div className="mt-2 text-5xl">{meta.emoji}</div>
      <div className="text-2xl font-black" style={{ color: meta.accent }}>{meta.label}</div>
      <div className="mb-2 text-sm" style={{ color: '#9fb4e0' }}>
        Score {result.score}
        {result.newBest && passed ? ' · NEW BEST!' : ''}
      </div>
      <div className="text-left">
        <DialoguePanel lines={lines} />
      </div>

      {passed && (
        <div className="mt-3 flex flex-col gap-1.5 rounded-xl p-3 text-left text-sm" style={{ background: 'rgba(70,211,105,0.08)', border: '1px solid rgba(70,211,105,0.3)' }}>
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#9fb4e0' }}>Salvage rewards</div>
          {result.cashReward > 0 && <div>🛰️ <b>+{money(result.cashReward)}</b> banked</div>}
          {result.buffMult > 1 && <div>🚀 Space profit <b>+{Math.round((result.buffMult - 1) * 100)}%</b> for {Math.round(result.buffMs / 1000)}s</div>}
          {result.unlockedYard && <div>🏗️ <b>Orbital Salvage Yard</b> unlocked (permanent Space boost)</div>}
          {result.unlockedAiPilot && <div>🤖 <b>AI Salvage Pilot</b> online — salvage runs are now automatic</div>}
        </div>
      )}

      {passed && !campaignComplete && (
        <div className="mt-3 text-xs" style={{ color: '#9fb4e0' }}>
          Next signal: <b style={{ color: '#e8f0ff' }}>Stage {result.stageNumber + 1}</b> — it will return after a cooldown.
        </div>
      )}
      {campaignComplete && (
        <div className="mt-3 text-xs" style={{ color: '#9fb4e0' }}>
          Campaign complete. The AI pilot handles salvage from here — no more manual runs.
        </div>
      )}

      <button type="button" onClick={onDone} className="mt-4 rounded-full py-3 text-base font-black" style={{ background: passed ? 'linear-gradient(135deg,#0e7490,#6ee7ff)' : 'rgba(255,255,255,0.12)', color: passed ? '#04121a' : '#e8f0ff' }}>
        {passed ? 'Return to Empire' : 'Refit & Retreat'}
      </button>
    </div>
  )
}
