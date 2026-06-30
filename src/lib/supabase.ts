// ============================================================
//  Supabase client (optional). Created only when both Vite env vars are present;
//  otherwise `supabase` is null and every cloud feature no-ops, so anonymous
//  local play is completely unaffected. Only a PUBLIC frontend key is used here
//  (publishable `sb_publishable_…` OR legacy anon JWT `eyJ…`) — NEVER a secret /
//  service_role key. Per-user privacy is enforced by Row Level Security.
// ============================================================
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** True when cloud save is configured for this build. */
export const isSupabaseConfigured = Boolean(url && anonKey)

// New Supabase "publishable" keys (sb_publishable_…) are NOT JWTs: they must be
// sent ONLY as the `apikey` header, never as `Authorization: Bearer`. supabase-js
// otherwise puts the project key in BOTH headers, so on unauthenticated requests
// (signup / login / token refresh) it sends `Authorization: Bearer sb_publishable_…`,
// which GoTrue rejects ("Failed to fetch"). Legacy anon keys are JWTs and ARE
// valid as a bearer, so we only strip the header for publishable keys.
/** Whether a key is a new-format publishable key (not a JWT). */
export function isPublishable(key: string | undefined): boolean {
  return typeof key === 'string' && key.startsWith('sb_publishable_')
}

/**
 * Pure header sanitiser (exported for tests). If `key` is a publishable key and
 * the request is carrying `Authorization: Bearer <key>`, return a copy of the
 * headers with that bad bearer removed (anon role comes from `apikey` instead).
 * Returns null when no rewrite is needed — including for legacy anon JWT keys and
 * for real user access tokens (a different value), which must be left intact.
 */
export function sanitizeAuthHeaders(raw: HeadersInit | undefined, key: string | undefined): Headers | null {
  if (!isPublishable(key) || !raw) return null
  const headers = new Headers(raw)
  if (headers.get('Authorization') === `Bearer ${key}`) {
    headers.delete('Authorization')
    return headers
  }
  return null
}

/** fetch wrapper applying {@link sanitizeAuthHeaders} so publishable keys are
 *  never sent as a bearer token. Real access tokens (after login) pass through. */
function apiKeySafeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const fixed = sanitizeAuthHeaders(init?.headers, anonKey)
  return fixed ? fetch(input, { ...init, headers: fixed }) : fetch(input, init)
}

/** Shared client, or null when unconfigured (anonymous local-only mode). */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true },
      global: { fetch: apiKeySafeFetch },
    })
  : null

if (import.meta.env.DEV && isSupabaseConfigured) {
  // Safe diagnostic — logs the key KIND only, never the value.
  console.info(`[supabase] cloud save configured (${isPublishable(anonKey) ? 'publishable' : 'legacy JWT'} key)`)
}
