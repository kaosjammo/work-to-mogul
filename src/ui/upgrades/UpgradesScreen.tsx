import { money } from '../../engine/num'
import { useUpgrades } from '../../store/gameStore'
import { buyUpgrade, buyAllUpgrades } from '../../store/actions'
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
  const affordableCount = upgrades.filter((u) => !u.purchased && u.affordable).length

  if (allOwned) {
    return (
      <Placeholder
        art="/assets/states/state_empty_upgrades.svg"
        title="All upgrades owned"
        body="You've bought every upgrade available in this build. More arrive with future content."
      />
    )
  }

  return (
    <div>
      <div className="section mb-2 flex items-center justify-between">
        <h2>Upgrades</h2>
        {affordableCount > 0 && (
          <button type="button" onClick={buyAllUpgrades} className="btn btn-secondary btn-sm" style={{ color: 'var(--accent)' }}>
            Buy all affordable ({affordableCount})
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        {sorted.map((u) => (
          <div key={u.id} className="list-row py-2.5 pl-3 pr-3" style={{ opacity: u.purchased ? 0.6 : 1 }}>
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg"
              style={{ background: 'var(--surface-2)' }}
            >
              <Icon art={{ src: u.iconSrc }} size={34} alt="" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{u.name}</div>
              <div className="truncate text-xs">
                <span className="font-bold" style={{ color: 'var(--good)' }}>
                  {u.effectLabel}
                </span>
                <span style={{ color: 'var(--text-faint)' }}> · {u.scopeLabel}</span>
              </div>
            </div>

            {u.purchased ? (
              <span
                className="shrink-0 text-right text-xs font-bold"
                style={{ color: 'var(--text-faint)', minWidth: '72px' }}
              >
                ✓ Owned
              </span>
            ) : (
              <button
                type="button"
                disabled={!u.affordable}
                onClick={() => buyUpgrade(u.id)}
                className={`btn btn-md shrink-0 ${u.affordable ? 'btn-primary' : 'btn-secondary'}`}
                style={{ minWidth: '72px' }}
              >
                <span>Buy</span>
                <span className="tnum" style={{ fontWeight: 400, opacity: 0.7 }}>
                  {money(u.cost)}
                </span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
