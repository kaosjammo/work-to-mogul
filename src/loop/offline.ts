// ============================================================
//  Offline catch-up wiring — runs on load and whenever the tab becomes
//  visible again (requestAnimationFrame is paused while hidden, so the wall-
//  clock catch-up in engine/catchUp.ts is what credits time away).
// ============================================================
import { getEngineState } from '../engine/engineState'
import { applyOfflineEarnings } from '../engine/catchUp'
import { isSavingPaused } from '../save/saveManager'
import { publishNow } from './publisher'
import { useUiStore } from '../store/uiStore'

const MIN_BANNER_MS = 5000 // don't nag for brief tab switches

export function runOfflineCatchUp(): void {
  if (isSavingPaused()) return // another tab owns the game — don't mint parallel income
  const res = applyOfflineEarnings(getEngineState(), Date.now())
  if (res.earned > 0 && res.elapsedMs >= MIN_BANNER_MS) {
    useUiStore.getState().setWelcomeBack({ earned: res.earned, elapsedMs: res.elapsedMs })
  }
  publishNow()
}

/**
 * Credit an IN-SESSION frame stall (GC pause, throttled/occluded window, system
 * sleep without a visibility event). Unlike a real absence this pays the plain
 * steady rate — no Idle-Mastery/Homebody away bonuses (a visible window ticking
 * at 1fps must not farm them) — and never pops the Welcome-Back banner mid-play.
 */
export function runStallCatchUp(): void {
  if (isSavingPaused()) return
  applyOfflineEarnings(getEngineState(), Date.now(), { awayBonuses: false })
}

export function startVisibilityCatchUp(): void {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') runOfflineCatchUp()
  })
}
