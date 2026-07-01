interface DailyStreakInfo {
  streak: number
  nextMilestone: { day: number; label: string } | null
  milestoneProgress: number
}

/**
 * The streak-as-a-goal cue shared by the daily surfaces: "🔥 N-day streak · next reward
 * at Day M" with a thin progress bar. Makes the streak a visible goal, not a hidden
 * counter — the "don't break your streak" hook.
 */
export function DailyStreakProgress({ streak, nextMilestone, milestoneProgress }: DailyStreakInfo) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2 text-[10px] font-semibold">
        <span style={{ color: 'var(--accent)' }}>
          🔥 {streak > 0 ? `${streak}-day streak` : 'Start a streak!'}
        </span>
        {nextMilestone && (
          <span style={{ color: 'var(--text-faint)' }}>
            next: {nextMilestone.label} · Day {nextMilestone.day}
          </span>
        )}
      </div>
      {nextMilestone && (
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full" style={{ background: 'var(--surface-3)' }}>
          <div
            className="h-full rounded-full"
            style={{ background: 'var(--accent)', width: `${Math.round(Math.min(1, milestoneProgress) * 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}
