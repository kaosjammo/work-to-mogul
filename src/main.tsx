import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'
import { startLoop, stopLoop } from './loop/gameLoop'
import { loadGame, startAutosave, saveGame, pauseSaving } from './save/saveManager'
import { runOfflineCatchUp, startVisibilityCatchUp } from './loop/offline'
import { startTabGuard } from './lib/tabGuard'
import { useAccountStore } from './store/accountStore'
import { useUiStore } from './store/uiStore'

// Restore any saved game, then credit time away before the first render / tick.
loadGame()
runOfflineCatchUp()

const rootEl = document.getElementById('root')
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

// The simulation lives outside React; start it once at module load.
startLoop()
startAutosave()
startVisibilityCatchUp()
// Single-active-tab rule: when another tab announces itself as the active one,
// save what we have, then pause this tab (loop + saving) behind a blocking
// overlay — two live tabs would clobber each other's saves and double-credit
// offline time. "Play here" on the overlay reclaims ownership.
startTabGuard(() => {
  saveGame() // bank this tab's progress before the newer tab's autosaves take over
  pauseSaving()
  stopLoop()
  useUiStore.getState().setTabConflict(true)
})
// Optional cloud account/sync (no-op in local-only mode when unconfigured).
useAccountStore.getState().init()

// Register the service worker for installability + offline play (prod only;
// the dev server is intentionally left without a SW to avoid cache staleness).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Offline support is a progressive enhancement — ignore failures.
    })
  })
}

// Dev-only content validation + debug bridge (not bundled in prod).
if (import.meta.env.DEV) {
  void import('./engine/validateContent').then((v) => {
    const errors = v.validateContent()
    if (errors.length) console.error('[content] validation errors:', errors)
  })
}
if (import.meta.env.DEV) {
  void Promise.all([
    import('./engine/engineState'),
    import('./loop/publisher'),
    import('./engine/simulate'),
    import('./store/uiStore'),
    import('./loop/offline'),
    import('./store/accountStore'),
  ]).then(([m, p, sim, ui, off, acc]) => {
    ;(window as unknown as { __game: unknown }).__game = {
      state: m.getEngineState,
      publish: p.publishNow,
      ui: () => ui.useUiStore.getState(),
      account: acc.useAccountStore, // the account/cloud store — for debugging sync/conflict flows
      offline: () => off.runOfflineCatchUp(),
      grantCash: (amount: number) => {
        m.getEngineState().cash += amount
        p.publishNow()
      },
      // Drive the sim deterministically (useful when the preview tab is hidden
      // and requestAnimationFrame is paused by the browser).
      advance: (ms: number) => {
        const s = m.getEngineState()
        let remaining = ms
        while (remaining > 0) {
          const step = Math.min(100, remaining)
          sim.applyTick(s, step)
          remaining -= step
        }
        p.publishNow()
      },
    }
  })
}
