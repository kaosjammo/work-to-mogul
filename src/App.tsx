import { TopHUD } from './ui/shell/TopHUD'
import { NavBar } from './ui/shell/NavBar'
import { TabRouter } from './ui/shell/TabRouter'
import { AssignmentSheet } from './ui/employees/AssignmentSheet'
import { WelcomeBackBanner } from './ui/shared/WelcomeBackBanner'
import { MilestoneCelebration } from './ui/shared/MilestoneCelebration'
import { FloatingGoldenDeal } from './ui/shared/FloatingGoldenDeal'
import { FloatingRushHour } from './ui/shared/FloatingRushHour'
import { FloatingProfitLayer } from './ui/shared/FloatingProfitLayer'
import { WealthStage } from './ui/shared/WealthStage'
import { AccountModal } from './ui/account/AccountModal'
import { ART_GENERATED } from './content/artManifest'

export function App() {
  return (
    <>
      <div className="app-backdrop" aria-hidden="true">
        <img className="app-backdrop__city" src={ART_GENERATED.background.tycoonCity} alt="" />
        <img className="app-backdrop__cash app-backdrop__cash--bag" src={ART_GENERATED.props.moneyBag} alt="" />
        <img className="app-backdrop__cash app-backdrop__cash--stack" src={ART_GENERATED.props.cashStack} alt="" />
        <img className="app-backdrop__mascot" src={ART_GENERATED.mascot.founderExcited} alt="" />
      </div>
      <TopHUD />
      <main className="scroll-region px-3 pt-3 pb-6">
        <TabRouter />
        <WealthStage />
      </main>
      <NavBar />
      <FloatingProfitLayer />
      <FloatingGoldenDeal />
      <FloatingRushHour />
      <AssignmentSheet />
      <AccountModal />
      <MilestoneCelebration />
      <WelcomeBackBanner />
    </>
  )
}
