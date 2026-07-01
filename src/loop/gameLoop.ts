// ============================================================
//  Game loop — requestAnimationFrame driver with a fixed 100 ms timestep.
//  The accumulator clamp here is the small ANTI-SPIRAL guard (rule #3),
//  NOT offline catch-up (that's catchUp.ts, added in M6).
// ============================================================
import { getEngineState } from '../engine/engineState'
import { applyTick } from '../engine/simulate'
import { publishThrottled } from './publisher'
import { runOfflineCatchUp } from './offline'

const TICK_MS = 100 // 10 Hz simulation
const MAX_CATCHUP_MS = 250 // anti-spiral only; large gaps are handled by catchUp.ts
// A frame gap this large is a real absence (system sleep, long stall, or the first
// frame after the tab was hidden). Credit it through the wall-clock catch-up path
// instead of simulating a clamped slice of it: the clamp would silently drop the
// remainder, and after a hidden→visible transition the visibilitychange handler has
// ALREADY credited this span — simulating another 250ms of it would double-pay.
const STALL_MS = 1000

let accumulator = 0
let last = 0
let rafId = 0
let running = false

function frame(now: number): void {
  let dt = now - last
  last = now
  if (dt >= STALL_MS) {
    runOfflineCatchUp() // no-ops if the span was already credited on visibilitychange
    dt = 0
  } else if (dt > MAX_CATCHUP_MS) dt = MAX_CATCHUP_MS
  accumulator += dt

  const state = getEngineState()
  while (accumulator >= TICK_MS) {
    applyTick(state, TICK_MS)
    accumulator -= TICK_MS
  }
  state.lastWallClock = Date.now()

  publishThrottled(now)
  rafId = requestAnimationFrame(frame)
}

export function startLoop(): void {
  if (running) return
  running = true
  last = performance.now()
  accumulator = 0
  rafId = requestAnimationFrame(frame)
}

export function stopLoop(): void {
  running = false
  cancelAnimationFrame(rafId)
}
