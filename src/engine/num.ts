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
 * 1234 -> "1.23K", 4.56e9 -> "4.56B", 1e18 -> "1.00Qi", 1e36 -> "1.00aa".
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

// Full magnitude names, parallel to SUFFIXES, then the short-scale continuation for the
// letter-pair (aa, ab, …) tiers. Used by the long-form display (full name + short in brackets).
const FULL_NAMES = [
  '', 'Thousand', 'Million', 'Billion', 'Trillion', 'Quadrillion', 'Quintillion',
  'Sextillion', 'Septillion', 'Octillion', 'Nonillion', 'Decillion',
]
const LETTER_FULL_NAMES = [
  'Undecillion', 'Duodecillion', 'Tredecillion', 'Quattuordecillion', 'Quindecillion',
  'Sexdecillion', 'Septendecillion', 'Octodecillion', 'Novemdecillion', 'Vigintillion',
]

function fullName(tier: number): string {
  if (tier < FULL_NAMES.length) return FULL_NAMES[tier]
  return LETTER_FULL_NAMES[tier - FULL_NAMES.length] ?? '' // '' past Vigintillion → short only
}

/**
 * Long-form: the full magnitude name with the short suffix in brackets, e.g.
 * 5.2e18 -> "5.20 Quintillion (Qi)", 1e6 -> "1.00 Million (M)". Numbers under 1000
 * (no magnitude) and tiers beyond a named suffix fall back to the compact form.
 */
export function formatLong(value: Num): string {
  const n = sanitize(value)
  if (n < 0) return '-' + formatLong(-n)
  if (n < 1000) return format(n)
  const tier = Math.floor(Math.log10(n) / 3)
  const scaled = n / Math.pow(10, tier * 3)
  const short = tier < SUFFIXES.length ? SUFFIXES[tier] : letterSuffix(tier)
  const decimals = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2
  const mantissa = scaled.toFixed(decimals)
  const name = fullName(tier)
  return name ? `${mantissa} ${name} (${short})` : `${mantissa}${short}`
}

/** Long-form money ("$5.20 Quintillion (Qi)"). */
export function moneyLong(value: Num): string {
  return '$' + formatLong(value)
}

/** Long-form per-second rate ("$1.24 Trillion (T)/s"). */
export function formatRateLong(value: Num): string {
  return '$' + formatLong(value) + '/s'
}

/** Format seconds as a compact duration ("2.4s", "1m 05s", "2h 05m"). */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return seconds.toFixed(1) + 's'
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}m ${s.toString().padStart(2, '0')}s`
  }
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m.toString().padStart(2, '0')}m`
}

/**
 * Coarse "time remaining" label for a live-updating estimate (e.g. time-to-afford),
 * which is recomputed several times a second. Rounds to a single coarse unit so the
 * digits don't flicker as it ticks down, and caps far-off goals at a friendly "10h+".
 */
export function formatEta(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return 'now'
  if (seconds < 60) return `${Math.ceil(seconds)}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  if (seconds < 36000) return `${(seconds / 3600).toFixed(1)}h`
  return '10h+'
}
