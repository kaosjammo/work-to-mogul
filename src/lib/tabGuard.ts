// ============================================================
//  Single-active-tab guard. Two tabs running the same save each simulate, credit
//  offline time, and autosave last-writer-wins over one localStorage key — the
//  slower tab silently clobbers the other's progress and wall-clock spans get
//  credited twice. Standard idle-game rule instead: the NEWEST tab takes over;
//  older tabs pause (loop + saving stopped) behind a "playing elsewhere" overlay
//  with an explicit "Play here" reclaim.
//
//  Protocol (BroadcastChannel, same-origin tabs; degrades to no guard where
//  unsupported): a tab announces 'takeover' when it starts or reclaims. A tab
//  receiving a foreign 'takeover' banks its progress, pauses, and replies
//  'saved'. Because delivery is async, the new owner loaded localStorage BEFORE
//  the old tab's final save landed — so the active tab re-adopts the save when
//  a 'saved' arrives, closing the stale-load race.
// ============================================================

const CHANNEL_NAME = 'tycoon:tab'
// Unique per tab instance; only used to ignore our own broadcasts.
const TAB_ID = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

let channel: BroadcastChannel | null = null

interface TabMsg {
  type: 'takeover' | 'saved'
  id: string
}

/**
 * Start listening for other tabs and announce this tab as the active one.
 * `onTakenOver` fires when ANOTHER tab announces — the caller pauses this tab,
 * banks its progress, then this guard broadcasts 'saved' on its behalf.
 * `onPeerSaved` fires when a paused peer has banked its final state — the
 * caller (if active) should re-adopt the newest save from localStorage.
 */
export function startTabGuard(onTakenOver: () => void, onPeerSaved: () => void): void {
  if (typeof BroadcastChannel === 'undefined') return // degrade gracefully
  channel = new BroadcastChannel(CHANNEL_NAME)
  channel.onmessage = (e: MessageEvent<TabMsg>) => {
    if (!e.data || e.data.id === TAB_ID) return
    if (e.data.type === 'takeover') {
      onTakenOver()
      channel?.postMessage({ type: 'saved', id: TAB_ID } satisfies TabMsg)
    } else if (e.data.type === 'saved') {
      onPeerSaved()
    }
  }
  announceTakeover()
}

/** Broadcast that THIS tab is now the active one (other tabs will pause). */
export function announceTakeover(): void {
  channel?.postMessage({ type: 'takeover', id: TAB_ID } satisfies TabMsg)
}
