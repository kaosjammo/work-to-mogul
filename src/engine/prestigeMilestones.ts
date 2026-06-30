// ============================================================
//  Prestige-milestone checker (pure over GameState). Mirrors the achievements
//  pattern but is keyed on ascension count and grants Empire Tokens. Only
//  called from prestigeReset (resets only change there), so no per-tick cost.
// ============================================================
import type { GameState } from '../types/domain'
import { PRESTIGE_MILESTONES, type PrestigeMilestoneDef } from '../content/prestigeMilestones'

/**
 * Grant any newly-reached prestige milestones: records the id and adds the
 * token reward to prestige.totalPoints. Returns the defs granted this call
 * (for toast notifications). Idempotent — claimed ids never re-grant.
 */
export function checkPrestigeMilestones(state: GameState): PrestigeMilestoneDef[] {
  if (!Array.isArray(state.prestigeMilestonesClaimed)) state.prestigeMilestonesClaimed = []
  const claimed = new Set(state.prestigeMilestonesClaimed)
  const granted: PrestigeMilestoneDef[] = []
  for (const m of PRESTIGE_MILESTONES) {
    if (claimed.has(m.id)) continue
    if (state.prestige.resets >= m.resets) {
      state.prestigeMilestonesClaimed.push(m.id)
      state.prestige.totalPoints += m.rewardTokens
      granted.push(m)
    }
  }
  return granted
}
