// ============================================================
//  Publisher — copies the canonical engine snapshot into the view store.
//  Throttled to ~7 Hz from the loop; publishNow() is called immediately
//  after discrete actions so the UI stays consistent.
// ============================================================
import { useGameStore } from '../store/gameStore'
import { useUiStore } from '../store/uiStore'
import { buildView } from '../store/buildView'
import { getEngineState } from '../engine/engineState'
import { ACHIEVEMENT_NAME } from '../content/achievements'
import { haptic } from '../lib/haptics'

const PUBLISH_INTERVAL_MS = 140 // ~7 Hz
let lastPublish = 0
// Tracks how many achievements we've already toasted (-1 = not yet synced).
let seenAchievements = -1

/** Toast achievements unlocked since the last publish (lazy-synced on first run). */
function toastNewAchievements(): void {
  const ids = getEngineState().achievementsUnlocked
  if (seenAchievements < 0) {
    seenAchievements = ids.length // first publish (or after load): don't toast existing
    return
  }
  if (ids.length > seenAchievements) {
    const fresh = ids.slice(seenAchievements)
    useUiStore.getState().pushCelebrations(fresh.map((id) => `🏆 ${ACHIEVEMENT_NAME[id] ?? id}`))
    haptic(26) // a notable reward — buzz like the other celebratory moments
    seenAchievements = ids.length
  }
}

export function publishNow(): void {
  toastNewAchievements()
  useGameStore.getState()._publish(buildView(getEngineState()))
}

export function publishThrottled(now: number): void {
  if (now - lastPublish >= PUBLISH_INTERVAL_MS) {
    lastPublish = now
    publishNow()
  }
}

/** Reset publish-side tracking (e.g. after a hard reset) so toasts re-sync. */
export function resetPublishTracking(): void {
  seenAchievements = -1
  lastPublish = 0
}
