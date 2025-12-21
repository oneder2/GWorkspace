/**
 * 生成 sitemap.xml 脚本
 * 从后端API获取所有博客文章，生成完整的sitemap
 */

import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { getDatabase } from '../backend/src/config/database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 网站基础URL（需要根据实际部署修改）
const BASE_URL = process.env.SITE_URL || 'https://your-domain.com'

/**
 * 生成 sitemap.xml
 */
async function generateSitemap() {
  try {
    // 连接数据库
    const db = getDatabase()
    
    // 获取所有已发布的博客文章
    const blogs = db.prepare(`
      SELECT id, updated_at, published_at 
      FROM blogs 
      WHERE status = 'published'
      ORDER BY published_at DESC
    `).all()
    
    // 静态页面路由
    const staticRoutes = [
      { path: '', priority: '1.0', changefreq: 'daily' },
      { path: '/sites', priority: '0.8', changefreq: 'weekly' },
      { path: '/tools', priority: '0.8', changefreq: 'weekly' },
      { path: '/blog', priority: '0.9', changefreq: 'daily' },
      { path: '/portfolio', priority: '0.7', changefreq: 'monthly' }
    ]
    
    // 生成 XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`
    
    // 添加静态页面
    for (const route of staticRoutes) {
      const lastmod = new Date().toISOString().split('T')[0]
      xml += `  <url>
    <loc>${BASE_URL}${route.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>
`
    }
    
    // 添加博客文章
    for (const blog of blogs) {
      const lastmod = blog.updated_at 
        ? new Date(blog.updated_at).toISOString().split('T')[0]
        : new Date(blog.published_at).toISOString().split('T')[0]
      
      xml += `  <url>
    <loc>${BASE_URL}/blog/${blog.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`
    }
    
    xml += `</urlset>`
    
    // 写入文件
    const outputPath = join(__dirname, '../public/sitemap.xml')
    writeFileSync(outputPath, xml, 'utf-8')
    
    console.log(`✓ Sitemap generated: ${outputPath}`)
    console.log(`  - Static routes: ${staticRoutes.length}`)
    console.log(`  - Blog posts: ${blogs.length}`)
    console.log(`  - Total URLs: ${staticRoutes.length + blogs.length}`)
  } catch (error) {
    console.error('Error generating sitemap:', error)
    process.exit(1)
  }
}

generateSitemap()

