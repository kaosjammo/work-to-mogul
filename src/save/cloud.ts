// ============================================================
//  Cloud save data access — the `game_saves` table (one row per user, RLS).
//  Stores the SAME versioned envelope used by localStorage, as jsonb. All calls
//  no-op / throw cleanly when Supabase is unconfigured; callers guard on a user.
// ============================================================
import { getSupabase } from '../lib/supabase'
import { CURRENT_SAVE_VERSION, type SaveEnvelope } from './serialize'

export interface CloudSave {
  envelope: SaveEnvelope
  saveVersion: number
  updatedAt: string // ISO timestamp from the row
}

/** Fetch the signed-in user's cloud save, or null if they have none. */
export async function fetchCloudSave(userId: string): Promise<CloudSave | null> {
  const supabase = await getSupabase()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('game_saves')
    .select('save_data, save_version, updated_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return {
    envelope: data.save_data as SaveEnvelope,
    saveVersion: typeof data.save_version === 'number' ? data.save_version : CURRENT_SAVE_VERSION,
    updatedAt: String(data.updated_at),
  }
}

/** Upsert the user's cloud save. Returns the new `updated_at` ISO timestamp. */
export async function uploadCloudSave(userId: string, envelope: SaveEnvelope): Promise<string> {
  const supabase = await getSupabase()
  if (!supabase) throw new Error('Cloud save is not configured')
  const updatedAt = new Date().toISOString()
  const { error } = await supabase.from('game_saves').upsert(
    {
      user_id: userId,
      save_data: envelope,
      save_version: CURRENT_SAVE_VERSION,
      updated_at: updatedAt,
    },
    { onConflict: 'user_id' },
  )
  if (error) throw error
  return updatedAt
}
