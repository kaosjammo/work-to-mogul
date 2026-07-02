// ============================================================
//  Game loop — requestAnimationFrame driver with a fixed 100 ms timestep.
//  The accumulator clamp here is the small ANTI-SPIRAL guard (rule #3),
//  NOT offline catch-up (that's catchUp.ts, added in M6).
// ============================================================
import { getEngineState } from '../engine/engineState'
import { applyTick } from '../engine/simulate'
import { MIN_REPORTABLE_MS } from '../engine/catchUp'
import { publishThrottled } from './publisher'
import { runStallCatchUp } from './offline'

const TICK_MS = 100 // 10 Hz simulation
const MAX_CATCHUP_MS = 250 // anti-spiral only; large gaps are handled by catchUp.ts
// A frame gap this large is a real interruption (system sleep, long GC stall, or
// the first frame after the tab was hidden). Credit it through the wall-clock
// stall path instead of simulating a clamped slice of it: the clamp would silently
// drop the remainder, and after a hidden→visible transition the visibilitychange
// handler has ALREADY credited this span — simulating another 250ms of it would
// double-pay. Derived from MIN_REPORTABLE_MS so a routed span can't fall under the
// catch-up's own minimum and be swallowed (the two share this boundary).
const STALL_MS = MIN_REPORTABLE_MS

let accumulator = 0
// Wall time the anti-spiral clamp dropped (250ms–1s gaps land in neither the
// simulate path nor the stall path). Banked here and credited through the stall
// path once it crosses the reportable minimum, so a device rendering ~500ms
// frames doesn't permanently lose half its income.
let clampDebtMs = 0
let last = 0
let rafId = 0
let running = false

function frame(now: number): void {
  let dt = now - last
  last = now
  if (dt >= STALL_MS) {
    runStallCatchUp() // no-ops if the span was already credited on visibilitychange
    dt = 0
  } else if (dt > MAX_CATCHUP_MS) {
    clampDebtMs += dt - MAX_CATCHUP_MS
    dt = MAX_CATCHUP_MS
  }
  accumulator += dt

  const state = getEngineState()
  while (accumulator >= TICK_MS) {
    applyTick(state, TICK_MS)
    accumulator -= TICK_MS
  }
  state.lastWallClock = Date.now()

  // Pay off accumulated clamp losses: rewind the anchor by the debt and let the
  // stall path credit it at the plain steady rate.
  if (clampDebtMs >= MIN_REPORTABLE_MS) {
    state.lastWallClock -= clampDebtMs
    clampDebtMs = 0
    runStallCatchUp()
  }

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
