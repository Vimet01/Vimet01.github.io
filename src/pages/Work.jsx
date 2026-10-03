import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { categories, projects } from '../data/projects'
import usePageMeta from '../hooks/usePageMeta'
import Reveal from '../components/ui/Reveal'
import WorkFilters from '../components/work/WorkFilters'
import WorkGrid from '../components/work/WorkGrid'
import WorkSchema from '../components/work/WorkSchema'
import './Work.css'

export default function Work() {
  usePageMeta(
    'Work',
    'Selected wedding films, cultural festival coverage, Web3 event recaps and corporate stories by Vimet, creative director based in Anambra State, Nigeria.',
  )

  const [active, setActive] = useState('all')

  const counts = useMemo(() => {
    const c = { all: projects.length }
    for (const cat of categories) {
      if (cat.id !== 'all') c[cat.id] = projects.filter((p) => p.category === cat.id).length
    }
    return c
  }, [])

  const visible = useMemo(
    () => (active === 'all' ? projects : projects.filter((p) => p.category === active)),
    [active],
  )

  return (
    <>
      <WorkSchema projects={projects} />
      <section className="page-hero work-hero" aria-labelledby="work-page-title">
        <div className="container">
          <Reveal as="h1" id="work-page-title" className="page-hero__title">
            Work
          </Reveal>
          <Reveal as="p" className="lead page-hero__lead" delay={0.08}>
            Everything here I directed, shot and edited myself.
          </Reveal>
        </div>
      </section>

      <section className="section section--flush-top" aria-label="Work gallery">
        <div className="container">
          <Reveal className="work-toolbar" delay={0.2}>
            <WorkFilters active={active} onChange={setActive} counts={counts} />
            <p className="work-toolbar__count" aria-live="polite">
              Showing {visible.length} of {projects.length}
            </p>
          </Reveal>

          <WorkGrid projects={visible} priorityCount={3} />
        </div>
      </section>

      <section className="section section--tight work-cta" aria-labelledby="work-cta-title">
        <div className="container work-cta__inner">
          <Reveal>
            <h2 id="work-cta-title">Want to see more?</h2>
            <p className="lead">Not everything I've shot is online. Ask and I'll send you a private link.</p>
          </Reveal>
          <Reveal delay={0.1}>
            <Link to="/contact" className="btn btn--primary btn--lg">
              Send me your date <i className="bi bi-arrow-up-right" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  )
}
