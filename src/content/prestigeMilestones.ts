// ============================================================
//  Prestige milestones — long-horizon goals keyed on ascension count.
//  Reaching one grants a one-time bonus of Empire Tokens (claimed in
//  engine/prestigeMilestones.ts, recorded so it never re-grants). The first
//  ascension itself is already covered by the `first_ascension` achievement,
//  so these start at 3 resets and reward dedicated prestige play.
// ============================================================
export interface PrestigeMilestoneDef {
  id: string
  resets: number // ascensions required
  name: string
  description: string
  icon: string
  rewardTokens: number // one-time Empire Token bonus
}

// Kept sorted by `resets` ascending — checkPrestigeMilestones back-grants every
// milestone at or below the current reset count in this order.
export const PRESTIGE_MILESTONES: PrestigeMilestoneDef[] = [
  { id: 'ascend_3', resets: 3, name: 'Serial Restarter', description: 'Ascend 3 times', icon: '🔁', rewardTokens: 3 },
  { id: 'ascend_5', resets: 5, name: 'Phoenix', description: 'Ascend 5 times', icon: '🔥', rewardTokens: 6 },
  { id: 'ascend_10', resets: 10, name: 'Cycle Master', description: 'Ascend 10 times', icon: '♾️', rewardTokens: 15 },
  { id: 'ascend_15', resets: 15, name: 'Reincarnated', description: 'Ascend 15 times', icon: '🌀', rewardTokens: 25 },
  { id: 'ascend_25', resets: 25, name: 'Eternal', description: 'Ascend 25 times', icon: '🌌', rewardTokens: 40 },
  { id: 'ascend_35', resets: 35, name: 'Ascendant', description: 'Ascend 35 times', icon: '🌠', rewardTokens: 70 },
  { id: 'ascend_50', resets: 50, name: 'Transcendent', description: 'Ascend 50 times', icon: '👑', rewardTokens: 100 },
  { id: 'ascend_75', resets: 75, name: 'Demigod', description: 'Ascend 75 times', icon: '⚡', rewardTokens: 150 },
  { id: 'ascend_100', resets: 100, name: 'Immortal', description: 'Ascend 100 times', icon: '🏛️', rewardTokens: 220 },
  { id: 'ascend_200', resets: 200, name: 'Omnipotent', description: 'Ascend 200 times', icon: '✨', rewardTokens: 500 },
]

export const PRESTIGE_MILESTONE_NAME: Record<string, string> = Object.fromEntries(
  PRESTIGE_MILESTONES.map((m) => [m.id, m.name]),
)
