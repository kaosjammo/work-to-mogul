import type { Rarity } from '../../types/domain'
import { money } from '../../engine/num'
import { useEmployees, useHireOptions } from '../../store/gameStore'
import { hire, unassign, levelUp, autoAssign, chooseSpecialisation, fuse } from '../../store/actions'
import { Icon } from '../shared/Icon'
import { employeeArt } from '../shared/art'
import { TRAIT_BY_NAME } from '../../content/traits'

const RARITY_COLOR: Record<Rarity, string> = {
  common: '#9aa1ad',
  uncommon: '#46d369',
  rare: '#60a5fa',
  epic: '#c084fc',
}

function RarityDot({ rarity }: { rarity: Rarity }) {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{ background: RARITY_COLOR[rarity] }}
      title={rarity}
    />
  )
}

// Self-documenting trait chips: icon + name + plain-language effect, with a
// fuller tooltip. So "what does Workaholic do?" is answered at a glance.
function TraitChips({ names }: { names: string[] }) {
  if (names.length === 0) return null
  return (
    <div className="mt-0.5 flex flex-wrap gap-1">
      {names.map((n) => {
        const info = TRAIT_BY_NAME[n]
        return (
          <span
            key={n}
            title={info?.blurb ?? n}
            className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ background: 'var(--surface-3)', color: 'var(--text-dim)' }}
          >
            {info ? (
              <>
                {info.icon} {info.name}
                <span className="font-normal opacity-75"> · {info.effect}</span>
              </>
            ) : (
              n
            )}
          </span>
        )
      })}
    </div>
  )
}

export function EmployeesScreen() {
  const employees = useEmployees()
  const hireOptions = useHireOptions()
  const benchedCount = employees.filter((e) => e.assignedToBusinessId == null).length

  return (
    <div className="flex flex-col gap-4">
      {/* HIRE first: hiring adds to YOUR TEAM below, so the hire buttons keep a
          stable position — you can recruit repeatedly without the list shifting
          out from under your finger. */}
      <section>
        <h2 className="mb-2 text-sm font-bold" style={{ color: 'var(--text-dim)' }}>
          HIRE
        </h2>
        <div className="flex flex-col gap-2">
          {hireOptions.map((o) => (
            <div
              key={o.templateId}
              className="flex items-center gap-3 rounded-2xl p-3"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl"
                style={{ background: 'var(--surface-2)' }}
              >
                <Icon art={employeeArt(o.templateId)} size={40} alt={o.name} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <RarityDot rarity={o.rarity} />
                  <span className="truncate font-semibold">{o.name}</span>
                </div>
                <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  {o.roleName}
                  {o.affinityName ? ` · ${o.affinityName} ⭐` : ''}
                </div>
                <TraitChips names={o.traitNames} />
              </div>
              <button
                type="button"
                disabled={!o.affordable}
                onClick={() => hire(o.templateId)}
                className="flex flex-col items-center justify-center rounded-xl px-3 font-bold transition active:scale-[0.98]"
                style={{
                  minHeight: 'var(--tap-lg)',
                  minWidth: '92px',
                  background: o.affordable ? 'var(--accent)' : 'var(--surface-3)',
                  color: o.affordable ? 'var(--accent-ink)' : 'var(--text-faint)',
                }}
              >
                <span className="text-sm">Hire</span>
                <span className="tnum text-xs opacity-90">{money(o.cost)}</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-dim)' }}>
            YOUR TEAM
          </h2>
          {benchedCount > 0 && (
            <button
              type="button"
              onClick={autoAssign}
              className="rounded-full px-3 text-xs font-bold"
              style={{ minHeight: 'var(--tap)', background: 'var(--accent)', color: 'var(--accent-ink)' }}
            >
              ✨ Auto-Assign ({benchedCount})
            </button>
          )}
        </div>
        {employees.length === 0 ? (
          <div
            className="flex flex-col items-center gap-3 rounded-2xl p-6 text-center text-sm"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}
          >
            <img
              src="/assets/states/state_empty_staff.svg"
              width={120}
              height={90}
              alt=""
              aria-hidden
              loading="lazy"
              decoding="async"
              style={{ width: 120, height: 90 }}
            />
            <span>
              No staff yet. Hire someone from the list above, then assign them to a business
              from its
              <span className="font-semibold"> 👤 staff </span>
              button.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            {employees.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-3 rounded-2xl p-3"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl"
                  style={{ background: 'var(--surface-2)' }}
                >
                  <Icon art={employeeArt(e.templateId)} size={40} alt={e.name} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <RarityDot rarity={e.rarity} />
                    <span className="truncate font-semibold">{e.name}</span>
                    <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                      Lv {e.level}
                    </span>
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
                    {e.roleName} · {e.effectLabel}
                    {e.nextEffectLabel && e.nextEffectLabel !== e.effectLabel && (
                      <span style={{ color: 'var(--text-faint)' }}> → {e.nextEffectLabel} next lvl</span>
                    )}
                    {e.affinityName ? ` · ${e.affinityName} ⭐` : ''}
                  </div>
                  <TraitChips names={e.traitNames} />
                  <div className="text-xs" style={{ color: 'var(--text-faint)' }}>
                    {e.assignedToName ? `Working: ${e.assignedToName}` : 'On the bench'}
                  </div>
                  {e.canSpecialise && (
                    <div className="mt-1.5">
                      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-faint)' }}>
                        {e.specialisationName ? 'Specialisation' : '🎓 Pick a specialisation'}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {e.specOptions.map((sp) => (
                          <button
                            key={sp.id}
                            type="button"
                            onClick={() => chooseSpecialisation(e.id, sp.id)}
                            title={sp.blurb}
                            className="rounded-lg px-2 py-1 text-[11px] font-semibold transition active:scale-[0.98]"
                            style={{
                              minHeight: '32px',
                              background: sp.chosen ? 'var(--accent)' : 'var(--surface-3)',
                              color: sp.chosen ? 'var(--accent-ink)' : 'var(--text-dim)',
                              border: sp.chosen ? '1px solid var(--accent)' : '1px solid var(--border)',
                            }}
                          >
                            {sp.icon} {sp.name}
                            <span className="ml-1 font-normal opacity-80">· {sp.blurb}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-stretch gap-1">
                  {e.atMaxLevel ? (
                    <span
                      className="rounded-lg px-3 py-1 text-center text-xs font-bold"
                      style={{ color: 'var(--accent)' }}
                    >
                      MAX
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={!e.levelUpAffordable}
                      onClick={() => levelUp(e.id)}
                      className="flex flex-col items-center rounded-lg px-3 py-1 text-xs font-bold"
                      style={{
                        minHeight: 'var(--tap)',
                        background: e.levelUpAffordable ? 'var(--accent)' : 'var(--surface-3)',
                        color: e.levelUpAffordable ? 'var(--accent-ink)' : 'var(--text-faint)',
                      }}
                    >
                      <span>Lv up</span>
                      <span className="tnum opacity-90">{money(e.levelUpCost)}</span>
                    </button>
                  )}
                  {e.assignedToBusinessId && (
                    <button
                      type="button"
                      onClick={() => unassign(e.id)}
                      className="rounded-lg px-3 text-xs font-semibold"
                      style={{ background: 'var(--surface-3)', color: 'var(--text-dim)' }}
                    >
                      Bench
                    </button>
                  )}
                  {e.canFuse && e.fuseWithId && (
                    <button
                      type="button"
                      onClick={() => fuse(e.id, e.fuseWithId!)}
                      title={`Consume a duplicate to promote this ${e.rarity} to ${e.fuseToRarity}`}
                      className="rounded-lg px-3 text-xs font-bold"
                      style={{ minHeight: 'var(--tap)', background: 'var(--accent)', color: 'var(--accent-ink)' }}
                    >
                      ✨ Fuse → {e.fuseToRarity}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
