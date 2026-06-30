import { useActiveTab } from '../../store/gameStore'
import { BusinessesScreen } from '../business/BusinessesScreen'
import { EmployeesScreen } from '../employees/EmployeesScreen'
import { UpgradesScreen } from '../upgrades/UpgradesScreen'
import { PrestigeScreen } from '../prestige/PrestigeScreen'
import { StatsScreen } from '../stats/StatsScreen'

export function TabRouter() {
  const tab = useActiveTab()
  switch (tab) {
    case 'business':
      return <BusinessesScreen />
    case 'employees':
      return <EmployeesScreen />
    case 'upgrades':
      return <UpgradesScreen />
    case 'stats':
      return <StatsScreen />
    case 'prestige':
      return <PrestigeScreen />
  }
}
