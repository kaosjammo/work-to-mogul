import { useState } from 'react'
import { useUiStore } from '../../store/uiStore'
import { useRomance } from '../../store/gameStore'
import { renewVows, bookHoneymoonTrip, startDivorce } from '../../store/actions'
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

/** The 💍 Married panel — opened from the main-screen button. First stop after the wedding
 *  is the HONEYMOON (a one-time "save up and go" purchase that clears the dot). Below that,
 *  lifestyle upkeep (the levelable money-sink), and — for the brave — a Divorce that opens
 *  a settlement negotiation. */
export function MarriageModal() {
  const open = useUiStore((s) => s.marriageOpen)
  const close = useUiStore((s) => s.closeMarriage)
  const r = useRomance()
  const [confirmDivorce, setConfirmDivorce] = useState(false)
  if (!open || !r.married) return null
  const first = r.partner.split(' ')[0]

  const doDivorce = () => {
    startDivorce()
    close()
  }

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

      {/* Honeymoon — the first thing to save up for after the wedding. */}
      {!r.honeymoonTaken ? (
        <div
          className="flex flex-col gap-2 rounded-xl p-3"
          style={{ background: 'rgba(245,197,24,0.08)', border: '1px solid rgba(245,197,24,0.4)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🌴</span>
            <span className="text-sm font-bold">The Honeymoon</span>
            <span className="ml-auto h-2 w-2 rounded-full" style={{ background: 'var(--accent)' }} aria-hidden />
          </div>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
            You’re married — now take {first} somewhere unforgettable. Save up and book the trip.
          </p>
          <button
            type="button"
            disabled={!r.honeymoonAffordable}
            onClick={() => bookHoneymoonTrip()}
            className={`btn btn-lg btn-block ${r.honeymoonAffordable ? 'btn-primary' : 'btn-secondary'}`}
          >
            <span>🌴 Book the Honeymoon</span>
            <span className="tnum" style={{ fontWeight: 400, opacity: 0.8 }}>{money(r.honeymoonCost)}</span>
          </button>
        </div>
      ) : (
        <div className="list-row justify-between gap-2 rounded-xl px-3 py-2" style={{ background: 'var(--surface-2)' }}>
          <span className="text-sm" style={{ color: 'var(--text-dim)' }}>🌴 Honeymoon</span>
          <span className="text-sm font-bold" style={{ color: 'var(--good)' }}>Taken ✓</span>
        </div>
      )}

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

      {!r.honeymoonTaken ? (
        <div className="card p-3 text-center text-sm" style={{ color: 'var(--text-dim)' }}>
          🔒 Lifestyle upkeep unlocks after the honeymoon — book the trip first.
        </div>
      ) : r.nextTitle ? (
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

      {/* Divorce — the point of no return, behind an are-you-sure. */}
      {confirmDivorce ? (
        <div
          className="flex flex-col gap-2 rounded-xl p-3"
          style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.4)' }}
        >
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
            Are you sure? This opens a <b style={{ color: 'var(--text)' }}>settlement negotiation</b> with{' '}
            {first}. Handle it well and you both walk away whole — badly, and you lose{' '}
            <b style={{ color: 'var(--bad)' }}>half of everything</b>.
          </p>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={doDivorce}
              className="btn btn-md btn-block"
              style={{ background: 'var(--bad)', color: '#fff' }}
            >
              💔 Start proceedings
            </button>
            <button type="button" onClick={() => setConfirmDivorce(false)} className="btn btn-secondary btn-md btn-block">
              Keep the marriage
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmDivorce(true)}
          className="btn btn-ghost btn-sm self-center"
          style={{ color: 'var(--text-faint)' }}
        >
          Divorce…
        </button>
      )}
    </Overlay>
  )
}
