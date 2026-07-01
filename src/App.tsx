import { useEffect } from 'react'
import { unlockAudio } from './lib/sound'
import { TopHUD } from './ui/shell/TopHUD'
import { NavBar } from './ui/shell/NavBar'
import { TabRouter } from './ui/shell/TabRouter'
import { AssignmentSheet } from './ui/employees/AssignmentSheet'
import { WelcomeBackBanner } from './ui/shared/WelcomeBackBanner'
import { MilestoneCelebration } from './ui/shared/MilestoneCelebration'
import { FloatingGoldenDeal } from './ui/shared/FloatingGoldenDeal'
import { FloatingRushHour } from './ui/shared/FloatingRushHour'
import { EventCardModal } from './ui/shared/EventCardModal'
import { AngelDealModal } from './ui/opportunities/AngelDealModal'
import { CombinatorExitWatcher } from './ui/business/CombinatorCard'
import { DailyBonusModal } from './ui/shared/DailyBonusModal'
import { AscensionCelebration } from './ui/shared/AscensionCelebration'
import { FloatingProfitLayer } from './ui/shared/FloatingProfitLayer'
import { WealthStage } from './ui/shared/WealthStage'
import { AccountModal } from './ui/account/AccountModal'
import { ART_GENERATED } from './content/artManifest'

export function App() {
  // Browsers block audio until a user gesture — unlock the AudioContext on the first tap
  // (harmless if sound is off; the sound layer stays silent until the player enables it).
  useEffect(() => {
    const unlock = () => unlockAudio()
    window.addEventListener('pointerdown', unlock, { once: true })
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

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
      <EventCardModal />
      <AngelDealModal />
      <CombinatorExitWatcher />
      <AscensionCelebration />
      <DailyBonusModal />
      <WelcomeBackBanner />
    </>
  )
}
