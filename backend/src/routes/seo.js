/**
 * SEO 相关路由
 * 处理 Sitemap 动态生成等功能
 */
import express from 'express'
import { Blog } from '../models/Blog.js'

const router = express.Router()

/**
 * 动态生成 sitemap.xml
 * GET /api/seo/sitemap.xml
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    // 1. 获取站点基础 URL
    let origin = req.get('origin') || req.get('referer')
    if (origin) {
      try {
        origin = new URL(origin).origin
      } catch (e) {
        origin = null
      }
    }
    
    // 生产环境兜底
    if (!origin) {
      origin = process.env.NODE_ENV === 'production' 
        ? 'https://workspace.gellaronline.cc' 
        : `http://${req.get('host')}`
    }

    // 2. 获取所有已发布的博客
    const blogs = Blog.getAll({ status: 'published' })

    // 3. 定义静态页面
    const staticPages = [
      { url: '/', changefreq: 'daily', priority: '1.0' },
      { url: '/blog', changefreq: 'daily', priority: '0.9' },
      { url: '/sites', changefreq: 'weekly', priority: '0.8' },
      { url: '/tools', changefreq: 'weekly', priority: '0.8' },
      { url: '/portfolio', changefreq: 'weekly', priority: '0.8' },
    ]

    // 4. 构造 XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`

    // 添加静态页
    staticPages.forEach(page => {
      xml += `
  <url>
    <loc>${origin}${page.url}</loc>
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
    <loc>${origin}/blog/${blog.id}</loc>
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
