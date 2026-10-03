/**
 * Downloads the three web font families from Google Fonts as woff2 and writes
 * src/styles/fonts.css, so the site serves them itself.
 *
 * Self hosting matters here: a preconnect to a third party font host stalls
 * the page whenever DNS is slow, which is common on the mobile networks this
 * site is built for.
 *
 * Run with: npm run fonts
 */
import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FONT_DIR = path.join(ROOT, 'public', 'fonts')
const CSS_OUT = path.join(ROOT, 'src', 'styles', 'fonts.css')

// A desktop browser string, so Google returns woff2 rather than an older format.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'

const FAMILIES = [
  { q: 'Bricolage+Grotesque:opsz,wght@96,600..800', name: 'Bricolage Grotesque', slug: 'bricolage-grotesque' },
  { q: 'Instrument+Sans:wght@400..700', name: 'Instrument Sans', slug: 'instrument-sans' },
  { q: 'Instrument+Serif:ital@1', name: 'Instrument Serif', slug: 'instrument-serif' },
]

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': UA }, timeout: 30000 }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return get(res.headers.location).then(resolve, reject)
        }
        if (res.statusCode !== 200) return reject(new Error(`${url} -> ${res.statusCode}`))
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => resolve(Buffer.concat(chunks)))
      })
      .on('error', reject)
      .on('timeout', function onTimeout() {
        this.destroy(new Error('timed out: ' + url))
      })
  })
}

fs.mkdirSync(FONT_DIR, { recursive: true })
const blocks = []

for (const fam of FAMILIES) {
  const css = (await get(`https://fonts.googleapis.com/css2?family=${fam.q}&display=swap`)).toString('utf8')

  // Latin and latin extended only. The site has no other scripts.
  const faces = css.split('/*').filter((b) => /^\s*(latin|latin-ext)\s*\*\//.test(b))
  let i = 0
  for (const block of faces) {
    const subset = /^\s*(latin-ext|latin)\s*\*\//.exec(block)[1]
    const url = /url\((https:[^)]+\.woff2)\)/.exec(block)
    if (!url) continue
    const range = /unicode-range:\s*([^;]+);/.exec(block)
    const style = /font-style:\s*([a-z]+);/.exec(block)
    const weight = /font-weight:\s*([^;]+);/.exec(block)

    const file = `${fam.slug}-${subset}-${i++}.woff2`
    const data = await get(url[1])
    fs.writeFileSync(path.join(FONT_DIR, file), data)
    console.log(file, (data.length / 1024).toFixed(1) + 'KB')

    blocks.push(
      [
        '@font-face {',
        `  font-family: '${fam.name}';`,
        `  font-style: ${style ? style[1] : 'normal'};`,
        `  font-weight: ${weight ? weight[1].trim() : '400'};`,
        '  font-display: swap;',
        `  src: url('/fonts/${file}') format('woff2');`,
        range ? `  unicode-range: ${range[1].trim()};` : null,
        '}',
      ]
        .filter(Boolean)
        .join('\n'),
    )
  }
}

fs.writeFileSync(
  CSS_OUT,
  `/*!
 * Self hosted web fonts, so no third party request can hold up the page.
 * Generated file. Run "npm run fonts" to rebuild it.
 */

${blocks.join('\n\n')}
`,
)
console.log('fonts.css written,', blocks.length, 'faces')
