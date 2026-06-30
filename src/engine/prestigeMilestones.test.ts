import { describe, it, expect } from 'vitest'
import { initialGameState } from '../store/initialState'
import { checkPrestigeMilestones } from './prestigeMilestones'
import { prestigeReset } from './prestige'
import { PRESTIGE_SCALE } from './economy'

describe('prestige milestones', () => {
  it('grants the token reward once when the reset threshold is reached', () => {
    const s = initialGameState(0)
    s.prestige.resets = 3
    s.prestige.totalPoints = 10

    const first = checkPrestigeMilestones(s)
    expect(first.map((m) => m.id)).toEqual(['ascend_3'])
    expect(s.prestige.totalPoints).toBe(13) // +3 reward
    expect(s.prestigeMilestonesClaimed).toContain('ascend_3')

    // Idempotent — re-checking at the same reset count grants nothing more.
    const second = checkPrestigeMilestones(s)
    expect(second).toHaveLength(0)
    expect(s.prestige.totalPoints).toBe(13)
  })

  it('back-grants every milestone at or below the current reset count at once', () => {
    const s = initialGameState(0)
    s.prestige.resets = 6 // crosses ascend_3 (+3) and ascend_5 (+6)
    s.prestige.totalPoints = 0
    const granted = checkPrestigeMilestones(s)
    expect(granted.map((m) => m.id)).toEqual(['ascend_3', 'ascend_5'])
    expect(s.prestige.totalPoints).toBe(9)
  })

  it('does not fire before the first qualifying threshold', () => {
    const s = initialGameState(0)
    s.prestige.resets = 2
    expect(checkPrestigeMilestones(s)).toHaveLength(0)
  })

  it('prestigeReset reaches the 3-ascension milestone and banks the bonus', () => {
    const s = initialGameState(0)
    s.prestige.resets = 2 // next ascension is the 3rd
    s.lifetimeEarnings = PRESTIGE_SCALE // 1 base token
    prestigeReset(s)
    expect(s.prestige.resets).toBe(3)
    expect(s.prestigeMilestonesClaimed).toContain('ascend_3')
    // 1 base token + 3 milestone reward
    expect(s.prestige.totalPoints).toBe(4)
  })

  it('milestone claims survive subsequent ascensions (no double-grant)', () => {
    const s = initialGameState(0)
    s.prestige.resets = 2
    s.lifetimeEarnings = PRESTIGE_SCALE
    prestigeReset(s) // → resets 3, claims ascend_3
    const afterFirst = s.prestige.totalPoints
    s.lifetimeEarnings = PRESTIGE_SCALE
    prestigeReset(s) // → resets 4, ascend_3 already claimed
    expect(s.prestigeMilestonesClaimed.filter((id) => id === 'ascend_3')).toHaveLength(1)
    expect(s.prestige.totalPoints).toBe(afterFirst + 1) // only the base token, no re-reward
  })
})
