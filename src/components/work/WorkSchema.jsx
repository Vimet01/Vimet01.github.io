import { useEffect } from 'react'

// The site's public address, matching index.html.
const ORIGIN = 'https://vimet.com'
const ID = 'vimet-work-schema'

function isoDuration(seconds) {
  const total = Math.round(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `PT${m > 0 ? `${m}M` : ''}${s}S`
}

/**
 * Publishes the films as VideoObject data so search engines can show them as
 * video results. Rendered by the Work page only, and removed when it unmounts.
 */
export default function WorkSchema({ projects }) {
  useEffect(() => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Selected work by Vimet',
      itemListElement: projects.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'VideoObject',
          name: p.title,
          // Google needs a description on a VideoObject. The films no longer
          // carry prose, so this is composed from the same two facts the card
          // already shows rather than written copy.
          description: `${p.categoryLabel}, ${p.location}. Directed and shot by Vimet.`,
          thumbnailUrl: ORIGIN + p.thumb.jpg,
          contentUrl: ORIGIN + p.video.src1080,
          duration: isoDuration(p.video.duration),
          width: p.video.width,
          height: p.video.height,
          genre: p.categoryLabel,
          creator: { '@id': `${ORIGIN}/#vimet` },
        },
      })),
    }

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = ID
    script.textContent = JSON.stringify(data)
    document.head.appendChild(script)

    return () => {
      const existing = document.getElementById(ID)
      if (existing) existing.remove()
    }
  }, [projects])

  return null
}
