import type { ReactNode } from 'react'
import { money, formatRate, format } from '../../engine/num'
import { CAREER_LEVELS } from '../../content/career'
import { useStats, useContracts, useDaily } from '../../store/gameStore'
import { useSettingsStore } from '../../store/settingsStore'
import type { ContractView } from '../../store/buildView'
import { claimContract, claimDailyBonus } from '../../store/actions'
import { DailyStreakProgress } from '../shared/DailyStreakProgress'

function ToggleRow({ label, hint, on, onToggle }: { label: string; hint: string; on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      role="switch"
      aria-checked={on}
      className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-left"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', minHeight: 'var(--tap)' }}
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-xs" style={{ color: 'var(--text-faint)' }}>
          {hint}
        </span>
      </span>
      <span
        className="relative shrink-0 rounded-full transition-colors"
        style={{ width: 44, height: 26, background: on ? 'var(--accent)' : 'var(--surface-3)' }}
      >
        <span
          className="absolute top-0.5 rounded-full transition-all"
          style={{ width: 22, height: 22, background: '#fff', left: on ? 20 : 2 }}
        />
      </span>
    </button>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-xl px-3 py-2"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <span className="text-sm" style={{ color: 'var(--text-dim)' }}>
        {label}
      </span>
      <span className="tnum text-sm font-bold">{value}</span>
    </div>
  )
}

function ContractRow({ c }: { c: ContractView }) {
  const progressLabel =
    c.target >= 1e6 ? `${money(c.progress)} / ${money(c.target)}` : `${Math.floor(c.progress)} / ${c.target}`
  return (
    <div
      className="flex items-center gap-3 rounded-xl p-2.5"
      style={{
        background: 'var(--surface)',
        border: `1px solid ${c.complete ? 'var(--accent)' : 'var(--border)'}`,
      }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg"
        style={{ background: 'var(--surface-2)' }}
      >
        {c.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold">{c.name}</span>
          <span className="shrink-0 text-xs font-bold" style={{ color: 'var(--accent)' }}>
            +{c.rewardTokens} ✦
          </span>
        </div>
        <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
          {c.description}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--surface-3)' }}>
            <div
              className="h-full rounded-full"
              style={{ background: c.complete ? 'var(--good)' : 'var(--accent)', width: `${Math.round(c.fraction * 100)}%` }}
            />
          </div>
          <span className="tnum text-[10px]" style={{ color: 'var(--text-faint)' }}>
            {progressLabel}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => claimContract(c.id)}
        disabled={!c.complete}
        className="shrink-0 rounded-lg px-3 text-xs font-bold transition active:scale-[0.98]"
        style={{
          minHeight: 'var(--tap)',
          background: c.complete ? 'var(--accent)' : 'var(--surface-3)',
          color: c.complete ? 'var(--accent-ink)' : 'var(--text-faint)',
          cursor: c.complete ? 'pointer' : 'not-allowed',
        }}
      >
        {c.complete ? 'Claim' : '…'}
      </button>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-bold" style={{ color: 'var(--text-dim)' }}>
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{children}</div>
    </section>
  )
}

export function StatsScreen() {
  const s = useStats()
  const contracts = useContracts()
  const daily = useDaily()
  const careerTitle = CAREER_LEVELS[s.stats.careerLevel]?.title ?? '—'
  const bonusPct = s.prestigeProfitBonusPct
  const haptics = useSettingsStore((st) => st.haptics)
  const effects = useSettingsStore((st) => st.effects)
  const toggleHaptics = useSettingsStore((st) => st.toggleHaptics)
  const toggleEffects = useSettingsStore((st) => st.toggleEffects)

  return (
    <div className="flex flex-col gap-4">
      {daily.available && (
        <button
          type="button"
          onClick={claimDailyBonus}
          className="flex flex-col gap-2 rounded-2xl p-3 text-left transition active:scale-[0.99]"
          style={{ background: 'rgba(245,197,24,0.12)', border: '1px solid var(--accent)' }}
        >
          <span className="flex w-full items-center gap-3">
            <span className="text-2xl">🎁</span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold">Claim Daily Bonus</span>
              <span className="block text-xs" style={{ color: 'var(--text-dim)' }}>
                About 2h of income — comes back every day.
              </span>
            </span>
            <span className="tnum shrink-0 font-bold" style={{ color: 'var(--accent)' }}>
              +{money(daily.reward)}
            </span>
          </span>
          <DailyStreakProgress
            streak={daily.streak}
            nextMilestone={daily.nextMilestone}
            milestoneProgress={daily.milestoneProgress}
          />
        </button>
      )}

      {contracts.list.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold" style={{ color: 'var(--text-dim)' }}>
            CONTRACTS{contracts.claimable > 0 ? ` · ${contracts.claimable} ready ✓` : ''}
          </h2>
          <div className="flex flex-col gap-2">
            {contracts.list.map((c) => (
              <ContractRow key={c.id} c={c} />
            ))}
          </div>
        </section>
      )}

      <Section title="ECONOMY">
        <Row label="Cash" value={money(s.cash)} />
        <Row label="Idle income" value={formatRate(s.totalPps)} />
        <Row label="Lifetime earned" value={money(s.lifetime)} />
        <Row label="Permanent profit bonus" value={`+${bonusPct}%`} />
      </Section>

      <Section title="EMPIRE">
        <Row label="Businesses owned" value={String(s.stats.totalOwned)} />
        <Row label="Automated" value={`${s.stats.automatedCount}/${s.stats.businessesUnlocked}`} />
        <Row label="Industries entered" value={`${s.stats.industriesEntered}/${s.stats.industriesTotal}`} />
        <Row label="Employees hired" value={String(s.stats.employees)} />
      </Section>

      <Section title="PROGRESS">
        <Row label="Career" value={careerTitle} />
        <Row label="Ascensions" value={String(s.prestige.resets)} />
        <Row label="Empire tokens" value={format(s.prestige.totalPoints)} />
        <Row label="Achievements" value={`${s.achievements}/${s.achievementsTotal}`} />
      </Section>

      <Section title="SETTINGS">
        <ToggleRow
          label="Haptics"
          hint="Vibration feedback on taps & rewards"
          on={haptics}
          onToggle={toggleHaptics}
        />
        <ToggleRow
          label="Floating numbers"
          hint="Show +$ pops when you earn"
          on={effects}
          onToggle={toggleEffects}
        />
      </Section>
    </div>
  )
}
