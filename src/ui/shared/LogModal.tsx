import { useState } from 'react'
import { useUiStore } from '../../store/uiStore'
import { useLog, useSpaceShooter, useFoodFrenzy } from '../../store/gameStore'
import { getMogulStory } from '../../content/mogulStories'
import { SPACE_SHOOTER_STAGES } from '../../content/spaceShooter'
import { FOOD_FRENZY_TIERS } from '../../content/foodFrenzy'
import type { StoryLogItem } from '../../store/buildView'
import { haptic } from '../../lib/haptics'
import { Overlay } from './Overlay'

const ACCENT = 'var(--accent)'

const KIND_META: Record<StoryLogItem['kind'], { label: string; icon: string }> = {
  romance: { label: 'Romance', icon: '💘' },
  ea: { label: 'Recruitment', icon: '🤝' },
  mogul: { label: 'Mogul Stories', icon: '💼' },
}
const KIND_ORDER: StoryLogItem['kind'][] = ['mogul', 'romance', 'ea']

function tnum(n: number): string {
  return n > 0 ? n.toLocaleString('en-US') : '—'
}

/** A row of tappable stage/tier chips: cleared → replay (practice), next → continue campaign,
 *  future → locked. */
function StageChips({
  labels,
  cleared,
  bestScores,
  onReplay,
  onContinue,
}: {
  labels: string[]
  cleared: number // count of cleared stages/tiers
  bestScores: number[]
  onReplay: (index: number) => void
  onContinue: () => void
}) {
  return (
    <div className="flex flex-col gap-1">
      {labels.map((label, i) => {
        const done = i < cleared
        const next = i === cleared
        const best = bestScores[i] ?? 0
        return (
          <button
            key={i}
            type="button"
            disabled={!done && !next}
            onClick={() => (done ? onReplay(i) : onContinue())}
            className={`list-row w-full justify-between gap-2 px-3 py-2 text-left ${done || next ? '' : 'opacity-40'}`}
            style={{ minHeight: 'var(--tap)' }}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="tnum text-xs font-bold" style={{ color: done ? 'var(--good)' : next ? ACCENT : 'var(--text-faint)' }}>
                {done ? '✓' : next ? '▸' : '🔒'}
              </span>
              <span className="truncate text-sm font-semibold">{label}</span>
            </span>
            <span className="tnum shrink-0 text-xs" style={{ color: 'var(--text-dim)' }}>
              {done ? `▶ replay · ★ ${tnum(best)}` : next ? 'play ▸' : 'locked'}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/** Read-only replay of a past story — steps through its stages (narration + speech), no
 *  choices. A quiet re-read of a tale the player already lived. */
function StoryReader({ storyId, onBack }: { storyId: string; onBack: () => void }) {
  const story = getMogulStory(storyId)
  const [i, setI] = useState(0)
  if (!story) {
    return (
      <button type="button" onClick={onBack} className="btn btn-secondary btn-lg btn-block">
        ◂ Back to the Log
      </button>
    )
  }
  const total = story.order.length
  const idx = Math.min(i, total - 1)
  const stage = story.stages[story.order[idx]]
  const speaker =
    !stage || stage.speaker === 'narrator' ? '' : stage.speaker === 'protagonist' ? story.protagonist : 'You'

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-extrabold" style={{ color: ACCENT }}>
            {story.icon ?? '💼'} {story.title}
          </div>
          <div className="truncate text-[10px]" style={{ color: 'var(--text-faint)' }}>
            {story.subject}
          </div>
        </div>
        <div className="tnum shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: 'var(--surface-3)', color: 'var(--text-dim)' }}>
          {stage?.title} · {idx + 1}/{total}
        </div>
      </div>

      <div className="rounded-xl p-3" style={{ background: 'var(--surface-2)', minHeight: '132px' }}>
        {speaker && (
          <div className="mb-1 text-xs font-bold" style={{ color: ACCENT }}>
            {speaker}
          </div>
        )}
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
          {stage?.text}
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={idx === 0}
          onClick={() => setI(idx - 1)}
          className={`btn btn-md ${idx === 0 ? 'btn-secondary opacity-40' : 'btn-secondary'}`}
        >
          ◂ Back
        </button>
        {idx < total - 1 ? (
          <button type="button" onClick={() => setI(idx + 1)} className="btn btn-primary btn-md btn-block">
            Next ▸
          </button>
        ) : (
          <button type="button" onClick={onBack} className="btn btn-primary btn-md btn-block">
            ✓ Back to the Log
          </button>
        )}
      </div>
      <button type="button" onClick={onBack} className="btn btn-ghost btn-sm self-center">
        Close story
      </button>
    </>
  )
}

/**
 * The Log — a scrapbook the player opens from the main-screen 📜 button once they have any
 * history. Two shelves: REPLAY a mini-game (arcade shooter / food-truck rush) at any cleared
 * stage — a practice run that chases a best score without touching campaign progress — and
 * RE-READ any Mogul / romance / recruitment story they've completed.
 */
export function LogModal() {
  const open = useUiStore((s) => s.logOpen)
  const close = useUiStore((s) => s.closeLog)
  const replayShooter = useUiStore((s) => s.replaySpaceShooter)
  const openShooter = useUiStore((s) => s.openSpaceShooter)
  const replayFrenzy = useUiStore((s) => s.replayFoodFrenzy)
  const openFrenzy = useUiStore((s) => s.openFoodFrenzy)
  const log = useLog()
  const ss = useSpaceShooter()
  const ff = useFoodFrenzy()
  const [reading, setReading] = useState<string | null>(null)

  if (!open) return null

  const launchShooterReplay = (i: number) => {
    haptic(16)
    replayShooter(i)
    close()
  }
  const continueShooter = () => {
    haptic(16)
    openShooter()
    close()
  }
  const launchFrenzyReplay = (i: number) => {
    haptic(16)
    replayFrenzy(i)
    close()
  }
  const continueFrenzy = () => {
    haptic(16)
    openFrenzy()
    close()
  }

  const playedShooter = ss.missionsPlayed > 0 || ss.stagesCompleted > 0
  const playedFrenzy = ff.runsPlayed > 0 || ff.tiersCleared > 0
  const noMinigames = !playedShooter && !playedFrenzy

  // Group completed stories by kind for the re-read shelf.
  const grouped = KIND_ORDER.map((kind) => ({
    kind,
    items: log.stories.filter((s) => s.kind === kind),
  })).filter((g) => g.items.length > 0)

  return (
    <Overlay accent={ACCENT} onBackdropClick={() => (reading ? setReading(null) : close())} panelClassName="max-h-[88vh] overflow-y-auto">
      {reading ? (
        <StoryReader storyId={reading} onBack={() => setReading(null)} />
      ) : (
        <>
          <div>
            <h2 className="text-lg font-extrabold">📜 The Log</h2>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Replay a mini-game for a better score, or re-read a story you've lived through.
            </p>
          </div>

          {/* ── Mini-games ─────────────────────────────────────── */}
          <div className="section">
            <h3>🎮 Mini-games</h3>
          </div>
          {noMinigames ? (
            <div className="card p-3 text-center text-xs" style={{ color: 'var(--text-faint)' }}>
              No mini-games played yet — a signal will find you out there.
            </div>
          ) : (
            <>
              {playedShooter && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between px-0.5">
                    <span className="text-sm font-bold">🛰️ Space Salvage</span>
                    <span className="tnum text-[11px]" style={{ color: 'var(--text-faint)' }}>
                      {ss.stagesCompleted}/{ss.totalStages} cleared
                    </span>
                  </div>
                  <StageChips
                    labels={SPACE_SHOOTER_STAGES.map((s) => `Stage ${s.number} · ${s.title}`)}
                    cleared={ss.stagesCompleted}
                    bestScores={ss.bestScores}
                    onReplay={launchShooterReplay}
                    onContinue={continueShooter}
                  />
                </div>
              )}
              {playedFrenzy && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between px-0.5">
                    <span className="text-sm font-bold">🌭 Lunch Rush</span>
                    <span className="tnum text-[11px]" style={{ color: 'var(--text-faint)' }}>
                      {ff.tiersCleared}/{ff.totalTiers} cleared
                    </span>
                  </div>
                  <StageChips
                    labels={FOOD_FRENZY_TIERS.map((t) => t.name)}
                    cleared={ff.tiersCleared}
                    bestScores={ff.bestScores}
                    onReplay={launchFrenzyReplay}
                    onContinue={continueFrenzy}
                  />
                </div>
              )}
            </>
          )}

          {/* ── Stories ────────────────────────────────────────── */}
          <div className="section">
            <h3>📖 Stories</h3>
          </div>
          {grouped.length === 0 ? (
            <div className="card p-3 text-center text-xs" style={{ color: 'var(--text-faint)' }}>
              No stories yet — rare tales surface as your empire grows.
            </div>
          ) : (
            grouped.map((g) => (
              <div key={g.kind} className="flex flex-col gap-1">
                <div className="px-0.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-faint)' }}>
                  {KIND_META[g.kind].icon} {KIND_META[g.kind].label}
                </div>
                {g.items.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      haptic(12)
                      setReading(s.id)
                    }}
                    className="list-row w-full justify-between gap-2 px-3 py-2 text-left"
                    style={{ minHeight: 'var(--tap)' }}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="text-lg">{s.icon}</span>
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-semibold">{s.title}</span>
                        <span className="truncate text-[11px]" style={{ color: 'var(--text-faint)' }}>
                          {s.subject}
                        </span>
                      </span>
                    </span>
                    <span className="shrink-0 text-xs" style={{ color: ACCENT }}>
                      read ▸
                    </span>
                  </button>
                ))}
              </div>
            ))
          )}

          <button type="button" onClick={close} className="btn btn-secondary btn-lg btn-block">
            Done
          </button>
        </>
      )}
    </Overlay>
  )
}
