import { TopHUD } from './ui/shell/TopHUD'
import { NavBar } from './ui/shell/NavBar'
import { TabRouter } from './ui/shell/TabRouter'
import { AssignmentSheet } from './ui/employees/AssignmentSheet'
import { WelcomeBackBanner } from './ui/shared/WelcomeBackBanner'
import { MilestoneCelebration } from './ui/shared/MilestoneCelebration'
import { FloatingGoldenDeal } from './ui/shared/FloatingGoldenDeal'
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
        <div className="wealth-stage" aria-hidden="true">
          <img className="wealth-stage__burst" src={ART_GENERATED.props.profitBurst} alt="" />
          <img className="wealth-stage__bag" src={ART_GENERATED.props.moneyBag} alt="" />
          <img className="wealth-stage__stack" src={ART_GENERATED.props.cashStack} alt="" />
          <img className="wealth-stage__mascot" src={ART_GENERATED.mascot.founderExcited} alt="" />
        </div>
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
