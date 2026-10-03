/**
 * Rebuilds the subset icon font from Bootstrap Icons.
 *
 * Scans src/ for every `bi-*` class actually used, subsets the upstream woff2
 * down to just those glyphs, and rewrites src/styles/icons.css to match.
 *
 * Run with: npm run icons
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import subsetFont from 'subset-font'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BI = path.join(ROOT, 'node_modules', 'bootstrap-icons', 'font')
const OUT_FONT = path.join(ROOT, 'src', 'assets', 'vimet-icons.woff2')
const OUT_CSS = path.join(ROOT, 'src', 'styles', 'icons.css')

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(p, out)
    else if (/\.(jsx|js|html|css)$/.test(entry.name) && p !== OUT_CSS) out.push(p)
  }
  return out
}

const sources = [...walk(path.join(ROOT, 'src')), path.join(ROOT, 'index.html')]
const used = new Set()
for (const file of sources) {
  const text = fs.readFileSync(file, 'utf8')
  for (const match of text.matchAll(/\bbi-[a-z0-9-]+/g)) used.add(match[0])
}
used.delete('bi-')
const names = [...used].sort()

const css = fs.readFileSync(path.join(BI, 'bootstrap-icons.css'), 'utf8')
const RULE = new RegExp('\\.(bi-[a-z0-9-]+)::before\\s*\\{\\s*content:\\s*"\\\\([0-9a-fA-F]+)"', 'g')
const codepoints = new Map()
for (const match of css.matchAll(RULE)) {
  if (!codepoints.has(match[1])) codepoints.set(match[1], match[2])
}

const missing = names.filter((n) => !codepoints.has(n))
if (missing.length) {
  console.error('These icon names are not in Bootstrap Icons:', missing.join(', '))
  process.exit(1)
}

const chars = names.map((n) => String.fromCodePoint(parseInt(codepoints.get(n), 16))).join('')
const source = fs.readFileSync(path.join(BI, 'fonts', 'bootstrap-icons.woff2'))
const subset = await subsetFont(source, chars, { targetFormat: 'woff2' })

fs.mkdirSync(path.dirname(OUT_FONT), { recursive: true })
fs.writeFileSync(OUT_FONT, subset)

const rules = names.map((n) => `.${n}::before { content: "\\${codepoints.get(n)}"; }`).join('\n')
fs.writeFileSync(
  OUT_CSS,
  `/*!
 * Bootstrap Icons (MIT), subset to the ${names.length} icons this site uses.
 * Source: https://github.com/twbs/icons
 * Generated file. Run "npm run icons" to rebuild it.
 */
@font-face {
  font-family: 'vimet-icons';
  font-display: swap;
  src: url('../assets/vimet-icons.woff2') format('woff2');
  font-weight: normal;
  font-style: normal;
}

.bi::before,
[class^='bi-']::before,
[class*=' bi-']::before {
  display: inline-block;
  font-family: 'vimet-icons' !important;
  font-style: normal;
  font-weight: normal !important;
  font-variant: normal;
  text-transform: none;
  line-height: 1;
  vertical-align: -0.125em;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

${rules}
`,
)

const kb = (n) => (n / 1024).toFixed(1) + 'KB'
console.log(`${names.length} icons, ${kb(source.length)} -> ${kb(subset.length)}`)
