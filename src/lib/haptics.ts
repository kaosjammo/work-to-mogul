// Tiny haptic feedback helper. A short vibration on supported devices (mobile),
// a safe no-op everywhere else. Keeps the satisfying-tap feel without coupling
// the engine to the DOM.
export function haptic(ms = 12): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(ms)
    }
  } catch {
    // ignore — unsupported, blocked, or denied
  }
}
