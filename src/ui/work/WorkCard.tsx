import { money, formatDuration } from '../../engine/num'
import { useCareer } from '../../store/gameStore'
import { workShift } from '../../store/actions'
import { ProgressBar } from '../business/ProgressBar'
import { Icon } from '../shared/Icon'
import { ART_WORK } from '../../content/artManifest'

const WORK_ACCENT = '#6aa9ff'

export function WorkCard() {
  const c = useCareer()

  return (
    <div
      className="mb-3 flex flex-col gap-2 rounded-2xl p-3"
      style={{
        background: 'var(--surface)',
        border: `1px solid ${WORK_ACCENT}55`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl"
          style={{ background: 'var(--surface-2)' }}
        >
          <Icon art={{ src: ART_WORK.shift }} size={40} alt="Work" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-semibold">{c.title}</span>
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold"
              style={{ background: 'var(--surface-3)', color: WORK_ACCENT }}
            >
              Lv {c.level + 1}
            </span>
          </div>
          <div className="tnum text-xs" style={{ color: 'var(--text-dim)' }}>
            {money(c.wage)} / shift · {formatDuration(c.shiftMs / 1000)}
          </div>
        </div>
      </div>

      <ProgressBar fraction={c.shiftProgressFraction} color={WORK_ACCENT} />

      <button
        type="button"
        onClick={workShift}
        disabled={c.working}
        className="rounded-xl font-bold transition active:scale-[0.98]"
        style={{
          minHeight: 'var(--tap-lg)',
          background: c.working ? 'var(--surface-3)' : WORK_ACCENT,
          color: c.working ? 'var(--text-dim)' : '#06122b',
        }}
      >
        {c.working ? 'Working…' : 'Work Shift'}
      </button>

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-xs" style={{ color: 'var(--text-faint)' }}>
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
