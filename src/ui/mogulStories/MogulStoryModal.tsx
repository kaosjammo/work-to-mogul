import { useEffect, useState } from 'react'
import { useAngelDeal } from '../../store/gameStore'
import { acceptAngelDeal, declineAngel, chooseAngel, closeAngelOutcome } from '../../store/actions'
import { money } from '../../engine/num'
import {
  ANGEL_DEAL,
  getMogulStory,
  type MogulStoryChoice,
  type MogulStoryOutcomeBand,
} from '../../content/mogulStories'

const REDUCED =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Reveal text one character at a time (visual-novel style). Tap to skip to full. */
function useTypewriter(text: string, speed = 16) {
  const [n, setN] = useState(REDUCED ? text.length : 0)
  useEffect(() => {
    setN(REDUCED ? text.length : 0)
  }, [text])
  useEffect(() => {
    if (REDUCED || n >= text.length) return
    const t = setTimeout(() => setN((k) => k + 1), speed)
    return () => clearTimeout(t)
  }, [n, text, speed])
  return { shown: text.slice(0, n), done: n >= text.length, skip: () => setN(text.length) }
}

const BAND_COLOR: Record<MogulStoryOutcomeBand, string> = {
  great: 'var(--good)',
  good: 'var(--accent)',
  neutral: 'var(--text-dim)',
  bad: 'var(--bad)',
}

const scrimStyle = { background: 'rgba(0,0,0,0.72)' }

/**
 * The reusable Mogul Story UI — a mobile-first visual-novel modal. Renders ANY story
 * from its `MogulStory` def (stages, speaker, outcome copy) + the session view; no
 * story-specific logic lives here. Currently wired to the Angel Investment session.
 */
export function MogulStoryModal() {
  const a = useAngelDeal()
  // The active story, resolved from the session's story id — the modal renders ANY
  // registered story's def (stages/speaker/outcome copy), never a hardcoded one.
  const STORY = getMogulStory(a.storyId) ?? ANGEL_DEAL

  // A consequence beat: after picking a choice with a `result`, show it, then continue.
  const [pending, setPending] = useState<MogulStoryChoice | null>(null)
  useEffect(() => {
    setPending(null)
  }, [a.stageId, a.active, a.outcome])

  const stage = a.stageId ? STORY.stages[a.stageId] : null
  const bodyText = pending?.result ?? stage?.text ?? ''
  const tw = useTypewriter(bodyText)

  // ── Floating offer ────────────────────────────────────────────────────────
  if (a.offered && !a.active) {
    const bottom = 'calc(var(--nav-h, 64px) + env(safe-area-inset-bottom) + 14px)'
    return (
      <div className="fixed inset-x-0 z-40 mx-auto flex w-max max-w-[92vw] flex-col items-center gap-1" style={{ bottom }}>
        <button
          type="button"
          onClick={acceptAngelDeal}
          className="golden-pulse flex items-center gap-2 rounded-full px-4 py-2 font-bold shadow-lg"
          style={{ background: 'linear-gradient(135deg,#2bd47a,#46d369)', color: '#06231a', border: '2px solid #bff3d6' }}
        >
          <span className="text-xl">{STORY.icon ?? '💼'}</span>
          <span className="flex flex-col items-start leading-tight">
            <span className="text-sm">{STORY.hook}</span>
            <span className="text-[10px] font-semibold opacity-80">tap to hear them out</span>
          </span>
        </button>
        <button type="button" onClick={declineAngel} className="btn btn-ghost btn-sm">
          Not now
        </button>
      </div>
    )
  }

  if (!a.active) return null

  // ── Outcome screen ────────────────────────────────────────────────────────
  if (a.outcome) {
    const copy = STORY.outcome[a.outcome]
    const color = BAND_COLOR[a.outcome]
    const gain = a.payout > 0
    const loss = a.payout < 0
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" style={scrimStyle}>
        <div className="card m-3 flex w-full max-w-sm flex-col gap-3 p-5 text-center" style={{ borderColor: color }}>
          <div className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-faint)' }}>
            {STORY.subject} · {STORY.title}
          </div>
          <h2 className="text-2xl font-extrabold" style={{ color }}>
            {copy.title}
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            {copy.line}
          </p>
          {(gain || loss) && (
            <p className="tnum text-3xl font-extrabold" style={{ color: gain ? 'var(--good)' : 'var(--bad)' }}>
              {gain ? '+' : '−'}
              {money(Math.abs(a.payout))}
            </p>
          )}
          {a.disciplined && (
            <p className="text-xs" style={{ color: 'var(--good)' }}>
              🧊 Discipline bonus — you dodged a bad one.
            </p>
          )}
          <button type="button" onClick={closeAngelOutcome} className="btn btn-primary btn-lg btn-block mt-1">
            Done
          </button>
        </div>
      </div>
    )
  }

  if (!stage) return null

  const speaker = pending || stage.speaker === 'narrator' ? '' : stage.speaker === 'protagonist' ? STORY.protagonist : 'You'
  const choices = stage.choices.filter((c) => !c.walkAway)
  const walkChoice = stage.choices.find((c) => c.walkAway)

  const pick = (c: MogulStoryChoice) => {
    if (!tw.done) {
      tw.skip()
      return
    }
    if (c.result && !c.walkAway) setPending(c)
    else chooseAngel(c.id)
  }

  // ── A story stage ─────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" style={scrimStyle}>
      <div className="card m-3 flex max-h-[92vh] w-full max-w-md flex-col gap-3 p-4" style={{ borderColor: 'var(--accent)' }}>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-extrabold" style={{ color: 'var(--accent)' }}>
              {STORY.icon ?? '💼'} {STORY.subject}
            </div>
            <div className="truncate text-[10px]" style={{ color: 'var(--text-faint)' }}>
              {STORY.hook}
            </div>
          </div>
          <div className="tnum shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: 'var(--surface-3)', color: 'var(--text-dim)' }}>
            {stage.title} · {a.stageIndex}/{a.stageTotal}
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto rounded-xl p-3"
          style={{ background: 'var(--surface-2)', minHeight: '112px' }}
          onClick={() => !tw.done && tw.skip()}
        >
          {speaker && (
            <div className="mb-1 text-xs font-bold" style={{ color: 'var(--accent)' }}>
              {speaker}
            </div>
          )}
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
            {tw.shown}
            {!tw.done && <span style={{ color: 'var(--text-faint)' }}>▌</span>}
          </p>
        </div>

        {!pending && a.hints.length > 0 && tw.done && (
          <div className="flex flex-col gap-0.5">
            {a.hints.map((h, i) => (
              <div key={i} className="text-[11px] italic" style={{ color: 'var(--text-faint)' }}>
                {h}
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          {!tw.done ? (
            <button type="button" onClick={tw.skip} className="btn btn-secondary btn-sm self-center">
              tap to continue…
            </button>
          ) : pending ? (
            <button type="button" onClick={() => chooseAngel(pending.id)} className="btn btn-primary btn-md btn-block">
              Continue ▸
            </button>
          ) : (
            <>
              {choices.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pick(c)}
                  className="w-full rounded-[var(--ctrl-radius)] px-3 py-2 text-left text-sm font-semibold transition active:scale-[0.99]"
                  style={{ background: 'var(--surface-2)', borderLeft: '2px solid var(--accent)', minHeight: 'var(--tap)' }}
                >
                  {c.label}
                </button>
              ))}
              {walkChoice && (
                <button type="button" onClick={() => chooseAngel(walkChoice.id)} className="btn btn-ghost btn-sm mt-0.5 self-center">
                  {walkChoice.label}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
