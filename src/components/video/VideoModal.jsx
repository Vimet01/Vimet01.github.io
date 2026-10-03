import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { formatDuration } from '../../data/projects'
import useMediaQuery from '../../hooks/useMediaQuery'
import './VideoModal.css'

const SKIP_SECONDS = 10
const HIDE_DELAY = 2600
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2]
const SIZES = [
  { id: 'compact', label: 'Compact', hint: 'Smaller window' },
  { id: 'standard', label: 'Standard', hint: 'Fits the screen' },
  { id: 'theater', label: 'Theater', hint: 'Fills the screen' },
]
const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Chrome heights used before the real ones have been measured. */
const DEFAULT_CHROME = { top: 60, meta: 34 }

/** The four safe area insets, published as custom properties in tokens.css. */
function safeInsets() {
  const cs = getComputedStyle(document.documentElement)
  const read = (name) => {
    const n = parseFloat(cs.getPropertyValue(name))
    return Number.isFinite(n) ? n : 0
  }
  return { top: read('--sat'), right: read('--sar'), bottom: read('--sab'), left: read('--sal') }
}

function viewport() {
  const vv = window.visualViewport
  // Ignore pinch zoom: while zoomed the visual viewport shrinks and would
  // otherwise squeeze the player down to nothing.
  const zoomed = vv && Math.abs(vv.scale - 1) > 0.01
  return {
    w: Math.round(vv && !zoomed ? vv.width : window.innerWidth),
    h: Math.round(vv && !zoomed ? vv.height : window.innerHeight),
  }
}

function pickSource(video) {
  const conn = navigator.connection
  const slow = Boolean(conn && (conn.saveData || /(^|\D)[23]g$/.test(conn.effectiveType || '')))
  const small = window.innerWidth < 900
  return { src: small || slow ? video.src720 : video.src1080, slow }
}

/**
 * Largest box of the given aspect ratio that fits the viewport once the title
 * row and the caption below have taken their share. `chrome` carries the real
 * measured heights, so this works on a landscape phone as well as a desktop.
 */
function fitBox(ar, mode, chrome) {
  const { w: vw, h: vh } = viewport()
  const tight = vw < 640 || vh < 520
  const margin = mode === 'theater' ? 0 : tight ? 12 : 32
  const reserve = mode === 'theater' ? 0 : chrome.top + chrome.meta + (tight ? 12 : 24)
  const scale = mode === 'compact' ? 0.72 : 1

  // Theater goes edge to edge on purpose; every other mode has to stay inside
  // the notch and the home indicator, which .vm reserves with padding.
  const ins = mode === 'theater' ? { top: 0, right: 0, bottom: 0, left: 0 } : safeInsets()

  const maxW = Math.max(160, (vw - ins.left - ins.right - margin * 2) * scale)
  const maxH = Math.max(140, (vh - ins.top - ins.bottom - reserve - margin * 2) * scale)

  let w = maxW
  let h = w / ar
  if (h > maxH) {
    h = maxH
    w = h * ar
  }
  return { w: Math.round(w), h: Math.round(h) }
}

/** Buckets the control bar by the real player width, so nothing ever overlaps. */
function widthClass(w) {
  if (w < 260) return 'vm--xs'
  if (w < 340) return 'vm--sm'
  // 44px buttons need more room than the old 38px ones, so medium density now
  // runs to 440px: below that the full bar wraps onto a second line.
  if (w < 440) return 'vm--md'
  // wide enough to absorb the 92px the volume slider adds when it expands
  if (w >= 520) return 'vm--lg'
  return ''
}

function fullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null
}

export default function VideoModal({ project, onClose }) {
  const { video, thumb } = project
  const ar = video.width / video.height

  const rootRef = useRef(null)
  const stageRef = useRef(null)
  const playerRef = useRef(null)
  const videoRef = useRef(null)
  const closeRef = useRef(null)
  const topRef = useRef(null)
  const metaRef = useRef(null)
  const menuRef = useRef(null)
  const menuButtonRef = useRef(null)
  const hideTimer = useRef(0)
  const overControls = useRef(false)
  const seekingRef = useRef(false)
  const swallowClick = useRef(false)
  const keyHandlerRef = useRef(null)

  const isTouch = useMediaQuery('(hover: none), (pointer: coarse)')
  const { src, slow } = useMemo(() => pickSource(video), [video])

  const [playing, setPlaying] = useState(false)
  const [ended, setEnded] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(video.duration || 0)
  const [buffered, setBuffered] = useState(0)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [loop, setLoop] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [size, setSize] = useState('standard')
  const [fullscreen, setFullscreen] = useState(false)
  const [nativeFullscreen, setNativeFullscreen] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [waiting, setWaiting] = useState(true)
  const [error, setError] = useState(false)
  const [autoplayMuted, setAutoplayMuted] = useState(false)
  const [chrome, setChrome] = useState(DEFAULT_CHROME)
  const [box, setBox] = useState(() => fitBox(ar, 'standard', DEFAULT_CHROME))

  /* ---------- controls visibility ---------- */

  const clearHide = () => {
    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current)
      hideTimer.current = 0
    }
  }

  const showControls = useCallback(() => {
    setControlsVisible(true)
    clearHide()
    const tick = () => {
      const v = videoRef.current
      const root = rootRef.current
      const focusInside = root && root.contains(document.activeElement) && document.activeElement !== root
      // Never pull the control bar out from under the pointer or the keyboard.
      if (overControls.current || focusInside) {
        hideTimer.current = window.setTimeout(tick, HIDE_DELAY)
        return
      }
      if (v && !v.paused && !v.ended) setControlsVisible(false)
    }
    hideTimer.current = window.setTimeout(tick, HIDE_DELAY)
  }, [])

  const hideControls = () => {
    clearHide()
    setControlsVisible(false)
  }

  useEffect(() => {
    if (menuOpen || !playing) {
      clearHide()
      setControlsVisible(true)
    } else {
      showControls()
    }
  }, [menuOpen, playing, showControls])

  /* ---------- mount / unmount ---------- */

  // The scroll lock, the inert page and the focus restore all live in
  // VideoModalProvider, so they are already in place while this chunk loads.
  useEffect(() => {
    const node = videoRef.current

    const focusTimer = window.setTimeout(() => closeRef.current && closeRef.current.focus(), 30)

    return () => {
      window.clearTimeout(focusTimer)
      clearHide()
      // Captured above: React detaches refs before passive cleanups run.
      if (node) {
        node.pause()
        node.removeAttribute('src')
        node.load()
      }
      if (fullscreenElement()) {
        const exit = document.exitFullscreen || document.webkitExitFullscreen
        if (exit) {
          try {
            const p = exit.call(document)
            if (p && typeof p.catch === 'function') p.catch(() => {})
          } catch {
            /* ignore */
          }
        }
      }
    }
  }, [])

  /* ---------- autoplay ---------- */

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.volume = 1
    const attempt = v.play()
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(() => {
        v.muted = true
        setMuted(true)
        const retryPlay = v.play()
        if (retryPlay && typeof retryPlay.then === 'function') {
          retryPlay.then(() => setAutoplayMuted(true)).catch(() => setWaiting(false))
        }
      })
    }
  }, [])

  /* ---------- sizing ---------- */

  // Measure the real chrome so the player never guesses wrong on any device.
  useLayoutEffect(() => {
    if (typeof ResizeObserver === 'undefined') return undefined
    const measure = () => {
      // Read the real margin rather than assuming 12px: the phone and
      // landscape media queries both shrink it.
      const topEl = topRef.current
      const top = topEl
        ? topEl.offsetHeight + (parseFloat(getComputedStyle(topEl).marginBottom) || 0)
        : DEFAULT_CHROME.top
      // The caption is display:none on a landscape phone, so reserve nothing.
      const metaH = metaRef.current ? metaRef.current.offsetHeight : 0
      const meta = metaH > 0 ? metaH + 14 : 0
      setChrome((prev) => (Math.abs(prev.top - top) > 1 || Math.abs(prev.meta - meta) > 1 ? { top, meta } : prev))
    }
    const ro = new ResizeObserver(measure)
    if (topRef.current) ro.observe(topRef.current)
    if (metaRef.current) ro.observe(metaRef.current)
    measure()
    return () => ro.disconnect()
  }, [size, fullscreen])

  useLayoutEffect(() => {
    const update = () => setBox(fitBox(ar, size, chrome))
    update()
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    const vv = window.visualViewport
    if (vv) vv.addEventListener('resize', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
      if (vv) vv.removeEventListener('resize', update)
    }
  }, [ar, size, chrome])

  /* ---------- fullscreen ---------- */

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(fullscreenElement()))
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    // iPhone puts the video element itself into the native player and fires
    // these instead. It is tracked separately: the native player draws its own
    // chrome, so the button label has to follow it but the CSS layout must not
    // (our own box would collapse to nothing behind it).
    const v = videoRef.current
    const on = () => setNativeFullscreen(true)
    const off = () => setNativeFullscreen(false)
    if (v) {
      v.addEventListener('webkitbeginfullscreen', on)
      v.addEventListener('webkitendfullscreen', off)
    }
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
      if (v) {
        v.removeEventListener('webkitbeginfullscreen', on)
        v.removeEventListener('webkitendfullscreen', off)
      }
    }
  }, [])

  const toggleFullscreen = useCallback(() => {
    // The whole stage goes fullscreen, not just the picture, so the close
    // button and the title stay on screen.
    const el = stageRef.current
    const v = videoRef.current
    if (!el || !v) return
    try {
      if (fullscreenElement()) {
        const exit = document.exitFullscreen || document.webkitExitFullscreen
        const p = exit && exit.call(document)
        if (p && typeof p.catch === 'function') p.catch(() => {})
      } else if (v.webkitDisplayingFullscreen) {
        if (v.webkitExitFullscreen) v.webkitExitFullscreen()
      } else if (el.requestFullscreen) {
        const p = el.requestFullscreen()
        if (p && typeof p.catch === 'function') p.catch(() => {})
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen()
      } else if (v.webkitEnterFullscreen) {
        v.webkitEnterFullscreen()
      }
    } catch {
      /* fullscreen not available */
    }
  }, [])

  const isFullscreen = fullscreen || nativeFullscreen

  /* ---------- playback helpers ---------- */

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused || v.ended) {
      if (v.ended) v.currentTime = 0
      const p = v.play()
      if (p && typeof p.catch === 'function') p.catch(() => {})
    } else {
      v.pause()
    }
  }, [])

  const skip = useCallback(
    (delta) => {
      const v = videoRef.current
      if (!v) return
      const total = Number.isFinite(v.duration) ? v.duration : duration
      const next = Math.min(Math.max(0, v.currentTime + delta), total || 0)
      v.currentTime = next
      setCurrent(next)
      showControls()
    },
    [duration, showControls],
  )

  const toggleMute = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    const next = !v.muted
    v.muted = next
    setMuted(next)
    if (!next && v.volume === 0) {
      v.volume = 0.6
      setVolume(0.6)
    }
    setAutoplayMuted(false)
  }, [])

  const onVolume = (e) => {
    const v = videoRef.current
    const value = Number(e.target.value)
    if (!v) return
    v.volume = value
    v.muted = value === 0
    setVolume(value)
    setMuted(value === 0)
  }

  const toggleLoop = useCallback(() => {
    const v = videoRef.current
    setLoop((prev) => {
      const next = !prev
      if (v) v.loop = next
      return next
    })
    showControls()
  }, [showControls])

  const changeSpeed = (s) => {
    const v = videoRef.current
    if (v) v.playbackRate = s
    setSpeed(s)
    setMenuOpen(false)
  }

  const changeSize = (id) => {
    setSize(id)
    setMenuOpen(false)
    if (fullscreenElement()) toggleFullscreen()
  }

  const onSeek = (e) => {
    const v = videoRef.current
    const t = Number(e.target.value)
    setCurrent(t)
    if (v) v.currentTime = t
    showControls()
  }

  const retry = () => {
    const v = videoRef.current
    if (!v) return
    setError(false)
    setWaiting(true)
    v.load()
    // load() resets these to their defaults, so put the user's choices back.
    v.playbackRate = speed
    v.loop = loop
    v.muted = muted
    v.volume = volume
    const p = v.play()
    if (p && typeof p.catch === 'function') p.catch(() => {})
  }

  const unmute = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = false
    setMuted(false)
    setAutoplayMuted(false)
  }

  /* ---------- surface interaction ---------- */

  const onSurfaceClick = () => {
    // A tap that dismissed the settings menu must not also toggle playback.
    if (swallowClick.current) {
      swallowClick.current = false
      return
    }
    if (isTouch) {
      if (!controlsVisible) {
        showControls()
      } else if (playing) {
        hideControls()
      } else {
        togglePlay()
      }
      return
    }
    togglePlay()
  }

  const onSurfaceDoubleClick = () => {
    if (!isTouch) toggleFullscreen()
  }

  const onBackdropMouseDown = (e) => {
    if (e.target === rootRef.current) onClose()
  }

  /* ---------- keyboard ---------- */

  const onKey = (e) => {
    const target = e.target
    const tag = target && target.tagName
    const isRange = tag === 'INPUT' && target.type === 'range'
    const isInteractive = tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'A'

    if (e.key === 'Escape') {
      e.preventDefault()
      if (menuOpen) setMenuOpen(false)
      else if (fullscreenElement()) toggleFullscreen()
      else onClose()
      return
    }

    if (e.key === 'Tab') {
      const root = rootRef.current
      if (!root) return
      const items = Array.from(root.querySelectorAll(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null && el.getClientRects().length > 0,
      )
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
      return
    }

    if (isRange && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      showControls()
      return
    }

    switch (e.key) {
      case ' ':
        if (isInteractive) return
        e.preventDefault()
        togglePlay()
        break
      case 'k':
      case 'K':
        togglePlay()
        break
      case 'ArrowLeft':
      case 'j':
      case 'J':
        e.preventDefault()
        skip(-SKIP_SECONDS)
        break
      case 'ArrowRight':
      case 'l':
      case 'L':
        e.preventDefault()
        skip(SKIP_SECONDS)
        break
      case 'ArrowUp':
      case 'ArrowDown': {
        e.preventDefault()
        const v = videoRef.current
        if (!v) return
        const next = Math.min(1, Math.max(0, v.volume + (e.key === 'ArrowUp' ? 0.1 : -0.1)))
        v.volume = next
        v.muted = next === 0
        setVolume(next)
        setMuted(next === 0)
        showControls()
        break
      }
      case 'm':
      case 'M':
        toggleMute()
        break
      case 'f':
      case 'F':
        toggleFullscreen()
        break
      case 'r':
      case 'R':
        toggleLoop()
        break
      default:
        break
    }
  }

  keyHandlerRef.current = onKey

  // Subscribe once. The handler is read from a ref so it is never stale and
  // the listener is not swapped four times a second during playback.
  useEffect(() => {
    const handler = (e) => keyHandlerRef.current && keyHandlerRef.current(e)
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  /* ---------- settings menu outside click ---------- */

  useEffect(() => {
    if (!menuOpen) return undefined
    const onDown = (e) => {
      const menu = menuRef.current
      const btn = menuButtonRef.current
      if (menu && menu.contains(e.target)) return
      if (btn && btn.contains(e.target)) return
      swallowClick.current = true
      setMenuOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [menuOpen])

  /* ---------- video events ---------- */

  const onLoadedMetadata = (e) => {
    const d = e.currentTarget.duration
    if (Number.isFinite(d) && d > 0) setDuration(d)
  }

  const onTimeUpdate = (e) => {
    if (!seekingRef.current) setCurrent(e.currentTarget.currentTime)
  }

  const onProgress = (e) => {
    const v = e.currentTarget
    try {
      if (v.buffered.length) setBuffered(v.buffered.end(v.buffered.length - 1))
    } catch {
      /* ignore */
    }
  }

  const pct = duration > 0 ? Math.min(100, (current / duration) * 100) : 0
  const bufPct = duration > 0 ? Math.min(100, (buffered / duration) * 100) : 0

  // Theater and full screen let CSS fill the available box. Measuring it in JS
  // and setting a pixel size risks disagreeing with the real container width by
  // the width of a scrollbar, which would push the picture off screen.
  const fills = fullscreen || size === 'theater'
  const playerStyle = fills ? undefined : { width: `${box.w}px`, height: `${box.h}px` }
  const stageStyle = fills ? undefined : { width: `${box.w}px` }

  const classes = [
    'vm',
    `vm--${size}`,
    widthClass(fills ? 9999 : box.w),
    !fills && box.h < 330 ? 'vm--short' : '',
    isTouch ? 'vm--touch' : 'vm--pointer',
    controlsVisible ? 'has-controls' : 'no-controls',
    fullscreen ? 'is-fullscreen' : '',
    playing ? 'is-playing' : 'is-paused',
    video.orientation === 'portrait' ? 'vm--portrait' : 'vm--landscape',
  ]
    .filter(Boolean)
    .join(' ')

  const playLabel = ended ? 'Replay' : playing ? 'Pause' : 'Play'
  const playIcon = ended ? 'bi-arrow-counterclockwise' : playing ? 'bi-pause-fill' : 'bi-play-fill'
  const volumeIcon =
    muted || volume === 0 ? 'bi-volume-mute-fill' : volume < 0.5 ? 'bi-volume-down-fill' : 'bi-volume-up-fill'
  const titleId = `vm-title-${project.id}`

  return createPortal(
    <div
      ref={rootRef}
      className={classes}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={onBackdropMouseDown}
    >
      <div ref={stageRef} className="vm__stage" style={stageStyle}>
        <div ref={topRef} className="vm__top">
          <button ref={closeRef} type="button" className="vm__close" onClick={onClose} aria-label="Close video">
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
          <div className="vm__head">
            <span className="vm__cat">{project.categoryLabel}</span>
            <h2 className="vm__title" id={titleId}>
              {project.title}
            </h2>
          </div>
        </div>

        <div
          ref={playerRef}
          className="vm__player"
          style={playerStyle}
          onPointerMove={isTouch ? undefined : showControls}
          onMouseLeave={
            isTouch
              ? undefined
              : () => {
                  overControls.current = false
                  if (playing && !menuOpen) hideControls()
                }
          }
        >
          {/* Click surface sits behind the controls so control clicks never toggle playback */}
          <div className="vm__surface" onClick={onSurfaceClick} onDoubleClick={onSurfaceDoubleClick}>
            <video
              ref={videoRef}
              className="vm__video"
              src={src}
              poster={thumb.small || thumb.jpg}
              preload={slow ? 'metadata' : 'auto'}
              playsInline
              webkit-playsinline="true"
              x-webkit-airplay="allow"
              controlsList="nodownload"
              aria-label={`${project.title} video`}
              onLoadedMetadata={onLoadedMetadata}
              onTimeUpdate={onTimeUpdate}
              onProgress={onProgress}
              onPlay={() => {
                setPlaying(true)
                setEnded(false)
              }}
              onPause={() => setPlaying(false)}
              onWaiting={() => setWaiting(true)}
              onPlaying={() => setWaiting(false)}
              onCanPlay={() => setWaiting(false)}
              onSeeking={() => {
                seekingRef.current = true
              }}
              onSeeked={() => {
                seekingRef.current = false
              }}
              onEnded={() => {
                setEnded(true)
                setPlaying(false)
                setControlsVisible(true)
              }}
              onError={() => {
                setError(true)
                setWaiting(false)
                // the gear that opened it is about to unmount with the control bar
                setMenuOpen(false)
              }}
              onVolumeChange={(e) => {
                setMuted(e.currentTarget.muted)
                setVolume(e.currentTarget.volume)
              }}
            />
          </div>

          {waiting && !error ? (
            <div className="vm__spinner" role="status" aria-label="Loading video">
              <span />
            </div>
          ) : null}

          {error ? (
            <div className="vm__error" role="alert">
              <i className="bi bi-exclamation-triangle" aria-hidden="true" />
              <p>This video could not be loaded. Check your connection and try again.</p>
              <button type="button" className="btn btn--light btn--sm" onClick={retry}>
                Try again
              </button>
            </div>
          ) : null}

          {autoplayMuted && !error ? (
            <button type="button" className="vm__unmute" onClick={unmute}>
              <i className="bi bi-volume-mute-fill" aria-hidden="true" />
              Tap to unmute
            </button>
          ) : null}

          {!error ? (
            <button
              type="button"
              className={`vm__big ${(playing && !ended && !isTouch) || waiting ? 'is-hidden' : ''}`}
              onClick={togglePlay}
              aria-label={playLabel}
              tabIndex={-1}
            >
              <i className={`bi ${playIcon}`} aria-hidden="true" />
            </button>
          ) : null}

          {!error ? (
            <div
              className="vm__controls"
              onPointerMove={showControls}
              onPointerEnter={() => {
                overControls.current = true
              }}
              onPointerLeave={() => {
                overControls.current = false
              }}
              onFocus={() => {
                overControls.current = true
                showControls()
              }}
              onBlur={() => {
                overControls.current = false
              }}
            >
              <div className="vm__progress" style={{ '--p': `${pct}%`, '--b': `${bufPct}%` }}>
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  step="0.05"
                  value={Math.min(current, duration || 0)}
                  onChange={onSeek}
                  onPointerDown={() => {
                    seekingRef.current = true
                  }}
                  onPointerUp={() => {
                    seekingRef.current = false
                  }}
                  aria-label="Seek"
                  aria-valuetext={`${formatDuration(current)} of ${formatDuration(duration)}`}
                />
              </div>

              <div className="vm__row">
                <div className="vm__group">
                  <button type="button" className="vm__btn" onClick={togglePlay} aria-label={playLabel}>
                    <i className={`bi ${playIcon}`} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="vm__btn vm__btn--skip"
                    onClick={() => skip(-SKIP_SECONDS)}
                    aria-label={`Back ${SKIP_SECONDS} seconds`}
                  >
                    <i className="bi bi-arrow-counterclockwise" aria-hidden="true" />
                    <span>{SKIP_SECONDS}</span>
                  </button>
                  <button
                    type="button"
                    className="vm__btn vm__btn--skip"
                    onClick={() => skip(SKIP_SECONDS)}
                    aria-label={`Forward ${SKIP_SECONDS} seconds`}
                  >
                    <i className="bi bi-arrow-clockwise" aria-hidden="true" />
                    <span>{SKIP_SECONDS}</span>
                  </button>

                  <div className="vm__volume">
                    <button
                      type="button"
                      className="vm__btn"
                      onClick={toggleMute}
                      aria-label={muted ? 'Unmute' : 'Mute'}
                    >
                      <i className={`bi ${volumeIcon}`} aria-hidden="true" />
                    </button>
                    <input
                      type="range"
                      className="vm__volume-slider"
                      min="0"
                      max="1"
                      step="0.02"
                      value={muted ? 0 : volume}
                      onChange={onVolume}
                      aria-label="Volume"
                      style={{ '--v': `${(muted ? 0 : volume) * 100}%` }}
                    />
                  </div>

                  <span className="vm__time">
                    <span>{formatDuration(current)}</span>
                    <span className="vm__time-sep">/</span>
                    <span className="vm__time-total">{formatDuration(duration)}</span>
                  </span>
                </div>

                <div className="vm__group">
                  {speed !== 1 ? <span className="vm__speed-tag">{speed}x</span> : null}
                  <button
                    type="button"
                    className={`vm__btn vm__btn--loop ${loop ? 'is-on' : ''}`}
                    onClick={toggleLoop}
                    aria-pressed={loop}
                    aria-label={loop ? 'Turn loop off' : 'Loop this video'}
                  >
                    <i className="bi bi-repeat" aria-hidden="true" />
                  </button>
                  <button
                    ref={menuButtonRef}
                    type="button"
                    className={`vm__btn ${menuOpen ? 'is-on' : ''}`}
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-haspopup="dialog"
                    aria-expanded={menuOpen}
                    aria-label="Screen size and playback options"
                  >
                    <i className="bi bi-gear" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="vm__btn vm__btn--fs"
                    onClick={toggleFullscreen}
                    aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'}
                  >
                    <i className={`bi ${isFullscreen ? 'bi-fullscreen-exit' : 'bi-fullscreen'}`} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {menuOpen && !error ? (
            <div ref={menuRef} className="vm__menu" role="group" aria-label="Playback options">
              <div className="vm__menu-group">
                <span className="vm__menu-label">Screen size</span>
                {SIZES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`vm__menu-item ${size === s.id && !isFullscreen ? 'is-on' : ''}`}
                    onClick={() => changeSize(s.id)}
                    aria-pressed={size === s.id && !isFullscreen}
                  >
                    <span>
                      {s.label}
                      <small>{s.hint}</small>
                    </span>
                    {size === s.id && !isFullscreen ? <i className="bi bi-check2" aria-hidden="true" /> : null}
                  </button>
                ))}
                <button
                  type="button"
                  className={`vm__menu-item ${isFullscreen ? 'is-on' : ''}`}
                  onClick={toggleFullscreen}
                  aria-pressed={isFullscreen}
                >
                  <span>
                    Full screen
                    <small>Uses the whole display</small>
                  </span>
                  {isFullscreen ? <i className="bi bi-check2" aria-hidden="true" /> : null}
                </button>
              </div>
              <div className="vm__menu-group">
                <span className="vm__menu-label">Playback</span>
                {/* Loop lives here too, because the narrowest players drop it
                    from the bar to keep mute and full screen reachable. */}
                <button
                  type="button"
                  className={`vm__menu-item ${loop ? 'is-on' : ''}`}
                  onClick={toggleLoop}
                  aria-pressed={loop}
                >
                  <span>
                    Loop
                    <small>Start again when it ends</small>
                  </span>
                  {loop ? <i className="bi bi-check2" aria-hidden="true" /> : null}
                </button>
                <div className="vm__speeds">
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`vm__speed ${speed === s ? 'is-on' : ''}`}
                      onClick={() => changeSpeed(s)}
                      aria-pressed={speed === s}
                    >
                      {s === 1 ? 'Normal' : `${s}x`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div ref={metaRef} className="vm__meta">
          <p className="vm__meta-line">
            <span>{project.location}</span>
            <span className="vm__meta-dot" aria-hidden="true" />
            <span>{formatDuration(duration)}</span>
            <span className="vm__meta-dot" aria-hidden="true" />
            <span>{video.orientation === 'portrait' ? 'Vertical' : 'Widescreen'}</span>
          </p>
        </div>
      </div>
    </div>,
    document.body,
  )
}
