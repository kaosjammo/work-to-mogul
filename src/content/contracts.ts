// ============================================================
//  Contracts — a claimable, rotating missions board. Generalises the
//  achievements machinery: an ORDERED, escalating ladder of goals; the board
//  shows a few at a time and a new one rotates in whenever you claim a
//  completed one. Rewards are Empire Tokens (a bounded alternate source that
//  rewards active engagement without bypassing prestige — the ladder is finite).
//  (Time-gated daily/weekly repeatables are deferred — they need a wall-clock
//  cadence design; this ladder gives the "rotating missions" feel without one.)
// ============================================================
export type ContractMetric =
  | 'totalOwned'
  | 'employees'
  | 'industries'
  | 'automated'
  | 'lifetime'

export interface ContractDef {
  id: string
  name: string
  description: string
  icon: string
  metric: ContractMetric
  target: number
  rewardTokens: number
}

/** How many contracts are shown on the board at once. */
export const CONTRACT_BOARD_SIZE = 3

// Ordered by difficulty — the board deals from the front as goals are claimed.
export const CONTRACTS: ContractDef[] = [
  { id: 'own_5', name: 'Open for Business', description: 'Own 5 businesses', icon: '🏪', metric: 'totalOwned', target: 5, rewardTokens: 1 },
  { id: 'hire_1', name: 'First Recruit', description: 'Hire an employee', icon: '🧑‍💼', metric: 'employees', target: 1, rewardTokens: 1 },
  { id: 'automate_1', name: 'Set & Forget', description: 'Automate a business', icon: '⚙️', metric: 'automated', target: 1, rewardTokens: 1 },
  { id: 'own_50', name: 'Growing Empire', description: 'Own 50 businesses', icon: '🏬', metric: 'totalOwned', target: 50, rewardTokens: 2 },
  { id: 'two_industries', name: 'Branching Out', description: 'Operate in 2 industries', icon: '🧩', metric: 'industries', target: 2, rewardTokens: 2 },
  { id: 'hire_5', name: 'Building a Team', description: 'Have 5 employees', icon: '👥', metric: 'employees', target: 5, rewardTokens: 2 },
  { id: 'earn_1m', name: 'Seven Figures', description: 'Earn $1M lifetime', icon: '💰', metric: 'lifetime', target: 1e6, rewardTokens: 2 },
  { id: 'own_150', name: 'Conglomerate', description: 'Own 150 businesses', icon: '🏙️', metric: 'totalOwned', target: 150, rewardTokens: 3 },
  { id: 'automate_8', name: 'Hands Free', description: 'Automate 8 businesses', icon: '🤖', metric: 'automated', target: 8, rewardTokens: 3 },
  { id: 'four_industries', name: 'Diversified', description: 'Operate in 4 industries', icon: '🌐', metric: 'industries', target: 4, rewardTokens: 3 },
  { id: 'earn_1b', name: 'Ten Figures', description: 'Earn $1B lifetime', icon: '💎', metric: 'lifetime', target: 1e9, rewardTokens: 3 },
  { id: 'hire_12', name: 'Full Payroll', description: 'Have 12 employees', icon: '🏢', metric: 'employees', target: 12, rewardTokens: 4 },
  { id: 'own_400', name: 'Tycoon', description: 'Own 400 businesses', icon: '👑', metric: 'totalOwned', target: 400, rewardTokens: 4 },
  { id: 'all_seven', name: 'Master of All', description: 'Operate in all 7 industries', icon: '🌟', metric: 'industries', target: 7, rewardTokens: 4 },

  // ---- Endgame ladder (keeps the board feeding well past the mid-game) ----
  { id: 'automate_15', name: 'Lights-Out Operation', description: 'Automate 15 businesses', icon: '🦾', metric: 'automated', target: 15, rewardTokens: 4 },
  { id: 'hire_20', name: 'Corporation', description: 'Have 20 employees', icon: '🏛️', metric: 'employees', target: 20, rewardTokens: 5 },
  { id: 'own_1000', name: 'Industrial Powerhouse', description: 'Own 1,000 businesses', icon: '🏭', metric: 'totalOwned', target: 1000, rewardTokens: 5 },
  { id: 'earn_1t', name: 'Twelve Figures', description: 'Earn $1T lifetime', icon: '🪙', metric: 'lifetime', target: 1e12, rewardTokens: 5 },
  { id: 'own_2500', name: 'Megacorp', description: 'Own 2,500 businesses', icon: '🌃', metric: 'totalOwned', target: 2500, rewardTokens: 6 },
  { id: 'earn_1qa', name: 'Fifteen Figures', description: 'Earn $1Qa lifetime', icon: '🏦', metric: 'lifetime', target: 1e15, rewardTokens: 6 },
  { id: 'own_5000', name: 'Galactic Empire', description: 'Own 5,000 businesses', icon: '🌐', metric: 'totalOwned', target: 5000, rewardTokens: 8 },
  { id: 'earn_1qi', name: 'Astronomical Wealth', description: 'Earn $1Qi lifetime', icon: '🌌', metric: 'lifetime', target: 1e18, rewardTokens: 8 },

  // ---- Quantum / ultra-endgame (requires reaching the 8th industry) ----
  { id: 'all_eight', name: 'Multiversal', description: 'Operate in all 8 industries', icon: '🔮', metric: 'industries', target: 8, rewardTokens: 10 },
  { id: 'own_10000', name: 'Cosmic Conglomerate', description: 'Own 10,000 businesses', icon: '♾️', metric: 'totalOwned', target: 10000, rewardTokens: 12 },
  { id: 'earn_1sx', name: 'Sextillionaire', description: 'Earn $1Sx lifetime', icon: '💠', metric: 'lifetime', target: 1e21, rewardTokens: 12 },
]

export const CONTRACT_BY_ID: Record<string, ContractDef> = Object.fromEntries(
  CONTRACTS.map((c) => [c.id, c]),
)
