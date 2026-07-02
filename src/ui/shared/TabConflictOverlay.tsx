import { useUiStore } from '../../store/uiStore'
import { announceTakeover } from '../../lib/tabGuard'
import { loadGame, resumeSaving } from '../../save/saveManager'
import { startLoop } from '../../loop/gameLoop'
import { runOfflineCatchUp } from '../../loop/offline'
import { publishNow, resetPublishTracking } from '../../loop/publisher'

/**
 * Blocking overlay shown when ANOTHER tab took over the save (see lib/tabGuard).
 * This tab's loop + saving are already paused; "Play here" reclaims ownership by
 * adopting the newest save and pausing the other tab in turn.
 */
export function TabConflictOverlay() {
  const conflict = useUiStore((s) => s.tabConflict)
  if (!conflict) return null

  const playHere = () => {
    announceTakeover() // pauses the other tab (it replies with a final 'saved' broadcast)
    resumeSaving() // FIRST — runOfflineCatchUp no-ops while saving is paused
    loadGame() // adopt whatever the other tab last saved (newest state)
    resetPublishTracking() // don't toast achievements the other tab unlocked
    runOfflineCatchUp() // credit time since that save's wall-clock anchor
    startLoop()
    useUiStore.getState().setTabConflict(false)
    publishNow()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 px-8 text-center"
      style={{ background: 'var(--bg, #0b0e14)', color: 'var(--text)' }}
      role="alertdialog"
      aria-label="Game opened in another tab"
    >
      <span className="text-5xl" aria-hidden>
        🪟
      </span>
      <h2 className="text-lg font-bold">Playing in another tab</h2>
      <p className="max-w-sm text-sm" style={{ color: 'var(--text-dim)' }}>
        Your empire is now open somewhere else, so this tab paused itself — running two
        copies at once would overwrite your progress.
      </p>
      <button type="button" onClick={playHere} className="btn btn-primary btn-lg">
        Play here instead
      </button>
    </div>
  )
}
