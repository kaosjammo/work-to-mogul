// ============================================================
//  Supabase client (optional). Created only when both Vite env vars are present;
//  otherwise `supabase` is null and every cloud feature no-ops, so anonymous
//  local play is completely unaffected. Only the PUBLIC anon key is used here —
//  per-user privacy is enforced by Row Level Security (see supabase-notes.md).
// ============================================================
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** True when cloud save is configured for this build. */
export const isSupabaseConfigured = Boolean(url && anonKey)

/** Shared client, or null when unconfigured (anonymous local-only mode). */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null
