import { money } from '../../engine/num'
import { useUpgrades, useRepeatables } from '../../store/gameStore'
import { buyUpgrade, buyAllUpgrades, buyRepeatableProgram } from '../../store/actions'
import { Icon } from '../shared/Icon'

export function UpgradesScreen() {
  const upgrades = useUpgrades()
  const { list: repeatables, unlocked: programsUnlocked } = useRepeatables()

  // Available (affordable-or-not, unowned) first — cheapest first — then owned.
  const sorted = [...upgrades].sort((a, b) => {
    if (a.purchased !== b.purchased) return a.purchased ? 1 : -1
    return a.cost - b.cost
  })

  const allOwned = upgrades.length > 0 && upgrades.every((u) => u.purchased)
  const affordableCount = upgrades.filter((u) => !u.purchased && u.affordable).length

  return (
    <div>
      {/* Executive Programs — repeatable, endlessly-buyable ranks (a late-game cash
          sink), so this tab keeps paying off after every one-shot is owned. */}
      {programsUnlocked && (
        <>
          <div className="section mb-2 flex items-center justify-between">
            <h2>Executive Programs</h2>
            <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
              repeatable
            </span>
          </div>
          <div className="card mb-4 overflow-hidden">
            {repeatables.map((p) => (
              <div key={p.id} className="list-row py-2.5 pl-3 pr-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl"
                  style={{ background: 'var(--surface-2)' }}
                  aria-hidden
                >
                  {p.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold">{p.name}</span>
                    {p.rank > 0 && (
                      <span className="tnum shrink-0 text-xs font-bold" style={{ color: 'var(--accent)' }}>
                        Rk {p.rank}
                      </span>
                    )}
                  </div>
                  <div className="truncate text-xs">
                    <span className="font-bold" style={{ color: 'var(--good)' }}>
                      {p.effectLabel}
                    </span>
                    <span style={{ color: 'var(--text-faint)' }}>
                      {p.currentLabel ? ` · ${p.currentLabel}` : ` · ${p.blurb}`}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!p.affordable}
                  onClick={() => buyRepeatableProgram(p.id)}
                  className={`btn btn-md shrink-0 ${p.affordable ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ minWidth: '72px' }}
                >
                  <span>{p.rank > 0 ? 'Rank up' : 'Start'}</span>
                  <span className="tnum" style={{ fontWeight: 400, opacity: 0.7 }}>
                    {money(p.cost)}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="section mb-2 flex items-center justify-between">
        <h2>Upgrades</h2>
        {affordableCount > 0 && (
          <button type="button" onClick={buyAllUpgrades} className="btn btn-secondary btn-sm" style={{ color: 'var(--accent)' }}>
            Buy all affordable ({affordableCount})
          </button>
        )}
        {allOwned && (
          <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
            all owned ✓
          </span>
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
