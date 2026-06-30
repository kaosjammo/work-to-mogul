// Achievement metadata only (no logic). Predicates live in engine/achievements.ts
// so this stays a pure, content-only module.
export interface AchievementDef {
  id: string
  name: string
  description: string
  icon: string
  /** Empire Tokens granted on unlock — scaled by difficulty (a bounded meta source,
   *  in the spirit of contracts + ascension milestones). The bot never spends tokens,
   *  so this is harness-safe; it just makes achievements *matter* beyond a badge. */
  reward: number
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_shift', name: 'First Day', description: 'Complete a work shift', icon: '💼', reward: 1 },
  { id: 'promoted', name: 'Moving Up', description: 'Reach Supervisor', icon: '📈', reward: 1 },
  { id: 'max_career', name: 'Top of the Ladder', description: 'Become Regional Manager', icon: '👔', reward: 3 },
  { id: 'first_business', name: 'Entrepreneur', description: 'Own your first business', icon: '🏪', reward: 1 },
  { id: 'hundred_units', name: 'Tycoon', description: 'Own 100 businesses', icon: '🏢', reward: 2 },
  { id: 'five_hundred_units', name: 'Mogul', description: 'Own 500 businesses', icon: '🏙️', reward: 3 },
  { id: 'first_automation', name: 'Hands Off', description: 'Automate a business', icon: '⚙️', reward: 1 },
  { id: 'first_hire', name: "You're Hired", description: 'Hire an employee', icon: '🧑‍💼', reward: 1 },
  { id: 'ten_staff', name: 'Full Roster', description: 'Hire 10 employees', icon: '👥', reward: 2 },
  { id: 'three_industries', name: 'Diversified', description: 'Operate in 3 industries', icon: '🧩', reward: 2 },
  { id: 'all_industries', name: 'Conglomerate', description: 'Operate in all 8 industries', icon: '🌐', reward: 5 },
  { id: 'millionaire', name: 'Millionaire', description: 'Earn $1M lifetime', icon: '💰', reward: 2 },
  { id: 'billionaire', name: 'Billionaire', description: 'Earn $1B lifetime', icon: '💎', reward: 3 },
  { id: 'first_ascension', name: 'Reborn', description: 'Ascend for the first time', icon: '✦', reward: 2 },

  // ---- End-game ladder ----
  { id: 'trillionaire', name: 'Trillionaire', description: 'Earn $1T lifetime', icon: '🪙', reward: 3 },
  { id: 'quadrillionaire', name: 'Quadrillionaire', description: 'Earn $1Qa lifetime', icon: '🏦', reward: 4 },
  { id: 'quintillionaire', name: 'Astronomical', description: 'Earn $1Qi lifetime', icon: '🌌', reward: 5 },
  { id: 'thousand_units', name: 'Empire', description: 'Own 1,000 businesses', icon: '🌆', reward: 4 },
  { id: 'specialist', name: 'Specialist', description: 'Own 500 of a single business', icon: '🎯', reward: 3 },
  { id: 'reach_space', name: 'Final Frontier', description: 'Operate in the Space industry', icon: '🛰️', reward: 3 },
  { id: 'mars_colony', name: 'Red Planet', description: 'Own a Mars Colony', icon: '🪐', reward: 4 },
  { id: 'ascend_three', name: 'Serial Restarter', description: 'Ascend 3 times', icon: '🔄', reward: 3 },
  { id: 'ascend_ten', name: 'Eternal', description: 'Ascend 10 times', icon: '♻️', reward: 5 },
  { id: 'talented', name: 'Skill Tree', description: 'Spend 10 Empire Tokens on talents', icon: '🌳', reward: 2 },
  { id: 'epic_hire', name: 'Legendary Hire', description: 'Have an epic-rarity employee', icon: '🌟', reward: 2 },
  { id: 'maxed_employee', name: 'Mentor', description: 'Level an employee to 10', icon: '🎓', reward: 2 },
  { id: 'big_team', name: 'Corporation', description: 'Employ 25 staff', icon: '🏛️', reward: 3 },
  { id: 'fully_upgraded', name: 'Fully Equipped', description: 'Own every upgrade', icon: '🔧', reward: 4 },
  { id: 'quantum_frontier', name: 'Quantum Pioneer', description: 'Reach the Quantum Frontier', icon: '🔮', reward: 4 },
  { id: 'multiverse_mogul', name: 'Master of Reality', description: 'Own a Multiverse Exchange', icon: '♾️', reward: 5 },
]

export const ACHIEVEMENT_NAME: Record<string, string> = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.id, a.name]),
)

export const ACHIEVEMENT_REWARD: Record<string, number> = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.id, a.reward]),
)
