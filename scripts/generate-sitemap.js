/**
 * Generate public/sitemap.xml from the deployed public blog API by default.
 * Set SITEMAP_SOURCE=db to generate from the local backend SQLite database.
 */

import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execFileSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const SITE_URL = normalizeBaseUrl(process.env.SITE_URL || 'https://www.gellaronline.cc')
const SOURCE = process.env.SITEMAP_SOURCE || 'api'
const BLOG_API_URL = process.env.SITEMAP_BLOG_API_URL || 'https://workspace.gellaronline.cc/api/blogs?limit=500'

const staticRoutes = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/workspace', priority: '0.8', changefreq: 'weekly' },
  { path: '/blog', priority: '0.9', changefreq: 'daily' },
  { path: '/portfolio', priority: '0.7', changefreq: 'monthly' }
]

function normalizeBaseUrl(url) {
  return url.replace(/\/+$/, '')
}

function formatDate(value = new Date()) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return new Date().toISOString().split('T')[0]
  return date.toISOString().split('T')[0]
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

async function getBlogsFromApi() {
  try {
    const response = await fetch(BLOG_API_URL, {
      headers: { Accept: 'application/json' }
    })

    if (!response.ok) {
      throw new Error(`Blog API request failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    const raw = execFileSync('curl', ['-fsSL', '--max-time', '20', BLOG_API_URL], {
      encoding: 'utf-8'
    })
    return JSON.parse(raw)
  }
}

async function getBlogsFromDatabase() {
  const { getDatabase } = await import('../backend/src/config/database.js')
  const db = getDatabase()

  return db.prepare(`
    SELECT id, updated_at, published_at
    FROM blogs
    WHERE status = 'published'
    ORDER BY published_at DESC
  `).all()
}

async function getPublishedBlogs() {
  if (SOURCE === 'db') return getBlogsFromDatabase()
  if (SOURCE === 'api') return getBlogsFromApi()
  throw new Error(`Unsupported SITEMAP_SOURCE: ${SOURCE}`)
}

function renderUrl({ loc, lastmod, changefreq, priority }) {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${formatDate(lastmod)}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
}

function renderSitemap(blogs) {
  const today = formatDate()
  const staticEntries = staticRoutes.map((route) => renderUrl({
    loc: `${SITE_URL}${route.path}`,
    lastmod: today,
    changefreq: route.changefreq,
    priority: route.priority
  }))

  const blogEntries = blogs
    .filter((blog) => blog?.id)
    .map((blog) => renderUrl({
      loc: `${SITE_URL}/blog/${blog.id}`,
      lastmod: blog.updated_at || blog.published_at || today,
      changefreq: 'monthly',
      priority: '0.7'
    }))

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticEntries, ...blogEntries].join('\n')}
</urlset>
`
}

async function generateSitemap() {
  try {
    const blogs = await getPublishedBlogs()
    const xml = renderSitemap(blogs)
    const outputPath = join(__dirname, '../public/sitemap.xml')
    writeFileSync(outputPath, xml, 'utf-8')

    console.log(`Sitemap generated: ${outputPath}`)
    console.log(`Source: ${SOURCE}`)
    console.log(`Static routes: ${staticRoutes.length}`)
    console.log(`Blog posts: ${blogs.length}`)
    console.log(`Total URLs: ${staticRoutes.length + blogs.length}`)
  } catch (error) {
    console.error('Error generating sitemap:', error)
    process.exit(1)
  }
}

generateSitemap()
