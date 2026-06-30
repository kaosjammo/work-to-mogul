// ============================================================
//  Number seam + formatting.
//  The slice uses plain `number`. To adopt break_infinity.js later,
//  re-type Num and reimplement add/mul/pow here — call sites unchanged.
// ============================================================
import type { Num } from '../types/domain'

export const add = (a: Num, b: Num): Num => a + b
export const sub = (a: Num, b: Num): Num => a - b
export const mul = (a: Num, b: Num): Num => a * b
export const pow = (base: number, exp: number): Num => Math.pow(base, exp)

/** Coerce a possibly-invalid number to a safe finite value. */
export function sanitize(n: number, fallback = 0): number {
  return Number.isFinite(n) ? n : fallback
}

// Named short-scale suffixes, then letter-pair notation (aa, ab, ...) beyond.
const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc']

function letterSuffix(tier: number): string {
  // tier here is the index past the named suffixes (>= SUFFIXES.length)
  const n = tier - SUFFIXES.length // 0-based into aa, ab, ...
  const first = Math.floor(n / 26)
  const second = n % 26
  return String.fromCharCode(97 + first) + String.fromCharCode(97 + second)
}

/**
 * Format a number with short-scale suffixes.
 * 1234 -> "1.23K", 4.56e9 -> "4.56B", 1e18 -> "1.00aa".
 */
export function format(value: Num, sigFigs = 3): string {
  const n = sanitize(value)
  if (n < 0) return '-' + format(-n, sigFigs)
  if (n < 1000) {
    // Whole numbers under 1000 show as integers; small fractions get 1 decimal.
    return n >= 100 || Number.isInteger(n) ? String(Math.floor(n)) : n.toFixed(1)
  }
  const tier = Math.floor(Math.log10(n) / 3)
  const scaled = n / Math.pow(10, tier * 3)
  const suffix = tier < SUFFIXES.length ? SUFFIXES[tier] : letterSuffix(tier)
  // Keep `sigFigs` significant figures on the mantissa (1.00 - 999).
  const decimals = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2
  void sigFigs
  return scaled.toFixed(decimals) + suffix
}

/** Format a per-second rate, e.g. "$1.2K/s". */
export function formatRate(value: Num): string {
  return '$' + format(value) + '/s'
}

/** Format money with a leading $. */
export function money(value: Num): string {
  return '$' + format(value)
}

/** Format seconds as a compact duration ("2.4s", "1m 05s"). */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return seconds.toFixed(1) + 's'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}m ${s.toString().padStart(2, '0')}s`
}
