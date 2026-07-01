// ============================================================
//  Account + cloud-sync store (Zustand, UI-only — separate from the game engine).
//  Wires Supabase Auth to the existing local save. Anonymous local play is the
//  default and is never broken: when unconfigured/signed-out, status is "local"
//  and nothing touches the cloud. On login we reconcile local vs cloud and NEVER
//  silently overwrite — both-exist surfaces a "use this device / use cloud" choice.
// ============================================================
import { create } from 'zustand'
import { getSupabase, isSupabaseConfigured, configError as supabaseConfigError, supabaseHost } from '../lib/supabase'
import { fetchCloudSave, uploadCloudSave } from '../save/cloud'
import {
  snapshotEnvelope,
  readLocalEnvelope,
  applyEnvelope,
  summarizeEnvelope,
  setAfterSave,
  type SaveSummary,
} from '../save/saveManager'
import { publishNow } from '../loop/publisher'

export type SyncStatus = 'local' | 'syncing' | 'synced' | 'error'

interface AccountUser {
  id: string
  email: string | null
}

interface Conflict {
  local: SaveSummary
  cloud: SaveSummary
  cloudEnvelope: unknown
  cloudUpdatedAt: string
}

interface AccountStore {
  configured: boolean
  configError: string | null // bad VITE_SUPABASE_URL etc. (clear message), or null
  host: string | null // configured Supabase host (no key) for diagnosis
  ready: boolean
  user: AccountUser | null
  status: SyncStatus
  authBusy: boolean
  authError: string | null
  authNotice: string | null
  conflict: Conflict | null
  init: () => void
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  syncNow: () => Promise<void>
  resolveConflict: (choice: 'local' | 'cloud') => Promise<void>
  clearAuthMessages: () => void
}

const SYNCED_AT_KEY = 'tycoon:cloud_synced_at'
const MIN_UPLOAD_GAP_MS = 25_000

let initialized = false
let lastUploadAt = 0
// Guards against overlapping reconciles (getSession + onAuthStateChange both
// fire for one session; auth token refresh re-emits events for the same user).
let reconciling = false
let reconciledUserId: string | null = null

function zeroSummary(): SaveSummary {
  return { savedAt: 0, cash: 0, lifetime: 0 }
}

// Two saves are "the same" if their key figures match closely (so a returning
// user who is already in sync isn't nagged with the conflict chooser).
function sameSave(a: SaveSummary, b: SaveSummary): boolean {
  return Math.abs(a.savedAt - b.savedAt) < 2000 && a.cash === b.cash && a.lifetime === b.lifetime
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // ignore (private mode / quota)
  }
}

/** Friendly auth-error text + a safe (key-free) diagnostic for network failures. */
function authErrorMessage(error: { message?: string }): string {
  const msg = error?.message ?? 'Something went wrong. Please try again.'
  if (/failed to fetch|load failed|networkerror|network request failed|fetch/i.test(msg)) {
    // Never log the URL/key values — just that the request didn't reach the server.
    console.warn('[supabase] auth request could not reach the server (network / Supabase outage / config).')
    return 'Couldn’t reach the sign-in server. Supabase may be temporarily down (check status.supabase.com), or the Supabase URL/key may be misconfigured. Your progress is saved locally — try again shortly.'
  }
  return msg
}

export const useAccountStore = create<AccountStore>((set, get) => ({
  configured: isSupabaseConfigured,
  configError: supabaseConfigError,
  host: supabaseHost,
  ready: !isSupabaseConfigured, // unconfigured → immediately ready in local-only mode
  user: null,
  status: 'local',
  authBusy: false,
  authError: null,
  authNotice: null,
  conflict: null,

  init: () => {
    if (initialized) return
    initialized = true

    // Cloud upload piggybacks on local autosave, throttled, and never while a
    // sync/conflict is in flight.
    setAfterSave(() => {
      const s = get()
      if (!s.user || s.status === 'syncing' || s.conflict) return
      if (Date.now() - lastUploadAt < MIN_UPLOAD_GAP_MS) return
      void get().syncNow()
    })

    if (!isSupabaseConfigured || supabaseConfigError) {
      set({ ready: true, status: 'local' })
      return
    }

    // Loads the Supabase library (its own chunk) — only reached when cloud is
    // configured, so anonymous play never triggers the download.
    void getSupabase().then((supabase) => {
      if (!supabase) {
        set({ ready: true, status: 'local' })
        return
      }

      supabase.auth.getSession().then(({ data }) => {
        const u = data.session?.user
        if (u) {
          set({ user: { id: u.id, email: u.email ?? null } })
          maybeReconcile(u.id)
        }
        set({ ready: true })
      })

      // Deduped by user id + in-flight guard, so repeated INITIAL_SESSION /
      // TOKEN_REFRESHED events for an already-reconciled user are no-ops.
      supabase.auth.onAuthStateChange((_event, session) => {
        const u = session?.user
        if (u) {
          set({ user: { id: u.id, email: u.email ?? null }, authError: null })
          maybeReconcile(u.id)
        } else {
          reconciledUserId = null
          lastUploadAt = 0
          set({ user: null, status: 'local', conflict: null })
        }
      })
    })
  },

  signUp: async (email, password) => {
    const supabase = await getSupabase()
    if (!supabase) return
    set({ authBusy: true, authError: null, authNotice: null })
    const { data, error } = await supabase.auth.signUp({ email, password })
    set({ authBusy: false })
    if (error) {
      set({ authError: authErrorMessage(error) })
      return
    }
    // Confirmation ON → user exists but no session yet; tell them to check email.
    if (data.user && !data.session) {
      set({ authNotice: 'Account created — check your email to confirm, then log in.' })
    }
    // Confirmation OFF → a session arrives and onAuthStateChange reconciles.
  },

  signIn: async (email, password) => {
    const supabase = await getSupabase()
    if (!supabase) return
    set({ authBusy: true, authError: null, authNotice: null })
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    set({ authBusy: false })
    if (error) set({ authError: authErrorMessage(error) })
  },

  signOut: async () => {
    const supabase = await getSupabase()
    if (!supabase) return
    await supabase.auth.signOut()
    reconciledUserId = null
    lastUploadAt = 0
    set({ user: null, status: 'local', conflict: null })
  },

  syncNow: async () => {
    const { user } = get()
    if (!user || !(await getSupabase())) return
    set({ status: 'syncing' })
    try {
      const updatedAt = await uploadCloudSave(user.id, snapshotEnvelope())
      safeSet(SYNCED_AT_KEY, updatedAt)
      lastUploadAt = Date.now()
      set({ status: 'synced' })
    } catch {
      set({ status: 'error' })
    }
  },

  resolveConflict: async (choice) => {
    const { user, conflict } = get()
    if (!user || !conflict) return
    set({ status: 'syncing', conflict: null })
    try {
      if (choice === 'cloud') {
        if (!applyEnvelope(conflict.cloudEnvelope)) {
          set({ status: 'error' }) // unrecoverable cloud data — don't claim success
          return
        }
        publishNow()
        safeSet(SYNCED_AT_KEY, conflict.cloudUpdatedAt)
      } else {
        const updatedAt = await uploadCloudSave(user.id, snapshotEnvelope())
        safeSet(SYNCED_AT_KEY, updatedAt)
        lastUploadAt = Date.now()
      }
      set({ status: 'synced' })
    } catch {
      set({ status: 'error' })
    }
  },

  clearAuthMessages: () => set({ authError: null, authNotice: null }),
}))

function maybeReconcile(userId: string): void {
  if (reconciling || reconciledUserId === userId) return
  if (useAccountStore.getState().conflict) return
  void reconcile(userId)
}

// Decide what to do with local vs cloud saves right after a session appears.
async function reconcile(userId: string): Promise<void> {
  if (!(await getSupabase())) return
  reconciling = true
  reconciledUserId = userId
  const store = useAccountStore
  store.setState({ status: 'syncing' })
  try {
    const cloud = await fetchCloudSave(userId)
    const local = readLocalEnvelope()

    if (cloud && local) {
      const ls = summarizeEnvelope(local) ?? zeroSummary()
      const cs = summarizeEnvelope(cloud.envelope) ?? zeroSummary()
      if (sameSave(ls, cs)) {
        safeSet(SYNCED_AT_KEY, cloud.updatedAt)
        store.setState({ status: 'synced' })
        return
      }
      // Both exist and differ → ask the player; never overwrite silently.
      // Status must NOT be 'syncing' here: the conflict chooser disables its two
      // choice buttons while busy (status === 'syncing'), which would deadlock the
      // modal — the player could never pick. 'local' is accurate (not yet synced;
      // local play continues) and the autosave upload already no-ops while a
      // conflict is pending (it guards on s.conflict), so nothing uploads meanwhile.
      store.setState({
        conflict: { local: ls, cloud: cs, cloudEnvelope: cloud.envelope, cloudUpdatedAt: cloud.updatedAt },
        status: 'local',
      })
    } else if (cloud && !local) {
      if (!applyEnvelope(cloud.envelope)) {
        reconciledUserId = null // unrecoverable — allow a retry later
        store.setState({ status: 'error' })
        return
      }
      publishNow()
      safeSet(SYNCED_AT_KEY, cloud.updatedAt)
      store.setState({ status: 'synced' })
    } else if (!cloud && local) {
      const updatedAt = await uploadCloudSave(userId, local)
      safeSet(SYNCED_AT_KEY, updatedAt)
      lastUploadAt = Date.now()
      store.setState({ status: 'synced' })
    } else {
      // Neither: seed the cloud row from the current (fresh) state.
      const updatedAt = await uploadCloudSave(userId, snapshotEnvelope())
      safeSet(SYNCED_AT_KEY, updatedAt)
      lastUploadAt = Date.now()
      store.setState({ status: 'synced' })
    }
  } catch {
    reconciledUserId = null // allow retry on a later auth event
    store.setState({ status: 'error' })
  } finally {
    reconciling = false
  }
}
