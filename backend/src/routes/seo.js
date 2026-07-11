/**
 * SEO 相关路由
 * 处理 Sitemap 动态生成等功能
 */
import express from 'express'
import { Blog } from '../models/Blog.js'

const router = express.Router()
const DEFAULT_SITE_URL = 'https://www.gellaronline.cc'

function normalizeBaseUrl(url) {
  return String(url || DEFAULT_SITE_URL).replace(/\/+$/, '')
}

function getCanonicalSiteUrl() {
  if (process.env.SITE_URL) return normalizeBaseUrl(process.env.SITE_URL)
  if (process.env.PUBLIC_SITE_URL) return normalizeBaseUrl(process.env.PUBLIC_SITE_URL)
  return DEFAULT_SITE_URL
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * 动态生成 sitemap.xml
 * GET /api/seo/sitemap.xml
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    // 1. Dynamic SEO must point to the public frontend canonical host.
    const siteUrl = getCanonicalSiteUrl()

    // 2. 获取所有已发布的博客
    const blogs = Blog.getAll({ status: 'published' })

    // 3. 定义静态页面
    const staticPages = [
      { url: '/', changefreq: 'daily', priority: '1.0' },
      { url: '/blog', changefreq: 'daily', priority: '0.9' },
      { url: '/workspace', changefreq: 'weekly', priority: '0.8' },
      { url: '/portfolio', changefreq: 'monthly', priority: '0.7' },
    ]

    // 4. 构造 XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`

    // 添加静态页
    staticPages.forEach(page => {
      xml += `
  <url>
    <loc>${escapeXml(`${siteUrl}${page.url}`)}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    })

    // 添加博客文章
    blogs.forEach(blog => {
      const lastMod = blog.updated_at || blog.published_at || new Date().toISOString()
      const date = new Date(lastMod).toISOString().split('T')[0]
      xml += `
  <url>
    <loc>${escapeXml(`${siteUrl}/blog/${blog.id}`)}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
    })

    xml += '\n</urlset>'

    // 5. 发送响应
    res.header('Content-Type', 'application/xml')
    res.send(xml)
  } catch (error) {
    console.error('Error generating sitemap:', error)
    res.status(500).end()
  }
})

export default router
