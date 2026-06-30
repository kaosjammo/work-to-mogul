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

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && close()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.55)' }}
        />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[80vh] w-full max-w-[720px] flex-col gap-3 overflow-y-auto rounded-t-3xl p-4"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            paddingBottom: 'calc(var(--safe-bottom) + 16px)',
          }}
        >
          <div className="mx-auto h-1 w-10 rounded-full" style={{ background: 'var(--surface-3)' }} />
          {view && (
            <>
              <Dialog.Title className="text-lg font-bold">{view.name} · Staff</Dialog.Title>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="tnum" style={{ color: 'var(--accent)' }}>
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

              {view.synergies.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
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
              <div className="flex flex-col gap-2">
                {view.slots.map((eid, i) => {
                  const e = eid ? byId.get(eid) : null
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-xl p-2"
                      style={{
                        background: 'var(--surface-2)',
                        border: `1px ${e ? 'solid' : 'dashed'} var(--border)`,
                      }}
                    >
                      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg" style={{ background: 'var(--surface-3)' }}>
                        {e ? <Icon art={roleArt(e.role, e.roleIcon)} size={28} alt={e.roleName} /> : '+'}
                      </div>
                      <div className="min-w-0 flex-1">
                        {e ? (
                          <>
                            <div className="truncate text-sm font-semibold">{e.name}</div>
                            <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
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
                          className="rounded-lg px-3 text-xs font-semibold"
                          style={{ minHeight: 'var(--tap)', background: 'var(--surface-3)', color: 'var(--text-dim)' }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Available staff */}
              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold" style={{ color: 'var(--text-dim)' }}>
                    AVAILABLE STAFF
                  </span>
                  <button
                    type="button"
                    onClick={goHire}
                    className="rounded-full px-2.5 py-1 text-xs font-bold"
                    style={{ minHeight: '32px', background: 'var(--accent)', color: 'var(--accent-ink)' }}
                  >
                    ＋ Hire staff
                  </button>
                </div>
                {available.length === 0 ? (
                  <button
                    type="button"
                    onClick={goHire}
                    className="w-full rounded-xl p-3 text-center text-xs font-semibold"
                    style={{ background: 'var(--surface-2)', border: '1px dashed var(--border)', color: 'var(--text-dim)' }}
                  >
                    No benched staff — tap to hire someone on the Staff page →
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    {available.map((e) => {
                      const match = e.affinity === view.industryId
                      return (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => assignToBusiness(e.id, view.id)}
                          className="flex items-center gap-3 rounded-xl p-2 text-left"
                          style={{
                            background: 'var(--surface-2)',
                            border: `1px solid ${match ? view.industryId : 'var(--border)'}`,
                          }}
                        >
                          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg" style={{ background: 'var(--surface-3)' }}>
                            <Icon art={roleArt(e.role, e.roleIcon)} size={28} alt={e.roleName} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold">
                              {e.name} {match && '⭐'}
                            </div>
                            <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
                              {e.roleName} · {e.effectLabel}
                              {match && <span style={{ color: 'var(--accent)' }}> · ⭐ +25% on-theme</span>}
                            </div>
                          </div>
                          <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                            Assign
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <Dialog.Close asChild>
                <button
                  type="button"
                  className="mt-1 rounded-xl font-bold"
                  style={{ minHeight: 'var(--tap-lg)', background: 'var(--surface-3)', color: 'var(--text)' }}
                >
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
