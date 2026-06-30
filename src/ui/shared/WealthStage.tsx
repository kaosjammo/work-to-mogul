import { useGameStore } from '../../store/gameStore'
import { useUiStore } from '../../store/uiStore'
import { ART_GENERATED } from '../../content/artManifest'

// The decorative founder scene at the foot of the content. The mascot reacts to
// what's happening — celebrating during a toast, working while income flows,
// idle when the empire is dormant — giving the game a bit of personality.
// Boolean selectors keep this to a re-render only when the pose actually flips.
export function WealthStage() {
  const earning = useGameStore((s) => s.totalPps > 0)
  const celebrating = useUiStore((s) => s.celebrations.length > 0)

  const mascot = celebrating
    ? ART_GENERATED.mascot.founderExcited
    : earning
      ? ART_GENERATED.mascot.founderWorking
      : ART_GENERATED.mascot.founderIdle

  return (
    <div className="wealth-stage" aria-hidden="true">
      <img className="wealth-stage__burst" src={ART_GENERATED.props.profitBurst} alt="" />
      <img className="wealth-stage__bag" src={ART_GENERATED.props.moneyBag} alt="" />
      <img className="wealth-stage__stack" src={ART_GENERATED.props.cashStack} alt="" />
      <img className="wealth-stage__mascot" src={mascot} alt="" />
    </div>
  )
}
