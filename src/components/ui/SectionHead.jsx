import Reveal from './Reveal'

export default function SectionHead({ eyebrow, title, lead, aside, className = '' }) {
  return (
    <div className={`section-head ${className}`}>
      <div className="section-head__text">
        {eyebrow ? (
          <Reveal as="p" className="eyebrow">
            {eyebrow}
          </Reveal>
        ) : null}
        <Reveal as="h2" delay={0.08}>
          {title}
        </Reveal>
        {lead ? (
          <Reveal as="p" className="section-head__lead" delay={0.16}>
            {lead}
          </Reveal>
        ) : null}
      </div>
      {aside ? (
        <Reveal className="section-head__aside" delay={0.2}>
          {aside}
        </Reveal>
      ) : null}
    </div>
  )
}
