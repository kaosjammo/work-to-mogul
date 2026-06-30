import { describe, it, expect } from 'vitest'
import { format, money, formatRate, formatDuration, formatEta, sanitize } from './num'

describe('format', () => {
  it('shows small numbers as integers or one-decimal fractions', () => {
    expect(format(0)).toBe('0')
    expect(format(7)).toBe('7')
    expect(format(999)).toBe('999')
    expect(format(100)).toBe('100')
    expect(format(5.5)).toBe('5.5')
    expect(format(99.5)).toBe('99.5')
  })

  it('uses named short-scale suffixes', () => {
    expect(format(1234)).toBe('1.23K')
    expect(format(12345)).toBe('12.3K')
    expect(format(123456)).toBe('123K')
    expect(format(1e6)).toBe('1.00M')
    expect(format(4.56e9)).toBe('4.56B')
    expect(format(1e12)).toBe('1.00T')
    expect(format(1.5e15)).toBe('1.50Qa')
    expect(format(1e18)).toBe('1.00Qi')
    expect(format(1e21)).toBe('1.00Sx')
    expect(format(1e33)).toBe('1.00Dc')
  })

  it('falls back to letter-pair notation past the named suffixes', () => {
    expect(format(1e36)).toBe('1.00aa') // first tier past Dc
    expect(format(1e39)).toBe('1.00ab')
  })

  it('handles negatives and invalid values safely', () => {
    expect(format(-1234)).toBe('-1.23K')
    expect(format(NaN)).toBe('0')
    expect(format(Infinity)).toBe('0')
    expect(sanitize(NaN)).toBe(0)
    expect(sanitize(Infinity, 5)).toBe(5)
    expect(sanitize(42)).toBe(42)
  })

  it('money and rate wrappers add the $ and /s', () => {
    expect(money(1e6)).toBe('$1.00M')
    expect(formatRate(1500)).toBe('$1.50K/s')
  })
})

describe('formatDuration', () => {
  it('formats sub-minute and minute+ durations', () => {
    expect(formatDuration(2.4)).toBe('2.4s')
    expect(formatDuration(59.9)).toBe('59.9s')
    expect(formatDuration(65)).toBe('1m 05s')
    expect(formatDuration(125)).toBe('2m 05s')
  })
})

describe('formatEta', () => {
  it('rounds to a single coarse unit so a ticking countdown does not flicker', () => {
    expect(formatEta(0)).toBe('now')
    expect(formatEta(-3)).toBe('now') // already affordable
    expect(formatEta(0.5)).toBe('1s') // rounds the final sub-second up
    expect(formatEta(8.2)).toBe('9s') // ceil within the final minute
    expect(formatEta(90)).toBe('2m') // rounds to nearest minute
    expect(formatEta(3600)).toBe('1.0h')
    expect(formatEta(9000)).toBe('2.5h')
    expect(formatEta(40000)).toBe('10h+') // far-off goals cap politely
  })

  it('treats non-finite input as immediate', () => {
    expect(formatEta(Infinity)).toBe('now')
    expect(formatEta(NaN)).toBe('now')
  })
})
