import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import manifest from '../data/media-manifest.json'
import { featuredProjects } from '../data/projects'
import { process, services, site } from '../data/site'
import usePageMeta from '../hooks/usePageMeta'
import useMediaQuery from '../hooks/useMediaQuery'
import Reveal from '../components/ui/Reveal'
import SectionHead from '../components/ui/SectionHead'
import SmartImage from '../components/ui/SmartImage'
import WorkGrid from '../components/work/WorkGrid'
import './Home.css'

const portrait = manifest['vimet-portrait'] || {}

export default function Home() {
  usePageMeta(
    '',
    'Vimet is a creative director and video content creator based in Anambra State, Nigeria. Wedding films, cultural festivals, Web3 events and corporate stories, directed and shot with intent.',
  )

  const mediaRef = useRef(null)
  const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)')
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  // Gentle parallax on the portrait for mouse users only
  useEffect(() => {
    if (!finePointer || reducedMotion) return undefined
    const el = mediaRef.current
    if (!el) return undefined
    let raf = 0
    const update = () => {
      raf = 0
      const y = window.scrollY
      if (y > window.innerHeight * 1.2) return
      el.style.transform = `translate3d(0, ${y * 0.08}px, 0)`
    }
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) window.cancelAnimationFrame(raf)
      el.style.transform = ''
    }
  }, [finePointer, reducedMotion])

  const scrollToWork = (e) => {
    e.preventDefault()
    const target = document.getElementById('work')
    if (!target) return
    // Measure the bar rather than guessing: with a notch it is over 120px tall,
    // and a flat 40px offset put the section eyebrow underneath it.
    const header = document.querySelector('.header')
    const offset = (header ? header.getBoundingClientRect().height : 76) + 24
    const top = target.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' })
  }

  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__backdrop" aria-hidden="true">
          <span className="hero__glow" />
          <span className="hero__lines" />
        </div>

        <div className="container hero__inner">
          <div className="hero__content">
            <p className="hero__eyebrow anim" style={{ '--i': 0 }}>
              <span className="hero__dot" aria-hidden="true" />
              {/* the full role needs two lines on a phone, so the short one takes over there */}
              <span className="hero__role-long">{site.role}</span>
              <span className="hero__role-short">{site.roleShort}</span>
            </p>

            <h1 id="hero-title" className="hero__title">
              <span className="hero__line">
                <span className="anim" style={{ '--i': 1 }}>
                  Your story,
                </span>
              </span>
              <span className="hero__line">
                <span className="anim" style={{ '--i': 2 }}>
                  shot like <em>it matters.</em>
                </span>
              </span>
            </h1>

            <p className="hero__lead anim" style={{ '--i': 3 }}>
              I'm Vimet, a creative director and video content creator based in Anambra State, Nigeria. I direct and
              shoot weddings, cultural festivals, Web3 events and corporate stories.
            </p>

            <div className="hero__actions anim" style={{ '--i': 4 }}>
              <a href="#work" className="btn btn--primary btn--lg" onClick={scrollToWork}>
                Watch the work <i className="bi bi-play-fill" aria-hidden="true" />
              </a>
              <Link to="/contact" className="btn btn--ghost btn--lg">
                Book a project <i className="bi bi-arrow-up-right" aria-hidden="true" />
              </Link>
            </div>

            <ul className="hero__facts anim" style={{ '--i': 5 }}>
              <li>
                <i className="bi bi-geo-alt" aria-hidden="true" />
                {site.location}
              </li>
              <li>
                <i className="bi bi-camera-reels" aria-hidden="true" />
                Weddings, festivals, Web3 and corporate
              </li>
            </ul>
          </div>

          <div className="hero__media anim" style={{ '--i': 2 }} ref={mediaRef}>
            <div className="hero__frame">
              <SmartImage
                jpg="/media/images/vimet-portrait.jpg"
                webp="/media/images/vimet-portrait.webp"
                small="/media/images/vimet-portrait-small.webp"
                smallWidth={portrait.smallWidth}
                webpWidth={portrait.webpWidth}
                lqip={portrait.lqip}
                width={portrait.width}
                height={portrait.height}
                focal="50% 28%"
                alt="Vimet in a black suit adjusting his tie, with the words Vimet, Creative Director set beside him"
                sizes="(max-width: 900px) 92vw, 42vw"
                priority
              />
              <span className="hero__corner hero__corner--tl" aria-hidden="true" />
              <span className="hero__corner hero__corner--br" aria-hidden="true" />
            </div>
            <div className="hero__badge">
              <span className="hero__badge-dot" aria-hidden="true" />
              {site.availability}
            </div>
          </div>
        </div>

      </section>

      {/* ---------------- Selected work ---------------- */}
      <section className="section" id="work" aria-labelledby="work-title">
        <div className="container">
          <SectionHead
            eyebrow="Selected work"
            title={<span id="work-title">Recent work</span>}
            lead="Real weddings, real festivals, real rooms full of people. Click a thumbnail to watch."
            aside={
              <Link to="/work" className="link">
                See all work <i className="bi bi-arrow-up-right" aria-hidden="true" />
              </Link>
            }
          />
          <WorkGrid projects={featuredProjects} priorityCount={3} />
        </div>
      </section>

      {/* ---------------- Services ---------------- */}
      <section className="section section--services" aria-labelledby="services-title">
        <div className="container">
          <SectionHead
            title={<span id="services-title">What I do</span>}
            lead="One person directing the whole thing keeps the story consistent."
          />
          <div className="services">
            {services.map((s, i) => (
              <Reveal as="article" className="service" key={s.title} delay={(i % 3) * 0.1}>
                <div className="service__top">
                  <span className="service__icon">
                    <i className={`bi ${s.icon}`} aria-hidden="true" />
                  </span>
                  <span className="service__index">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="service__title">{s.title}</h3>
                <p className="service__text">{s.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Statement ---------------- */}
      <section className="statement" aria-labelledby="statement-title">
        <div className="container statement__inner">
          <Reveal className="statement__text">
            <p className="eyebrow">The approach</p>
            <h2 id="statement-title" className="statement__title">
              I try to stay out of the way. <em>The goal is the film, not the camera.</em>
            </h2>
          </Reveal>
          <Reveal className="statement__aside" delay={0.15}>
            <p>
              I plan the shoot before I show up, so shoot day is about getting it right, not figuring it out. If a shot
              isn't earning its place, it doesn't make the cut.
            </p>
            <Link to="/about" className="link">
              More about me <i className="bi bi-arrow-up-right" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ---------------- Process ---------------- */}
      <section className="section" aria-labelledby="process-title">
        <div className="container">
          <SectionHead
            eyebrow="How I work"
            title={<span id="process-title">How a project runs</span>}
            lead="You will always know what happens next. That is how the shoot day stays calm and the film stays on brief."
          />
          <ol className="process">
            {process.map((p, i) => (
              <Reveal as="li" className="process__step" key={p.step} delay={i * 0.1}>
                <span className="process__num">{p.step}</span>
                <h3 className="process__title">{p.title}</h3>
                <p className="process__text">{p.text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------- Call to action ---------------- */}
      <section className="cta" aria-labelledby="cta-title">
        <div className="container cta__inner">
          <Reveal>
            <p className="cta__eyebrow">Ready when you are</p>
            <h2 id="cta-title" className="cta__title">
              Got a date in mind? <em>Bring it to me.</em>
            </h2>
          </Reveal>
          <Reveal className="cta__actions" delay={0.12}>
            <Link to="/contact" className="btn btn--dark btn--lg">
              Start a project <i className="bi bi-arrow-up-right" aria-hidden="true" />
            </Link>
            <a href={`mailto:${site.email}`} className="cta__email">
              {site.email}
            </a>
          </Reveal>
        </div>
      </section>
    </>
  )
}
