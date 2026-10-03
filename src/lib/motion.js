/**
 * Motion helpers for code that runs outside React state, where the reactive
 * useMediaQuery hook is not available.
 */
export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
