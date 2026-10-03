/**
 * Site wide details for Vimet.
 *
 * Change a value here once and it updates across the header, footer, contact
 * page, mobile menu and the structured data.
 */

// WhatsApp number in international format, digits only.
const WHATSAPP_NUMBER = '2348100562510'

export const site = {
  name: 'Vimet',
  role: 'Creative Director & Video Content Creator',
  roleShort: 'Creative Director',
  tagline: 'Stories shot with intent.',
  location: 'Anambra State, Nigeria',
  locationShort: 'Anambra, Nigeria',
  email: 'ifeanyivictormetu@gmail.com',
  // Lets the contact form's "Send by email" button deliver the message. Free
  // from https://web3forms.com: enter the address that should receive the
  // messages and the key arrives in that inbox. It is public by design.
  web3formsAccessKey: '',
  phoneDisplay: '+234 810 056 2510',
  whatsappNumber: WHATSAPP_NUMBER,
  availability: 'Booking now for the December rush',

  // Social and messaging links.
  socials: [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      handle: 'Chat on WhatsApp',
      href: `https://wa.me/${WHATSAPP_NUMBER}`, // updates automatically with WHATSAPP_NUMBER
      icon: 'bi-whatsapp',
    },
    {
      id: 'instagram',
      label: 'Instagram',
      handle: '@vimetofficial',
      href: 'https://instagram.com/vimetofficial',
      icon: 'bi-instagram',
    },
    {
      id: 'x',
      label: 'X',
      handle: '@vimetofficial',
      href: 'https://x.com/vimetofficial',
      icon: 'bi-twitter-x',
    },
  ],
}

export const nav = [
  { to: '/work', label: 'Work' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export const services = [
  {
    icon: 'bi-compass',
    title: 'Creative Direction',
    text: 'Concept, mood, shot list and the overall look of the piece.',
  },
  {
    icon: 'bi-heart',
    title: 'Wedding Films',
    text: 'Full coverage of the traditional and the white wedding.',
  },
  {
    icon: 'bi-mic',
    title: 'Event Coverage',
    text: 'Conferences, summits, launches and festivals, cut and delivered fast.',
  },
  {
    icon: 'bi-building',
    title: 'Corporate Stories',
    text: 'Interviews, aerials and product shots, built around one clear message.',
  },
  {
    icon: 'bi-phone',
    title: 'Social Content',
    text: 'Vertical cuts for Instagram, TikTok and X.',
  },
  {
    icon: 'bi-airplane-engines',
    title: 'Aerial Footage',
    text: 'Drone shots of the venue, the city and the crowd.',
  },
]

export const process = [
  {
    step: '01',
    title: 'Listen',
    text: 'We talk through the event, the timeline, and what you actually want the film to do.',
  },
  {
    step: '02',
    title: 'Plan',
    text: "Shot list, crew, timing — sorted before the day so nothing's left to chance.",
  },
  {
    step: '03',
    title: 'Shoot',
    text: 'I direct, stay out of the way, and make quick calls when I need to.',
  },
  {
    step: '04',
    title: 'Deliver',
    text: 'Edited, colour graded, and sent in whatever format you need — widescreen, vertical, both.',
  },
]

export const skills = [
  'Creative direction',
  'Cinematography',
  'Aerial footage',
  'Editing and colour grading',
  'Sound design',
  'Social content strategy',
  'Event coverage',
  'Brand storytelling',
]

export const principles = [
  {
    title: 'Honest first',
    text: "I don't stage what already happened.",
  },
  {
    title: 'Clean frames',
    text: "If a shot doesn't earn its place, it doesn't make the cut.",
  },
  {
    title: 'Edits that move',
    text: 'Ninety seconds or nine minutes, the pace has to hold.',
  },
]
