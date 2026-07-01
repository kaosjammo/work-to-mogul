import { useState, type ReactNode } from 'react'
import { money, format } from '../../engine/num'
import { PRESTIGE_UNLOCK_LIFETIME } from '../../engine/economy'
import { TALENT_THEMES } from '../../content/talents'
import { usePrestige, useAchievements, useTalents, useFounderPerks, usePrestigeMilestones } from '../../store/gameStore'
import type { TalentView } from '../../store/buildView'
import { prestige, buyTalent, chooseFounderPerk, hardReset } from '../../store/actions'
import { HoldToConfirmButton } from './HoldToConfirmButton'

export function PrestigeScreen() {
  const { prestige: p, pending, unlocked, lifetime, nextTokenAt, nextTokenProgress, profitBonusPct } = usePrestige()
  const talents = useTalents()
  const founderPerks = useFounderPerks()
  const milestones = usePrestigeMilestones()
  const achievements = useAchievements()
  const milestonesReached = milestones.filter((m) => m.reached).length
  const progress = Math.min(1, lifetime / PRESTIGE_UNLOCK_LIFETIME)

  return (
    <div className="flex flex-col gap-5">
      {/* ---- Hero: borderless header + inline stat pills, then ONE flat surface around Ascend ---- */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl leading-none">✦</span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold leading-tight">Ascend</h2>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Reset cash, career, businesses &amp; staff for <span style={{ color: 'var(--accent)' }}>Empire Tokens</span> — spend on permanent talents.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Pill label="Profit bonus" value={`+${profitBonusPct}%`} />
          <Pill label="Tokens" value={format(talents.available)} />
          <Pill label="Ascensions" value={String(p.resets)} />
        </div>

        <div className="card p-4">
          {unlocked ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm">
                Ascend now to bank{' '}
                <span className="font-bold" style={{ color: 'var(--accent)' }}>
                  +{format(pending)} {pending === 1 ? 'token' : 'tokens'}
                </span>
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
              {/* "Wait or ascend?" — how close the next token is. */}
              <div className="flex flex-col gap-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--surface-3)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ background: 'var(--accent)', width: `${Math.round(nextTokenProgress * 100)}%` }}
                  />
                </div>
                <p className="tnum text-xs" style={{ color: 'var(--text-faint)' }}>
                  Next ✦ at {money(nextTokenAt)} lifetime
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
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
        <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
          ✓ Kept forever: talents, tokens, achievements &amp; ascension milestones.
        </p>
      </div>

      {/* ---- Founder Perk: the per-run flavour choice ---- */}
      <section className="section">
        <div className="mb-2">
          <h2>Founder Perk</h2>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--text-faint)' }}>
            Pick a style for this run — each is a trade-off.
          </p>
        </div>
        <div className="card overflow-hidden">
          {founderPerks.map((fp) => (
            <button
              key={fp.id}
              type="button"
              onClick={() => chooseFounderPerk(fp.chosen ? null : fp.id)}
              className="list-row w-full py-2.5 pr-3 text-left transition active:scale-[0.99]"
              style={{
                paddingLeft: fp.chosen ? '10px' : '12px',
                borderLeft: fp.chosen ? '2px solid var(--accent)' : undefined,
              }}
            >
              <span className="text-2xl leading-none">{fp.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate font-semibold">{fp.name}</span>
                  {fp.chosen && (
                    <span className="shrink-0 text-xs font-bold" style={{ color: 'var(--accent)' }}>
                      ✓ Active
                    </span>
                  )}
                </span>
                <span className="block text-xs" style={{ color: 'var(--text-dim)' }}>{fp.blurb}</span>
                <span className="mt-0.5 block text-xs font-semibold" style={{ color: 'var(--good)' }}>{fp.effectLabel}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ---- Talent tree ---- */}
      <section className="section">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2>Talents</h2>
          <span className="tnum shrink-0 text-xs" style={{ color: 'var(--accent)' }}>
            ✦ {format(talents.available)} · {format(talents.spent)} spent
          </span>
        </div>
        {talents.total === 0 ? (
          <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
            Ascend at least once to earn Empire Tokens, then spend them here on permanent upgrades.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {TALENT_THEMES.map((theme) => {
              const group = talents.list.filter((t) => t.theme === theme)
              if (!group.length) return null
              return (
                <div key={theme}>
                  <h3 className="mb-1 text-[0.6875rem] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-faint)' }}>
                    {theme}
                  </h3>
                  <div className="card overflow-hidden">
                    {group.map((t) => (
                      <TalentRow key={t.id} t={t} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ---- Prestige milestones (ascension-count token rewards) ---- */}
      <CollapsibleSection title="Ascension Milestones" badge={`${milestonesReached}/${milestones.length}`}>
        <div className="card overflow-hidden">
          {milestones.map((m) => (
            <div
              key={m.id}
              className="list-row py-2.5 pr-3"
              style={{
                paddingLeft: m.reached ? '10px' : '12px',
                borderLeft: m.reached ? '2px solid var(--accent)' : undefined,
                opacity: m.reached ? 1 : 0.72,
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
              {m.reached && <span className="shrink-0" style={{ color: 'var(--good)' }}>✓</span>}
            </div>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Achievements" badge={`${achievements.unlocked}/${achievements.list.length}`}>
        <div className="card overflow-hidden">
          {achievements.list.map((a) => (
            <div
              key={a.id}
              className="list-row py-2.5 pr-3"
              style={{
                paddingLeft: a.unlocked ? '10px' : '12px',
                borderLeft: a.unlocked ? '2px solid var(--good)' : undefined,
                opacity: a.unlocked ? 1 : 0.6,
              }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg"
                style={{ background: 'var(--surface-2)', filter: a.unlocked ? 'none' : 'grayscale(1)' }}
              >
                {a.unlocked ? a.icon : '🔒'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{a.name}</span>
                  <span
                    className="shrink-0 text-xs font-bold"
                    style={{ color: a.unlocked ? 'var(--good)' : 'var(--accent)' }}
                    title={a.unlocked ? 'Unlocked' : `Unlock to bank ${a.reward} Empire Tokens`}
                  >
                    {a.unlocked ? '✓' : `✦${a.reward}`}
                  </span>
                </div>
                <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  {a.description}
                </div>
                {!a.unlocked && a.progress != null && (
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--surface-3)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{ background: 'var(--accent)', width: `${Math.round(a.progress * 100)}%` }}
                      />
                    </div>
                    <span className="tnum text-[10px]" style={{ color: 'var(--text-faint)' }}>
                      {Math.round(a.progress * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      <section className="section">
        <h2 className="mb-1" style={{ color: 'var(--bad)' }}>Danger Zone</h2>
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

// A tappable section that hides its body by default — the prestige screen stacks a
// lot of long, informational lists (10 milestones + 30 achievements), so collapsing
// them keeps the screen scannable on a phone. The count badge stays visible while
// collapsed, so progress is legible without expanding.
function CollapsibleSection({
  title,
  badge,
  defaultOpen = false,
  children,
}: {
  title: string
  badge?: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="section">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mb-2 flex w-full items-center justify-between gap-2"
        style={{ minHeight: 'var(--tap)' }}
      >
        <h2>
          {title}
          {badge ? <span style={{ color: 'var(--text-faint)' }}> · {badge}</span> : null}
        </h2>
        <span className="text-xs font-semibold" style={{ color: 'var(--text-faint)' }}>
          {open ? '▾ Hide' : '▸ Show'}
        </span>
      </button>
      {open && children}
    </section>
  )
}

function TalentRow({ t }: { t: TalentView }) {
  const owned = t.rank > 0
  return (
    <div
      className="list-row py-2.5 pr-3"
      style={{
        paddingLeft: owned ? '10px' : '12px',
        borderLeft: owned ? '2px solid var(--accent)' : undefined,
      }}
    >
      <span className="text-xl leading-none">{t.icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold">{t.name}</span>
          <span className="tnum shrink-0 text-xs" style={{ color: 'var(--text-faint)' }}>
            {t.rank}/{t.maxRank}
          </span>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
          {t.blurb}
        </p>
        {owned && (
          <p className="tnum text-xs font-medium" style={{ color: 'var(--accent)' }}>
            Now: {t.currentLabel}
          </p>
        )}
        {!t.maxed && t.nextLabel != null && (
          <p className="tnum text-xs" style={{ color: 'var(--text-faint)' }}>
            {owned ? 'Next' : 'Unlock'}: {t.nextLabel}
          </p>
        )}
      </div>

      {t.maxed ? (
        <span className="shrink-0 text-xs font-semibold" style={{ color: 'var(--text-faint)' }}>
          MAXED
        </span>
      ) : (
        <button
          type="button"
          onClick={() => buyTalent(t.id)}
          disabled={!t.affordable}
          className={`btn btn-md shrink-0 ${t.affordable ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flexDirection: 'column', gap: 0, height: 'auto', paddingTop: 5, paddingBottom: 5, lineHeight: 1.15 }}
        >
          <span>{owned ? 'Next' : 'Unlock'}</span>
          <span className="tnum text-[0.6875rem]" style={{ fontWeight: 400, opacity: 0.75 }}>✦{t.nextCost != null ? format(t.nextCost) : ''}</span>
        </button>
      )}
    </div>
  )
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-baseline gap-1.5 rounded-lg px-2.5 py-1"
      style={{ background: 'var(--surface-2)' }}
    >
      <span className="tnum text-sm font-bold" style={{ color: 'var(--accent)' }}>
        {value}
      </span>
      <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
        {label}
      </span>
    </div>
  )
}
