import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { nav, site } from '../../data/site'
import { lockBody, unlockBody } from '../../lib/bodyLock'
import ThemeToggle from './ThemeToggle'
import './Header.css'

const WORDMARK = '/media/images/vimet-wordmark-480.png'
const FOCUSABLE = 'a[href], button:not([disabled])'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const burgerRef = useRef(null)
  const menuRef = useRef(null)

  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      setScrolled(window.scrollY > 24)
    }
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  // Lock the page, trap the tab key inside the panel, and hand focus back
  // to the button that opened it.
  useEffect(() => {
    if (!open) return undefined
    lockBody()

    const focusTimer = window.setTimeout(() => {
      const first = menuRef.current && menuRef.current.querySelector(FOCUSABLE)
      if (first) first.focus()
    }, 60)

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
        return
      }
      if (e.key !== 'Tab') return
      const panel = menuRef.current
      if (!panel) return
      const items = Array.from(panel.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null)
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', onKey)
      const burger = burgerRef.current
      if (burger && document.activeElement !== burger) burger.focus({ preventScroll: true })
      unlockBody()
    }
  }, [open])

  const menuLinks = [{ to: '/', label: 'Home', end: true }, ...nav]

  return (
    <>
      <header className={`header ${scrolled ? 'is-scrolled' : ''} ${open ? 'is-menu-open' : ''}`}>
        <div className="container header__inner">
          <Link to="/" className="header__logo" aria-label="Vimet, back to home">
            <img src={WORDMARK} alt="Vimet" width="480" height="218" decoding="async" />
          </Link>

          <nav className="header__nav" aria-label="Primary">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `header__link ${isActive ? 'is-active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="header__actions">
            <Link to="/contact" className="btn btn--primary btn--sm header__cta">
              Book a project
            </Link>
            <ThemeToggle className="header__theme" />
            <button
              ref={burgerRef}
              type="button"
              className="header__burger"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
              onClick={() => setOpen((v) => !v)}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      {open ? (
        <div id="mobile-menu" ref={menuRef} className="menu is-open">
          <div className="menu__inner container">
            <nav className="menu__nav" aria-label="Mobile">
              {menuLinks.map((item, i) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `menu__link ${isActive ? 'is-active' : ''}`}
                  style={{ '--i': i }}
                >
                  <span className="menu__index">{String(i + 1).padStart(2, '0')}</span>
                  <span className="menu__label">{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="menu__meta">
              <div className="menu__meta-block">
                <span className="menu__meta-label">Based in</span>
                <span>{site.location}</span>
              </div>
              <div className="menu__meta-block">
                <span className="menu__meta-label">Email</span>
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </div>
              <div className="menu__socials">
                {site.socials.map((s) => (
                  <a key={s.id} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}>
                    <i className={`bi ${s.icon}`} aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
