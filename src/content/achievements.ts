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
  { id: 'all_industries', name: 'Conglomerate', description: 'Operate in all 8 industries', icon: '🌐' },
  { id: 'millionaire', name: 'Millionaire', description: 'Earn $1M lifetime', icon: '💰' },
  { id: 'billionaire', name: 'Billionaire', description: 'Earn $1B lifetime', icon: '💎' },
  { id: 'first_ascension', name: 'Reborn', description: 'Ascend for the first time', icon: '✦' },

  // ---- End-game ladder ----
  { id: 'trillionaire', name: 'Trillionaire', description: 'Earn $1T lifetime', icon: '🪙' },
  { id: 'quadrillionaire', name: 'Quadrillionaire', description: 'Earn $1Qa lifetime', icon: '🏦' },
  { id: 'quintillionaire', name: 'Astronomical', description: 'Earn $1Qi lifetime', icon: '🌌' },
  { id: 'thousand_units', name: 'Empire', description: 'Own 1,000 businesses', icon: '🌆' },
  { id: 'specialist', name: 'Specialist', description: 'Own 500 of a single business', icon: '🎯' },
  { id: 'reach_space', name: 'Final Frontier', description: 'Operate in the Space industry', icon: '🛰️' },
  { id: 'mars_colony', name: 'Red Planet', description: 'Own a Mars Colony', icon: '🪐' },
  { id: 'ascend_three', name: 'Serial Restarter', description: 'Ascend 3 times', icon: '🔄' },
  { id: 'ascend_ten', name: 'Eternal', description: 'Ascend 10 times', icon: '♻️' },
  { id: 'talented', name: 'Skill Tree', description: 'Spend 10 Empire Tokens on talents', icon: '🌳' },
  { id: 'epic_hire', name: 'Legendary Hire', description: 'Have an epic-rarity employee', icon: '🌟' },
  { id: 'maxed_employee', name: 'Mentor', description: 'Level an employee to 10', icon: '🎓' },
  { id: 'big_team', name: 'Corporation', description: 'Employ 25 staff', icon: '🏛️' },
  { id: 'fully_upgraded', name: 'Fully Equipped', description: 'Own every upgrade', icon: '🔧' },
  { id: 'quantum_frontier', name: 'Quantum Pioneer', description: 'Reach the Quantum Frontier', icon: '🔮' },
  { id: 'multiverse_mogul', name: 'Master of Reality', description: 'Own a Multiverse Exchange', icon: '♾️' },
]

export const ACHIEVEMENT_NAME: Record<string, string> = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.id, a.name]),
)
