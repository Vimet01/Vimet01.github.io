import { useEffect, useRef } from 'react'
import useMediaQuery from '../../hooks/useMediaQuery'
import './Cursor.css'

/**
 * Custom cursor for mouse users only. A small dot follows the pointer
 * exactly and a ring eases behind it. Elements with data-cursor="Play"
 * expand the ring into a label. Touch devices never render this.
 */
export default function Cursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)
  const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)')
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const enabled = finePointer && !reducedMotion

  useEffect(() => {
    if (!enabled) return undefined
    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return undefined

    const html = document.documentElement
    html.classList.add('has-cursor')

    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    let rx = x
    let ry = y
    let raf = 0
    let visible = false

    const show = () => {
      if (!visible) {
        visible = true
        dot.classList.add('is-visible')
        ring.classList.add('is-visible')
      }
    }
    const hide = () => {
      visible = false
      dot.classList.remove('is-visible')
      ring.classList.remove('is-visible')
    }

    // Idle when the ring has caught up, so a still pointer costs nothing
    const loop = () => {
      rx += (x - rx) * 0.16
      ry += (y - ry) * 0.16
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`
      if (Math.abs(x - rx) < 0.1 && Math.abs(y - ry) < 0.1) {
        raf = 0
        return
      }
      raf = window.requestAnimationFrame(loop)
    }
    const kick = () => {
      if (!raf) raf = window.requestAnimationFrame(loop)
    }

    const onMove = (e) => {
      x = e.clientX
      y = e.clientY
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`
      kick()
      show()
    }

    const onOver = (e) => {
      const target = e.target instanceof Element ? e.target : null
      if (!target) return
      const labelled = target.closest('[data-cursor]')
      const interactive = target.closest('a, button, [role="button"], input, select, textarea, label, summary')
      if (labelled) {
        const label = labelled.getAttribute('data-cursor') || ''
        ring.textContent = label
        ring.dataset.mode = 'label'
      } else {
        ring.textContent = ''
        ring.dataset.mode = interactive ? 'link' : ''
      }
    }

    const onDown = () => ring.classList.add('is-down')
    const onUp = () => ring.classList.remove('is-down')
    const onLeave = () => hide()
    const onEnter = () => show()

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerover', onOver, { passive: true })
    document.addEventListener('pointerdown', onDown, { passive: true })
    document.addEventListener('pointerup', onUp, { passive: true })
    document.documentElement.addEventListener('mouseleave', onLeave)
    document.documentElement.addEventListener('mouseenter', onEnter)
    kick()

    return () => {
      html.classList.remove('has-cursor')
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('pointerup', onUp)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      document.documentElement.removeEventListener('mouseenter', onEnter)
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  )
}
