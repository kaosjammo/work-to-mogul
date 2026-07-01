// ============================================================
//  Supabase client (optional). Created only when both Vite env vars are present
//  AND the URL is well-formed; otherwise `getSupabase()` resolves to null and
//  every cloud feature no-ops, so anonymous local play is completely unaffected.
//  Only a PUBLIC frontend key is used here (publishable `sb_publishable_…` OR
//  legacy anon JWT `eyJ…`) — NEVER a secret / service_role key.
//
//  The `@supabase/supabase-js` library (~150 kB gzip) is loaded LAZILY via a
//  dynamic import inside `getSupabase()`, so it splits into its own chunk that
//  the anonymous majority never downloads — the initial mobile payload stays
//  lean. Only the type import below is static (types are erased at build).
// ============================================================
import type { SupabaseClient } from '@supabase/supabase-js'

/** Strip accidental surrounding quotes + whitespace (common env-var paste mistake). */
function cleanEnv(v: unknown): string | undefined {
  return typeof v === 'string' ? v.trim().replace(/^['"]+|['"]+$/g, '') : undefined
}

// Normalise: drop quotes/whitespace, and a trailing slash on the URL.
const url = cleanEnv(import.meta.env.VITE_SUPABASE_URL)?.replace(/\/+$/, '')
const anonKey = cleanEnv(import.meta.env.VITE_SUPABASE_ANON_KEY)

/** True when both env vars are present. */
export const isSupabaseConfigured = Boolean(url && anonKey)

/** A human-readable reason the URL is unusable, or null if it looks valid. */
export function supabaseUrlError(u: string | undefined): string | null {
  if (!u) return 'VITE_SUPABASE_URL is not set.'
  let parsed: URL | null = null
  try {
    parsed = new URL(u)
  } catch {
    return 'VITE_SUPABASE_URL isn’t a valid URL — expected https://<project-ref>.supabase.co (no quotes, no trailing slash).'
  }
  if (parsed.protocol !== 'https:') {
    return `VITE_SUPABASE_URL must start with https:// (got "${parsed.protocol}").`
  }
  return null
}

/** Config problem (bad URL) when configured, else null — surfaced in the UI. */
export const configError: string | null = isSupabaseConfigured ? supabaseUrlError(url) : null

/** The configured host (NO key) — safe to show/log for diagnosis. */
export const supabaseHost: string | null = (() => {
  try {
    return url ? new URL(url).host : null
  } catch {
    return null
  }
})()

/** Whether a key is a new-format publishable key (not a JWT). */
export function isPublishable(key: string | undefined): boolean {
  return typeof key === 'string' && key.startsWith('sb_publishable_')
}

/**
 * Pure header sanitiser (exported for tests). New publishable keys (sb_publishable_…)
 * are NOT JWTs and must be sent only as the `apikey` header. supabase-js otherwise
 * puts the key in `Authorization: Bearer …` on unauthenticated requests, which
 * GoTrue rejects. If `key` is publishable and the request carries
 * `Authorization: Bearer <key>`, return headers with that bad bearer removed; else
 * null (no rewrite) — including for legacy anon JWTs and real user access tokens.
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

/** fetch wrapper applying {@link sanitizeAuthHeaders}. Real access tokens pass through. */
function apiKeySafeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const fixed = sanitizeAuthHeaders(init?.headers, anonKey)
  return fixed ? fetch(input, { ...init, headers: fixed }) : fetch(input, init)
}

// Memoised lazy client. The first `getSupabase()` call triggers the dynamic
// import of the library and builds the client; subsequent calls reuse the same
// in-flight/resolved promise so every consumer shares one auth instance.
let clientPromise: Promise<SupabaseClient | null> | null = null

/**
 * Resolve the shared Supabase client, or null when unconfigured / misconfigured
 * (anonymous local-only). Loads `@supabase/supabase-js` on first use — call this
 * only on an actual cloud path (sign-in, sync) so anonymous play never fetches it.
 */
export function getSupabase(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured || configError) return Promise.resolve(null)
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(url as string, anonKey as string, {
        auth: { persistSession: true, autoRefreshToken: true },
        global: { fetch: apiKeySafeFetch },
      }),
    )
  }
  return clientPromise
}

if (isSupabaseConfigured) {
  // Safe startup diagnostic — host + key KIND only, NEVER the key value.
  if (configError) {
    console.error(`[supabase] cloud save disabled — ${configError}`)
  } else {
    console.info(`[supabase] cloud save → ${supabaseHost} (${isPublishable(anonKey) ? 'publishable' : 'legacy JWT'} key)`)
  }
}
