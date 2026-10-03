/**
 * Picks the colour theme before the first paint, so a light-mode visitor never
 * sees a black flash and a dark-mode visitor never sees a white one.
 *
 * This lives in /public as its own file rather than inline in index.html
 * because the site ships a strict Content Security Policy (script-src 'self'),
 * which blocks inline scripts. It must stay render blocking: no defer, no
 * async, and no module type.
 *
 * The palette itself lives in src/styles/tokens.css. Only the two browser
 * chrome colours are repeated here, because the theme-color meta tag has to be
 * a literal value.
 */
;(function () {
  var KEY = 'vimet-theme'
  var CHROME = { dark: '#0a0a0a', light: '#fbf9f5' }

  var stored = null
  try {
    stored = window.localStorage.getItem(KEY)
  } catch (e) {
    /* private mode or storage disabled, fall through to the system preference */
  }

  var theme =
    stored === 'light' || stored === 'dark'
      ? stored
      : window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark'

  document.documentElement.setAttribute('data-theme', theme)

  var meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', CHROME[theme])
})()
