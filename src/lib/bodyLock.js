/**
 * Locks page scrolling behind overlays (video modal, mobile menu).
 * Uses the fixed body technique so iOS Safari respects it, keeps the
 * scroll position, and compensates for the scrollbar width on desktop.
 * Reference counted so nested overlays do not fight each other.
 */

const LOCK_PROPS = ['position', 'top', 'left', 'right', 'width', 'overflow', 'paddingRight']

let count = 0
let saved = null

export function lockBody() {
  if (typeof document === 'undefined') return
  count += 1
  if (count > 1) return

  const html = document.documentElement
  const body = document.body
  const scrollY = window.scrollY || window.pageYOffset || 0

  // Remember only the properties this module touches, so anything else that
  // writes to body.style while an overlay is open survives the unlock.
  const previous = {}
  for (const prop of LOCK_PROPS) previous[prop] = body.style[prop]
  saved = { scrollY, previous }

  // Measure the gutter AFTER hiding the overflow, not before. base.css sets
  // scrollbar-gutter: stable, so in most browsers the space is still reserved
  // and no compensation is needed; compensating anyway used to shift the whole
  // page sideways on every overlay open.
  const widthBefore = html.clientWidth
  html.classList.add('is-locked')
  const scrollbar = html.clientWidth - widthBefore

  body.style.position = 'fixed'
  body.style.top = `-${scrollY}px`
  body.style.left = '0'
  body.style.right = '0'
  body.style.width = '100%'
  body.style.overflow = 'hidden'
  if (scrollbar > 0) {
    body.style.paddingRight = `${scrollbar}px`
    html.style.setProperty('--sbw', `${scrollbar}px`)
  }
}

export function unlockBody() {
  if (typeof document === 'undefined') return
  if (count === 0) return
  count -= 1
  if (count > 0) return

  const html = document.documentElement
  const body = document.body
  const { scrollY, previous } = saved || { scrollY: 0, previous: {} }

  for (const prop of LOCK_PROPS) body.style[prop] = previous[prop] || ''
  if (!body.getAttribute('style')) body.removeAttribute('style')
  html.classList.remove('is-locked')
  html.style.removeProperty('--sbw')

  if (scrollY !== null) {
    const prev = html.style.scrollBehavior
    html.style.scrollBehavior = 'auto'
    window.scrollTo(0, scrollY)
    html.style.scrollBehavior = prev
  }
  saved = null
}

/**
 * Drops the remembered scroll position while an overlay is still open.
 *
 * A route change closes the overlay, but the unlock happens a commit later
 * than the router's scroll reset. Without this the overlay would scroll the
 * brand new page back to the old page's offset.
 */
export function cancelLockScroll() {
  if (saved) saved.scrollY = null
}

export function isBodyLocked() {
  return count > 0
}
