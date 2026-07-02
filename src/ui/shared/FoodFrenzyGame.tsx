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
//  Controls — desktop: WASD/arrows. Mobile: drag to move. Sprites are emoji
//  (zero assets). Level-up pauses the swarm; the overlay buttons are real DOM
//  (44px tap areas), not canvas hit-boxes.
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
  r: number
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

function statsFrom(stacks: Record<string, number>): RunStats {
  return {
    projectiles: 1 + (stacks.double_dogs ?? 0),
    fireMs: 520 * Math.pow(0.75, stacks.turbo_grill ?? 0),
    splash: (stacks.extra_mustard ?? 0) * 30,
    range: 190 * Math.pow(1.3, stacks.long_toss ?? 0),
    moveSpeed: 300 * Math.pow(1.2, stacks.roller_skates ?? 0),
    pierce: (stacks.big_dog ?? 0) > 0 ? 2 : 0,
    magnet: 60 * Math.pow(1.5, stacks.snack_magnet ?? 0),
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
    const truck = { x: W / 2, y: H / 2, r: 22, composure: MAX_COMPOSURE, invMs: 0, fireMs: 0 }
    const fans: Fan[] = []
    const dogs: Dog[] = []
    const tips: Tip[] = []
    const parts: Particle[] = []
    const stacks: Record<string, number> = {}
    let stats = statsFrom(stacks)

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

    // input
    const keys = new Set<string>()
    let pointerActive = false
    let pTargetX = truck.x
    let pTargetY = truck.y
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'a', 'w', 's', 'd'].includes(k)) e.preventDefault()
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

    function burst(x: number, y: number, color: string, n: number) {
      for (let i = 0; i < n; i++) {
        const a = rand(0, Math.PI * 2)
        const sp = rand(30, 160)
        parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: rand(0.25, 0.6), color, r: rand(1.5, 3) })
      }
    }
    function heartPop(x: number, y: number) {
      parts.push({ x, y, vx: 0, vy: -46, life: 0, max: 0.8, text: '💖' })
    }

    function spawnFan(kindOverride?: 0 | 1 | 2, angle?: number) {
      // Ramp: late-run fans spawn faster + walk quicker.
      const t = Math.min(1, elapsed / (tier.durationSec * 1000))
      let kind: 0 | 1 | 2 = 0
      if (kindOverride != null) kind = kindOverride
      else if (Math.random() < tier.fastShare) kind = 1
      const a = angle ?? rand(0, Math.PI * 2)
      const rad = Math.hypot(W, H) / 2 + 30
      const speedBase = tier.fanSpeed * (1 + 0.35 * t)
      fans.push({
        x: W / 2 + Math.cos(a) * rad,
        y: H / 2 + Math.sin(a) * rad,
        hunger: kind === 2 ? 3 : 1,
        kind,
        speed: kind === 1 ? speedBase * 1.8 : kind === 2 ? speedBase * 0.55 : speedBase * rand(0.9, 1.1),
        r: kind === 2 ? 20 : 14,
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
        tips.push({ x: f.x + rand(-8, 8), y: f.y + rand(-8, 8), vx: 0, vy: 0, burger: burger && i === 0 })
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
      haptic(24)
      onLevelUp(opts, (id: string) => {
        stacks[id] = (stacks[id] ?? 0) + 1
        stats = statsFrom(stacks)
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

      // truck movement
      let mvx = 0
      let mvy = 0
      if (keys.has('arrowleft') || keys.has('a')) mvx -= 1
      if (keys.has('arrowright') || keys.has('d')) mvx += 1
      if (keys.has('arrowup') || keys.has('w')) mvy -= 1
      if (keys.has('arrowdown') || keys.has('s')) mvy += 1
      if (pointerActive) {
        truck.x += (pTargetX - truck.x) * Math.min(1, dt * (stats.moveSpeed / 34))
        truck.y += (pTargetY - truck.y) * Math.min(1, dt * (stats.moveSpeed / 34))
      } else if (mvx || mvy) {
        const len = Math.hypot(mvx, mvy) || 1
        truck.x += (mvx / len) * stats.moveSpeed * dt
        truck.y += (mvy / len) * stats.moveSpeed * dt
      }
      truck.x = Math.max(truck.r, Math.min(W - truck.r, truck.x))
      truck.y = Math.max(truck.r + 46, Math.min(H - truck.r - 6, truck.y))
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
            dogs.push({ x: truck.x, y: truck.y, vx: Math.cos(a) * 340, vy: Math.sin(a) * 340, pierce: stats.pierce })
          }
          truck.fireMs = stats.fireMs
        }
      }

      // hotdogs
      for (let i = dogs.length - 1; i >= 0; i--) {
        const d = dogs[i]
        d.x += d.vx * dt
        d.y += d.vy * dt
        if (d.x < -20 || d.x > W + 20 || d.y < -20 || d.y > H + 20) {
          dogs.splice(i, 1)
          continue
        }
        for (let j = fans.length - 1; j >= 0; j--) {
          const f = fans[j]
          if (Math.hypot(d.x - f.x, d.y - f.y) < f.r + 8) {
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
        f.y += Math.sin(a) * f.speed * dt + Math.sin(f.wobble) * 8 * dt
        if (Math.hypot(f.x - truck.x, f.y - truck.y) < f.r + truck.r - 6) {
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
          p.vx += (dx / (d || 1)) * 900 * dt
          p.vy += (dy / (d || 1)) * 900 * dt
        }
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.vx *= 0.92
        p.vy *= 0.92
        if (d < truck.r + 10) {
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
      // pavement backdrop + subtle grid
      ctx!.fillStyle = '#141019'
      ctx!.fillRect(0, 0, W, H)
      ctx!.strokeStyle = 'rgba(255,255,255,0.04)'
      ctx!.lineWidth = 1
      for (let gx = 0; gx < W; gx += 40) {
        ctx!.beginPath()
        ctx!.moveTo(gx, 0)
        ctx!.lineTo(gx, H)
        ctx!.stroke()
      }
      for (let gy = 0; gy < H; gy += 40) {
        ctx!.beginPath()
        ctx!.moveTo(0, gy)
        ctx!.lineTo(W, gy)
        ctx!.stroke()
      }

      ctx!.textAlign = 'center'
      ctx!.textBaseline = 'middle'

      // range ring (subtle)
      ctx!.strokeStyle = 'rgba(245,197,24,0.14)'
      ctx!.beginPath()
      ctx!.arc(truck.x, truck.y, stats.range, 0, Math.PI * 2)
      ctx!.stroke()

      // tips
      for (const p of tips) {
        ctx!.font = '14px system-ui'
        ctx!.fillText(p.burger ? '🍔' : '💵', p.x, p.y)
      }

      // hotdogs (rotated toward travel)
      for (const d of dogs) {
        ctx!.save()
        ctx!.translate(d.x, d.y)
        ctx!.rotate(Math.atan2(d.vy, d.vx))
        ctx!.font = '16px system-ui'
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
            ctx!.arc(f.x - 10 + i * 10, f.y - f.r - 6, 3, 0, Math.PI * 2)
            ctx!.fill()
          }
        }
      }

      // truck (blink while recovering composure)
      const blink = truck.invMs > 0 && Math.floor(elapsed / 90) % 2 === 0
      if (!blink) {
        ctx!.font = '44px system-ui'
        ctx!.fillText('🚚', truck.x, truck.y)
      }

      // particles
      for (const p of parts) {
        const a = Math.max(0, 1 - p.life / p.max)
        ctx!.globalAlpha = a
        if (p.text) {
          ctx!.font = '18px system-ui'
          ctx!.fillText(p.text, p.x, p.y)
        } else {
          ctx!.fillStyle = p.color ?? '#fff'
          ctx!.beginPath()
          ctx!.arc(p.x, p.y, p.r ?? 2, 0, Math.PI * 2)
          ctx!.fill()
        }
      }
      ctx!.globalAlpha = 1

      // ---------- HUD ----------
      const pct = Math.min(1, elapsed / (tier.durationSec * 1000))
      ctx!.fillStyle = 'rgba(255,255,255,0.12)'
      ctx!.fillRect(10, 10, W - 20, 8)
      ctx!.fillStyle = '#f5c518'
      ctx!.fillRect(10, 10, (W - 20) * pct, 8)
      ctx!.fillStyle = '#e8e0d0'
      ctx!.font = '600 11px system-ui, sans-serif'
      ctx!.fillText(`CLOSING TIME ${Math.floor(pct * 100)}%`, W / 2, 30)
      // composure hearts (top-left)
      ctx!.textAlign = 'left'
      ctx!.font = '13px system-ui'
      for (let i = 0; i < MAX_COMPOSURE; i++) {
        ctx!.globalAlpha = i < truck.composure ? 1 : 0.22
        ctx!.fillText('❤️', 12 + i * 18, 48)
      }
      ctx!.globalAlpha = 1
      // fed + score (top-right)
      ctx!.textAlign = 'right'
      ctx!.fillStyle = '#f5c518'
      ctx!.font = '700 14px system-ui, sans-serif'
      ctx!.fillText(String(Math.round(score)), W - 12, 48)
      ctx!.fillStyle = '#e8e0d0'
      ctx!.font = '600 11px system-ui, sans-serif'
      ctx!.fillText(`🌭 ${fansFed} fed`, W - 12, 64)
      // XP bar (bottom) + level
      ctx!.fillStyle = 'rgba(255,255,255,0.12)'
      ctx!.fillRect(10, H - 14, W - 20, 6)
      ctx!.fillStyle = '#46d369'
      ctx!.fillRect(10, H - 14, (W - 20) * Math.min(1, xp / xpNext), 6)
      ctx!.textAlign = 'left'
      ctx!.fillStyle = '#9ce3ae'
      ctx!.font = '700 10px system-ui, sans-serif'
      ctx!.fillText(`LV ${level}`, 10, H - 22)
      // control hint
      if (elapsed < 3000) {
        ctx!.globalAlpha = Math.max(0, 1 - elapsed / 3000)
        ctx!.fillStyle = '#f5eee0'
        ctx!.font = '600 12px system-ui, sans-serif'
        ctx!.textAlign = 'center'
        ctx!.fillText('Drag to move · the tongs throw themselves', W / 2, H - 34)
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
      window.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
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
