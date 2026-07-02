import type { Rarity } from '../../types/domain'
import type { EmployeeView } from '../../store/buildView'
import { money } from '../../engine/num'
import { useEmployees, useHireOptions, useAutomation } from '../../store/gameStore'
import { useUiStore } from '../../store/uiStore'
import { hire, unassign, levelUp, autoAssign, chooseSpecialisation, fuse, hireChiefOfStaff } from '../../store/actions'
import { Icon } from '../shared/Icon'
import { employeeArt } from '../shared/art'
import { TRAIT_BY_NAME } from '../../content/traits'

const RARITY_COLOR: Record<Rarity, string> = {
  common: '#9aa1ad',
  uncommon: '#46d369',
  rare: '#60a5fa',
  epic: '#c084fc',
}

// Self-documenting trait chips: icon + name + plain-language effect, with a
// fuller tooltip. So "what does Workaholic do?" is answered at a glance.
function TraitChips({ names }: { names: string[] }) {
  if (names.length === 0) return null
  return (
    <div className="mt-1 flex flex-wrap gap-1">
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

// One specialisation slot: a labelled row of pickable spec chips (chosen = accent).
// Shared by the L5 slot and the L10 Mastery slot.
function SpecPicker({
  label,
  options,
  onPick,
}: {
  label: string
  options: { id: string; name: string; icon: string; blurb: string; chosen: boolean }[]
  onPick: (specId: string) => void
}) {
  if (options.length === 0) return null
  return (
    <div className="mt-1.5">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-faint)' }}>
        {label}
      </div>
      <div className="flex flex-wrap gap-1">
        {options.map((sp) => (
          <button
            key={sp.id}
            type="button"
            onClick={() => onPick(sp.id)}
            title={sp.blurb}
            className={`btn btn-sm ${sp.chosen ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontWeight: 600 }}
          >
            <span>
              {sp.icon} {sp.name}
              <span className="ml-1 font-normal opacity-80">· {sp.blurb}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// The Chief of Staff — a one-time HIRE that unlocks the auto-roster manager, then a
// Configure entry into its menu. Lives in the Staff section (it manages your roster).
function ChiefOfStaffCard() {
  const automation = useAutomation()
  const openAutomation = useUiStore((s) => s.openAutomation)
  const staff = automation.staff
  if (!automation.eligible) return null // nothing to manage before you own a business
  return (
    <section className="section">
      <div className="mb-2">
        <h2>Chief of Staff</h2>
      </div>
      <div className="card overflow-hidden">
        <div
          className="list-row py-2.5 pr-3"
          style={{ paddingLeft: '9px', borderLeft: `2px solid ${staff.unlocked ? 'var(--accent)' : 'var(--divider)'}` }}
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl"
            style={{ background: 'var(--surface-2)' }}
          >
            👔
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">
              {staff.unlocked ? 'Chief of Staff' : 'Hire a Chief of Staff'}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
              {staff.unlocked
                ? staff.enabled
                  ? `On · auto hire / level / assign · ${money(staff.lifetimeSpent)} spent`
                  : 'Hired · currently paused (turn on in the menu)'
                : 'Auto-hires, levels, and assigns your roster within a budget you set.'}
            </div>
          </div>
          {staff.unlocked ? (
            <button
              type="button"
              onClick={() => openAutomation('staff')}
              className="btn btn-md btn-secondary shrink-0"
            >
              Configure ›
            </button>
          ) : (
            <button
              type="button"
              disabled={!automation.chiefAffordable}
              onClick={() => hireChiefOfStaff()}
              className={`btn btn-md shrink-0 ${automation.chiefAffordable ? 'btn-primary' : 'btn-secondary'}`}
            >
              <span>Hire</span>
              <span className="tnum" style={{ fontWeight: 400, opacity: 0.7 }}>
                {money(automation.chiefUnlockCost)}
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

export function EmployeesScreen() {
  const employees = useEmployees()
  const hireOptions = useHireOptions()
  const benched = employees.filter((e) => e.assignedToBusinessId == null)
  const working = employees.filter((e) => e.assignedToBusinessId != null)
  const benchedCount = benched.length

  return (
    <div className="flex flex-col gap-5">
      {/* HIRE first: hiring adds to YOUR TEAM below, so the hire buttons keep a
          stable position — you can recruit repeatedly without the list shifting
          out from under your finger. */}
      <section className="section">
        <div className="mb-2">
          <h2>Hire</h2>
        </div>
        <div className="card overflow-hidden">
          {hireOptions.map((o) => (
            <div
              key={o.templateId}
              className="list-row py-2.5 pr-3"
              style={{ paddingLeft: '9px', borderLeft: `2px solid ${RARITY_COLOR[o.rarity]}` }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg"
                style={{ background: 'var(--surface-2)' }}
              >
                <Icon art={employeeArt(o.templateId)} size={38} alt={o.name} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-semibold">{o.name}</span>
                  <span
                    className="shrink-0 text-[10px] font-bold uppercase tracking-wide"
                    style={{ color: RARITY_COLOR[o.rarity] }}
                  >
                    {o.rarity}
                  </span>
                </div>
                <div className="truncate text-xs" style={{ color: 'var(--text-dim)' }}>
                  {o.roleName}
                  {o.affinityName ? ` · ${o.affinityName} ⭐` : ''}
                </div>
                <TraitChips names={o.traitNames} />
              </div>
              <button
                type="button"
                disabled={!o.affordable}
                onClick={() => hire(o.templateId)}
                className={`btn btn-md shrink-0 ${o.affordable ? 'btn-primary' : 'btn-secondary'}`}
              >
                <span>Hire</span>
                <span className="tnum" style={{ fontWeight: 400, opacity: 0.7 }}>
                  {money(o.cost)}
                </span>
              </button>
            </div>
          ))}
        </div>
      </section>

      <ChiefOfStaffCard />

      <section className="section">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2>Your Team</h2>
          {benchedCount > 0 && (
            <button type="button" onClick={autoAssign} className="btn btn-sm btn-primary shrink-0">
              ✨ Auto-Assign ({benchedCount})
            </button>
          )}
        </div>
        {employees.length === 0 ? (
          <div
            className="card flex flex-col items-center gap-3 p-6 text-center text-sm"
            style={{ color: 'var(--text-dim)' }}
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
          <RosterGroups benched={benched} working={working} />
        )}
      </section>
    </div>
  )
}

// The roster can grow past 20 staff (the harness ends a long run with ~24), so a
// flat list becomes a wall. When some staff are idle, split into "Benched" (the
// call-to-action — they're earning nothing) and "On the job"; otherwise keep one
// clean list. Grouping is by current state, so assigning a benched employee simply
// moves it to the working group — an expected, legible transition.
function RosterGroups({ benched, working }: { benched: EmployeeView[]; working: EmployeeView[] }) {
  const list = (rows: EmployeeView[]) => (
    <div className="card overflow-hidden">
      {rows.map((e) => (
        <EmployeeRow key={e.id} e={e} />
      ))}
    </div>
  )
  // Only sub-group when it actually helps (both states present); otherwise one list.
  if (benched.length === 0 || working.length === 0) return list([...benched, ...working])
  return (
    <div className="flex flex-col gap-4">
      <div className="section">
        <div className="mb-2">
          <h2>🪑 Benched · {benched.length}</h2>
        </div>
        {list(benched)}
      </div>
      <div className="section">
        <div className="mb-2">
          <h2>⚙️ On the Job · {working.length}</h2>
        </div>
        {list(working)}
      </div>
    </div>
  )
}

function EmployeeRow({ e }: { e: EmployeeView }) {
  return (
    <div
      className="list-row items-start py-2.5 pr-3"
      style={{ paddingLeft: '9px', borderLeft: `2px solid ${RARITY_COLOR[e.rarity]}` }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg"
        style={{ background: 'var(--surface-2)' }}
      >
        <Icon art={employeeArt(e.templateId)} size={38} alt={e.name} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold">{e.name}</span>
          <span
            className="shrink-0 text-[10px] font-bold uppercase tracking-wide"
            style={{ color: RARITY_COLOR[e.rarity] }}
          >
            {e.rarity}
          </span>
          <span className="tnum shrink-0 text-xs" style={{ color: 'var(--text-faint)' }}>
            Lv {e.level}
          </span>
        </div>
        <div className="truncate text-xs" style={{ color: 'var(--text-dim)' }}>
          {e.roleName} · {e.effectLabel}
          {e.nextEffectLabel && e.nextEffectLabel !== e.effectLabel && (
            <span style={{ color: 'var(--text-faint)' }}> → {e.nextEffectLabel} next lvl</span>
          )}
          {e.affinityName ? ` · ${e.affinityName} ⭐` : ''}
        </div>
        <div className="text-xs" style={{ color: 'var(--text-faint)' }}>
          {e.assignedToName ? `Working: ${e.assignedToName}` : 'On the bench'}
        </div>
        <TraitChips names={e.traitNames} />
        {e.canSpecialise && (
          <SpecPicker
            label={e.specialisationName ? 'Specialisation' : '🎓 Pick a specialisation'}
            options={e.specOptions}
            onPick={(specId) => chooseSpecialisation(e.id, specId)}
          />
        )}
        {e.canMastery && (
          <SpecPicker
            label={e.specialisation2Name ? '⭐ Mastery' : '⭐ Pick a Mastery spec'}
            options={e.specOptions2}
            onPick={(specId) => chooseSpecialisation(e.id, specId, 2)}
          />
        )}
        {/* Make the level-cap reward a visible goal: a specced (L5+) employee that
            hasn't hit the cap yet earns a SECOND spec at Lv 10. */}
        {e.canSpecialise && !e.canMastery && (
          <div className="mt-1 text-[10px]" style={{ color: 'var(--text-faint)' }}>
            ⭐ Reach Lv 10 for a 2nd (Mastery) specialisation
          </div>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {e.atMaxLevel ? (
          <span className="px-2 text-xs font-bold" style={{ color: 'var(--accent)' }}>
            MAX
          </span>
        ) : (
          <button
            type="button"
            disabled={!e.levelUpAffordable}
            onClick={() => levelUp(e.id)}
            className={`btn btn-sm shrink-0 ${e.levelUpAffordable ? 'btn-primary' : 'btn-secondary'}`}
          >
            <span>Lv up</span>
            <span className="tnum" style={{ fontWeight: 400, opacity: 0.7 }}>
              {money(e.levelUpCost)}
            </span>
          </button>
        )}
        {e.assignedToBusinessId && (
          <button type="button" onClick={() => unassign(e.id)} className="btn btn-sm btn-ghost shrink-0">
            Bench
          </button>
        )}
        {e.canFuse && e.fuseWithId && (
          <button
            type="button"
            onClick={() => fuse(e.id, e.fuseWithId!)}
            title={`Consume a duplicate to promote this ${e.rarity} to ${e.fuseToRarity}`}
            className="btn btn-sm btn-primary shrink-0"
          >
            ✨ Fuse → {e.fuseToRarity}
          </button>
        )}
      </div>
    </div>
  )
}
