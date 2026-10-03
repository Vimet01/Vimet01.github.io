import { useState } from 'react'
import { site } from '../data/site'
import usePageMeta from '../hooks/usePageMeta'
import Reveal from '../components/ui/Reveal'
import './Contact.css'

const PROJECT_TYPES = [
  'Wedding film',
  'Cultural festival',
  'Web3 or tech event',
  'Corporate story',
  'Brand or social content',
  'Something else',
]

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/
const MESSAGE_MAX = 1200
const FIELD_ORDER = ['name', 'email', 'type', 'message']
const EMPTY = { name: '', email: '', type: '', date: '', message: '' }

// "Send by email" posts to Web3Forms, which emails the inbox the access key in
// site.js was created for. Give up after 20 seconds on a stalled connection
// rather than leave the button spinning.
const EMAIL_ENDPOINT = 'https://api.web3forms.com/submit'
const EMAIL_TIMEOUT_MS = 20000

function validate(values) {
  const errors = {}
  if (!values.name.trim() || values.name.trim().length < 2) errors.name = 'Please tell me your name.'
  if (!values.email.trim()) errors.email = 'An email address helps me reply.'
  else if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = "That email doesn't look right."
  if (!values.type) errors.type = 'Pick the closest option.'
  const message = values.message.trim()
  if (!message || message.length < 10) errors.message = 'Give me a few details about the project.'
  else if (message.length > MESSAGE_MAX) errors.message = `Please keep it under ${MESSAGE_MAX} characters.`
  return errors
}

function buildMessage(values) {
  return [
    `Hello Vimet, my name is ${values.name.trim()}.`,
    `Project: ${values.type}`,
    values.date ? `Date: ${values.date}` : null,
    `Email: ${values.email.trim()}`,
    '',
    values.message.trim(),
  ]
    .filter((line) => line !== null)
    .join('\n')
}

function mailtoHref(values) {
  const subject = encodeURIComponent(`Project enquiry: ${values.type}`)
  const body = encodeURIComponent(buildMessage(values))
  return `mailto:${site.email}?subject=${subject}&body=${body}`
}

// Resolves true only once Web3Forms confirms the email went out.
async function sendEmail(values) {
  if (!site.web3formsAccessKey) return false

  // FormData rather than JSON keeps this a simple CORS request, which saves a
  // preflight round trip on mobile data.
  const data = new FormData()
  data.append('access_key', site.web3formsAccessKey)
  data.append('subject', `Project enquiry from ${values.name.trim()}: ${values.type}`)
  data.append('from_name', 'Vimet website')
  data.append('name', values.name.trim())
  data.append('email', values.email.trim()) // becomes the Reply-To address
  data.append('Project type', values.type)
  if (values.date) data.append('Event date', values.date)
  data.append('message', values.message.trim())

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), EMAIL_TIMEOUT_MS)
  try {
    const res = await fetch(EMAIL_ENDPOINT, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: data,
      signal: controller.signal,
    })
    const result = await res.json()
    return res.ok && result.success === true
  } catch {
    return false
  } finally {
    window.clearTimeout(timer)
  }
}

export default function Contact() {
  usePageMeta(
    'Contact',
    'Book Vimet for your wedding, festival, Web3 event or corporate story. Reach out on WhatsApp, email, Instagram or X.',
  )

  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [sent, setSent] = useState(null)
  const [sending, setSending] = useState(false)

  const whatsapp = site.socials.find((s) => s.id === 'whatsapp')
  const others = site.socials.filter((s) => s.id !== 'whatsapp')

  const update = (field) => (e) => {
    const next = { ...values, [field]: e.target.value }
    setValues(next)
    setSent(null)
    if (touched[field]) setErrors(validate(next))
  }

  const blur = (field) => () => {
    setTouched((t) => ({ ...t, [field]: true }))
    setErrors(validate(values))
  }

  const submitVia = (channel) => (e) => {
    e.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    setTouched({ name: true, email: true, type: true, message: true })

    if (Object.keys(nextErrors).length) {
      // Focus from the error object, not the DOM: the invalid styling has not
      // been committed yet on the first submit.
      const firstBad = FIELD_ORDER.find((f) => nextErrors[f])
      if (firstBad) {
        window.requestAnimationFrame(() => {
          const el = document.getElementById(firstBad)
          if (el) el.focus()
        })
      }
      return
    }

    if (channel === 'whatsapp') {
      const url = `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(buildMessage(values))}`
      const win = window.open(url, '_blank')
      if (win) {
        win.opener = null
        setSent('whatsapp')
      } else {
        setSent('blocked')
      }
    } else {
      setSending(true)
      setSent(null)
      sendEmail(values).then((ok) => {
        setSending(false)
        if (ok) {
          setValues(EMPTY)
          setErrors({})
          setTouched({})
        }
        setSent(ok ? 'email' : 'failed')
      })
    }
  }

  const fieldClass = (field) => `field ${touched[field] && errors[field] ? 'has-error' : ''}`
  const remaining = MESSAGE_MAX - values.message.length
  const warning = sent === 'blocked' || sent === 'failed'

  return (
    <>
      <section className="page-hero contact-hero" aria-labelledby="contact-title">
        <div className="container">
          <Reveal as="p" className="eyebrow">
            Contact
          </Reveal>
          <Reveal as="h1" id="contact-title" className="page-hero__title" delay={0.08}>
            Let's talk about <em>your project</em>
          </Reveal>
          <Reveal as="p" className="lead page-hero__lead" delay={0.16}>
            Tell me about the event, the date, and what you want people to feel when they watch it. I usually reply
            within a day.
          </Reveal>
        </div>
      </section>

      <section className="section section--flush-top" aria-label="Ways to reach me">
        <div className="container contact__grid">
          <div className="contact__channels">
            {whatsapp ? (
              <Reveal
                as="a"
                className="channel channel--primary"
                href={whatsapp.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="channel__icon">
                  <i className={`bi ${whatsapp.icon}`} aria-hidden="true" />
                </span>
                <span className="channel__body">
                  <span className="channel__label">Fastest reply</span>
                  <span className="channel__value">{whatsapp.label}</span>
                  <span className="channel__hint">{site.phoneDisplay}</span>
                </span>
                <i className="bi bi-arrow-up-right channel__arrow" aria-hidden="true" />
              </Reveal>
            ) : null}

            <Reveal as="a" className="channel" href={`mailto:${site.email}`} delay={0.06}>
              <span className="channel__icon">
                <i className="bi bi-envelope" aria-hidden="true" />
              </span>
              <span className="channel__body">
                <span className="channel__label">Email</span>
                <span className="channel__value">{site.email}</span>
                <span className="channel__hint">For briefs, quotes and documents</span>
              </span>
              <i className="bi bi-arrow-up-right channel__arrow" aria-hidden="true" />
            </Reveal>

            <Reveal className="channel channel--static" delay={0.12}>
              <span className="channel__icon">
                <i className="bi bi-geo-alt" aria-hidden="true" />
              </span>
              <span className="channel__body">
                <span className="channel__label">Location</span>
                <span className="channel__value">{site.location}</span>
                <span className="channel__hint">Available for travel across Nigeria and beyond</span>
              </span>
            </Reveal>

            <Reveal className="socials" delay={0.18}>
              <p className="socials__label">Also on</p>
              <ul className="socials__list">
                {others.map((s) => (
                  <li key={s.id}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer">
                      <i className={`bi ${s.icon}`} aria-hidden="true" />
                      <span className="socials__name">{s.label}</span>
                      <span className="socials__handle">{s.handle}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <Reveal className="contact__form-wrap" delay={0.1}>
            <form className="form" noValidate onSubmit={submitVia('whatsapp')}>
              <div className="form__head">
                <h2 className="form__title">Tell me about the project</h2>
                <p className="form__lead">
                  Fill this in, then send it on WhatsApp or straight to my inbox by email.
                </p>
              </div>

              <div className="form__row">
                <div className={fieldClass('name')}>
                  <label htmlFor="name">Your name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    maxLength={80}
                    value={values.name}
                    onChange={update('name')}
                    onBlur={blur('name')}
                    aria-invalid={Boolean(touched.name && errors.name)}
                    aria-describedby={touched.name && errors.name ? 'name-error' : undefined}
                    placeholder="Chinedu Okafor"
                  />
                  {touched.name && errors.name ? (
                    <p className="field__error" id="name-error" role="alert">
                      {errors.name}
                    </p>
                  ) : null}
                </div>

                <div className={fieldClass('email')}>
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    maxLength={120}
                    value={values.email}
                    onChange={update('email')}
                    onBlur={blur('email')}
                    aria-invalid={Boolean(touched.email && errors.email)}
                    aria-describedby={touched.email && errors.email ? 'email-error' : undefined}
                    placeholder="you@example.com"
                  />
                  {touched.email && errors.email ? (
                    <p className="field__error" id="email-error" role="alert">
                      {errors.email}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="form__row">
                <div className={fieldClass('type')}>
                  <label htmlFor="type">Project type</label>
                  <div className="select">
                    <select
                      id="type"
                      name="type"
                      value={values.type}
                      onChange={update('type')}
                      onBlur={blur('type')}
                      aria-invalid={Boolean(touched.type && errors.type)}
                      aria-describedby={touched.type && errors.type ? 'type-error' : undefined}
                    >
                      <option value="">Choose one</option>
                      {PROJECT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <i className="bi bi-chevron-down" aria-hidden="true" />
                  </div>
                  {touched.type && errors.type ? (
                    <p className="field__error" id="type-error" role="alert">
                      {errors.type}
                    </p>
                  ) : null}
                </div>

                <div className="field">
                  <label htmlFor="date">
                    Event date <span className="field__optional">optional</span>
                  </label>
                  <input id="date" name="date" type="date" value={values.date} onChange={update('date')} />
                </div>
              </div>

              <div className={fieldClass('message')}>
                <label htmlFor="message">About the project</label>
                <textarea
                  id="message"
                  name="message"
                  rows="5"
                  maxLength={MESSAGE_MAX}
                  value={values.message}
                  onChange={update('message')}
                  onBlur={blur('message')}
                  aria-invalid={Boolean(touched.message && errors.message)}
                  aria-describedby={touched.message && errors.message ? 'message-error' : 'message-count'}
                  placeholder="Where is it, how many people, and what should the final film do?"
                />
                <p className="field__count" id="message-count">
                  {remaining} characters left
                </p>
                {touched.message && errors.message ? (
                  <p className="field__error" id="message-error" role="alert">
                    {errors.message}
                  </p>
                ) : null}
              </div>

              <div className="form__actions">
                <button type="submit" className="btn btn--primary btn--lg" disabled={sending}>
                  <i className="bi bi-whatsapp" aria-hidden="true" /> Send on WhatsApp
                </button>
                <button type="button" className="btn btn--ghost btn--lg" onClick={submitVia('email')} disabled={sending}>
                  <i className="bi bi-envelope" aria-hidden="true" /> {sending ? 'Sending…' : 'Send by email'}
                </button>
              </div>

              {sent ? (
                <p className={`form__note ${warning ? 'is-warning' : ''}`} role="status">
                  <i className={`bi ${warning ? 'bi-exclamation-triangle' : 'bi-check2-circle'}`} aria-hidden="true" />
                  {sent === 'whatsapp'
                    ? 'WhatsApp is open with your message ready. Press send there and I will get it.'
                    : null}
                  {sent === 'email' ? "Sent. Your message is in my inbox and I'll reply by email, usually within a day." : null}
                  {sent === 'failed' ? (
                    <span>
                      Your message didn't send. Please try again, or email me directly at{' '}
                      <a href={mailtoHref(values)}>{site.email}</a>.
                    </span>
                  ) : null}
                  {sent === 'blocked' ? (
                    <span>
                      Your browser blocked the new tab. Use the{' '}
                      <a href={whatsapp ? whatsapp.href : '#'} target="_blank" rel="noopener noreferrer">
                        WhatsApp link
                      </a>{' '}
                      directly, or send it by email instead.
                    </span>
                  ) : null}
                </p>
              ) : null}
            </form>
          </Reveal>
        </div>
      </section>
    </>
  )
}
