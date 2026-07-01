import { describe, it, expect } from 'vitest'
import { playSound, unlockAudio } from './sound'
import { useSettingsStore } from '../store/settingsStore'

describe('sound layer', () => {
  it('sound defaults OFF (opt-in)', () => {
    expect(useSettingsStore.getState().sound).toBe(false)
  })

  it('playSound is a safe no-op with no console noise (jsdom has no AudioContext)', () => {
    useSettingsStore.setState({ sound: false })
    expect(() => playSound('coin')).not.toThrow() // gated off → returns immediately
    useSettingsStore.setState({ sound: true })
    expect(() => playSound('buy')).not.toThrow() // on, but no AudioContext → still no-ops
    expect(() => unlockAudio()).not.toThrow()
    useSettingsStore.setState({ sound: false })
  })

  it('toggleSound flips + persists the preference', () => {
    const before = useSettingsStore.getState().sound
    useSettingsStore.getState().toggleSound()
    expect(useSettingsStore.getState().sound).toBe(!before)
    useSettingsStore.getState().toggleSound() // restore
    expect(useSettingsStore.getState().sound).toBe(before)
  })
})
