/**
 * Colour theme store.
 *
 * public/theme.js has already stamped data-theme on <html> before the first
 * paint. This module owns the theme from there on: it remembers an explicit
 * choice in localStorage, keeps the browser chrome colour in step, and follows
 * the operating system until the visitor picks a side.
 *
 * It is a tiny external store rather than React context so the toggle can live
 * anywhere without threading a provider through the tree, and so changing the
 * theme re-renders only the components that actually read it.
 */

import { prefersReducedMotion } from './motion'

const KEY = 'vimet-theme'
const SYSTEM_LIGHT = '(prefers-color-scheme: light)'

// Mirrors the two --bg values in src/styles/tokens.css and public/theme.js.
// The theme-color meta tag cannot read a custom property, so it needs literals.
const CHROME = { dark: '#0a0a0a', light: '#fbf9f5' }

// How long the cross fade between palettes runs. Matches --theme-swap in tokens.css.
const SWAP_MS = 260

const listeners = new Set()

function readStored() {
  try {
    const value = window.localStorage.getItem(KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

function systemTheme() {
  return window.matchMedia && window.matchMedia(SYSTEM_LIGHT).matches ? 'light' : 'dark'
}

function readApplied() {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
}

let explicit = typeof window === 'undefined' ? null : readStored()
let current = readApplied()
let swapTimer = 0

function apply(next, animate) {
  if (next === current) return
  current = next

  const html = document.documentElement

  // A short lived class lets base.css cross fade the palette instead of
  // snapping. Skipped on the very first paint and for reduced motion.
  if (animate && !prefersReducedMotion()) {
    html.classList.add('is-theme-swapping')
    window.clearTimeout(swapTimer)
    swapTimer = window.setTimeout(() => html.classList.remove('is-theme-swapping'), SWAP_MS)
  }

  html.setAttribute('data-theme', next)

  const meta = document.head.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', CHROME[next])

  for (const fn of listeners) fn()
}

export function getTheme() {
  return current
}

/** True once the visitor has chosen a theme, rather than inheriting the system one. */
export function hasExplicitTheme() {
  return explicit !== null
}

export function setTheme(next) {
  explicit = next === 'light' || next === 'dark' ? next : null
  try {
    if (explicit) window.localStorage.setItem(KEY, explicit)
    else window.localStorage.removeItem(KEY)
  } catch {
    /* the choice simply will not survive a reload */
  }
  apply(explicit || systemTheme(), true)
}

export function toggleTheme() {
  setTheme(current === 'light' ? 'dark' : 'light')
}

export function subscribeTheme(onChange) {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

// Follow the operating system for as long as no explicit choice has been made.
if (typeof window !== 'undefined' && window.matchMedia) {
  const mql = window.matchMedia(SYSTEM_LIGHT)
  const onSystemChange = () => {
    if (!explicit) apply(systemTheme(), true)
  }
  if (mql.addEventListener) mql.addEventListener('change', onSystemChange)
  else if (mql.addListener) mql.addListener(onSystemChange)
}
