/**
 * 博客API路由
 * 处理博客文章的CRUD操作
 */

import express from 'express'
import { Blog } from '../models/Blog.js'
import { getDatabase } from '../config/database.js'
import { generateBlogImage } from '../utils/imageGenerator.js'
import { normalizePublishedAt } from '../utils/blogDate.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

const VALID_BLOG_STATUSES = new Set(['published', 'draft'])
const UNTITLED_DRAFT_TITLE = '未命名文件'
const PUBLIC_PAGE_LIMIT = 24

const isBlankString = (value) => (
  value === undefined ||
  value === null ||
  (typeof value === 'string' && value.trim().length === 0)
)

const normalizeSlugSeed = (value) => (
  String(value || '')
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
)

const createUniqueDraftSlug = (seed = 'draft', currentId = null) => {
  const base = normalizeSlugSeed(seed) || 'draft'
  let candidate = ''

  do {
    candidate = `${base}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  } while ((() => {
    const existing = Blog.getBySlug(candidate)
    return existing && existing.id !== currentId
  })())

  return candidate
}

const sanitizeBlogPayload = (payload = {}) => ({
  ...payload,
  title: typeof payload.title === 'string' ? payload.title.trim() : payload.title,
  slug: typeof payload.slug === 'string' ? payload.slug.trim() : payload.slug,
  status: typeof payload.status === 'string' ? payload.status.trim() : payload.status,
  genre: typeof payload.genre === 'string' ? payload.genre.trim() : payload.genre,
  content: typeof payload.content === 'string' ? payload.content.trim() : payload.content,
  excerpt: typeof payload.excerpt === 'string' ? payload.excerpt.trim() : payload.excerpt,
  tags: Array.isArray(payload.tags)
    ? payload.tags
        .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
        .map(tag => tag.trim())
    : payload.tags,
  raw_published_at: payload.published_at,
  published_at: payload.published_at === undefined
    ? undefined
    : normalizePublishedAt(payload.published_at)
})

const applyDraftFallbacks = (payload, existingBlog = null) => {
  const status = payload.status || existingBlog?.status || 'published'

  if (status !== 'draft') {
    return payload
  }

  const nextPayload = { ...payload }
  const shouldFillTitle = isBlankString(nextPayload.title) && (nextPayload.title !== undefined || !existingBlog)
  const autoFilledTitle = shouldFillTitle

  if (shouldFillTitle) {
    nextPayload.title = UNTITLED_DRAFT_TITLE
  }

  const hasPlaceholderSlug = autoFilledTitle && normalizeSlugSeed(nextPayload.slug) === normalizeSlugSeed(UNTITLED_DRAFT_TITLE)

  if (isBlankString(nextPayload.slug) || hasPlaceholderSlug) {
    if (existingBlog?.slug && nextPayload.slug !== undefined) {
      nextPayload.slug = existingBlog.slug
    } else if (!existingBlog || nextPayload.slug !== undefined) {
      const slugSeed = !isBlankString(nextPayload.title)
        ? nextPayload.title
        : existingBlog?.title || UNTITLED_DRAFT_TITLE
      nextPayload.slug = createUniqueDraftSlug(slugSeed, existingBlog?.id ?? null)
    }
  }

  return nextPayload
}

const validateBlogPayload = (payload, existingBlog = null) => {
  const status = payload.status || existingBlog?.status || 'published'
  const effective = { ...existingBlog, ...payload, status }
  const missingFields = []
  const invalidFields = []

  if (!VALID_BLOG_STATUSES.has(status)) {
    invalidFields.push('status')
  }

  if (payload.raw_published_at !== undefined && !isBlankString(payload.raw_published_at) && effective.published_at === null) {
    invalidFields.push('published_at')
  }

  if (status === 'published') {
    if (isBlankString(effective.title)) missingFields.push('title')
    if (isBlankString(effective.slug)) missingFields.push('slug')
    if (isBlankString(effective.genre)) missingFields.push('genre')
    if (isBlankString(effective.content)) missingFields.push('content')
    if (isBlankString(effective.excerpt)) missingFields.push('excerpt')
    if (!Array.isArray(effective.tags) || effective.tags.length === 0) missingFields.push('tags')
    if (isBlankString(effective.published_at)) missingFields.push('published_at')
  }

  return { status, missingFields, invalidFields }
}

const parsePositiveInteger = (value, fallback = 0) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

const parseListLimit = (value) => {
  if (value === undefined) return null
  const parsed = parsePositiveInteger(value, 0)
  if (parsed <= 0) return null
  return Math.min(parsed, PUBLIC_PAGE_LIMIT)
}

/**
 * 获取文章动态预览图/海报
 * GET /api/blogs/:id/og-image
 * 参数: type=poster (生成带二维码的海报)
 */
router.get('/:id/og-image', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const isPoster = req.query.type === 'poster'
    const blog = Blog.getById(id)

    if (!blog || blog.status !== 'published') {
      return res.status(404).json({ error: 'Blog not found' })
    }

    // 获取前端 Origin
    // 优先使用请求头中的 Origin，否则从 Referer 中解析出 Origin 部分
    let frontendOrigin = req.get('origin')
    if (!frontendOrigin && req.get('referer')) {
      try {
        const refUrl = new URL(req.get('referer'))
        frontendOrigin = refUrl.origin
      } catch (e) {
        // 解析失败则留空
      }
    }
    
    // 兜底方案：如果是本地开发且拿不到头信息，才使用请求的主机名（仅作万一之计）
    if (!frontendOrigin) {
      frontendOrigin = `${req.protocol}://${req.get('host')}`
    }

    const blogUrl = `${frontendOrigin}/blog/${blog.id}`

    // 生成图片
    try {
      const { buffer, contentType } = await generateBlogImage({
        title: blog.title,
        genre: blog.genre || blog.category || 'Tech',
        excerpt: blog.excerpt,
        date: blog.published_at || blog.created_at,
        slug: blog.slug,
        updatedAt: blog.updated_at,
        url: blogUrl,
        isPoster: isPoster
      })

      // 设置响应头并发送图片
      res.set('Content-Type', contentType || 'image/png')
      res.set('Cache-Control', 'public, max-age=86400')
      res.send(buffer)
    } catch (genError) {
      console.error('[OG-Image] Generation totally failed:', genError.message)
      if (blog.image) {
        return res.redirect(blog.image)
      }
      res.status(500).json({ error: 'Image generation service unavailable' })
    }
  } catch (error) {
    console.error('Error generating blog image:', error)
    res.status(500).json({ error: 'Failed to generate image' })
  }
})

/**
 * 获取博客列表
 * GET /api/blogs
 * 查询参数：
 * - genre: 分类筛选
 * - tag: 标签筛选
 * - archive: 归档筛选（YYYY-MM）
 * - search: 搜索关键词
 * - limit: 限制数量
 * - offset: 偏移量
 * - sortBy: 排序字段（date/views/likes/title）
 * - sortOrder: 排序方向（asc/desc）
 */
router.get('/', (req, res) => {
  try {
    const {
      genre,
      tag,
      archive,
      search,
      limit,
      offset = 0,
      sortBy = 'published_at',
      sortOrder = 'desc'
    } = req.query

    const options = {
      genre: genre || null,
      tag: tag || null,
      archive: archive || null,
      search: search || null,
      status: 'published',
      limit: parseListLimit(limit),
      offset: parsePositiveInteger(offset, 0),
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
 * 获取博客筛选元数据
 * GET /api/blogs/metadata
 * 返回完整已发布文章集上的分类、标签、归档统计
 */
router.get('/metadata', (req, res) => {
  try {
    const metadata = Blog.getMetadata('published')
    res.json(metadata)
  } catch (error) {
    console.error('Error fetching blog metadata:', error)
    res.status(500).json({ error: 'Failed to fetch blog metadata' })
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
 * 获取所有分类（Genre）
 * GET /api/blogs/genres
 * 注意：必须在 /:id 路由之前定义，否则会被当作ID处理
 */
router.get('/genres', (req, res) => {
  try {
    const genres = Blog.getAllGenres('published')
    res.json(genres)
  } catch (error) {
    console.error('Error fetching genres:', error)
    res.status(500).json({ error: 'Failed to fetch genres' })
  }
})

/**
 * 获取所有标签（Tags）
 * GET /api/blogs/tags
 * 注意：必须在 /:id 路由之前定义，否则会被当作ID处理
 */
router.get('/tags', (req, res) => {
  try {
    const tags = Blog.getAllTags('published')
    res.json(tags)
  } catch (error) {
    console.error('Error fetching tags:', error)
    res.status(500).json({ error: 'Failed to fetch tags' })
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

    if (!blog || blog.status !== 'published') {
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

    if (!blog || blog.status !== 'published') {
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
router.post('/', authenticate, requireAdmin, (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ 
        error: 'Request body is missing or not parsed',
        message: 'The request body could not be parsed. Please check Content-Type header and request format.'
      })
    }

    let payload = sanitizeBlogPayload({
      tags: [],
      status: 'published',
      published_at: null,
      ...req.body
    })
    payload = applyDraftFallbacks(payload)
    const { missingFields, invalidFields } = validateBlogPayload(payload)

    if (invalidFields.length > 0) {
      return res.status(400).json({
        error: 'Invalid fields',
        invalidFields,
        message: `Invalid fields: ${invalidFields.join(', ')}`
      })
    }
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        missingFields,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        receivedFields: req.body ? Object.keys(req.body) : []
      })
    }

    // 检查slug是否已存在
    const existing = Blog.getBySlug(payload.slug)
    if (existing) {
      return res.status(409).json({ error: 'Slug already exists' })
    }

    const blog = Blog.create(payload)

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
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const blog = Blog.getById(id)

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' })
    }

    let payload = sanitizeBlogPayload(req.body || {})
    payload = applyDraftFallbacks(payload, blog)
    const { missingFields, invalidFields } = validateBlogPayload(payload, blog)

    if (invalidFields.length > 0) {
      return res.status(400).json({
        error: 'Invalid fields',
        invalidFields,
        message: `Invalid fields: ${invalidFields.join(', ')}`
      })
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missingFields,
        message: `Missing required fields: ${missingFields.join(', ')}`
      })
    }

    // 如果更新slug，检查是否冲突
    if (payload.slug && payload.slug !== blog.slug) {
      const existing = Blog.getBySlug(payload.slug)
      if (existing) {
        return res.status(409).json({ error: 'Slug already exists' })
      }
    }

    const updated = Blog.update(id, payload)

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
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
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
    const existingBlog = Blog.getById(id)
    if (!existingBlog || existingBlog.status !== 'published') {
      return res.status(404).json({ error: 'Blog not found' })
    }

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
