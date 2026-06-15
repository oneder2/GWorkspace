/**
 * Guard public SEO/PWA entrypoints against stale domains, missing assets,
 * and legacy route/resource regressions.
 */

import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

const ROOT = process.cwd()
const SITE_URL = 'https://www.gellaronline.cc'
const DEFAULT_OG_IMAGE = '/images/portfolio/glass-dashboard.jpg'
const DEFAULT_LOGO_IMAGE = '/images/icons/icon.svg'
const failures = []

function readText(path) {
  return readFileSync(join(ROOT, path), 'utf-8')
}

function exists(path) {
  return existsSync(join(ROOT, path))
}

function assert(condition, message) {
  if (!condition) failures.push(message)
}

function assertNoStaleReferences(label, content) {
  const stalePatterns = [
    'your-domain.com',
    '/og-image.jpg',
    '/logo.png',
    '<loc>https://www.gellaronline.cc/tools</loc>',
    '<loc>https://www.gellaronline.cc/sites</loc>'
  ]

  for (const pattern of stalePatterns) {
    assert(!content.includes(pattern), `${label} contains stale reference: ${pattern}`)
  }
}

function getLocs(xml) {
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])
}

function checkPublicSources() {
  const robots = readText('public/robots.txt')
  const sitemap = readText('public/sitemap.xml')
  const index = readText('index.html')
  const viteConfig = readText('vite.config.js')
  const useSEO = readText('src/composables/useSEO.js')

  assert(robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`), 'robots.txt must point to the public sitemap URL')
  assert(sitemap.trim().startsWith('<?xml'), 'public/sitemap.xml must be XML')

  const locs = getLocs(sitemap)
  assert(locs.length > 0, 'public/sitemap.xml must contain at least one URL')
  assert(locs.includes(`${SITE_URL}/`), 'public/sitemap.xml must include the homepage with trailing slash')
  assert(locs.includes(`${SITE_URL}/workspace`), 'public/sitemap.xml must include /workspace')
  assert(locs.includes(`${SITE_URL}/blog`), 'public/sitemap.xml must include /blog')
  assert(locs.includes(`${SITE_URL}/portfolio`), 'public/sitemap.xml must include /portfolio')
  assert(locs.every((loc) => loc.startsWith(SITE_URL)), 'all sitemap URLs must use the public www domain')

  assert(index.includes(`${SITE_URL}${DEFAULT_OG_IMAGE}`), 'index.html must use the deployed default OG image')
  assert(viteConfig.includes("theme_color: '#22c55e'"), 'PWA manifest theme_color must match index.html')
  assert(viteConfig.includes('sitemap.xml'), 'PWA includeAssets must include sitemap.xml')
  assert(useSEO.includes(`const DEFAULT_OG_IMAGE = '${DEFAULT_OG_IMAGE}'`), 'useSEO must use the deployed default OG image')
  assert(useSEO.includes(`const DEFAULT_LOGO_IMAGE = '${DEFAULT_LOGO_IMAGE}'`), 'useSEO must use the deployed icon as logo')

  assert(exists(`public${DEFAULT_OG_IMAGE}`), `default OG image is missing: public${DEFAULT_OG_IMAGE}`)
  assert(exists(`public${DEFAULT_LOGO_IMAGE}`), `default logo image is missing: public${DEFAULT_LOGO_IMAGE}`)

  assertNoStaleReferences('public/robots.txt', robots)
  assertNoStaleReferences('public/sitemap.xml', sitemap)
  assertNoStaleReferences('index.html', index)
  assertNoStaleReferences('vite.config.js', viteConfig)
  assertNoStaleReferences('src/composables/useSEO.js', useSEO)
}

function checkDistIfPresent() {
  if (!exists('dist')) return

  const distSitemap = readText('dist/sitemap.xml')
  const distManifest = readText('dist/manifest.webmanifest')
  const distIndex = readText('dist/index.html')

  assertNoStaleReferences('dist/sitemap.xml', distSitemap)
  assertNoStaleReferences('dist/manifest.webmanifest', distManifest)
  assertNoStaleReferences('dist/index.html', distIndex)
  assert(distManifest.includes('"theme_color":"#22c55e"'), 'dist manifest must use the current theme color')
  assert(distSitemap.includes(`<loc>${SITE_URL}/</loc>`), 'dist sitemap must include homepage with trailing slash')
}

checkPublicSources()
checkDistIfPresent()

if (failures.length) {
  console.error('Public SEO checks failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log('Public SEO checks passed')
