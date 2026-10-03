import { useEffect, useRef, useState } from 'react'
import { useVideoModalActions } from '../../context/VideoModalContext'
import { formatDuration } from '../../data/projects'
import useMediaQuery from '../../hooks/useMediaQuery'
import SmartImage from '../ui/SmartImage'
import './WorkCard.css'

export default function WorkCard({ project, priority = false }) {
  const { open } = useVideoModalActions()
  const [previewOn, setPreviewOn] = useState(false)
  const [everHovered, setEverHovered] = useState(false)
  const [previewFailed, setPreviewFailed] = useState(false)
  const previewRef = useRef(null)
  const { thumb, video } = project

  const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)')
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const canPreview = finePointer && !reducedMotion && !previewFailed
  const showPreview = canPreview && (previewOn || everHovered)

  useEffect(() => {
    const el = previewRef.current
    if (!el) return
    if (previewOn && canPreview) {
      const p = el.play()
      if (p && typeof p.catch === 'function') p.catch(() => {})
    } else {
      el.pause()
      try {
        el.currentTime = 0
      } catch {
        /* not seekable yet */
      }
    }
  }, [previewOn, canPreview, showPreview])

  const handleOpen = () => open(project)

  // Handlers stay attached no matter what, so the preview can never get stuck on.
  const startPreview = () => {
    if (!canPreview) return
    setEverHovered(true)
    setPreviewOn(true)
  }
  const stopPreview = () => setPreviewOn(false)

  return (
    <article className="work-card">
      <button
        type="button"
        className="work-card__media"
        onClick={handleOpen}
        onMouseEnter={startPreview}
        onMouseLeave={stopPreview}
        onFocus={startPreview}
        onBlur={stopPreview}
        aria-label={`Play ${project.title}, ${project.categoryLabel}, ${formatDuration(video.duration)}`}
        data-cursor="Play"
      >
        <SmartImage
          jpg={thumb.jpg}
          webp={thumb.webp}
          webpWidth={thumb.webpWidth}
          small={thumb.small}
          smallWidth={thumb.smallWidth}
          lqip={thumb.lqip}
          width={thumb.width}
          height={thumb.height}
          focal={thumb.focal}
          alt={`${project.title}, ${project.categoryLabel}`}
          sizes="(max-width: 760px) min(100vw, 520px), (max-width: 1100px) 50vw, 33vw"
          priority={priority}
        />

        {showPreview ? (
          <video
            ref={previewRef}
            className={`work-card__preview ${previewOn ? 'is-on' : ''}`}
            src={video.preview}
            muted
            loop
            playsInline
            preload="none"
            tabIndex={-1}
            aria-hidden="true"
            onError={() => {
              setPreviewFailed(true)
              setPreviewOn(false)
            }}
          />
        ) : null}

        <span className="work-card__shade" aria-hidden="true" />

        <span className="work-card__badge">{project.categoryLabel}</span>

        <span className="work-card__duration">
          <i className="bi bi-play-fill" aria-hidden="true" />
          {formatDuration(video.duration)}
        </span>

        <span className="work-card__play" aria-hidden="true">
          <i className="bi bi-play-fill" />
        </span>
      </button>

      <div className="work-card__body">
        <div className="work-card__meta">
          <span>{project.categoryLabel}</span>
          <span className="work-card__sep" aria-hidden="true" />
          <span>{project.location}</span>
        </div>
        <h3 className="work-card__title">
          {/* Not a tab stop: the thumbnail above already opens the same video. */}
          <button type="button" onClick={handleOpen} tabIndex={-1}>
            {project.title}
          </button>
        </h3>
      </div>
    </article>
  )
}
