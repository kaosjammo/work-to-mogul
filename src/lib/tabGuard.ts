// ============================================================
//  Single-active-tab guard. Two tabs running the same save each simulate, credit
//  offline time, and autosave last-writer-wins over one localStorage key — the
//  slower tab silently clobbers the other's progress and wall-clock spans get
//  credited twice. Standard idle-game rule instead: the NEWEST tab takes over;
//  older tabs pause (loop + saving stopped) behind a "playing elsewhere" overlay
//  with an explicit "Play here" reclaim.
//
//  Transport is a BroadcastChannel (same-origin tabs only). Where unsupported,
//  the guard degrades to today's behaviour rather than breaking anything.
// ============================================================

const CHANNEL_NAME = 'tycoon:tab'
// Unique per tab instance; only used to ignore our own broadcasts.
const TAB_ID = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

let channel: BroadcastChannel | null = null

interface TakeoverMsg {
  type: 'takeover'
  id: string
}

/**
 * Start listening for other tabs and announce this tab as the active one.
 * `onTakenOver` fires when ANOTHER tab announces — the caller pauses this tab.
 */
export function startTabGuard(onTakenOver: () => void): void {
  if (typeof BroadcastChannel === 'undefined') return // degrade gracefully
  channel = new BroadcastChannel(CHANNEL_NAME)
  channel.onmessage = (e: MessageEvent<TakeoverMsg>) => {
    if (e.data?.type === 'takeover' && e.data.id !== TAB_ID) onTakenOver()
  }
  announceTakeover()
}

/** Broadcast that THIS tab is now the active one (other tabs will pause). */
export function announceTakeover(): void {
  channel?.postMessage({ type: 'takeover', id: TAB_ID } satisfies TakeoverMsg)
}
