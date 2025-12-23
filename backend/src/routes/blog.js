/**
 * 博客API路由
 * 处理博客文章的CRUD操作
 */

import express from 'express'
import { Blog } from '../models/Blog.js'
import { getDatabase } from '../config/database.js'

const router = express.Router()

/**
 * 获取博客列表
 * GET /api/blogs
 * 查询参数：
 * - genre: 分类筛选
 * - status: 状态筛选（published/draft）
 * - limit: 限制数量
 * - offset: 偏移量
 * - sortBy: 排序字段（date/views/likes/title）
 * - sortOrder: 排序方向（asc/desc）
 */
router.get('/', (req, res) => {
  try {
    const {
      genre,
      status = 'published',
      limit,
      offset = 0,
      sortBy = 'published_at',
      sortOrder = 'desc'
    } = req.query

    const options = {
      genre: genre || null,
      status: status === 'all' ? null : status, // 'all'表示获取所有状态
      limit: limit ? parseInt(limit) : null,
      offset: parseInt(offset),
      sortBy,
      sortOrder
    }

    const blogs = Blog.getAll(options)
    res.json(blogs)
  } catch (error) {
    console.error('Error fetching blogs:', error)
    res.status(500).json({ error: 'Failed to fetch blogs' })
  }
})

/**
 * 获取博客统计信息
 * GET /api/blogs/stats
 * 返回文章总数、评论总数、访问量等统计信息
 * 注意：必须在 /:id 路由之前定义，否则会被当作ID处理
 */
router.get('/stats', (req, res) => {
  try {
    const db = getDatabase()
    
    // 获取已发布文章总数
    const totalArticles = db.prepare('SELECT COUNT(*) as count FROM blogs WHERE status = ?').get('published').count
    
    // 获取评论总数（已审核通过）
    const totalComments = db.prepare('SELECT COUNT(*) as count FROM comments WHERE status = ?').get('approved').count
    
    // 获取总访问量
    const totalViews = db.prepare('SELECT SUM(views) as total FROM blogs WHERE status = ?').get('published').total || 0
    
    // 获取总点赞数
    const totalLikes = db.prepare('SELECT COUNT(*) as count FROM likes').get().count
    
    res.json({
      totalArticles,
      totalComments,
      totalViews,
      totalLikes
    })
  } catch (error) {
    console.error('Error fetching blog stats:', error)
    res.status(500).json({ error: 'Failed to fetch blog stats' })
  }
})

/**
 * 获取单篇博客详情
 * GET /api/blogs/:id
 */
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const blog = Blog.getById(id)

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' })
    }

    res.json(blog)
  } catch (error) {
    console.error('Error fetching blog:', error)
    res.status(500).json({ error: 'Failed to fetch blog' })
  }
})

/**
 * 通过slug获取博客
 * GET /api/blogs/slug/:slug
 */
router.get('/slug/:slug', (req, res) => {
  try {
    const { slug } = req.params
    const blog = Blog.getBySlug(slug)

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' })
    }

    res.json(blog)
  } catch (error) {
    console.error('Error fetching blog by slug:', error)
    res.status(500).json({ error: 'Failed to fetch blog' })
  }
})

/**
 * 创建新博客
 * POST /api/blogs
 * 需要认证（后续实现）
 */
router.post('/', (req, res) => {
  try {
    // 记录请求信息用于调试
    console.log('POST /api/blogs - Request received')
    console.log('Request headers:', JSON.stringify(req.headers, null, 2))
    console.log('Request body type:', typeof req.body)
    console.log('Request body keys:', req.body ? Object.keys(req.body) : 'req.body is null/undefined')
    console.log('Request body content:', JSON.stringify(req.body, null, 2))
    
    // 检查请求体是否存在
    if (!req.body) {
      console.error('Request body is missing or not parsed')
      return res.status(400).json({ 
        error: 'Request body is missing or not parsed',
        message: 'The request body could not be parsed. Please check Content-Type header and request format.'
      })
    }

    const {
      title,
      slug,
      genre,
      content,
      excerpt,
      tags = [],
      status = 'published',
      published_at = null
    } = req.body

    // 记录每个字段的值（用于调试）
    console.log('Extracted fields:')
    console.log('  title:', typeof title, title ? `"${title.substring(0, 50)}..."` : title)
    console.log('  slug:', typeof slug, slug)
    console.log('  genre:', typeof genre, genre)
    console.log('  content:', typeof content, content ? `[${content.length} chars]` : content)
    console.log('  excerpt:', typeof excerpt, excerpt ? `"${excerpt.substring(0, 50)}..."` : excerpt)
    console.log('  tags:', typeof tags, Array.isArray(tags) ? `[${tags.length} items]` : tags)

    // 基础验证 - 检查所有必需字段，提供详细的错误信息
    const missingFields = []
    
    // 更严格的验证：检查字段是否存在且非空
    if (title === undefined || title === null || (typeof title === 'string' && title.trim().length === 0)) {
      missingFields.push('title')
      console.log('  -> title is missing or empty')
    }
    if (slug === undefined || slug === null || (typeof slug === 'string' && slug.trim().length === 0)) {
      missingFields.push('slug')
      console.log('  -> slug is missing or empty')
    }
    if (genre === undefined || genre === null || (typeof genre === 'string' && genre.trim().length === 0)) {
      missingFields.push('genre')
      console.log('  -> genre is missing or empty')
    }
    if (content === undefined || content === null || (typeof content === 'string' && content.trim().length === 0)) {
      missingFields.push('content')
      console.log('  -> content is missing or empty')
    }
    if (excerpt === undefined || excerpt === null || (typeof excerpt === 'string' && excerpt.trim().length === 0)) {
      missingFields.push('excerpt')
      console.log('  -> excerpt is missing or empty')
    }

    if (missingFields.length > 0) {
      console.error('Validation failed. Missing fields:', missingFields)
      return res.status(400).json({ 
        error: 'Missing required fields',
        missingFields: missingFields,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        receivedFields: req.body ? Object.keys(req.body) : []
      })
    }

    // 检查slug是否已存在
    const existing = Blog.getBySlug(slug)
    if (existing) {
      return res.status(409).json({ error: 'Slug already exists' })
    }

    const blog = Blog.create({
      title,
      slug,
      genre,
      content,
      excerpt,
      tags,
      status,
      published_at
    })

    res.status(201).json(blog)
  } catch (error) {
    console.error('Error creating blog:', error)
    res.status(500).json({ error: 'Failed to create blog' })
  }
})

/**
 * 更新博客
 * PUT /api/blogs/:id
 * 需要认证（后续实现）
 */
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const blog = Blog.getById(id)

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' })
    }

    // 如果更新slug，检查是否冲突
    if (req.body.slug && req.body.slug !== blog.slug) {
      const existing = Blog.getBySlug(req.body.slug)
      if (existing) {
        return res.status(409).json({ error: 'Slug already exists' })
      }
    }

    const updated = Blog.update(id, req.body)

    if (!updated) {
      return res.status(500).json({ error: 'Failed to update blog' })
    }

    res.json(updated)
  } catch (error) {
    console.error('Error updating blog:', error)
    res.status(500).json({ error: 'Failed to update blog' })
  }
})

/**
 * 删除博客
 * DELETE /api/blogs/:id
 * 需要认证（后续实现）
 */
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const success = Blog.delete(id)

    if (!success) {
      return res.status(404).json({ error: 'Blog not found' })
    }

    res.json({ message: 'Blog deleted successfully' })
  } catch (error) {
    console.error('Error deleting blog:', error)
    res.status(500).json({ error: 'Failed to delete blog' })
  }
})

/**
 * 增加浏览量
 * POST /api/blogs/:id/views
 */
router.post('/:id/views', (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const blog = Blog.incrementViews(id)

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' })
    }

    res.json({ views: blog.views })
  } catch (error) {
    console.error('Error incrementing views:', error)
    res.status(500).json({ error: 'Failed to increment views' })
  }
})

export default router

