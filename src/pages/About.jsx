import { Link } from 'react-router-dom'
import manifest from '../data/media-manifest.json'
import { principles, site, skills } from '../data/site'
import usePageMeta from '../hooks/usePageMeta'
import Reveal from '../components/ui/Reveal'
import SectionHead from '../components/ui/SectionHead'
import SmartImage from '../components/ui/SmartImage'
import './About.css'

const portrait = manifest['vimet-portrait'] || {}

const facts = [
  { label: 'Based in', value: site.location },
  { label: 'Works', value: 'Across Nigeria and beyond' },
  { label: 'Focus', value: 'Weddings, festivals, Web3 and corporate' },
  { label: 'Delivery', value: 'Widescreen and vertical, ready for every screen' },
]

export default function About() {
  usePageMeta(
    'About',
    'Meet Vimet, creative director and video content creator from Anambra State, Nigeria. How I plan, direct and shoot films that people remember.',
  )

  return (
    <>
      <section className="page-hero about-hero" aria-labelledby="about-title">
        <div className="container about-hero__inner">
          <div className="about-hero__text">
            <Reveal as="p" className="eyebrow">
              About me
            </Reveal>
            <Reveal as="h1" id="about-title" className="page-hero__title" delay={0.08}>
              I tell stories <em>for a living.</em>
            </Reveal>
            <Reveal as="p" className="lead page-hero__lead" delay={0.16}>
              I'm Vimet, a creative director and video content creator working out of Anambra State, Nigeria.
            </Reveal>
            <Reveal className="about-hero__actions" delay={0.24}>
              <Link to="/contact" className="btn btn--primary">
                Work with me <i className="bi bi-arrow-up-right" aria-hidden="true" />
              </Link>
              <Link to="/work" className="btn btn--ghost">
                See the work
              </Link>
            </Reveal>
          </div>

          <Reveal className="about-hero__media" variant="scale" delay={0.1}>
            <div className="about-hero__frame">
              <SmartImage
                jpg="/media/images/vimet-portrait.jpg"
                webp="/media/images/vimet-portrait.webp"
                small="/media/images/vimet-portrait-small.webp"
                smallWidth={portrait.smallWidth}
                webpWidth={portrait.webpWidth}
                lqip={portrait.lqip}
                width={portrait.width}
                height={portrait.height}
                focal="50% 20%"
                alt="Vimet in a black suit adjusting his tie, with the words Vimet, Creative Director set beside him"
                sizes="(max-width: 900px) 92vw, 40vw"
                priority
              />
            </div>
            <p className="about-hero__caption">
              <span>{site.name}</span>
              <span>{site.roleShort}</span>
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section about-story" aria-labelledby="story-title">
        <div className="container about-story__inner">
          <Reveal className="about-story__side">
            <h2 id="story-title" className="about-story__title">
              Where the work <em>comes from</em>
            </h2>
          </Reveal>
          <div className="about-story__body">
            <Reveal as="p" delay={0.05}>
              I've covered weddings, cultural festivals, and Web3 events across Anambra and beyond. Every job is
              different, but the job is the same: get close, stay out of the way, and cut it so people actually watch it
              to the end.
            </Reveal>
            <Reveal as="p" delay={0.1}>
              Before I show up, I already know the shot list and I've walked the venue in my head. On the day, I try to
              stay light and stay close — the moments that matter don't repeat themselves.
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section section--tight about-facts" aria-label="Quick facts">
        <div className="container">
          <dl className="facts">
            {facts.map((f, i) => (
              <Reveal as="div" className="facts__item" key={f.label} delay={i * 0.08}>
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      <section className="section" aria-labelledby="skills-title">
        <div className="container about-skills">
          <SectionHead
            eyebrow="What I bring"
            title={<span id="skills-title">Skills that show up on screen</span>}
            lead="One director carrying the story from the first call to the final export. These are the tools I lean on."
          />
          <ul className="skills">
            {skills.map((s, i) => (
              <Reveal as="li" className="skills__item" key={s} delay={(i % 4) * 0.07}>
                <i className="bi bi-check2" aria-hidden="true" />
                {s}
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="section about-principles" aria-labelledby="principles-title">
        <div className="container">
          <SectionHead
            eyebrow="How I think"
            title={<span id="principles-title">Three rules for every film</span>}
          />
          <div className="principles">
            {principles.map((p, i) => (
              <Reveal as="article" className="principle" key={p.title} delay={i * 0.1}>
                <span className="principle__num">{String(i + 1).padStart(2, '0')}</span>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tight about-cta" aria-labelledby="about-cta-title">
        <div className="container about-cta__inner">
          <Reveal>
            <h2 id="about-cta-title">
              Tell me about <em>your</em> day
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <Link to="/contact" className="btn btn--primary btn--lg">
              Tell me your date <i className="bi bi-arrow-up-right" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  )
}
