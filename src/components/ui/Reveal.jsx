import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../../lib/motion'

const SHOWN = 'is-in'

/** How far into the viewport an element must come before it fades in. */
const MARGIN = 0.06

/**
 * Reveal on scroll.
 *
 * An IntersectionObserver does the work, but it batches entries and only
 * reports an element's final state. A fast flick scroll can therefore carry a
 * section past the viewport before the callback runs, leaving it stuck at zero
 * opacity forever. A rAF throttled scroll sweep backs the observer up, so
 * nothing can stay hidden. Both stop listening once every element is shown.
 */
const pending = new Set()
let observer = null
let listening = false
let frame = 0

function show(el) {
  el.classList.add(SHOWN)
  pending.delete(el)
  if (observer) observer.unobserve(el)
  if (!pending.size) stopListening()
}

function sweep() {
  frame = 0
  if (!pending.size) return
  const limit = window.innerHeight * (1 - MARGIN)
  for (const el of Array.from(pending)) {
    const rect = el.getBoundingClientRect()
    if (rect.top < limit && rect.bottom > 0) show(el)
  }
}

function queueSweep() {
  if (!frame) frame = window.requestAnimationFrame(sweep)
}

function startListening() {
  if (listening) return
  listening = true
  window.addEventListener('scroll', queueSweep, { passive: true })
  window.addEventListener('resize', queueSweep)
  window.addEventListener('orientationchange', queueSweep)
}

function stopListening() {
  if (!listening) return
  listening = false
  window.removeEventListener('scroll', queueSweep)
  window.removeEventListener('resize', queueSweep)
  window.removeEventListener('orientationchange', queueSweep)
  if (frame) {
    window.cancelAnimationFrame(frame)
    frame = 0
  }
}

function getObserver() {
  if (observer) return observer
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) show(entry.target)
      }
    },
    // threshold 0 so a section taller than the screen still counts as visible
    { rootMargin: `0px 0px -${MARGIN * 100}% 0px`, threshold: 0 },
  )
  return observer
}

function register(el) {
  if (el.classList.contains(SHOWN)) return
  pending.add(el)
  getObserver().observe(el)
  startListening()
  queueSweep()
}

function unregister(el) {
  pending.delete(el)
  if (observer) observer.unobserve(el)
  if (!pending.size) stopListening()
}

/**
 * Wraps content and fades it in the first time it scrolls into view.
 * `delay` is in seconds and staggers siblings. `variant` picks the motion.
 */
export default function Reveal({
  as: Tag = 'div',
  delay = 0,
  variant = '',
  className = '',
  children,
  style,
  ...rest
}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      el.classList.add(SHOWN)
      return undefined
    }
    register(el)
    return () => unregister(el)
  }, [])

  const classes = ['reveal', variant ? `reveal--${variant}` : '', className].filter(Boolean).join(' ')

  return (
    <Tag ref={ref} className={classes} style={{ '--d': `${delay}s`, ...style }} {...rest}>
      {children}
    </Tag>
  )
}
