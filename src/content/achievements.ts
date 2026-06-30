// Achievement metadata only (no logic). Predicates live in engine/achievements.ts
// so this stays a pure, content-only module.
export interface AchievementDef {
  id: string
  name: string
  description: string
  icon: string
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_shift', name: 'First Day', description: 'Complete a work shift', icon: '💼' },
  { id: 'promoted', name: 'Moving Up', description: 'Reach Supervisor', icon: '📈' },
  { id: 'max_career', name: 'Top of the Ladder', description: 'Become Regional Manager', icon: '👔' },
  { id: 'first_business', name: 'Entrepreneur', description: 'Own your first business', icon: '🏪' },
  { id: 'hundred_units', name: 'Tycoon', description: 'Own 100 businesses', icon: '🏢' },
  { id: 'five_hundred_units', name: 'Mogul', description: 'Own 500 businesses', icon: '🏙️' },
  { id: 'first_automation', name: 'Hands Off', description: 'Automate a business', icon: '⚙️' },
  { id: 'first_hire', name: "You're Hired", description: 'Hire an employee', icon: '🧑‍💼' },
  { id: 'ten_staff', name: 'Full Roster', description: 'Hire 10 employees', icon: '👥' },
  { id: 'three_industries', name: 'Diversified', description: 'Operate in 3 industries', icon: '🧩' },
  { id: 'all_industries', name: 'Conglomerate', description: 'Operate in all 7 industries', icon: '🌐' },
  { id: 'millionaire', name: 'Millionaire', description: 'Earn $1M lifetime', icon: '💰' },
  { id: 'billionaire', name: 'Billionaire', description: 'Earn $1B lifetime', icon: '💎' },
  { id: 'first_ascension', name: 'Reborn', description: 'Ascend for the first time', icon: '✦' },
]

export const ACHIEVEMENT_NAME: Record<string, string> = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.id, a.name]),
)
