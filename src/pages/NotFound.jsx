import { Link } from 'react-router-dom'
import usePageMeta from '../hooks/usePageMeta'
import Reveal from '../components/ui/Reveal'
import './NotFound.css'

export default function NotFound() {
  // Third argument keeps this route out of search results.
  usePageMeta('Page not found', 'That page does not exist.', true)

  return (
    <section className="notfound" aria-labelledby="nf-title">
      <div className="container notfound__inner">
        <Reveal as="p" className="eyebrow">
          Error 404
        </Reveal>
        <Reveal as="h1" id="nf-title" className="notfound__title" delay={0.08}>
          This page got <em>cut in the edit.</em>
        </Reveal>
        <Reveal as="p" className="lead notfound__lead" delay={0.16}>
          The link is either old or mistyped. Head back to the work and pick a film instead.
        </Reveal>
        <Reveal className="notfound__actions" delay={0.24}>
          <Link to="/" className="btn btn--primary">
            Back to home
          </Link>
          <Link to="/work" className="btn btn--ghost">
            See the work
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
