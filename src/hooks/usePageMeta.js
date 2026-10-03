import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const BRAND = 'Vimet'
const DEFAULT_TITLE = 'Vimet | Creative Director and Video Content Creator in Anambra, Nigeria'

// The site's public address, used for canonical and social preview URLs.
// Keep in step with index.html.
const ORIGIN = 'https://vimet.com'

function setMeta(selector, attr, name, content) {
  let tag = document.head.querySelector(selector)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function setLink(rel, href) {
  let tag = document.head.querySelector(`link[rel="${rel}"]`)
  if (!tag) {
    tag = document.createElement('link')
    tag.setAttribute('rel', rel)
    document.head.appendChild(tag)
  }
  tag.setAttribute('href', href)
}

/**
 * Keeps the title, description, canonical link and social preview tags in sync
 * with the current route, so a shared link to /work does not show the home page.
 *
 * Pass `noIndex` on pages that should stay out of search results.
 */
export default function usePageMeta(title, description, noIndex = false) {
  const { pathname } = useLocation()

  useEffect(() => {
    const full = title ? `${title} | ${BRAND}` : DEFAULT_TITLE
    document.title = full

    if (description) {
      setMeta('meta[name="description"]', 'name', 'description', description)
      setMeta('meta[property="og:description"]', 'property', 'og:description', description)
      setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description)
    }

    setMeta('meta[property="og:title"]', 'property', 'og:title', full)
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', full)
    setMeta('meta[name="robots"]', 'name', 'robots', noIndex ? 'noindex, follow' : 'index, follow')

    const url = ORIGIN + (pathname === '/' ? '/' : pathname)
    setMeta('meta[property="og:url"]', 'property', 'og:url', url)
    setLink('canonical', url)
  }, [title, description, noIndex, pathname])
}
