import { Link } from 'react-router-dom'
import { nav, site } from '../../data/site'
import Reveal from '../ui/Reveal'
import './Footer.css'

const WORDMARK = '/media/images/vimet-wordmark.png'

export default function Footer() {
  const year = new Date().getFullYear()
  const whatsapp = site.socials.find((s) => s.id === 'whatsapp')

  const toTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <Reveal className="footer__brand">
            <img src={WORDMARK} alt="Vimet" width="904" height="410" loading="lazy" decoding="async" />
            <p>
              {site.role}. Based in {site.location}. Available for travel across Nigeria and beyond.
            </p>
          </Reveal>

          <div className="footer__cols">
            <Reveal className="footer__col" delay={0.05}>
              <h3>Pages</h3>
              <ul>
                <li>
                  <Link to="/">Home</Link>
                </li>
                {nav.map((item) => (
                  <li key={item.to}>
                    <Link to={item.to}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal className="footer__col" delay={0.1}>
              <h3>Contact</h3>
              <ul>
                <li>
                  <a href={`mailto:${site.email}`}>{site.email}</a>
                </li>
                {whatsapp ? (
                  <li>
                    <a href={whatsapp.href} target="_blank" rel="noopener noreferrer">
                      WhatsApp
                    </a>
                  </li>
                ) : null}
                <li>
                  <span className="muted">{site.location}</span>
                </li>
              </ul>
            </Reveal>

            <Reveal className="footer__col" delay={0.15}>
              <h3>Follow</h3>
              <ul className="footer__socials">
                {site.socials.map((s) => (
                  <li key={s.id}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer">
                      <i className={`bi ${s.icon}`} aria-hidden="true" />
                      <span>{s.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>

        <div className="footer__bottom">
          <p>
            &copy; {year} {site.name}. All rights reserved.
          </p>
          <p className="footer__made">Creative direction and video content from Anambra State, Nigeria.</p>
          <button type="button" className="footer__top-btn" onClick={toTop}>
            Back to top <i className="bi bi-arrow-up" aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  )
}
