import './PageFallback.css'

/**
 * Holds the page height while a lazily loaded route arrives, so the footer
 * does not jump up and back down.
 */
export default function PageFallback() {
  return (
    <div className="page-fallback" role="status" aria-label="Loading page">
      <div className="container">
        <span className="page-fallback__bar page-fallback__bar--eyebrow" />
        <span className="page-fallback__bar page-fallback__bar--title" />
        <span className="page-fallback__bar page-fallback__bar--lead" />
      </div>
    </div>
  )
}
