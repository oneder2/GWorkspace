import { readFileSync } from 'fs'
import { join } from 'path'

const seoRoutePath = join(process.cwd(), 'backend', 'src', 'routes', 'seo.js')
const source = readFileSync(seoRoutePath, 'utf-8')

const requiredSnippets = [
  "const DEFAULT_SITE_URL = 'https://www.gellaronline.cc'",
  "process.env.SITE_URL",
  "process.env.PUBLIC_SITE_URL",
  "{ url: '/workspace'",
  'escapeXml'
]

const forbiddenSnippets = [
  "https://workspace.gellaronline.cc",
  "{ url: '/sites'",
  "{ url: '/tools'"
]

const missingSnippets = requiredSnippets.filter((snippet) => !source.includes(snippet))
const presentForbiddenSnippets = forbiddenSnippets.filter((snippet) => source.includes(snippet))

if (missingSnippets.length > 0 || presentForbiddenSnippets.length > 0) {
  if (missingSnippets.length > 0) {
    console.error('Backend SEO route is missing required canonical sitemap behavior:')
    for (const snippet of missingSnippets) console.error(`- ${snippet}`)
  }

  if (presentForbiddenSnippets.length > 0) {
    console.error('Backend SEO route still contains legacy sitemap behavior:')
    for (const snippet of presentForbiddenSnippets) console.error(`- ${snippet}`)
  }

  process.exit(1)
}

console.log('backend SEO sitemap route ok')
