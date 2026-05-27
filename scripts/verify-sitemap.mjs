/**
 * Smoke-check sitemap includes locale-prefixed legal + accessibility URLs.
 * Usage:
 *   node scripts/verify-sitemap.mjs [baseUrl]     — fetch live server
 *   node scripts/verify-sitemap.mjs --prerender   — read .output/public after build
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const required = [
  '/ua',
  '/ru',
  '/ua/privacy',
  '/ru/privacy',
  '/ua/accessibility',
  '/ru/accessibility',
]

const mode = process.argv[2]
let xml

if (mode === '--prerender') {
  const path = resolve('.output/public/sitemap.xml')
  if (!existsSync(path)) {
    // sitemap index or dynamic — check prerendered HTML paths exist
    const ok = required.every((p) => {
      const locale = p.split('/')[1]
      const page = p.split('/')[2]
      const html = page
        ? resolve(`.output/public/${locale}/${page}/index.html`)
        : resolve(`.output/public/${locale}/index.html`)
      return existsSync(html)
    })
    if (!ok) {
      console.error('prerender: missing locale HTML for', required.join(', '))
      process.exit(1)
    }
    console.log('prerender: ok (locale HTML present)')
    process.exit(0)
  }
  xml = readFileSync(path, 'utf8')
}
else {
  const base = mode && mode !== '--prerender' ? mode : process.env.NUXT_PUBLIC_SITE_URL || 'http://127.0.0.1:3000'
  const url = new URL('/sitemap.xml', base).toString()
  const res = await fetch(url)
  if (!res.ok) {
    console.error(`sitemap: ${res.status} ${url}`)
    process.exit(1)
  }
  xml = await res.text()
}

const missing = required.filter(path => !xml.includes(path))
if (missing.length) {
  console.error('sitemap: missing paths:', missing.join(', '))
  process.exit(1)
}

console.log(`sitemap: ok (${required.length} paths found)`)
