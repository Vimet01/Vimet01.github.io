import { useEffect, useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { cancelLockScroll, isBodyLocked } from '../../lib/bodyLock'
import { prefersReducedMotion } from '../../lib/motion'

/** Breathing room between the fixed header and the element it scrolls to. */
const HEADER_GAP = 16
const HASH_RETRY_MS = 50
const HASH_TIMEOUT_MS = 4000

/**
 * Resets scroll on route change and honours hash links such as /work#gallery.
 *
 * The reset runs in a layout effect so the new page is never painted at the
 * old page's offset. If an overlay is still unwinding its scroll lock, its
 * remembered position is dropped first so it cannot scroll the new page.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useLayoutEffect(() => {
    if (hash) return
    if (isBodyLocked()) cancelLockScroll()
    const html = document.documentElement
    const previous = html.style.scrollBehavior
    html.style.scrollBehavior = 'auto'
    window.scrollTo(0, 0)
    html.style.scrollBehavior = previous
  }, [pathname, hash])

  useEffect(() => {
    if (!hash) return undefined
    const id = hash.slice(1)
    const smooth = !prefersReducedMotion()

    const tryScroll = () => {
      const target = document.getElementById(id)
      if (!target) return false
      // Measured, not assumed: the bar is 76px, 64px or 56px depending on the
      // viewport, plus the safe area inset on a notched phone.
      const header = document.querySelector('.header')
      const offset = (header ? header.getBoundingClientRect().height : 76) + HEADER_GAP
      const top = target.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' })
      return true
    }

    if (tryScroll()) return undefined

    // The target may live in a lazily loaded route, so keep looking briefly.
    let waited = 0
    const timer = window.setInterval(() => {
      waited += HASH_RETRY_MS
      if (tryScroll() || waited >= HASH_TIMEOUT_MS) window.clearInterval(timer)
    }, HASH_RETRY_MS)
    return () => window.clearInterval(timer)
  }, [pathname, hash])

  return null
}
