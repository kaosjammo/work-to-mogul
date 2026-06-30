import { TopHUD } from './ui/shell/TopHUD'
import { NavBar } from './ui/shell/NavBar'
import { TabRouter } from './ui/shell/TabRouter'
import { AssignmentSheet } from './ui/employees/AssignmentSheet'
import { WelcomeBackBanner } from './ui/shared/WelcomeBackBanner'
import { MilestoneCelebration } from './ui/shared/MilestoneCelebration'
import { FloatingGoldenDeal } from './ui/shared/FloatingGoldenDeal'
import { AccountModal } from './ui/account/AccountModal'

export function App() {
  return (
    <>
      <TopHUD />
      <main className="scroll-region px-3 pt-3 pb-6">
        <TabRouter />
      </main>
      <NavBar />
      <FloatingGoldenDeal />
      <AssignmentSheet />
      <AccountModal />
      <MilestoneCelebration />
      <WelcomeBackBanner />
    </>
  )
}
