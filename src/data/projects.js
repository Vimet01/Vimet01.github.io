import manifest from './media-manifest.json'

/**
 * Portfolio projects.
 *
 * Thumbnails live in /public/media/images and the web ready videos in
 * /public/media/videos. Each video has a 1080p and a 720p copy. Phones and
 * slow connections get the 720p copy automatically.
 *
 * To host the videos on a CDN later, change VIDEO_BASE to the full URL of the
 * folder that holds the mp4 files. Nothing else needs to change.
 */

const IMAGE_BASE = '/media/images'
const VIDEO_BASE = '/media/videos'

export const categories = [
  { id: 'all', label: 'All work' },
  { id: 'wedding', label: 'Wedding Films' },
  { id: 'cultural', label: 'Cultural Festivals' },
  { id: 'web3', label: 'Web3 Events' },
  { id: 'corporate', label: 'Corporate Stories' },
]

const categoryLabel = Object.fromEntries(categories.map((c) => [c.id, c.label]))

function thumb(slug, focal = '50% 50%') {
  const meta = manifest[slug] || {}
  return {
    jpg: `${IMAGE_BASE}/${slug}.jpg`,
    webp: `${IMAGE_BASE}/${slug}.webp`,
    webpWidth: meta.webpWidth || meta.width || 0,
    small: `${IMAGE_BASE}/${slug}-small.webp`,
    smallWidth: meta.smallWidth || 0,
    lqip: meta.lqip || '',
    width: meta.width || 0,
    height: meta.height || 0,
    focal,
  }
}

function video(slug, width, height, duration) {
  return {
    src1080: `${VIDEO_BASE}/${slug}-1080.mp4`,
    src720: `${VIDEO_BASE}/${slug}-720.mp4`,
    preview: `${VIDEO_BASE}/${slug}-preview.mp4`,
    width,
    height,
    duration,
    orientation: width >= height ? 'landscape' : 'portrait',
  }
}

export const projects = [
  {
    id: 'wedding-1',
    title: 'The Bride Steps Out',
    category: 'wedding',
    categoryLabel: categoryLabel.wedding,
    location: 'Anambra, Nigeria',
    tags: ['Wedding film', 'Natural light', 'Vertical'],
    thumb: thumb('wedding-1', '50% 32%'),
    video: video('wedding-1', 1080, 1920, 50.2),
    featured: true,
  },
  {
    id: 'web3-event-1',
    title: 'Do More With Crypto',
    category: 'web3',
    categoryLabel: categoryLabel.web3,
    // TODO: add the host city once the client confirms it
    location: 'Nigeria',
    tags: ['Conference', 'Booth coverage', 'Widescreen'],
    thumb: thumb('web3-event-1', '50% 50%'),
    video: video('web3-event-1', 1920, 1080, 43.1),
    featured: true,
  },
  {
    id: 'cultural-festival-2',
    title: 'Eze Ji',
    category: 'cultural',
    categoryLabel: categoryLabel.cultural,
    location: 'Anambra, Nigeria',
    tags: ['Festival', 'Portrait', 'Vertical'],
    thumb: thumb('cultural-festival-2', '50% 30%'),
    video: video('cultural-festival-2', 1080, 1920, 126.8),
    featured: true,
  },
  {
    id: 'corporate-event-1',
    title: 'Anambra in Motion',
    category: 'corporate',
    categoryLabel: categoryLabel.corporate,
    location: 'Awka, Nigeria',
    tags: ['Aerial', 'Corporate', 'Widescreen'],
    thumb: thumb('corporate-event-1', '50% 50%'),
    video: video('corporate-event-1', 1920, 1080, 51.8),
    featured: true,
  },
  {
    id: 'wedding-2',
    title: 'These Kids Are Getting Married',
    category: 'wedding',
    categoryLabel: categoryLabel.wedding,
    location: 'Anambra, Nigeria',
    tags: ['Wedding film', 'Opening sequence', 'Vertical'],
    thumb: thumb('wedding-2', '50% 45%'),
    video: video('wedding-2', 1080, 1920, 49.9),
    featured: true,
  },
  {
    id: 'web3-event-2',
    title: 'Solana Summit, Uyo',
    category: 'web3',
    categoryLabel: categoryLabel.web3,
    location: 'Uyo, Nigeria',
    tags: ['Summit', 'Keynote', 'Widescreen'],
    thumb: thumb('web3-event-2', '50% 45%'),
    video: video('web3-event-2', 1920, 1080, 23.8),
    featured: true,
  },
  {
    id: 'cultural-festival-1',
    title: 'Custodians of Tradition',
    category: 'cultural',
    categoryLabel: categoryLabel.cultural,
    location: 'Anambra, Nigeria',
    tags: ['Festival', 'Documentary', 'Vertical'],
    thumb: thumb('cultural-festival-1', '50% 38%'),
    video: video('cultural-festival-1', 1080, 1920, 44.0),
    featured: false,
  },
]

export const featuredProjects = projects.filter((p) => p.featured)

export function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return '0:00'
  const total = Math.round(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s < 10 ? '0' : ''}${s}`
}
