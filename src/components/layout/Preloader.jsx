import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../../lib/motion'
import './Preloader.css'

const KEY = 'vimet-intro-seen'
const WORDMARK = '/media/images/vimet-wordmark.png'
const HOLD_MS = 700
const LEAVE_MS = 560

function alreadySeen() {
  try {
    return window.sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

function markSeen() {
  try {
    window.sessionStorage.setItem(KEY, '1')
  } catch {
    /* storage unavailable, fine */
  }
}

/**
 * Short branded intro, once per session, skipped for reduced motion.
 *
 * It is deliberately brief and it does not hold back the hero underneath, so
 * the largest image still paints on time. The session is marked as soon as the
 * intro starts, so leaving early does not make it replay.
 */
export default function Preloader() {
  const shouldPlay = useRef(null)
  if (shouldPlay.current === null) {
    shouldPlay.current = !prefersReducedMotion() && !alreadySeen()
    if (shouldPlay.current) markSeen()
  }

  const [phase, setPhase] = useState(shouldPlay.current ? 'active' : 'done')

  useEffect(() => {
    if (!shouldPlay.current) return undefined
    const leave = window.setTimeout(() => setPhase('leaving'), HOLD_MS)
    const done = window.setTimeout(() => setPhase('done'), HOLD_MS + LEAVE_MS)
    return () => {
      window.clearTimeout(leave)
      window.clearTimeout(done)
    }
  }, [])

  if (phase === 'done') return null

  return (
    <div className={`preloader ${phase === 'leaving' ? 'is-leaving' : ''}`} inert={true} aria-hidden="true">
      <div className="preloader__mark">
        <img src={WORDMARK} alt="" width="904" height="410" decoding="sync" />
        <span className="preloader__line" />
      </div>
    </div>
  )
}
