import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const VENDOR = /node_modules[\/](react|react-dom|scheduler|react-router|react-router-dom)[\/]/

// Routes that get their own static copy of index.html so GitHub Pages answers
// them with HTTP 200 instead of the 404 fallback. Keep in step with src/App.jsx.
const STATIC_ROUTES = ['/work', '/about', '/contact']

/**
 * GitHub Pages has no rewrite rules, but it serves 404.html for any unknown
 * path and serves /foo.html when /foo is requested. Once the bundle is
 * written this copies the hashed index.html to:
 *   404.html                        SPA fallback for every other URL
 *   work.html, about.html, contact.html
 *                                   HTTP 200 for the three real pages, with
 *                                   canonical and og:url pointed at the route
 *   .nojekyll                       stops Jekyll from touching the output
 *
 * Only runs on `vite build`. Vercel and Netlify ignore these extra files
 * because their own rewrites (vercel.json, public/_redirects) win.
 */
function githubPagesSpa() {
  let outDir
  return {
    name: 'github-pages-spa',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      const index = path.join(outDir, 'index.html')
      if (!fs.existsSync(index)) return
      const html = fs.readFileSync(index, 'utf8')
      fs.writeFileSync(path.join(outDir, '404.html'), html)
      for (const route of STATIC_ROUTES) {
        const page = html
          .replace(/(<link rel="canonical" href="https?:\/\/[^"\/]+)\/"/, `$1${route}"`)
          .replace(/(<meta property="og:url" content="https?:\/\/[^"\/]+)\/"/, `$1${route}"`)
        fs.writeFileSync(path.join(outDir, `${route.slice(1)}.html`), page)
      }
      fs.writeFileSync(path.join(outDir, '.nojekyll'), '')
    },
  }
}

export default defineConfig({
  plugins: [react(), githubPagesSpa()],
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
  build: {
    target: 'es2019',
    sourcemap: false,
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        // Match on the resolved module id. Listing bare package names misses
        // react-dom/client, which leaves the renderer in the app chunk.
        manualChunks(id) {
          if (VENDOR.test(id)) return 'react'
          return undefined
        },
      },
    },
  },
})
