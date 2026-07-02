// ============================================================
//  Zustand view store — a throttled snapshot of canonical engine state.
//  Components subscribe to narrow slices; the publisher writes the snapshot.
// ============================================================
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import type { ViewSnapshot } from './buildView'
import { buildView } from './buildView'
import { getEngineState } from '../engine/engineState'

interface GameStore extends ViewSnapshot {
  _publish: (snapshot: ViewSnapshot) => void
}

export const useGameStore = create<GameStore>((set) => ({
  ...buildView(getEngineState()),
  _publish: (snapshot) => set(snapshot),
}))

// Convenience hooks for common slices.
export const useCash = () => useGameStore((s) => s.cash)
export const useTotalPps = () => useGameStore((s) => s.totalPps)
export const useBusinessView = (id: string) => useGameStore((s) => s.businesses[id])
export const useActiveTab = () => useGameStore((s) => s.activeTab)
export const useRevealedTabs = () => useGameStore(useShallow((s) => s.revealedTabs))
export const useNewTabs = () => useGameStore(useShallow((s) => s.newTabs))
export const useNavBadges = () => useGameStore(useShallow((s) => s.navBadges))
export const useBuyMode = () => useGameStore((s) => s.buyMode)
export const useActiveIndustry = () => useGameStore((s) => s.activeIndustryTab)
export const useIndustries = () => useGameStore(useShallow((s) => s.industries))
export const useCareer = () => useGameStore((s) => s.career)
export const useEmployees = () => useGameStore(useShallow((s) => s.employees))
export const useHireOptions = () => useGameStore(useShallow((s) => s.hireOptions))
export const useUpgrades = () => useGameStore(useShallow((s) => s.upgrades))
export const useRepeatables = () =>
  useGameStore(useShallow((s) => ({ list: s.repeatables, unlocked: s.repeatablesUnlocked })))
export const useStats = () =>
  useGameStore(
    useShallow((s) => ({
      cash: s.cash,
      lifetime: s.lifetimeEarnings,
      totalPps: s.totalPps,
      stats: s.stats,
      prestige: s.prestige,
      prestigeProfitBonusPct: s.prestigeProfitBonusPct,
      achievements: s.achievementsUnlockedCount,
      achievementsTotal: s.achievements.length,
    })),
  )
export const useAchievements = () =>
  useGameStore(
    useShallow((s) => ({ list: s.achievements, unlocked: s.achievementsUnlockedCount })),
  )
export const usePrestige = () =>
  useGameStore(
    useShallow((s) => ({
      prestige: s.prestige,
      pending: s.prestigePending,
      unlocked: s.prestigeUnlocked,
      lifetime: s.lifetimeEarnings,
      nextTokenAt: s.prestigeNextTokenAt,
      nextTokenProgress: s.prestigeNextTokenProgress,
      profitBonusPct: s.prestigeProfitBonusPct,
    })),
  )
export const useTalents = () =>
  useGameStore(
    useShallow((s) => ({
      list: s.talents,
      available: s.talentTokensAvailable,
      spent: s.talentTokensSpent,
      total: s.prestige.totalPoints,
    })),
  )
export const useFounderPerks = () => useGameStore(useShallow((s) => s.founderPerks))
export const usePrestigeMilestones = () => useGameStore(useShallow((s) => s.prestigeMilestones))
export const useGolden = () => useGameStore(useShallow((s) => s.golden))
export const useRushHour = () => useGameStore(useShallow((s) => s.rushHour))
export const useMomentum = () => useGameStore(useShallow((s) => s.momentum))
export const useLogistics = () => useGameStore(useShallow((s) => s.logistics))
export const useAngelDeal = () => useGameStore(useShallow((s) => s.angelDeal))
export const useRomance = () => useGameStore(useShallow((s) => s.romance))
export const useAutomation = () => useGameStore(useShallow((s) => s.automation))
export const useCombinator = () => useGameStore(useShallow((s) => s.combinator))
export const useFinanceCompound = () => useGameStore(useShallow((s) => s.financeCompound))
export const useQuantumSuperposition = () => useGameStore(useShallow((s) => s.quantumSuperposition))
export const useEventCard = () => useGameStore(useShallow((s) => s.eventCard))
export const useSpaceShooter = () => useGameStore(useShallow((s) => s.spaceShooter))
export const useFoodFrenzy = () => useGameStore(useShallow((s) => s.foodFrenzy))
export const useLog = () => useGameStore(useShallow((s) => s.log))
export const useDaily = () => useGameStore(useShallow((s) => s.daily))
export const useContracts = () =>
  useGameStore(useShallow((s) => ({ list: s.contracts, claimable: s.contractsClaimable })))
