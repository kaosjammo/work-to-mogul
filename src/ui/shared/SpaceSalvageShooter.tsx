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
    salvage: loadImg(ARCADE_PICKUPS.salvage.src),
    core: loadImg(ARCADE_PICKUPS.core.src),
    shield: loadImg(ARCADE_PICKUPS.shield.src),
    asteroid: loadImg(ARCADE_ENV.asteroid.src),
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

// ---------- entity types (plain objects held in refs, never React state) ----------
interface P { x: number; y: number; vx: number; vy: number }
interface Bullet extends P { r: number }
interface Enemy extends P { r: number; hp: number; kind: number; fires: boolean; fireMs: number; boss: boolean; score: number }
interface Pickup extends P { r: number; kind: 'salvage' | 'core' | 'shield' }
interface Debris extends P { r: number; hp: number; spin: number; rot: number }
interface Particle extends P { life: number; max: number; color: string; r: number }
interface Star { x: number; y: number; z: number }

const rand = (a: number, b: number) => a + Math.random() * (b - a)

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
    const player = { x: W / 2, y: H - 74, r: 16, shields: maxShields, invMs: 0, fireMs: 0, flash: 0 }
    const bullets: Bullet[] = []
    const enemies: Enemy[] = []
    const eBullets: Bullet[] = []
    const debris: Debris[] = []
    const pickups: Pickup[] = []
    const parts: Particle[] = []
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
      enemies.push({
        x: W / 2,
        y: -70,
        vx: 40,
        vy: d.fallSpeed * 0.35,
        r: 48,
        hp: 18 + stage.number * 4,
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
      const kind: Pickup['kind'] = roll < 0.25 ? 'shield' : roll < 0.6 ? 'core' : 'salvage'
      const r = 14
      pickups.push({ x: rand(r, W - r), y: -r, vx: 0, vy: 70, r, kind })
    }

    function update(dt: number) {
      elapsed += dt
      // stars
      for (const s of stars) {
        s.y += (30 + s.z * 90) * dt
        if (s.y > H) {
          s.y = 0
          s.x = rand(0, W)
        }
      }
      // spawns (timers in ms)
      const dtm = dt * 1000
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

      // auto-fire (always on; Space also counts as held)
      player.fireMs -= dtm
      if (player.fireMs <= 0) {
        bullets.push({ x: player.x, y: player.y - player.r - 2, vx: 0, vy: -560, r: 4 })
        player.fireMs = 180
      }

      // player bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i]
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
              spawnParticles(e.x, e.y, e.boss ? '#ff7a18' : '#ff4d6d', e.boss ? 34 : 12)
              enemies.splice(j, 1)
              enemiesDestroyed += 1
              score += e.score
              if (e.boss) haptic(45)
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
              spawnParticles(a.x, a.y, '#94a3b8', 14)
              debris.splice(j, 1)
              score += 40
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
          } else {
            salvageCollected += 1
            score += p.kind === 'core' ? 180 : 120
            spawnParticles(p.x, p.y, '#ffd24a', 10)
          }
          haptic(12)
        }
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
      ctx!.fillStyle = '#9fb4e0'
      for (const s of stars) {
        ctx!.globalAlpha = 0.4 + s.z * 0.6
        ctx!.fillRect(s.x, s.y, s.z * 2, s.z * 2)
      }
      ctx!.globalAlpha = 1

      // pickups (spinning salvage)
      const frame = Math.floor(elapsed * 12)
      for (const p of pickups) {
        const rec = p.kind === 'shield' ? bank.shield : p.kind === 'core' ? bank.core : bank.salvage
        if (!drawSpin(ctx!, rec, frame, p.x, p.y, p.r * 2.2)) {
          ctx!.fillStyle = p.kind === 'shield' ? '#46d369' : '#ffd24a'
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

      // player bullets
      ctx!.fillStyle = '#6ee7ff'
      for (const b of bullets) {
        ctx!.fillRect(b.x - b.r / 2, b.y - 8, b.r, 12)
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

      // particles
      for (const p of parts) {
        ctx!.globalAlpha = Math.max(0, 1 - p.life / p.max)
        ctx!.fillStyle = p.color
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx!.fill()
      }
      ctx!.globalAlpha = 1

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
      // shields (top-left pips)
      ctx!.textAlign = 'left'
      for (let i = 0; i < maxShields; i++) {
        ctx!.fillStyle = i < player.shields ? '#6ee7ff' : 'rgba(255,255,255,0.18)'
        ctx!.beginPath()
        ctx!.arc(18 + i * 16, 46, 5, 0, Math.PI * 2)
        ctx!.fill()
      }
      // score (top-right)
      ctx!.fillStyle = '#ffd24a'
      ctx!.font = '700 14px system-ui, sans-serif'
      ctx!.textAlign = 'right'
      ctx!.fillText(String(score), W - 12, 50)
      // one-time control hint
      if (elapsed < 3) {
        ctx!.globalAlpha = Math.max(0, 1 - elapsed / 3)
        ctx!.fillStyle = '#e8f0ff'
        ctx!.font = '600 12px system-ui, sans-serif'
        ctx!.textAlign = 'center'
        ctx!.fillText('Drag to move · auto-fire on', W / 2, H - 18)
        ctx!.globalAlpha = 1
      }
    }

    let raf = 0
    let last = performance.now()
    function frame(now: number) {
      if (finished) return
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
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

  // Briefing targets the next incomplete stage; play/outcome stay pinned to playIndex.
  const briefStage = ss.stageIndex >= 0 ? SPACE_SHOOTER_STAGE_BY_INDEX[ss.stageIndex] : undefined
  const playedStage = playIndex >= 0 ? SPACE_SHOOTER_STAGE_BY_INDEX[playIndex] : undefined
  const stage = phase === 'briefing' ? briefStage : playedStage

  const handleEnd = useCallback(
    (metrics: MissionMetrics) => {
      const r = completeSpaceMission(playIndex, metrics)
      setResult(r)
      setPhase('outcome')
    },
    [playIndex],
  )

  if (!open || !stage) return null

  const close = () => useUiStore.getState().closeSpaceShooter()
  const walkAway = () => {
    abortSpaceMission() // re-arm later, no progress
    close()
  }
  const eject = () => {
    abortSpaceMission() // bailing mid-run counts as walking away (no fail, no reward)
    close()
  }
  const launch = () => {
    setPlayIndex(ss.stageIndex) // pin the stage being played before ss can advance
    setPhase('playing')
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: 'radial-gradient(120% 90% at 50% 0%, #0b1030, #05070f 70%)', color: '#e8f0ff' }}>
      {/* header */}
      <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+10px)] pb-2">
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6ee7ff' }}>
            Space Salvage · Stage {stage.number}/{ss.totalStages}
          </div>
          <div className="truncate text-lg font-black">{stage.title}</div>
        </div>
        {phase === 'playing' ? (
          <button type="button" onClick={eject} className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)' }}>
            Eject ⏏
          </button>
        ) : (
          <button type="button" onClick={walkAway} aria-label="Close" className="rounded-full px-3 py-1 text-lg leading-none" style={{ background: 'rgba(255,255,255,0.1)' }}>
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
