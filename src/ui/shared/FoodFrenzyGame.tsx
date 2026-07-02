// ============================================================
//  Lunch Rush — the fullscreen Vampire-Survivors-style canvas mini-game (UI only).
//  Your food truck is mobbed by rabid fans from every direction; the tongs
//  auto-throw hotdogs at the nearest hungry mouth; feeding fans drops tips; tips
//  level you up; level-ups offer a pick-1-of-3 upgrade (the VS signature). Survive
//  until closing time without losing your composure.
//
//  Own requestAnimationFrame loop, fully isolated from the idle game's loop. On
//  finish it hands FINAL METRICS to completeFrenzyRun() — the engine applies
//  bounded rewards + advances the campaign. No mid-run state is ever persisted:
//  a refresh simply closes the modal and the signal re-arms.
//
//  Controls are device-aware: desktop = WASD/arrows OR hold-left-click to drive toward
//  the cursor; touch = a floating analog joystick. Everything (sprites, reach, HUD)
//  scales by one factor S from the short edge, so a phone renders the same game smaller.
//  Sprites are emoji (zero assets). Level-up pauses the swarm; the overlay buttons are
//  real DOM (44px tap areas), not canvas hit-boxes.
// ============================================================
import { useCallback, useEffect, useRef, useState } from 'react'
import { useFoodFrenzy } from '../../store/gameStore'
import { useUiStore } from '../../store/uiStore'
import { completeFrenzyRun, abortFrenzyRun } from '../../store/actions'
import { haptic } from '../../lib/haptics'
import { money } from '../../engine/num'
import type { FrenzyMetrics, FrenzyResult } from '../../engine/foodFrenzy'
import {
  FOOD_FRENZY_TIERS,
  FOOD_FRENZY_FAIL_LINES,
  FRENZY_UPGRADES,
  type FrenzyTierDef,
  type FrenzyUpgradeDef,
} from '../../content/foodFrenzy'

// ---------- entity types (plain objects held in closure, never React state) ----------
interface Fan {
  x: number
  y: number
  hunger: number
  kind: 0 | 1 | 2 // walker / sprinter / superfan
  speed: number
  r: number // effective radius = rBase * S (rescaled on resize)
  rBase: number // authored radius, so a mid-run resize can rescale live fans
  wobble: number
}
interface Dog {
  x: number
  y: number
  vx: number
  vy: number
  pierce: number // extra fans this dog can feed after the first
}
interface Tip {
  x: number
  y: number
  vx: number
  vy: number
  burger: boolean // 🍔 heals instead of scoring
}
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  text?: string
  color?: string
  r?: number
}

const rand = (a: number, b: number) => a + Math.random() * (b - a)
const FAN_EMOJI = ['😋', '🏃', '🤩'] as const
const MAX_COMPOSURE = 5

interface RunStats {
  projectiles: number
  fireMs: number
  splash: number
  range: number
  moveSpeed: number
  pierce: number
  magnet: number
  dmg: number
}

// S bakes the responsive scale into every WORLD-space stat (range/moveSpeed/magnet/
// splash) so the game is geometrically similar at any screen size; counts + times
// (projectiles/fireMs/pierce/dmg) are resolution-independent and stay unscaled.
function statsFrom(stacks: Record<string, number>, S: number): RunStats {
  return {
    projectiles: 1 + (stacks.double_dogs ?? 0),
    fireMs: 520 * Math.pow(0.75, stacks.turbo_grill ?? 0),
    splash: (stacks.extra_mustard ?? 0) * 30 * S,
    range: 190 * S * Math.pow(1.3, stacks.long_toss ?? 0),
    moveSpeed: 300 * S * Math.pow(1.2, stacks.roller_skates ?? 0),
    pierce: (stacks.big_dog ?? 0) > 0 ? 2 : 0,
    magnet: 60 * S * Math.pow(1.5, stacks.snack_magnet ?? 0),
    dmg: 1 + (stacks.combo_sauce ?? 0),
  }
}

// ---------- the canvas game ----------
function FrenzyCanvas({
  tier,
  onEnd,
  onLevelUp,
}: {
  tier: FrenzyTierDef
  onEnd: (m: FrenzyMetrics) => void
  // Called with the 3 offered upgrades + a chooser; the parent renders the DOM
  // overlay. The sim stays PAUSED until the chooser runs.
  onLevelUp: (opts: FrenzyUpgradeDef[], choose: (id: string) => void) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // ── responsive scale (one similarity factor) ──────────────────────────────
    let W = 0
    let H = 0
    let S = 1 // whole-scene scale from the short edge (sprites/reach/HUD were authored in px)
    let HUD_S = 0.72 // HUD text/geometry never shrinks below this (legibility floor)
    const dpr = Math.min(2, window.devicePixelRatio || 1)

    // ── world (declared BEFORE resize — resize() rescales them) ────────────────
    const truck = { x: 0, y: 0, r: 22, composure: MAX_COMPOSURE, invMs: 0, fireMs: 0 }
    const fans: Fan[] = []
    const dogs: Dog[] = []
    const tips: Tip[] = []
    const parts: Particle[] = []
    const stacks: Record<string, number> = {}
    let stats = statsFrom(stacks, S)

    let elapsed = 0
    let paused = false
    let finished = false
    let spawnT = 600
    let superT = 0
    let stampedeT = (tier.stampedeEverySec ?? 0) * 1000
    let fansFed = 0
    let tipsCollected = 0
    let score = 0
    let level = 1
    let xp = 0
    let xpNext = 12
    let fedSinceBurger = 0

    // ── input ──────────────────────────────────────────────────────────────────
    // Device-aware: TOUCH → a floating analog joystick (anchored where the thumb
    // lands; pace ∝ deflection). MOUSE → hold-left-click drives the truck toward the
    // cursor at a CONSTANT pace (re-targets live, stops at the cursor). KEYBOARD
    // (WASD/arrows) always wins. Priority: keyboard > joystick > hold-mouse.
    const keys = new Set<string>()
    let inputMode: 'idle' | 'joystick' | 'holdmouse' = 'idle'
    let activePointerId: number | null = null // the ONE tracked pointer; others ignored
    let lastPointerType: 'touch' | 'mouse' | null = null // for the device-aware hint
    let stickAX = 0
    let stickAY = 0 // joystick base-ring centre (canvas px)
    let stickDX = 0
    let stickDY = 0 // clamped thumb offset from anchor
    let stickNX = 0
    let stickNY = 0 // unit direction
    let stickMag = 0 // 0..1 throttle after dead-zone remap
    let holdTargetX = 0
    let holdTargetY = 0 // live cursor while a mouse button is held
    let stickMaxR = 46 // full-throttle thumb travel (S-scaled in resize)
    let stickBaseR = 52 // drawn base-ring radius
    let stickThumbR = 22 // drawn thumb radius
    let holdStop = 1 // arrive-and-stop epsilon
    const stickDead = 0.16 // dead-zone as a FRACTION of stickMaxR (unitless)

    // ── festival background — baked once per resize into an offscreen canvas ─────
    let bg: HTMLCanvasElement | OffscreenCanvas | null = null
    let lastBgKey = '' // device-pixel dims of the last bake — skip re-baking on same-size resizes
    function buildBackground(w: number, h: number, ratio: number, s: number): HTMLCanvasElement | OffscreenCanvas | null {
      try {
        const cw = Math.max(1, Math.floor(w * ratio))
        const ch = Math.max(1, Math.floor(h * ratio))
        const c: HTMLCanvasElement | OffscreenCanvas =
          typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(cw, ch) : document.createElement('canvas')
        if (!(typeof OffscreenCanvas !== 'undefined' && c instanceof OffscreenCanvas)) {
          ;(c as HTMLCanvasElement).width = cw
          ;(c as HTMLCanvasElement).height = ch
        }
        const b = c.getContext('2d') as unknown as CanvasRenderingContext2D | null
        if (!b) return null
        b.setTransform(ratio, 0, 0, ratio, 0, 0)
        // seeded LCG so the static layout is stable across rebuilds (no twinkle on resize)
        let seed = (0x9e3779b9 ^ (Math.floor(w) * 73856093) ^ (Math.floor(h) * 19349663)) >>> 0
        const rnd = () => {
          seed = (seed * 1664525 + 1013904223) >>> 0
          return seed / 4294967296
        }
        // 1. base wash (warm dusk pavement, keyed to the modal browns)
        const g = b.createLinearGradient(0, 0, 0, h)
        g.addColorStop(0, '#17110b')
        g.addColorStop(1, '#0f0a06')
        b.fillStyle = g
        b.fillRect(0, 0, w, h)
        // 2. ground plane + soft horizon (near street vs far end)
        b.fillStyle = '#1b1410'
        b.fillRect(0, h * 0.38, w, h * 0.62)
        const hz = b.createLinearGradient(0, h * 0.38, 0, h * 0.38 + 24 * s)
        hz.addColorStop(0, 'rgba(60,40,20,0.25)')
        hz.addColorStop(1, 'rgba(60,40,20,0)')
        b.fillStyle = hz
        b.fillRect(0, h * 0.38, w, 24 * s)
        // 3. paver seams (faint plaza floor)
        b.strokeStyle = 'rgba(255,235,200,0.03)'
        b.lineWidth = 1
        for (let gx = 0; gx <= w; gx += 46 * s) {
          b.beginPath()
          b.moveTo(gx, h * 0.4)
          b.lineTo(gx, h)
          b.stroke()
        }
        let cy = h * 0.42
        let gap = 26 * s
        while (cy < h) {
          b.beginPath()
          b.moveTo(0, cy)
          b.lineTo(w, cy)
          b.stroke()
          cy += gap
          gap *= 1.14
        }
        // 4. warm light pools the truck drives through
        const lamps = Math.ceil(w / 220)
        for (let i = 0; i < lamps; i++) {
          const lx = (i + 0.5) * 220
          const ly = i % 2 === 0 ? h * 0.32 : h * 0.78
          const rg = b.createRadialGradient(lx, ly, 0, lx, ly, 150 * s)
          rg.addColorStop(0, 'rgba(245,197,24,0.05)')
          rg.addColorStop(1, 'rgba(245,197,24,0)')
          b.fillStyle = rg
          b.fillRect(lx - 160 * s, ly - 160 * s, 320 * s, 320 * s)
        }
        // 5. distant stalls / skyline at the horizon (atmosphere, not focus)
        const stalls = 6
        for (let i = 0; i < stalls; i++) {
          const sw = 60 * s + rnd() * 40 * s
          const sx = (i / stalls) * w + rnd() * 20 * s
          const sy = h * 0.3 + rnd() * h * 0.06
          const sh = 26 * s + rnd() * 14 * s
          b.fillStyle = 'rgba(40,26,18,0.5)'
          b.fillRect(sx, sy, sw, sh)
          for (let k = 0; k < 4; k++) {
            b.fillStyle = k % 2 === 0 ? 'rgba(122,59,18,0.4)' : 'rgba(168,83,26,0.4)'
            b.fillRect(sx + (k / 4) * sw, sy, sw / 4, 5 * s)
          }
          b.fillStyle = 'rgba(255,207,138,0.25)'
          b.fillRect(sx + sw * 0.3, sy + sh * 0.5, 5 * s, 6 * s)
        }
        // 6. string-lights (bunting) across the top
        for (let row = 0; row < 2; row++) {
          const y0 = (8 + row * 10) * s
          b.strokeStyle = 'rgba(255,210,120,0.18)'
          b.lineWidth = 1.5 * s
          b.beginPath()
          b.moveTo(0, y0)
          b.quadraticCurveTo(w / 2, y0 + 16 * s, w, y0)
          b.stroke()
          for (let bx = 10 * s; bx < w; bx += 70 * s) {
            const tt = bx / w
            const by = y0 + 32 * s * tt * (1 - tt) // point on the quadratic sag
            const glow = b.createRadialGradient(bx, by, 0, bx, by, 6 * s)
            glow.addColorStop(0, 'rgba(255,210,120,0.12)')
            glow.addColorStop(1, 'rgba(255,210,120,0)')
            b.fillStyle = glow
            b.fillRect(bx - 6 * s, by - 6 * s, 12 * s, 12 * s)
            b.fillStyle = Math.floor(bx / (70 * s)) % 2 === 0 ? 'rgba(255,210,74,0.5)' : 'rgba(255,157,74,0.5)'
            b.beginPath()
            b.arc(bx, by, 2.2 * s, 0, Math.PI * 2)
            b.fill()
          }
        }
        // 7. confetti flecks on the pavement (seeded → static)
        const flecks = Math.floor((w * h) / 26000)
        const cols = ['#f5c518', '#46d369', '#f43f5e']
        b.globalAlpha = 0.06
        for (let i = 0; i < flecks; i++) {
          const fx = rnd() * w
          const fy = h * 0.4 + rnd() * h * 0.6
          b.fillStyle = cols[Math.floor(rnd() * cols.length)]
          const fs = (1 + rnd()) * s
          b.fillRect(fx, fy, fs, fs)
        }
        b.globalAlpha = 1
        // 8. edge vignette (LAST — darkens the busy spawn perimeter, brightens centre)
        const vg = b.createRadialGradient(w / 2, h * 0.55, Math.min(w, h) * 0.3, w / 2, h * 0.55, Math.hypot(w, h) * 0.62)
        vg.addColorStop(0, 'rgba(0,0,0,0)')
        vg.addColorStop(1, 'rgba(0,0,0,0.38)')
        b.fillStyle = vg
        b.fillRect(0, 0, w, h)
        // 9. contrast guard so nothing rivals a bright emoji
        b.fillStyle = 'rgba(10,7,4,0.16)'
        b.fillRect(0, 0, w, h)
        return c
      } catch {
        return null
      }
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect()
      W = Math.max(1, rect.width)
      H = Math.max(1, rect.height)
      canvas!.width = Math.floor(W * dpr)
      canvas!.height = Math.floor(H * dpr)
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      // one scale from the short edge; desktop stays ~full-size, phones shrink ~40%
      S = Math.min(1.15, Math.max(0.62, Math.min(W, H) / 640))
      HUD_S = Math.max(S, 0.72)
      stickMaxR = 46 * S
      stickBaseR = 52 * S
      stickThumbR = 22 * S
      holdStop = 1 * S
      stats = statsFrom(stacks, S) // re-derive scaled reach/speed (pure; safe mid-run)
      truck.r = 22 * S
      for (const f of fans) f.r = f.rBase * S // rescale live fans (radius only, NOT position)
      // The bake is deterministic in (W,H,dpr) — browsers fire bursts of duplicate resize
      // events (mobile URL-bar, orientation settle), so skip the multi-gradient rebuild
      // whenever the device-pixel size is unchanged.
      const bgKey = `${Math.floor(W * dpr)}x${Math.floor(H * dpr)}`
      if (bgKey !== lastBgKey || !bg) {
        bg = buildBackground(W, H, dpr, S)
        lastBgKey = bgKey
      }
    }
    resize()
    truck.x = W / 2 // now W/H are known — centre the truck
    truck.y = H / 2
    holdTargetX = truck.x
    holdTargetY = truck.y
    window.addEventListener('resize', resize)

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'a', 'w', 's', 'd'].includes(k)) e.preventDefault()
      keys.add(k)
    }
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase())
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    const ptFromEvent = (e: PointerEvent) => {
      const rect = canvas!.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    // Every touch currently on the glass (id → last point). Lets endPointer HAND OFF to
    // a still-down finger instead of stranding 'idle' when the owning finger lifts first.
    const downPoints = new Map<number, { x: number; y: number }>()
    const beginJoystick = (id: number, x: number, y: number) => {
      activePointerId = id
      lastPointerType = 'touch'
      inputMode = 'joystick'
      stickAX = x
      stickAY = y
      stickDX = 0
      stickDY = 0
      stickNX = 0
      stickNY = 0
      stickMag = 0
    }
    // Drop all live input (focus loss / level-up): no keyup or pointerup is delivered
    // when the window loses focus, so a held key or a captured pointer would otherwise
    // latch forever (stuck-key drift / frozen controls).
    const clearPointerInput = () => {
      if (activePointerId !== null) {
        try {
          canvas!.releasePointerCapture(activePointerId)
        } catch {
          /* not captured — fine */
        }
      }
      activePointerId = null
      inputMode = 'idle'
      stickMag = 0
      stickNX = 0
      stickNY = 0
      downPoints.clear()
    }
    const onBlur = () => {
      keys.clear()
      clearPointerInput()
    }
    const onPointerDown = (e: PointerEvent) => {
      if (paused || finished) return
      const isMouse = e.pointerType === 'mouse' // '', 'pen', 'touch', undefined → joystick
      if (!isMouse) downPoints.set(e.pointerId, ptFromEvent(e)) // track every touch for hand-off
      if (activePointerId !== null) return // one owner at a time (multi-touch guard)
      if (isMouse) {
        if (e.button !== 0) return // left button only
        activePointerId = e.pointerId
        lastPointerType = 'mouse'
        inputMode = 'holdmouse'
        const p = ptFromEvent(e)
        holdTargetX = p.x
        holdTargetY = p.y
      } else {
        const p = ptFromEvent(e)
        beginJoystick(e.pointerId, p.x, p.y)
        haptic(6)
      }
      try {
        canvas!.setPointerCapture(e.pointerId)
      } catch {
        /* capture unsupported — the window pointerup fallback still ends the gesture */
      }
      e.preventDefault()
    }
    const onPointerMove = (e: PointerEvent) => {
      const p = ptFromEvent(e)
      if (downPoints.has(e.pointerId)) downPoints.set(e.pointerId, p) // keep every finger's position fresh
      if (e.pointerId !== activePointerId) return
      if (inputMode === 'holdmouse') {
        holdTargetX = p.x
        holdTargetY = p.y
        return
      }
      // joystick — floating/follow: if the thumb pulls past max, drag the anchor under it
      let dx = p.x - stickAX
      let dy = p.y - stickAY
      const len = Math.hypot(dx, dy)
      if (len > stickMaxR) {
        const k = (len - stickMaxR) / len
        stickAX += dx * k
        stickAY += dy * k
        dx = p.x - stickAX
        dy = p.y - stickAY
      }
      stickDX = dx
      stickDY = dy
      const raw = Math.min(1, Math.hypot(dx, dy) / stickMaxR)
      stickMag = raw <= stickDead ? 0 : (raw - stickDead) / (1 - stickDead) // ramp 0→1 past the dead-zone
      if (stickMag > 0) {
        const dl = Math.hypot(dx, dy) || 1
        stickNX = dx / dl
        stickNY = dy / dl
      } else {
        stickNX = 0
        stickNY = 0
      }
    }
    const endPointer = (e: PointerEvent) => {
      downPoints.delete(e.pointerId)
      if (e.pointerId !== activePointerId) return
      // releasePointerCapture throws if the pointer isn't currently captured — must
      // never abort the state reset, or activePointerId stays latched and every later
      // tap is ignored (frozen controls).
      try {
        canvas!.releasePointerCapture(e.pointerId)
      } catch {
        /* not captured — fine */
      }
      // Two-thumb play: if another finger is still down, hand the stick to it (re-anchored
      // at its current spot) instead of freezing on 'idle' until the player re-presses.
      const next = downPoints.keys().next()
      if (!next.done) {
        const id = next.value
        const np = downPoints.get(id)!
        beginJoystick(id, np.x, np.y)
        try {
          canvas!.setPointerCapture(id)
        } catch {
          /* fine */
        }
        return
      }
      activePointerId = null
      inputMode = 'idle'
      stickMag = 0
      stickNX = 0
      stickNY = 0
    }
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', endPointer)
    canvas.addEventListener('pointercancel', endPointer)
    canvas.addEventListener('lostpointercapture', endPointer)
    window.addEventListener('pointerup', endPointer) // fallback where capture is unsupported
    window.addEventListener('blur', onBlur) // drop stuck keys/pointers on focus loss
    canvas.style.touchAction = 'none'

    function burst(x: number, y: number, color: string, n: number) {
      for (let i = 0; i < n; i++) {
        const a = rand(0, Math.PI * 2)
        const sp = rand(30, 160) * S
        parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: rand(0.25, 0.6), color, r: rand(1.5, 3) * S })
      }
    }
    function heartPop(x: number, y: number) {
      parts.push({ x, y, vx: 0, vy: -46 * S, life: 0, max: 0.8, text: '💖' })
    }

    function spawnFan(kindOverride?: 0 | 1 | 2, angle?: number) {
      // Ramp: late-run fans spawn faster + walk quicker.
      const t = Math.min(1, elapsed / (tier.durationSec * 1000))
      let kind: 0 | 1 | 2 = 0
      if (kindOverride != null) kind = kindOverride
      else if (Math.random() < tier.fastShare) kind = 1
      const a = angle ?? rand(0, Math.PI * 2)
      const rad = Math.hypot(W, H) / 2 + 30 * S
      const speedBase = tier.fanSpeed * (1 + 0.35 * t) * S
      const rBase = kind === 2 ? 20 : 14
      fans.push({
        x: W / 2 + Math.cos(a) * rad,
        y: H / 2 + Math.sin(a) * rad,
        hunger: kind === 2 ? 3 : 1,
        kind,
        speed: kind === 1 ? speedBase * 1.8 : kind === 2 ? speedBase * 0.55 : speedBase * rand(0.9, 1.1),
        r: rBase * S,
        rBase,
        wobble: rand(0, Math.PI * 2),
      })
    }
    function stampede() {
      for (let i = 0; i < 10; i++) spawnFan(i % 5 === 0 ? 1 : 0, (i / 10) * Math.PI * 2)
      haptic(20)
    }

    function feedFan(f: Fan, idx: number) {
      fans.splice(idx, 1)
      fansFed += 1
      fedSinceBurger += 1
      score += f.kind === 2 ? 250 : f.kind === 1 ? 120 : 100
      heartPop(f.x, f.y)
      burst(f.x, f.y, '#ffd24a', 6)
      // Fed fans tip — superfans tip big; every 12th fan drops a 🍔 (composure heal).
      const burger = fedSinceBurger >= 12
      if (burger) fedSinceBurger = 0
      const n = f.kind === 2 ? 3 : 1
      for (let i = 0; i < n; i++) {
        tips.push({ x: f.x + rand(-8, 8) * S, y: f.y + rand(-8, 8) * S, vx: 0, vy: 0, burger: burger && i === 0 })
      }
      gainXp(1) // feeding itself levels you — tips are a bonus, not the only path
    }

    // XP only ACCUMULATES here; thresholds are processed once per frame at the top
    // of update() — so a burst (splash cascade + a tip pile) can never fire two
    // level-ups in one pass and overwrite the pending pick. Banked XP levels up
    // frame-by-frame after each choice instead.
    function gainXp(n: number) {
      xp += n
    }
    function processLevelUps() {
      if (finished || paused) return
      if (xp >= xpNext) {
        xp -= xpNext
        level += 1
        xpNext = 12 + (level - 1) * 8
        openLevelUp()
      }
    }

    function openLevelUp() {
      // Offer 3 distinct un-maxed upgrades; if fewer remain, offer what's left.
      const available = FRENZY_UPGRADES.filter((u) => (stacks[u.id] ?? 0) < u.maxStacks)
      if (available.length === 0) {
        truck.composure = Math.min(MAX_COMPOSURE, truck.composure + 1) // all maxed → heal
        return
      }
      const opts: FrenzyUpgradeDef[] = []
      const pool = [...available]
      while (opts.length < 3 && pool.length > 0) {
        opts.push(pool.splice(Math.floor(rand(0, pool.length)), 1)[0])
      }
      paused = true
      // Force-release pointer input so a held stick/mouse can't coast the truck under
      // the pause overlay (and a stale target can't jerk it on resume). The player
      // re-presses when play resumes. (Keys are harmless — update() no-ops while paused.)
      clearPointerInput()
      haptic(24)
      onLevelUp(opts, (id: string) => {
        stacks[id] = (stacks[id] ?? 0) + 1
        stats = statsFrom(stacks, S)
        paused = false
      })
    }

    function mobbed() {
      if (truck.invMs > 0) return
      truck.composure -= 1
      truck.invMs = 900
      haptic(30)
      burst(truck.x, truck.y, '#f43f5e', 12)
      if (truck.composure <= 0) end(false)
    }

    function end(survived: boolean) {
      if (finished) return
      finished = true
      const composureBonus = Math.max(0, truck.composure) * 150
      const survivalBonus = survived ? 600 : Math.round((elapsed / (tier.durationSec * 1000)) * 250)
      onEnd({
        survived,
        fansFed,
        tipsCollected,
        composureRemaining: Math.max(0, truck.composure),
        maxComposure: MAX_COMPOSURE,
        level,
        score: Math.round(score + composureBonus + survivalBonus),
      })
    }

    function update(dt: number) {
      processLevelUps() // at most ONE level-up per frame (pauses the sim if it fires)
      if (paused) return
      elapsed += dt * 1000
      const dtm = dt * 1000
      const t = Math.min(1, elapsed / (tier.durationSec * 1000))

      // spawns — cadence tightens 40% across the run
      spawnT -= dtm
      if (spawnT <= 0) {
        spawnFan()
        spawnT = tier.spawnEveryMs * (1 - 0.4 * t) * rand(0.8, 1.2)
      }
      if (tier.superAtSec != null && elapsed >= tier.superAtSec * 1000) {
        superT -= dtm
        if (superT <= 0) {
          spawnFan(2)
          superT = 6000 * rand(0.8, 1.2)
        }
      }
      if (tier.stampedeEverySec != null) {
        stampedeT -= dtm
        if (stampedeT <= 0) {
          stampede()
          stampedeT = tier.stampedeEverySec * 1000
        }
      }

      // truck movement — keyboard > joystick (touch) > hold-mouse (desktop).
      // moveSpeed is ALREADY S-scaled inside stats; both pointer modes move at a
      // CONSTANT pace (no ease that mushes near the target).
      let mvx = 0
      let mvy = 0
      if (keys.has('arrowleft') || keys.has('a')) mvx -= 1
      if (keys.has('arrowright') || keys.has('d')) mvx += 1
      if (keys.has('arrowup') || keys.has('w')) mvy -= 1
      if (keys.has('arrowdown') || keys.has('s')) mvy += 1
      if (mvx || mvy) {
        const len = Math.hypot(mvx, mvy) || 1
        truck.x += (mvx / len) * stats.moveSpeed * dt
        truck.y += (mvy / len) * stats.moveSpeed * dt
      } else if (inputMode === 'joystick' && stickMag > 0) {
        truck.x += stickNX * stats.moveSpeed * stickMag * dt
        truck.y += stickNY * stats.moveSpeed * stickMag * dt
      } else if (inputMode === 'holdmouse') {
        const dx = holdTargetX - truck.x
        const dy = holdTargetY - truck.y
        const dist = Math.hypot(dx, dy)
        if (dist > holdStop) {
          const step = stats.moveSpeed * dt
          if (step >= dist) {
            truck.x = holdTargetX
            truck.y = holdTargetY
          } else {
            truck.x += (dx / dist) * step
            truck.y += (dy / dist) * step
          }
        }
      }
      truck.x = Math.max(truck.r, Math.min(W - truck.r, truck.x))
      truck.y = Math.max(truck.r + 48 * HUD_S, Math.min(H - truck.r - 10 * HUD_S, truck.y))
      if (truck.invMs > 0) truck.invMs -= dtm

      // auto-throw at the nearest fan in range
      truck.fireMs -= dtm
      if (truck.fireMs <= 0 && fans.length > 0) {
        const targets = fans
          .map((f, i) => ({ f, i, d: Math.hypot(f.x - truck.x, f.y - truck.y) }))
          .filter((e) => e.d <= stats.range)
          .sort((a, b) => a.d - b.d)
          .slice(0, stats.projectiles)
        if (targets.length > 0) {
          for (const tgt of targets) {
            const a = Math.atan2(tgt.f.y - truck.y, tgt.f.x - truck.x)
            dogs.push({ x: truck.x, y: truck.y, vx: Math.cos(a) * 340 * S, vy: Math.sin(a) * 340 * S, pierce: stats.pierce })
          }
          truck.fireMs = stats.fireMs
        }
      }

      // hotdogs
      for (let i = dogs.length - 1; i >= 0; i--) {
        const d = dogs[i]
        d.x += d.vx * dt
        d.y += d.vy * dt
        if (d.x < -20 * S || d.x > W + 20 * S || d.y < -20 * S || d.y > H + 20 * S) {
          dogs.splice(i, 1)
          continue
        }
        for (let j = fans.length - 1; j >= 0; j--) {
          const f = fans[j]
          if (Math.hypot(d.x - f.x, d.y - f.y) < f.r + 8 * S) {
            f.hunger -= stats.dmg
            burst(d.x, d.y, '#f5c518', 3)
            // splash (Extra Mustard) satisfies neighbours a little
            if (stats.splash > 0) {
              for (let k = fans.length - 1; k >= 0; k--) {
                if (k !== j && Math.hypot(d.x - fans[k].x, d.y - fans[k].y) < stats.splash) {
                  fans[k].hunger -= 1
                  if (fans[k].hunger <= 0) feedFan(fans[k], k > j ? k : k) // safe: splice below re-checks j
                }
              }
            }
            if (f.hunger <= 0) {
              const jNow = fans.indexOf(f)
              if (jNow >= 0) feedFan(f, jNow)
            }
            if (d.pierce > 0) d.pierce -= 1
            else {
              dogs.splice(i, 1)
            }
            break
          }
        }
      }

      // fans walk toward the truck
      for (let i = fans.length - 1; i >= 0; i--) {
        const f = fans[i]
        const a = Math.atan2(truck.y - f.y, truck.x - f.x)
        f.wobble += dt * 6
        f.x += Math.cos(a) * f.speed * dt
        f.y += Math.sin(a) * f.speed * dt + Math.sin(f.wobble) * 8 * S * dt
        if (Math.hypot(f.x - truck.x, f.y - truck.y) < f.r + truck.r - 6 * S) {
          // A mobbing fan grabs a snack off the counter and leaves (you lose composure).
          fans.splice(i, 1)
          mobbed()
        }
      }

      // tips magnetize + collect
      for (let i = tips.length - 1; i >= 0; i--) {
        const p = tips[i]
        const dx = truck.x - p.x
        const dy = truck.y - p.y
        const d = Math.hypot(dx, dy)
        if (d < stats.magnet) {
          // Pull accel scales with S like the trigger radius → same felt magnet strength
          // (pull-in time) at every screen size, consistent with range/moveSpeed/splash.
          p.vx += (dx / (d || 1)) * 900 * S * dt
          p.vy += (dy / (d || 1)) * 900 * S * dt
        }
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.vx *= 0.92
        p.vy *= 0.92
        if (d < truck.r + 10 * S) {
          tips.splice(i, 1)
          if (p.burger) {
            if (truck.composure < MAX_COMPOSURE) truck.composure += 1
            burst(truck.x, truck.y, '#46d369', 8)
          } else {
            tipsCollected += 1
            score += 25
            gainXp(2)
          }
          haptic(8)
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

      if (!finished && elapsed >= tier.durationSec * 1000) end(true)
    }

    function render() {
      // festival backdrop (pre-baked bitmap; guarded flat fill if the bake failed)
      if (bg) ctx!.drawImage(bg, 0, 0, W, H)
      else {
        ctx!.fillStyle = '#141019'
        ctx!.fillRect(0, 0, W, H)
      }

      ctx!.textAlign = 'center'
      ctx!.textBaseline = 'middle'

      // range ring (subtle) — stats.range is already S-scaled
      ctx!.strokeStyle = 'rgba(245,197,24,0.14)'
      ctx!.lineWidth = 1
      ctx!.beginPath()
      ctx!.arc(truck.x, truck.y, stats.range, 0, Math.PI * 2)
      ctx!.stroke()

      // tips
      for (const p of tips) {
        ctx!.font = `${14 * S}px system-ui`
        ctx!.fillText(p.burger ? '🍔' : '💵', p.x, p.y)
      }

      // hotdogs (rotated toward travel)
      for (const d of dogs) {
        ctx!.save()
        ctx!.translate(d.x, d.y)
        ctx!.rotate(Math.atan2(d.vy, d.vx))
        ctx!.font = `${16 * S}px system-ui`
        ctx!.fillText('🌭', 0, 0)
        ctx!.restore()
      }

      // fans
      for (const f of fans) {
        ctx!.font = `${f.r * 1.9}px system-ui`
        ctx!.fillText(FAN_EMOJI[f.kind], f.x, f.y)
        if (f.kind === 2 && f.hunger > 0) {
          // superfan hunger pips
          for (let i = 0; i < f.hunger; i++) {
            ctx!.fillStyle = '#f5c518'
            ctx!.beginPath()
            ctx!.arc(f.x - 10 * S + i * 10 * S, f.y - f.r - 6 * S, 3 * S, 0, Math.PI * 2)
            ctx!.fill()
          }
        }
      }

      // truck (blink while recovering composure)
      const blink = truck.invMs > 0 && Math.floor(elapsed / 90) % 2 === 0
      if (!blink) {
        ctx!.font = `${44 * S}px system-ui`
        ctx!.fillText('🚚', truck.x, truck.y)
      }

      // particles
      for (const p of parts) {
        const a = Math.max(0, 1 - p.life / p.max)
        ctx!.globalAlpha = a
        if (p.text) {
          ctx!.font = `${18 * S}px system-ui`
          ctx!.fillText(p.text, p.x, p.y)
        } else {
          ctx!.fillStyle = p.color ?? '#fff'
          ctx!.beginPath()
          ctx!.arc(p.x, p.y, p.r ?? 2, 0, Math.PI * 2)
          ctx!.fill()
        }
      }
      ctx!.globalAlpha = 1

      // joystick (touch only) — low alpha, drawn before the HUD so its ctx state
      // is isolated by save()/restore() and the HUD sets its own font/align.
      if (inputMode === 'joystick') {
        ctx!.save()
        ctx!.beginPath()
        ctx!.arc(stickAX, stickAY, stickBaseR, 0, Math.PI * 2)
        ctx!.fillStyle = 'rgba(245,197,24,0.06)'
        ctx!.fill()
        ctx!.lineWidth = Math.max(1, 2 * S)
        ctx!.strokeStyle = 'rgba(245,197,24,0.3)'
        ctx!.stroke()
        ctx!.beginPath()
        ctx!.arc(stickAX + stickDX, stickAY + stickDY, stickThumbR, 0, Math.PI * 2)
        ctx!.fillStyle = 'rgba(245,238,224,0.9)'
        ctx!.fill()
        ctx!.strokeStyle = 'rgba(180,83,9,0.9)'
        ctx!.lineWidth = Math.max(1, 2 * S)
        ctx!.stroke()
        ctx!.restore()
      }

      // ---------- HUD (geometry + text scale together by HUD_S) ----------
      const pct = Math.min(1, elapsed / (tier.durationSec * 1000))
      ctx!.fillStyle = 'rgba(255,255,255,0.12)'
      ctx!.fillRect(10 * HUD_S, 10 * HUD_S, W - 20 * HUD_S, 8 * HUD_S)
      ctx!.fillStyle = '#f5c518'
      ctx!.fillRect(10 * HUD_S, 10 * HUD_S, (W - 20 * HUD_S) * pct, 8 * HUD_S)
      ctx!.fillStyle = '#e8e0d0'
      ctx!.font = `600 ${11 * HUD_S}px system-ui, sans-serif`
      ctx!.fillText(`CLOSING TIME ${Math.floor(pct * 100)}%`, W / 2, 30 * HUD_S)
      // composure hearts (top-left)
      ctx!.textAlign = 'left'
      ctx!.font = `${13 * HUD_S}px system-ui`
      for (let i = 0; i < MAX_COMPOSURE; i++) {
        ctx!.globalAlpha = i < truck.composure ? 1 : 0.22
        ctx!.fillText('❤️', 12 * HUD_S + i * 18 * HUD_S, 50 * HUD_S)
      }
      ctx!.globalAlpha = 1
      // fed + score (top-right)
      ctx!.textAlign = 'right'
      ctx!.fillStyle = '#f5c518'
      ctx!.font = `700 ${14 * HUD_S}px system-ui, sans-serif`
      ctx!.fillText(String(Math.round(score)), W - 12 * HUD_S, 50 * HUD_S)
      ctx!.fillStyle = '#e8e0d0'
      ctx!.font = `600 ${11 * HUD_S}px system-ui, sans-serif`
      ctx!.fillText(`🌭 ${fansFed} fed`, W - 12 * HUD_S, 66 * HUD_S)
      // XP bar (bottom) + level
      ctx!.fillStyle = 'rgba(255,255,255,0.12)'
      ctx!.fillRect(10 * HUD_S, H - 14 * HUD_S, W - 20 * HUD_S, 6 * HUD_S)
      ctx!.fillStyle = '#46d369'
      ctx!.fillRect(10 * HUD_S, H - 14 * HUD_S, (W - 20 * HUD_S) * Math.min(1, xp / xpNext), 6 * HUD_S)
      ctx!.textAlign = 'left'
      ctx!.fillStyle = '#9ce3ae'
      ctx!.font = `700 ${10 * HUD_S}px system-ui, sans-serif`
      ctx!.fillText(`LV ${level}`, 10 * HUD_S, H - 22 * HUD_S)
      // control hint (device-aware)
      if (elapsed < 3200) {
        const coarse = lastPointerType === 'touch' || (lastPointerType === null && window.matchMedia?.('(pointer: coarse)').matches)
        ctx!.globalAlpha = Math.max(0, 1 - elapsed / 3200)
        ctx!.fillStyle = '#f5eee0'
        ctx!.font = `600 ${12 * HUD_S}px system-ui, sans-serif`
        ctx!.textAlign = 'center'
        ctx!.fillText(
          coarse ? 'Hold & steer with the stick · the tongs auto-throw' : 'WASD or hold-click to move · the tongs auto-throw',
          W / 2,
          H - 34 * HUD_S,
        )
        ctx!.globalAlpha = 1
      }
    }

    let raf = 0
    let last = performance.now()
    function frame(now: number) {
      if (finished) return
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!paused) update(dt)
      if (!finished) render()
      // Dev bridge for automated verification (mirrors window.__game's spirit).
      if (import.meta.env.DEV) {
        ;(window as unknown as Record<string, unknown>).__frenzy = {
          elapsed: Math.round(elapsed),
          fans: fans.length,
          fansFed,
          tipsCollected,
          level,
          paused,
          composure: truck.composure,
          S: Math.round(S * 100) / 100,
          inputMode,
          stickMag: Math.round(stickMag * 100) / 100,
          tx: Math.round(truck.x),
          ty: Math.round(truck.y),
          range: Math.round(stats.range),
        }
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      finished = true
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('pointerup', endPointer)
      window.removeEventListener('blur', onBlur)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', endPointer)
      canvas.removeEventListener('pointercancel', endPointer)
      canvas.removeEventListener('lostpointercapture', endPointer)
    }
  }, [tier, onEnd, onLevelUp])

  return <canvas ref={canvasRef} className="h-full w-full" style={{ display: 'block' }} />
}

// ---------- band → label/accent ----------
const BAND_META: Record<string, { label: string; accent: string; emoji: string }> = {
  great: { label: 'LEGENDARY SERVICE', accent: '#46d369', emoji: '🌟' },
  good: { label: 'GREAT SERVICE', accent: '#f5c518', emoji: '✨' },
  pass: { label: 'RUSH SURVIVED', accent: '#fb923c', emoji: '🌭' },
  failed: { label: 'MOBBED!', accent: '#f43f5e', emoji: '😵' },
}

// ---------- the outer modal (briefing → playing → outcome) ----------
type Phase = 'briefing' | 'playing' | 'outcome'

export function FoodFrenzyGame() {
  const open = useUiStore((s) => s.foodFrenzyOpen)
  const replay = useUiStore((s) => s.frenzyReplay) // number | null — a chosen cleared tier to practice
  const ff = useFoodFrenzy()
  const [phase, setPhase] = useState<Phase>('briefing')
  const [result, setResult] = useState<FrenzyResult | null>(null)
  const [playIndex, setPlayIndex] = useState(-1) // pinned at launch (clears advance ff.tierIndex)
  const [levelChoices, setLevelChoices] = useState<FrenzyUpgradeDef[] | null>(null)
  const chooseRef = useRef<((id: string) => void) | null>(null)

  useEffect(() => {
    if (open) {
      setPhase('briefing')
      setResult(null)
      setLevelChoices(null)
    }
  }, [open])

  const briefIndex = replay ?? ff.tierIndex
  const briefTier = FOOD_FRENZY_TIERS[briefIndex]
  const playedTier = playIndex >= 0 ? FOOD_FRENZY_TIERS[playIndex] : undefined
  const tier = phase === 'briefing' ? briefTier : playedTier

  const handleEnd = useCallback(
    (metrics: FrenzyMetrics) => {
      setLevelChoices(null)
      const r = completeFrenzyRun(playIndex, metrics, replay != null)
      setResult(r)
      setPhase('outcome')
    },
    [playIndex, replay],
  )
  const handleLevelUp = useCallback((opts: FrenzyUpgradeDef[], choose: (id: string) => void) => {
    chooseRef.current = choose
    setLevelChoices(opts)
  }, [])

  if (!open || !tier) return null

  const close = () => useUiStore.getState().closeFoodFrenzy()
  // A practice replay never re-gates the live rush cooldown — backing out is a pure close.
  const walkAway = () => {
    if (replay == null) abortFrenzyRun()
    close()
  }
  const start = () => {
    setPlayIndex(briefIndex)
    setPhase('playing')
  }
  const pick = (id: string) => {
    haptic(16)
    setLevelChoices(null)
    chooseRef.current?.(id)
    chooseRef.current = null
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col"
      style={{ background: 'radial-gradient(120% 90% at 50% 0%, #241a10, #120c08 70%)', color: '#f5eee0' }}
    >
      {/* header */}
      <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+10px)] pb-2">
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#f5c518' }}>
            Lunch Rush · Tier {tier.index + 1}/{ff.totalTiers}{replay != null ? ' · Replay' : ''}
          </div>
          <div className="truncate text-lg font-black">{tier.name}</div>
        </div>
        {phase === 'playing' ? (
          <button
            type="button"
            onClick={walkAway}
            className="flex items-center rounded-full px-3 text-xs font-bold"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)', minHeight: 44, minWidth: 44 }}
          >
            Close up 🛑
          </button>
        ) : (
          <button
            type="button"
            // On the OUTCOME screen the run is already resolved — the ✕ must NOT
            // abort (that would stomp the resolution cooldown: lengthening a fail's
            // 4-min retry, shortening a clear's 15-min pacing). Plain close there.
            onClick={phase === 'outcome' ? close : walkAway}
            aria-label="Close"
            className="flex items-center justify-center rounded-full px-3 text-lg leading-none"
            style={{ background: 'rgba(255,255,255,0.1)', minHeight: 44, minWidth: 44 }}
          >
            ✕
          </button>
        )}
      </div>

      {/* body */}
      {phase === 'briefing' && (
        <BriefingScreen tier={tier} best={ff.bestScore} onStart={start} onWalkAway={walkAway} />
      )}

      {phase === 'playing' && playedTier && (
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <FrenzyCanvas tier={playedTier} onEnd={handleEnd} onLevelUp={handleLevelUp} />
          {levelChoices && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6"
              style={{ background: 'rgba(10,7,4,0.82)' }}
            >
              <div className="text-2xl font-black" style={{ color: '#46d369' }}>
                LEVEL UP!
              </div>
              <div className="mb-1 text-xs" style={{ color: '#cbbf9f' }}>
                The crowd roars. Pick an upgrade:
              </div>
              {levelChoices.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => pick(u.id)}
                  className="flex w-full max-w-sm items-center gap-3 rounded-xl px-4 py-3 text-left"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(245,197,24,0.4)', minHeight: 'var(--tap, 44px)' }}
                >
                  <span className="text-2xl">{u.icon}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">{u.name}</span>
                    <span className="block text-xs" style={{ color: '#cbbf9f' }}>
                      {u.blurb}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {phase === 'outcome' && result && playedTier && (
        <OutcomeScreen tier={playedTier} result={result} onDone={close} />
      )}
    </div>
  )
}

function LinePanel({ lines }: { lines: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      {lines.map((line, i) => (
        <div
          key={i}
          className="rounded-[var(--ctrl-radius,10px)] p-3 text-sm leading-snug"
          style={{ background: 'rgba(245,197,24,0.08)', borderLeft: '2px solid #f5c518' }}
        >
          {line}
        </div>
      ))}
    </div>
  )
}

function BriefingScreen({
  tier,
  best,
  onStart,
  onWalkAway,
}: {
  tier: FrenzyTierDef
  best: number
  onStart: () => void
  onWalkAway: () => void
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
      <div className="mb-1 text-[11px] font-bold uppercase tracking-wider" style={{ color: '#cbbf9f' }}>
        🌭 Nacho (fry cook) · {tier.codename}
      </div>
      <LinePanel lines={tier.intro} />
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]" style={{ color: '#cbbf9f' }}>
        <div className="rounded-lg py-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="text-base font-black" style={{ color: '#f5eee0' }}>{tier.durationSec}s</div>
          shift
        </div>
        <div className="rounded-lg py-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="text-base font-black" style={{ color: '#f5eee0' }}>
            {tier.stampedeEverySec ? 'Stampedes' : tier.superAtSec ? 'Superfans' : 'Hungry'}
          </div>
          crowd
        </div>
        <div className="rounded-lg py-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="text-base font-black" style={{ color: '#f5eee0' }}>{best > 0 ? best : '—'}</div>
          best
        </div>
      </div>
      <div className="mt-auto flex flex-col gap-2 pt-4">
        <button
          type="button"
          onClick={onStart}
          className="rounded-full py-3 text-base font-black"
          style={{ background: 'linear-gradient(135deg,#b45309,#f5c518)', color: '#1a1206' }}
        >
          🌭 Open the Hatch
        </button>
        <button
          type="button"
          onClick={onWalkAway}
          className="rounded-full py-2 text-sm font-semibold"
          style={{ background: 'transparent', color: '#cbbf9f', border: '1px solid rgba(255,255,255,0.18)', minHeight: 44 }}
        >
          Walk away (the rush comes back later)
        </button>
      </div>
    </div>
  )
}

function OutcomeScreen({
  tier,
  result,
  onDone,
}: {
  tier: FrenzyTierDef
  result: FrenzyResult
  onDone: () => void
}) {
  const meta = BAND_META[result.band] ?? BAND_META.pass
  const passed = result.band !== 'failed'
  const lines = passed ? tier.debrief : FOOD_FRENZY_FAIL_LINES
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] text-center">
      <div className="mt-2 text-5xl">{meta.emoji}</div>
      <div className="text-2xl font-black" style={{ color: meta.accent }}>{meta.label}</div>
      <div className="mb-2 text-sm" style={{ color: '#cbbf9f' }}>
        Score {result.score}
        {result.newBest && passed ? ' · NEW BEST!' : ''}
      </div>
      <div className="text-left">
        <LinePanel lines={lines} />
      </div>

      {passed && (
        <div
          className="mt-3 flex flex-col gap-1.5 rounded-xl p-3 text-left text-sm"
          style={{ background: 'rgba(70,211,105,0.08)', border: '1px solid rgba(70,211,105,0.3)' }}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#cbbf9f' }}>
            Till rewards
          </div>
          {result.cashReward > 0 && <div>💵 <b>+{money(result.cashReward)}</b> banked</div>}
          {result.buffMult > 1 && (
            <div>🍔 Food profit <b>+{Math.round((result.buffMult - 1) * 100)}%</b> for {Math.round(result.buffMs / 1000)}s</div>
          )}
          {result.unlockedSpatula && <div>🏆 <b>GOLDEN SPATULA</b> — Food cooks +10% hotter, forever</div>}
        </div>
      )}

      {passed && result.cleared && !result.allTiersCleared && (
        <div className="mt-3 text-xs" style={{ color: '#cbbf9f' }}>
          Next up: <b style={{ color: '#f5eee0' }}>{FOOD_FRENZY_TIERS[result.tierIndex + 1]?.name}</b> — the rush returns after a cooldown.
        </div>
      )}
      {result.allTiersCleared && (
        <div className="mt-3 text-xs" style={{ color: '#cbbf9f' }}>
          All rushes cleared. Festival Night stays open for score runs (and the buff).
        </div>
      )}

      <button
        type="button"
        onClick={onDone}
        className="mt-4 rounded-full py-3 text-base font-black"
        style={{ background: passed ? 'linear-gradient(135deg,#b45309,#f5c518)' : 'rgba(255,255,255,0.12)', color: passed ? '#1a1206' : '#f5eee0' }}
      >
        {passed ? 'Back to the Empire' : 'Restock & Regroup'}
      </button>
    </div>
  )
}
