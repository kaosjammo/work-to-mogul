import { money } from '../../engine/num'
import { useUpgrades } from '../../store/gameStore'
import { buyUpgrade } from '../../store/actions'
import { Placeholder } from '../shared/Placeholder'
import { Icon } from '../shared/Icon'

export function UpgradesScreen() {
  const upgrades = useUpgrades()

  // Available (affordable-or-not, unowned) first — cheapest first — then owned.
  const sorted = [...upgrades].sort((a, b) => {
    if (a.purchased !== b.purchased) return a.purchased ? 1 : -1
    return a.cost - b.cost
  })

  const allOwned = upgrades.length > 0 && upgrades.every((u) => u.purchased)

  if (allOwned) {
    return (
      <Placeholder
        icon="⚡"
        title="All upgrades owned"
        body="You've bought every upgrade available in this build. More arrive with future content."
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-bold" style={{ color: 'var(--text-dim)' }}>
        UPGRADES
      </h2>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {sorted.map((u) => (
        <div
          key={u.id}
          className="flex items-center gap-3 rounded-2xl p-3"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            opacity: u.purchased ? 0.7 : 1,
          }}
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl"
            style={{ background: 'var(--surface-2)' }}
          >
            <Icon art={{ src: u.iconSrc }} size={32} alt="" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold">{u.name}</div>
            <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
              {u.scopeLabel}
            </div>
          </div>
          {u.purchased ? (
            <span className="px-3 text-sm font-bold" style={{ color: 'var(--good)' }}>
              ✓ Owned
            </span>
          ) : (
            <button
              type="button"
              disabled={!u.affordable}
              onClick={() => buyUpgrade(u.id)}
              className="flex flex-col items-center justify-center rounded-xl px-3 font-bold"
              style={{
                minHeight: 'var(--tap-lg)',
                minWidth: '96px',
                background: u.affordable ? 'var(--accent)' : 'var(--surface-3)',
                color: u.affordable ? 'var(--accent-ink)' : 'var(--text-faint)',
              }}
            >
              <span className="text-sm">Buy</span>
              <span className="tnum text-xs opacity-90">{money(u.cost)}</span>
            </button>
          )}
        </div>
        ))}
      </div>
    </div>
  )
}
