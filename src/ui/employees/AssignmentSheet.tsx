import type { ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { formatRate } from '../../engine/num'
import { useUiStore } from '../../store/uiStore'
import { useGameStore, useEmployees } from '../../store/gameStore'
import { assignToBusiness, unassign, setActiveTab } from '../../store/actions'
import { Icon } from '../shared/Icon'
import { roleArt } from '../shared/art'

export function AssignmentSheet() {
  const businessId = useUiStore((s) => s.assignmentBusinessId)
  const close = useUiStore((s) => s.closeAssignment)
  const view = useGameStore((s) => (businessId ? s.businesses[businessId] : undefined))
  const assignPreviews = useGameStore((s) => s.assignPreviews)
  const employees = useEmployees()

  const open = !!businessId && !!view

  // Jump to the Staff tab to recruit (closes this sheet first).
  const goHire = () => {
    close()
    setActiveTab('employees')
  }

  // Roster lookups
  const byId = new Map(employees.map((e) => [e.id, e]))
  const available = employees
    .filter((e) => e.assignedToBusinessId == null)
    .sort((a, b) => {
      const am = a.affinity === view?.industryId ? 0 : 1
      const bm = b.affinity === view?.industryId ? 0 : 1
      return am - bm
    })

  // Per-industry accent for the on-theme (affinity-match) stripe.
  const industryAccent = view ? `var(--industry-${view.industryId})` : 'var(--accent)'

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && close()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.55)' }}
        />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[80vh] w-full max-w-[720px] flex-col gap-4 overflow-y-auto rounded-t-3xl p-4"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            paddingBottom: 'calc(var(--safe-bottom) + 16px)',
          }}
        >
          <div className="mx-auto h-1 w-10 rounded-full" style={{ background: 'var(--surface-3)' }} />
          {view && (
            <>
              <div>
                <Dialog.Title className="text-lg font-bold">{view.name} · Staff</Dialog.Title>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="tnum font-bold" style={{ color: 'var(--accent)' }}>
                    {formatRate(view.pps)}
                  </span>
                  {view.automated && <Badge>⚙️ Auto</Badge>}
                  {view.staffProfitPct > 0 && <Badge>💰 +{view.staffProfitPct}%</Badge>}
                  {view.staffSpeedPct > 0 && <Badge>⚡ +{view.staffSpeedPct}%</Badge>}
                  {view.staffCostPct > 0 && <Badge>🏷️ −{view.staffCostPct}%</Badge>}
                  {view.staffCritChance > 0 && (
                    <Badge>🎲 {view.staffCritChance}% ×{view.staffCritMult}</Badge>
                  )}
                  {view.staffMoralePct >= 6 && <Badge>😊 +{view.staffMoralePct}% morale</Badge>}
                  {view.riskEnabled && (
                    <Badge>
                      {view.riskEventActive ? '⚠️ Disruption −50%' : `🛡️ Risk ${view.riskPct}%`}
                    </Badge>
                  )}
                </div>
              </div>

              {view.synergies.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {view.synergies.map((label) => (
                    <span
                      key={label}
                      className="rounded-full px-2 py-0.5 text-xs font-bold"
                      style={{ background: 'rgba(192,132,252,0.18)', color: '#c084fc', border: '1px solid #c084fc55' }}
                    >
                      ✨ {label}
                    </span>
                  ))}
                </div>
              )}

              {/* Slots */}
              <div className="section">
                <div className="mb-2">
                  <h2>Slots</h2>
                </div>
                <div className="card overflow-hidden">
                  {view.slots.map((eid, i) => {
                    const e = eid ? byId.get(eid) : null
                    return (
                      <div key={i} className="list-row py-2 pl-3 pr-3">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg text-lg"
                          style={{ background: 'var(--surface-3)', color: 'var(--text-faint)' }}
                        >
                          {e ? <Icon art={roleArt(e.role, e.roleIcon)} size={26} alt={e.roleName} /> : '+'}
                        </div>
                        <div className="min-w-0 flex-1">
                          {e ? (
                            <>
                              <div className="truncate text-sm font-semibold">{e.name}</div>
                              <div className="truncate text-xs" style={{ color: 'var(--text-dim)' }}>
                                Lv {e.level} · {e.effectLabel}
                                {e.affinity === view.industryId && (
                                  <span style={{ color: 'var(--accent)' }}> · ⭐</span>
                                )}
                              </div>
                            </>
                          ) : (
                            <span className="text-sm" style={{ color: 'var(--text-faint)' }}>
                              Empty slot {i + 1}
                            </span>
                          )}
                        </div>
                        {e && (
                          <button
                            type="button"
                            onClick={() => unassign(e.id)}
                            className="btn btn-sm btn-ghost shrink-0"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Available staff */}
              <div className="section">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h2>Available Staff</h2>
                  <button type="button" onClick={goHire} className="btn btn-sm btn-secondary shrink-0">
                    ＋ Hire staff
                  </button>
                </div>
                {available.length === 0 ? (
                  <button
                    type="button"
                    onClick={goHire}
                    className="card w-full p-3 text-center text-xs font-semibold"
                    style={{ color: 'var(--text-dim)' }}
                  >
                    No benched staff — tap to hire someone on the Staff page →
                  </button>
                ) : (
                  <div className="card overflow-hidden">
                    {available.map((e) => {
                      const match = e.affinity === view.industryId
                      const gain = assignPreviews[e.id] ?? 0
                      return (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => assignToBusiness(e.id, view.id)}
                          className="list-row w-full py-2 pr-3 text-left"
                          style={{
                            paddingLeft: match ? '9px' : '12px',
                            borderLeft: match ? `2px solid ${industryAccent}` : undefined,
                          }}
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg" style={{ background: 'var(--surface-3)' }}>
                            <Icon art={roleArt(e.role, e.roleIcon)} size={26} alt={e.roleName} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold">
                              {e.name} {match && '⭐'}
                            </div>
                            <div className="truncate text-xs" style={{ color: 'var(--text-dim)' }}>
                              {e.roleName} · {e.effectLabel}
                              {match && <span style={{ color: 'var(--accent)' }}> · ⭐ +25% on-theme</span>}
                            </div>
                          </div>
                          <span className="flex shrink-0 flex-col items-end">
                            <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
                              Assign
                            </span>
                            {gain > 0 && (
                              <span className="tnum text-[11px] font-bold" style={{ color: 'var(--good)' }}>
                                +{formatRate(gain)}
                              </span>
                            )}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <Dialog.Close asChild>
                <button type="button" className="btn btn-lg btn-secondary btn-block mt-1">
                  Done
                </button>
              </Dialog.Close>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ background: 'var(--surface-3)', color: 'var(--text-dim)' }}
    >
      {children}
    </span>
  )
}
