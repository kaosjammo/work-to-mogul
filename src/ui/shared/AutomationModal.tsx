import type { ReactNode } from 'react'
import { useUiStore } from '../../store/uiStore'
import { useAutomation } from '../../store/gameStore'
import { setAutoInvest, setAutoStaff } from '../../store/actions'
import { money } from '../../engine/num'
import { INDUSTRIES, INDUSTRY_ORDER } from '../../content/industries'
import type { AutoInvestStrategy } from '../../types/domain'
import { Overlay } from './Overlay'

const ACCENT = 'var(--accent)'

/** A big on/off switch row. */
function Switch({ label, hint, on, onToggle }: { label: string; hint: string; on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left"
      style={{ background: on ? 'rgba(245,197,24,0.12)' : 'var(--surface-2)', border: `1px solid ${on ? ACCENT : 'var(--divider)'}` }}
    >
      <span className="min-w-0">
        <span className="block text-sm font-bold">{label}</span>
        <span className="block text-xs" style={{ color: 'var(--text-faint)' }}>{hint}</span>
      </span>
      <span className="relative shrink-0 rounded-full transition-colors" style={{ width: 46, height: 28, background: on ? ACCENT : 'var(--surface-3)' }}>
        <span className="absolute top-0.5 rounded-full transition-all" style={{ width: 24, height: 24, background: '#fff', left: on ? 20 : 2 }} />
      </span>
    </button>
  )
}

/** A −/＋ stepper row for a bounded numeric setting. */
function Stepper({ label, value, suffix, min, max, step, onChange }: { label: string; value: number; suffix: string; min: number; max: number; step: number; onChange: (v: number) => void }) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v))
  // Render the −/＋ as plain <button>s via a helper that RETURNS JSX — NOT a nested
  // <Btn/> component. A component defined inside Stepper gets a new type identity every
  // render, and this modal re-renders ~7Hz from the loop publish, so React was unmounting
  // + remounting both buttons continuously → taps landing mid-remount were dropped, which
  // read as "laggy / takes multiple clicks to adjust". Inlined buttons keep stable identity.
  const stepBtn = (d: number, sym: string) => {
    const atLimit = clamp(value + d) === value
    return (
      <button
        type="button"
        onClick={() => onChange(clamp(value + d))}
        disabled={atLimit}
        className="btn btn-secondary btn-sm shrink-0"
        style={{ minWidth: 40, opacity: atLimit ? 0.4 : 1 }}
        aria-label={`${sym} ${label}`}
      >
        {sym}
      </button>
    )
  }
  return (
    <div className="list-row justify-between px-3 py-2">
      <span className="text-sm" style={{ color: 'var(--text-dim)' }}>{label}</span>
      <span className="flex items-center gap-2">
        {stepBtn(-step, '−')}
        <span className="tnum w-16 text-center text-sm font-bold">{value}{suffix}</span>
        {stepBtn(step, '＋')}
      </span>
    </div>
  )
}

/** A small toggle chip (for the Chief's hire/level/assign switches). */
function Chip({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className="flex flex-1 items-center justify-center rounded-lg px-2 text-center text-xs font-bold transition"
      style={{ background: on ? ACCENT : 'var(--surface-2)', color: on ? 'var(--accent-ink)' : 'var(--text-dim)', border: `1px solid ${on ? ACCENT : 'var(--divider)'}`, minHeight: 'var(--tap)' }}
    >
      {label}
    </button>
  )
}

function Section({ children }: { children: ReactNode }) {
  return <div className="card overflow-hidden">{children}</div>
}

/** Shown for a manager the player hasn't unlocked yet (reachable via the tab switcher). */
function LockedNote({ children }: { children: ReactNode }) {
  return (
    <div className="card p-5 text-center text-sm" style={{ color: 'var(--text-dim)' }}>
      🔒 {children}
    </div>
  )
}

const STRATEGIES: { id: AutoInvestStrategy; label: string; hint: string }[] = [
  { id: 'roi', label: 'Best ROI', hint: 'Buys whatever adds the most income per dollar.' },
  { id: 'cheapest', label: 'Cheapest', hint: 'Buys the cheapest units first — fast progress + milestones.' },
  { id: 'focus', label: 'Focus', hint: 'Pours everything into one chosen industry.' },
]

export function AutomationModal() {
  const tab = useUiStore((s) => s.automationTab)
  const close = useUiStore((s) => s.closeAutomation)
  const setTab = useUiStore((s) => s.openAutomation)
  const a = useAutomation()
  if (!tab) return null

  return (
    <Overlay accent={ACCENT} onBackdropClick={close} panelClassName="max-h-[88vh] overflow-y-auto">
      {/* Tab switcher — only when BOTH managers are unlocked (else the modal is opened
          straight to the single unlocked manager, so there's nothing to switch to). */}
      {a.invest.unlocked && a.staff.unlocked && (
      <div className="flex gap-1 rounded-full p-1" style={{ background: 'var(--surface-2)' }}>
        {(['invest', 'staff'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="flex flex-1 items-center justify-center rounded-full text-sm font-bold transition"
            style={{ background: tab === t ? ACCENT : 'transparent', color: tab === t ? 'var(--accent-ink)' : 'var(--text-dim)', minHeight: 'var(--tap)' }}
          >
            {t === 'invest' ? '🤖 Assistant' : '👔 Chief of Staff'}
          </button>
        ))}
      </div>
      )}

      {tab === 'invest' ? (
        !a.invest.unlocked ? (
          <LockedNote>
            Win over {a.ea.partnerName} through the Investment Fund story, then poach her to
            unlock your Executive Assistant.
          </LockedNote>
        ) : (
        <>
          <div>
            <h2 className="text-lg font-extrabold">{a.ea.partnerName}</h2>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Your Executive Assistant — reinvests spare cash (and buys upgrades when they’re the
              better value) on a cadence, so the empire keeps compounding while you’re away.
            </p>
          </div>
          <Switch
            label={a.invest.enabled ? `${a.ea.partnerName.split(' ')[0]} is ON` : `${a.ea.partnerName.split(' ')[0]} is OFF`}
            hint={a.invest.enabled ? `Deploying ~${money(a.spendableNow)} every ${a.invest.intervalSec}s` : 'Turn on to auto-reinvest'}
            on={a.invest.enabled}
            onToggle={() => setAutoInvest({ enabled: !a.invest.enabled })}
          />

          <div>
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-faint)' }}>Strategy</div>
            <div className="flex gap-1.5">
              {STRATEGIES.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setAutoInvest({ strategy: st.id })}
                  className="flex flex-1 items-center justify-center rounded-lg px-2 text-center text-xs font-bold transition"
                  style={{ background: a.invest.strategy === st.id ? ACCENT : 'var(--surface-2)', color: a.invest.strategy === st.id ? 'var(--accent-ink)' : 'var(--text-dim)', border: `1px solid ${a.invest.strategy === st.id ? ACCENT : 'var(--divider)'}`, minHeight: 'var(--tap)' }}
                >
                  {st.label}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px]" style={{ color: 'var(--text-faint)' }}>
              {STRATEGIES.find((s) => s.id === a.invest.strategy)?.hint}
            </p>
          </div>

          {a.invest.strategy === 'focus' && (
            <div>
              <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-faint)' }}>Focus industry</div>
              <div className="grid grid-cols-2 gap-1.5">
                {INDUSTRY_ORDER.map((iid) => (
                  <button
                    key={iid}
                    type="button"
                    onClick={() => setAutoInvest({ focusIndustry: iid })}
                    className="flex items-center justify-center rounded-lg px-2 text-center text-xs font-bold transition"
                    style={{ background: a.invest.focusIndustry === iid ? ACCENT : 'var(--surface-2)', color: a.invest.focusIndustry === iid ? 'var(--accent-ink)' : 'var(--text-dim)', border: `1px solid ${a.invest.focusIndustry === iid ? ACCENT : 'var(--divider)'}`, minHeight: 'var(--tap)' }}
                  >
                    {INDUSTRIES[iid].name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Section>
            <Stepper label="Keep as reserve" value={a.invest.reservePct} suffix="%" min={0} max={90} step={5} onChange={(v) => setAutoInvest({ reservePct: v })} />
            <Stepper label="Act every" value={a.invest.intervalSec} suffix="s" min={3} max={60} step={1} onChange={(v) => setAutoInvest({ intervalSec: v })} />
            <div className="list-row justify-between px-3 py-2">
              <span className="text-sm" style={{ color: 'var(--text-dim)' }}>Reinvested so far</span>
              <span className="tnum text-sm font-bold">{money(a.invest.lifetimeSpent)} · {a.invest.lifetimeUnits} units</span>
            </div>
          </Section>

          {/* Board Advisor Fee — the poached EA auto-collects board fees at 100%. */}
          <div>
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-faint)' }}>Board Advisor Fee</div>
            <Switch
              label={a.ea.advisorFee ? 'Auto-collecting' : 'Off'}
              hint={`${a.ea.partnerName.split(' ')[0]} banks ~${money(a.ea.advisorFeeValue)} in board fees when the meter fills`}
              on={a.ea.advisorFee}
              onToggle={() => setAutoInvest({ advisorFee: !a.ea.advisorFee })}
            />
            {a.ea.advisorFee && (
              <div className="mt-1.5">
                <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--surface-3)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${a.ea.advisorFeePct}%`, background: ACCENT }} />
                </div>
                <div className="mt-0.5 text-right text-[10px]" style={{ color: 'var(--text-faint)' }}>
                  {a.ea.advisorFeePct}% · next ~{money(a.ea.advisorFeeValue)}
                </div>
              </div>
            )}
          </div>
        </>
        )
      ) : (
        !a.staff.unlocked ? (
          <LockedNote>Hire the Chief of Staff from the Staff screen to unlock this manager.</LockedNote>
        ) : (
        <>
          <div>
            <h2 className="text-lg font-extrabold">Chief of Staff</h2>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Hires, levels, and assigns your roster for you — within a budget you set.
            </p>
          </div>
          <Switch
            label={a.staff.enabled ? 'Chief of Staff is ON' : 'Chief of Staff is OFF'}
            hint={a.staff.enabled ? `Budget ~${money(a.staffBudgetNow)} every ${a.staff.intervalSec}s` : 'Turn on to auto-manage staff'}
            on={a.staff.enabled}
            onToggle={() => setAutoStaff({ enabled: !a.staff.enabled })}
          />

          <div>
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-faint)' }}>Duties</div>
            <div className="grid grid-cols-3 gap-1.5">
              <Chip label="🧑‍💼 Hire" on={a.staff.hire} onToggle={() => setAutoStaff({ hire: !a.staff.hire })} />
              <Chip label="⬆️ Level" on={a.staff.level} onToggle={() => setAutoStaff({ level: !a.staff.level })} />
              <Chip label="🎯 Assign" on={a.staff.assign} onToggle={() => setAutoStaff({ assign: !a.staff.assign })} />
              <Chip label="🧬 Fuse" on={a.staff.fuse} onToggle={() => setAutoStaff({ fuse: !a.staff.fuse })} />
              <Chip label="🎓 Skills" on={a.staff.spec} onToggle={() => setAutoStaff({ spec: !a.staff.spec })} />
            </div>
          </div>

          <Section>
            <Stepper label="Staff budget" value={a.staff.budgetPct} suffix="% of cash" min={0} max={90} step={5} onChange={(v) => setAutoStaff({ budgetPct: v })} />
            <Stepper label="Act every" value={a.staff.intervalSec} suffix="s" min={3} max={60} step={1} onChange={(v) => setAutoStaff({ intervalSec: v })} />
            <div className="list-row justify-between px-3 py-2">
              <span className="text-sm" style={{ color: 'var(--text-dim)' }}>Spent on staff</span>
              <span className="tnum text-sm font-bold">{money(a.staff.lifetimeSpent)} · {a.staff.lifetimeHires} hired</span>
            </div>
          </Section>
        </>
        )
      )}

      <button type="button" onClick={close} className="btn btn-primary btn-lg btn-block">
        Done
      </button>
    </Overlay>
  )
}

    