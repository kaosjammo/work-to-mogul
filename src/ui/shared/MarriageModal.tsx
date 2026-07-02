import { useUiStore } from '../../store/uiStore'
import { useRomance } from '../../store/gameStore'
import { renewVows } from '../../store/actions'
import { money, formatRate } from '../../engine/num'
import { Overlay } from './Overlay'

const ACCENT = 'var(--accent)'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="list-row justify-between gap-2 px-3 py-2">
      <span className="text-sm" style={{ color: 'var(--text-dim)' }}>{label}</span>
      <span className="tnum text-right text-sm font-bold">{value}</span>
    </div>
  )
}

/** The 💍 Married panel — opened from the main-screen button. Shows lifestyle upkeep and
 *  lets the player lavish the spouse (level the money-sink) — more upkeep, forever. */
export function MarriageModal() {
  const open = useUiStore((s) => s.marriageOpen)
  const close = useUiStore((s) => s.closeMarriage)
  const r = useRomance()
  if (!open || !r.married) return null
  const first = r.partner.split(' ')[0]

  return (
    <Overlay accent={ACCENT} onBackdropClick={close} panelClassName="max-h-[88vh] overflow-y-auto">
      <div>
        <h2 className="text-lg font-extrabold">💍 Married to {r.partner}</h2>
        <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
          The good life has a running cost — lifestyle upkeep skims a share of your business
          income every second. Lavish {first} to raise the standard of living (and the upkeep,
          forever).
        </p>
      </div>

      <div className="card overflow-hidden">
        <Row
          label="Standard of living"
          value={r.marriageLevel > 0 ? `Lv ${r.marriageLevel}/${r.maxLevel} · ${r.title}` : 'Just married'}
        />
        <Row
          label="Lifestyle upkeep"
          value={r.drainPct > 0 ? `${r.drainPct}% of income · ~${formatRate(r.drainPerSec)}` : 'None yet'}
        />
        <Row label="Lavished so far" value={money(r.totalSpent)} />
      </div>

      {r.nextTitle ? (
        <button
          type="button"
          disabled={!r.canAfford}
          onClick={() => renewVows()}
          className={`btn btn-lg btn-block ${r.canAfford ? 'btn-primary' : 'btn-secondary'}`}
          title={`+1% income upkeep, forever — ${first} would love it`}
        >
          <span>💝 {r.nextTitle}</span>
          <span className="tnum" style={{ fontWeight: 400, opacity: 0.8 }}>{money(r.nextCost)}</span>
        </button>
      ) : (
        <div className="card p-4 text-center text-sm" style={{ color: 'var(--text-dim)' }}>
          💞 Fully committed — every level of the good life unlocked.
        </div>
      )}

      <button type="button" onClick={close} className="btn btn-secondary btn-lg btn-block">
        Done
      </button>
    </Overlay>
  )
}
