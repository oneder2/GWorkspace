/**
 * 博客API路由
 * 处理博客文章的CRUD操作
 */

import express from 'express'
import { Blog } from '../models/Blog.js'

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
      status,
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

    // 基础验证
    if (!title || !slug || !genre || !content || !excerpt) {
      return res.status(400).json({ error: 'Missing required fields' })
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

