import { describe, it, expect } from 'vitest'
import { isPublishable, sanitizeAuthHeaders } from './supabase'

const PUB = 'sb_publishable_AbC123xyz'
const LEGACY_JWT = 'eyJhbGciOiJIUzI1NiIs.legacy.anon'
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIs.user.session' // a real session token (also a JWT)

describe('publishable-key auth header handling', () => {
  it('detects publishable vs legacy/absent keys', () => {
    expect(isPublishable(PUB)).toBe(true)
    expect(isPublishable(LEGACY_JWT)).toBe(false)
    expect(isPublishable(undefined)).toBe(false)
  })

  it('strips Authorization when a publishable key is sent as a bearer (signup/login/refresh)', () => {
    const fixed = sanitizeAuthHeaders(
      { apikey: PUB, Authorization: `Bearer ${PUB}`, 'Content-Type': 'application/json' },
      PUB,
    )
    expect(fixed).not.toBeNull()
    expect(fixed!.get('Authorization')).toBeNull() // no bearer publishable key
    expect(fixed!.get('apikey')).toBe(PUB) // key still carried as apikey
    expect(fixed!.get('Content-Type')).toBe('application/json')
  })

  it('leaves a real user access token intact (so cloud save works after login)', () => {
    // After login supabase-js sends Bearer <access_token> — must NOT be stripped.
    expect(sanitizeAuthHeaders({ apikey: PUB, Authorization: `Bearer ${ACCESS_TOKEN}` }, PUB)).toBeNull()
  })

  it('does not touch a legacy anon JWT key (valid as a bearer)', () => {
    expect(sanitizeAuthHeaders({ apikey: LEGACY_JWT, Authorization: `Bearer ${LEGACY_JWT}` }, LEGACY_JWT)).toBeNull()
  })

  it('no-ops with no headers or no key', () => {
    expect(sanitizeAuthHeaders(undefined, PUB)).toBeNull()
    expect(sanitizeAuthHeaders({ Authorization: 'Bearer whatever' }, undefined)).toBeNull()
  })
})
