import { money } from '../../engine/num'
import { PRESTIGE_UNLOCK_LIFETIME } from '../../engine/economy'
import { TALENT_THEMES } from '../../content/talents'
import { usePrestige, useAchievements, useTalents, usePrestigeMilestones } from '../../store/gameStore'
import type { TalentView } from '../../store/buildView'
import { prestige, buyTalent, hardReset } from '../../store/actions'
import { HoldToConfirmButton } from './HoldToConfirmButton'

export function PrestigeScreen() {
  const { prestige: p, pending, unlocked, lifetime, profitBonusPct } = usePrestige()
  const talents = useTalents()
  const milestones = usePrestigeMilestones()
  const achievements = useAchievements()
  const milestonesReached = milestones.filter((m) => m.reached).length
  const progress = Math.min(1, lifetime / PRESTIGE_UNLOCK_LIFETIME)

  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex flex-col items-center gap-2 rounded-2xl p-6 text-center"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <span className="text-4xl">✦</span>
        <h2 className="text-lg font-bold">Ascend</h2>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          Reset your cash, career, businesses and staff in exchange for
          <span className="font-semibold" style={{ color: 'var(--accent)' }}> Empire Tokens</span>.
          Spend them on permanent <span className="font-semibold">talents</span> below.
        </p>

        <div className="my-2 flex w-full justify-around">
          <Stat label="Profit bonus" value={`+${profitBonusPct}%`} />
          <Stat label="Tokens to spend" value={String(talents.available)} />
          <Stat label="Ascensions" value={String(p.resets)} />
        </div>

        {unlocked ? (
          <div className="flex w-full flex-col gap-2">
            <p className="text-sm">
              Ascend now to bank <span className="font-bold" style={{ color: 'var(--accent)' }}>+{pending} {pending === 1 ? 'token' : 'tokens'}</span>
            </p>
            <HoldToConfirmButton
              label="Hold to Ascend"
              holdingLabel="Ascending…"
              onConfirm={prestige}
              disabled={pending < 1}
              color="var(--accent)"
            />
            {pending < 1 && (
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                Earn more to bank at least 1 token.
              </p>
            )}
          </div>
        ) : (
          <div className="flex w-full flex-col gap-2">
            <p className="text-sm" style={{ color: 'var(--text-faint)' }}>
              Unlocks at {money(PRESTIGE_UNLOCK_LIFETIME)} lifetime earnings.
            </p>
            <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--surface-3)' }}>
              <div
                className="progress-fill h-full rounded-full"
                style={{
                  background: 'var(--accent)',
                  transform: `scaleX(${progress})`,
                  transition: 'transform 0.2s linear',
                }}
              />
            </div>
            <p className="tnum text-xs" style={{ color: 'var(--text-faint)' }}>
              {money(lifetime)} / {money(PRESTIGE_UNLOCK_LIFETIME)}
            </p>
          </div>
        )}
      </div>

      {/* ---- Talent tree ---- */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-dim)' }}>
            TALENTS
          </h2>
          <span className="tnum text-xs" style={{ color: 'var(--accent)' }}>
            ✦ {talents.available} available · {talents.spent} spent
          </span>
        </div>
        {talents.total === 0 ? (
          <p
            className="rounded-xl p-3 text-center text-xs"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-faint)' }}
          >
            Ascend at least once to earn Empire Tokens, then spend them here on permanent upgrades.
          </p>
        ) : (
          TALENT_THEMES.map((theme) => {
            const group = talents.list.filter((t) => t.theme === theme)
            if (!group.length) return null
            return (
              <div key={theme} className="mb-3">
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-faint)' }}>
                  {theme}
                </h3>
                <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                  {group.map((t) => (
                    <TalentCard key={t.id} t={t} />
                  ))}
                </div>
              </div>
            )
          })
        )}
      </section>

      {/* ---- Prestige milestones (ascension-count token rewards) ---- */}
      <section>
        <h2 className="mb-2 text-sm font-bold" style={{ color: 'var(--text-dim)' }}>
          ASCENSION MILESTONES · {milestonesReached}/{milestones.length}
        </h2>
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          {milestones.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 rounded-xl p-2"
              style={{
                background: 'var(--surface)',
                border: `1px solid ${m.reached ? 'var(--accent)' : 'var(--border)'}`,
                opacity: m.reached ? 1 : 0.7,
              }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg"
                style={{ background: 'var(--surface-2)', filter: m.reached ? 'none' : 'grayscale(1)' }}
              >
                {m.reached ? m.icon : '🔒'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{m.name}</div>
                <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  {m.description} · reward ✦{m.rewardTokens}
                </div>
                {!m.reached && (
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full" style={{ background: 'var(--surface-3)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ background: 'var(--accent)', width: `${Math.round(m.progress * 100)}%` }}
                    />
                  </div>
                )}
              </div>
              {m.reached && <span style={{ color: 'var(--good)' }}>✓</span>}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold" style={{ color: 'var(--text-dim)' }}>
          ACHIEVEMENTS · {achievements.unlocked}/{achievements.list.length}
        </h2>
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          {achievements.list.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 rounded-xl p-2"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                opacity: a.unlocked ? 1 : 0.55,
              }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg"
                style={{ background: 'var(--surface-2)', filter: a.unlocked ? 'none' : 'grayscale(1)' }}
              >
                {a.unlocked ? a.icon : '🔒'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{a.name}</div>
                <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  {a.description}
                </div>
              </div>
              {a.unlocked && <span style={{ color: 'var(--good)' }}>✓</span>}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-2">
        <h2 className="mb-2 text-sm font-bold" style={{ color: 'var(--text-dim)' }}>
          DANGER ZONE
        </h2>
        <p className="mb-2 text-xs" style={{ color: 'var(--text-faint)' }}>
          Permanently wipe this save and start a brand-new game — including prestige tokens
          and achievements. This cannot be undone.
        </p>
        <HoldToConfirmButton
          label="Hold to Reset Everything"
          holdingLabel="Resetting…"
          onConfirm={hardReset}
          color="var(--bad)"
        />
      </section>
    </div>
  )
}

function TalentCard({ t }: { t: TalentView }) {
  return (
    <div
      className="flex flex-col gap-2 rounded-xl p-3"
      style={{
        background: 'var(--surface)',
        border: `1px solid ${t.rank > 0 ? 'var(--accent)' : 'var(--border)'}`,
      }}
    >
      <div className="flex items-start gap-2">
        <span className="text-xl leading-none">{t.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold">{t.name}</span>
            <span className="tnum shrink-0 text-xs" style={{ color: 'var(--text-faint)' }}>
              {t.rank}/{t.maxRank}
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
            {t.blurb}
          </p>
        </div>
      </div>

      {t.rank > 0 && (
        <div className="tnum text-xs font-medium" style={{ color: 'var(--accent)' }}>
          Now: {t.currentLabel}
        </div>
      )}

      {t.maxed ? (
        <div
          className="rounded-lg py-1.5 text-center text-xs font-semibold"
          style={{ background: 'var(--surface-2)', color: 'var(--text-faint)' }}
        >
          MAXED
        </div>
      ) : (
        <button
          type="button"
          onClick={() => buyTalent(t.id)}
          disabled={!t.affordable}
          className="rounded-lg py-1.5 text-center text-xs font-semibold transition active:scale-[0.98]"
          style={{
            background: t.affordable ? 'var(--accent)' : 'var(--surface-2)',
            color: t.affordable ? 'var(--bg)' : 'var(--text-faint)',
            cursor: t.affordable ? 'pointer' : 'not-allowed',
          }}
        >
          {t.rank > 0 ? 'Next' : 'Unlock'}: {t.nextLabel} · ✦{t.nextCost}
        </button>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="tnum text-lg font-bold" style={{ color: 'var(--accent)' }}>
        {value}
      </span>
      <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
        {label}
      </span>
    </div>
  )
}
