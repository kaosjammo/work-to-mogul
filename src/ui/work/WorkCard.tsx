import { money, format, formatDuration } from '../../engine/num'
import { useCareer } from '../../store/gameStore'
import { workShift, consult } from '../../store/actions'
import { useUiStore } from '../../store/uiStore'
import { haptic } from '../../lib/haptics'
import { ProgressBar } from '../business/ProgressBar'
import { Icon } from '../shared/Icon'
import { ART_WORK } from '../../content/artManifest'

const WORK_ACCENT = '#6aa9ff'

export function WorkCard() {
  const c = useCareer()

  // Board Advisor — the retired end-state. A borderless accent strip with an
  // optional over-time advisory bonus you collect when you like (never required).
  if (c.retired) {
    const canCollect = c.consultingValue > 0
    return (
      <div
        className="mb-3 flex items-center gap-3 py-2.5 pr-3"
        style={{ borderLeft: `2px solid ${WORK_ACCENT}`, paddingLeft: '10px' }}
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg"
          style={{ background: 'var(--surface-2)' }}
        >
          <Icon art={{ src: ART_WORK.shift }} size={34} alt="Board Advisor" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold">Board Advisor</span>
            <span className="shrink-0 text-xs" style={{ color: 'var(--text-faint)' }}>
              {c.consultingFull ? 'ready to collect' : 'fees building…'}
            </span>
          </div>
          <div className="mt-1.5">
            <ProgressBar fraction={c.consultingFraction} color={WORK_ACCENT} />
          </div>
        </div>
        <button
          type="button"
          onClick={consult}
          disabled={!canCollect}
          className={`btn btn-md shrink-0 ${canCollect ? 'btn-primary' : 'btn-secondary'}`}
        >
          <span>Collect</span>
          {canCollect && (
            <span className="tnum" style={{ fontWeight: 400, opacity: 0.7 }}>
              {money(c.consultingValue)}
            </span>
          )}
        </button>
      </div>
    )
  }

  return (
    <div
      className="mb-3 flex flex-col gap-2 py-2.5 pr-3"
      style={{ borderLeft: `2px solid ${WORK_ACCENT}`, paddingLeft: '10px' }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg"
          style={{ background: 'var(--surface-2)' }}
        >
          <Icon art={{ src: ART_WORK.shift }} size={36} alt="Work" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold">{c.title}</span>
            <span className="shrink-0 text-xs font-bold" style={{ color: WORK_ACCENT }}>
              Lv {c.level + 1}
            </span>
          </div>
          <div className="tnum text-xs" style={{ color: 'var(--text-dim)' }}>
            {money(c.salaryDrawValue)} / shift · {formatDuration(c.shiftMs / 1000)}
            {c.salaryDrawMult > 1.01 && (
              <span
                className="ml-1 font-bold"
                style={{ color: WORK_ACCENT }}
                title={`Salary draw: each shift pays a slice of your empire's income — ×${format(
                  c.salaryDrawMult,
                )} your ${money(c.wage)} base wage.`}
              >
                · ×{format(c.salaryDrawMult)} salary draw
              </span>
            )}
            {c.nextShiftIsGolden && (
              <span className="ml-1 font-bold" style={{ color: 'var(--accent)' }}>
                · ⭐ Golden ×5 next!
              </span>
            )}
          </div>
          <div className="mt-1.5">
            <ProgressBar fraction={c.shiftProgressFraction} color={WORK_ACCENT} />
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            // Immediate payoff on the game's very first action: pop the shift's pay.
            if (!c.working && c.salaryDrawValue > 0) {
              useUiStore.getState().spawnFloat(e.clientX, e.clientY, `+${money(c.salaryDrawValue)}`)
            }
            haptic(12)
            workShift()
          }}
          disabled={c.working}
          className={`btn btn-lg shrink-0 ${c.working ? 'btn-secondary' : 'btn-primary'}`}
        >
          {c.working ? 'Working…' : 'Work Shift'}
        </button>
      </div>

      <div
        className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-xs"
        style={{ color: 'var(--text-faint)' }}
      >
        {c.isMaxLevel ? (
          <span>Top of the career ladder</span>
        ) : (
          <>
            <span>
              Promotion: {c.shiftsThisLevel}/{c.shiftsToPromote}
            </span>
            <span>
              Next: {c.nextTitle} · {c.nextWage != null ? `${money(c.nextWage)}/shift` : ''}
            </span>
          </>
        )}
      </div>
      {!c.isMaxLevel && (
        <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: 'var(--surface-3)' }}>
          <div
            className="progress-fill h-full rounded-full"
            style={{
              background: WORK_ACCENT,
              transform: `scaleX(${c.promotionFraction})`,
              transition: 'transform 0.2s linear',
            }}
          />
        </div>
      )}
    </div>
  )
}
