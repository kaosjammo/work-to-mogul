// ============================================================
//  Daily-streak milestones (D7 depth). Hitting a streak day grants a bigger one-off
//  on top of the normal daily bonus — the "don't break your streak" hook. Rewards
//  reuse existing systems only (cash scaled to the daily so it auto-scales across
//  prestige tiers, or Empire Tokens); NO new currency, NO RNG. Since the streak
//  advances by exactly 1 per real day, a milestone fires exactly when the streak
//  reaches its day, and re-earns on a fresh streak-run after a break.
// ============================================================

export type MilestoneReward =
  | { kind: 'cash'; dailyMult: number } // N× the current daily bonus (income-scaled)
  | { kind: 'tokens'; amount: number } // a chunk of Empire Tokens

export interface DailyMilestone {
  day: number // streak day this fires on
  label: string // plain-language reward, for the celebration + card
  reward: MilestoneReward
}

// 4 milestones — mixed cash / tokens for variety, modest token amounts so the daily
// can't out-earn a prestige run's token yield.
export const DAILY_MILESTONES: DailyMilestone[] = [
  { day: 3, label: '+6× bonus cash', reward: { kind: 'cash', dailyMult: 6 } },
  { day: 7, label: '+3 ✦ Empire Tokens', reward: { kind: 'tokens', amount: 3 } },
  { day: 14, label: '+40× bonus cash', reward: { kind: 'cash', dailyMult: 40 } },
  { day: 30, label: '+12 ✦ Empire Tokens', reward: { kind: 'tokens', amount: 12 } },
]

/** The milestone that fires exactly at `streak` day, or null. */
export function milestoneAt(streak: number): DailyMilestone | null {
  return DAILY_MILESTONES.find((m) => m.day === streak) ?? null
}

/** The next milestone strictly above `streak` (for the "next reward at Day N" cue), or null. */
export function nextMilestone(streak: number): DailyMilestone | null {
  return DAILY_MILESTONES.find((m) => m.day > streak) ?? null
}

/** The highest milestone day at or below `streak` (0 = none) — the progress-bar baseline. */
export function prevMilestoneDay(streak: number): number {
  let prev = 0
  for (const m of DAILY_MILESTONES) if (m.day <= streak) prev = m.day
  return prev
}
