/**
 * 博客数据模型
 * 封装博客文章的数据库操作
 */

import { getDatabase } from '../config/database.js'
import { getTodayDateString, normalizePublishedAt } from '../utils/blogDate.js'

const UNTITLED_DRAFT_TITLE = '未命名文件'

const normalizeSlugSeed = (value) => (
  String(value || '')
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
)

const createUniqueDraftSlug = (seed = 'draft', excludeId = null) => {
  const db = getDatabase()
  const base = normalizeSlugSeed(seed) || 'draft'
  let candidate = ''

  do {
    candidate = `${base}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
    const existing = db.prepare('SELECT id FROM blogs WHERE slug = ?').get(candidate)
    if (!existing || existing.id === excludeId) {
      return candidate
    }
  } while (true)
}

const resolveDraftPersistedFields = (data, existingBlog = null) => {
  const status = data.status ?? existingBlog?.status ?? 'published'

  if (status !== 'draft') {
    return data
  }

  const nextData = { ...data }
  const shouldFillTitle = (
    (nextData.title === undefined && !existingBlog) ||
    (typeof nextData.title === 'string' && nextData.title.trim().length === 0)
  )
  const autoFilledTitle = shouldFillTitle

  if (shouldFillTitle) {
    nextData.title = UNTITLED_DRAFT_TITLE
  }

  const slugIsBlank = nextData.slug === undefined || (typeof nextData.slug === 'string' && nextData.slug.trim().length === 0)
  const hasPlaceholderSlug = autoFilledTitle && normalizeSlugSeed(nextData.slug) === normalizeSlugSeed(UNTITLED_DRAFT_TITLE)
  if (slugIsBlank || hasPlaceholderSlug) {
    if (existingBlog?.slug && nextData.slug !== undefined) {
      nextData.slug = existingBlog.slug
    } else if (!existingBlog || nextData.slug !== undefined) {
      nextData.slug = createUniqueDraftSlug(nextData.title || existingBlog?.title || UNTITLED_DRAFT_TITLE, existingBlog?.id ?? null)
    }
  }

  return nextData
}

const parseTagsSafely = (value) => {
  if (!value) return []

  try {
    const tags = JSON.parse(value)
    return Array.isArray(tags) ? tags : []
  } catch (error) {
    return []
  }
}

const normalizeBlogRecord = (blog) => ({
  ...blog,
  tags: parseTagsSafely(blog.tags)
})

const escapeLikePattern = (value) => (
  String(value).replace(/[\\%_]/g, match => `\\${match}`)
)

const buildQueryFilters = (options = {}) => {
  const {
    genre = null,
    tag = null,
    archive = null,
    search = null,
    status = 'published'
  } = options

  const clauses = []
  const params = []

  if (genre) {
    clauses.push('genre = ?')
    params.push(genre)
  }

  if (tag) {
    clauses.push('tags LIKE ? ESCAPE \'\\\\\'')
    params.push(`%${escapeLikePattern(JSON.stringify(tag))}%`)
  }

  if (archive) {
    clauses.push('substr(COALESCE(published_at, created_at), 1, 7) = ?')
    params.push(archive)
  }

  if (search) {
    const pattern = `%${escapeLikePattern(search.trim())}%`
    clauses.push(`(
      title LIKE ? ESCAPE '\\' COLLATE NOCASE OR
      excerpt LIKE ? ESCAPE '\\' COLLATE NOCASE OR
      content LIKE ? ESCAPE '\\' COLLATE NOCASE OR
      genre LIKE ? ESCAPE '\\' COLLATE NOCASE OR
      tags LIKE ? ESCAPE '\\' COLLATE NOCASE
    )`)
    params.push(pattern, pattern, pattern, pattern, pattern)
  }

  if (status !== null && status !== undefined) {
    clauses.push('status = ?')
    params.push(status)
  }

  return { clauses, params }
}

const getArchiveKey = (value) => {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  return /^\d{4}-\d{2}/.test(trimmed) ? trimmed.slice(0, 7) : ''
}

/**
 * 博客模型类
 */
export class Blog {
  /**
   * 获取所有博客文章
   * @param {Object} options - 查询选项
   * @param {string} options.genre - 分类筛选
   * @param {string} options.tag - 标签筛选
   * @param {string} options.archive - 归档筛选（YYYY-MM）
   * @param {string} options.search - 搜索关键词
   * @param {string} options.status - 状态筛选（published/draft）
   * @param {number} options.limit - 限制数量
   * @param {number} options.offset - 偏移量
   * @param {string} options.sortBy - 排序字段（date/views/likes）
   * @param {string} options.sortOrder - 排序方向（asc/desc）
   * @returns {Array} 博客文章列表
   */
  static getAll(options = {}) {
    const db = getDatabase()
    const {
      genre = null,
      tag = null,
      archive = null,
      search = null,
      status = 'published',
      limit = null,
      offset = 0,
      sortBy = 'published_at',
      sortOrder = 'desc'
    } = options

    let query = 'SELECT * FROM blogs WHERE 1=1'
    const { clauses, params } = buildQueryFilters({
      genre,
      tag,
      archive,
      search,
      status
    })

    if (clauses.length > 0) {
      query += ` AND ${clauses.join(' AND ')}`
    }

    // 排序
    const validSortFields = ['published_at', 'created_at', 'updated_at', 'views', 'likes_count', 'title']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'published_at'
    const sortDir = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC'
    query += ` ORDER BY ${sortField} ${sortDir}`

    // 分页
    if (limit) {
      query += ' LIMIT ? OFFSET ?'
      params.push(limit, offset)
    }

    const blogs = db.prepare(query).all(...params)

    return blogs.map(normalizeBlogRecord)
  }

  /**
   * 根据ID获取博客文章
   * @param {number} id - 文章ID
   * @returns {Object|null} 博客文章对象
   */
  static getById(id) {
    const db = getDatabase()
    const blog = db.prepare('SELECT * FROM blogs WHERE id = ?').get(id)
    
    if (!blog) return null

    return normalizeBlogRecord(blog)
  }

  /**
   * 根据slug获取博客文章
   * @param {string} slug - 文章slug
   * @returns {Object|null} 博客文章对象
   */
  static getBySlug(slug) {
    const db = getDatabase()
    const blog = db.prepare('SELECT * FROM blogs WHERE slug = ?').get(slug)
    
    if (!blog) return null

    return normalizeBlogRecord(blog)
  }

  /**
   * 创建新博客文章
   * @param {Object} data - 文章数据
   * @returns {Object} 创建的文章对象
   */
  static create(data) {
    const db = getDatabase()
    const persistedData = resolveDraftPersistedFields(data)
    const {
      title,
      slug,
      genre,
      content,
      excerpt,
      tags = [],
      status = 'published',
      published_at = null
    } = persistedData

    const now = new Date().toISOString()
    const normalizedPublishedAt = normalizePublishedAt(published_at)
    const shouldAutoFillPublishedAt = published_at === undefined || published_at === null || published_at === ''
    const publishedAt = normalizedPublishedAt ?? (status === 'published' && shouldAutoFillPublishedAt ? getTodayDateString() : null)

    const result = db.prepare(`
      INSERT INTO blogs (title, slug, genre, content, excerpt, tags, status, published_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title,
      slug,
      genre,
      content,
      excerpt,
      JSON.stringify(tags),
      status,
      publishedAt,
      now,
      now
    )

    return this.getById(result.lastInsertRowid)
  }

  /**
   * 更新博客文章
   * @param {number} id - 文章ID
   * @param {Object} data - 更新数据
   * @returns {Object|null} 更新后的文章对象
   */
  static update(id, data) {
    const db = getDatabase()
    const blog = this.getById(id)
    
    if (!blog) return null

    const persistedData = resolveDraftPersistedFields(data, blog)

    const {
      title,
      slug,
      genre,
      content,
      excerpt,
      tags,
      status,
      published_at
    } = persistedData

    const updateFields = []
    const updateValues = []

    if (title !== undefined) {
      updateFields.push('title = ?')
      updateValues.push(title)
    }
    if (slug !== undefined) {
      updateFields.push('slug = ?')
      updateValues.push(slug)
    }
    if (genre !== undefined) {
      updateFields.push('genre = ?')
      updateValues.push(genre)
    }
    if (content !== undefined) {
      updateFields.push('content = ?')
      updateValues.push(content)
    }
    if (excerpt !== undefined) {
      updateFields.push('excerpt = ?')
      updateValues.push(excerpt)
    }
    if (tags !== undefined) {
      updateFields.push('tags = ?')
      updateValues.push(JSON.stringify(tags))
    }
    if (status !== undefined) {
      updateFields.push('status = ?')
      updateValues.push(status)
      
      // 如果状态从草稿变为已发布，且之前没有发布时间，则设置发布时间
      if (status === 'published' && (!blog.published_at) && published_at === undefined) {
        updateFields.push('published_at = ?')
        updateValues.push(getTodayDateString())
      }
    }
    if (published_at !== undefined) {
      updateFields.push('published_at = ?')
      updateValues.push(normalizePublishedAt(published_at))
    }

    // 更新updated_at
    updateFields.push('updated_at = ?')
    updateValues.push(new Date().toISOString())

    updateValues.push(id)

    const query = `UPDATE blogs SET ${updateFields.join(', ')} WHERE id = ?`
    db.prepare(query).run(...updateValues)

    return this.getById(id)
  }

  /**
   * 删除博客文章
   * @param {number} id - 文章ID
   * @returns {boolean} 是否删除成功
   */
  static delete(id) {
    const db = getDatabase()
    const result = db.prepare('DELETE FROM blogs WHERE id = ?').run(id)
    return result.changes > 0
  }

  /**
   * 增加浏览量
   * @param {number} id - 文章ID
   * @returns {Object|null} 更新后的文章对象
   */
  static incrementViews(id) {
    const db = getDatabase()
    db.prepare('UPDATE blogs SET views = views + 1 WHERE id = ?').run(id)
    return this.getById(id)
  }

  /**
   * 更新点赞数（冗余字段）
   * @param {number} id - 文章ID
   * @param {number} count - 新的点赞数
   */
  static updateLikesCount(id, count) {
    const db = getDatabase()
    db.prepare('UPDATE blogs SET likes_count = ? WHERE id = ?').run(count, id)
  }

  /**
   * 更新评论数（冗余字段）
   * @param {number} id - 文章ID
   * @param {number} count - 新的评论数
   */
  static updateCommentsCount(id, count) {
    const db = getDatabase()
    db.prepare('UPDATE blogs SET comments_count = ? WHERE id = ?').run(count, id)
  }

  /**
   * 获取所有分类
   * @param {string} status - 状态筛选（可选，默认获取所有状态）
   * @returns {Array} 分类列表
   */
  static getAllGenres(status = null) {
    const db = getDatabase()
    let query = 'SELECT DISTINCT genre FROM blogs WHERE genre IS NOT NULL'
    const params = []
    
    if (status) {
      query += ' AND status = ?'
      params.push(status)
    }
    
    const result = db.prepare(query).all(...params)
    return result.map(row => row.genre).filter(Boolean)
  }

  /**
   * 获取所有标签
   * @param {string} status - 状态筛选（可选，默认获取所有状态）
   * @returns {Array} 标签列表
   */
  static getAllTags(status = null) {
    const db = getDatabase()
    let query = 'SELECT tags FROM blogs WHERE tags IS NOT NULL'
    const params = []
    
    if (status) {
      query += ' AND status = ?'
      params.push(status)
    }
    
    const blogs = db.prepare(query).all(...params)
    const tagSet = new Set()
    
    blogs.forEach(blog => {
      try {
        const tags = JSON.parse(blog.tags)
        if (Array.isArray(tags)) {
          tags.forEach(tag => tagSet.add(tag))
        }
      } catch (e) {
        // 忽略解析错误
      }
    })
    
    return Array.from(tagSet)
  }

  /**
   * 获取公开博客的完整筛选元数据
   * @param {string|null} status - 状态筛选
   * @returns {{genres: Array, tags: Array, archives: Array}}
   */
  static getMetadata(status = 'published') {
    const db = getDatabase()

    const genres = db.prepare(`
      SELECT genre AS value, COUNT(*) AS count
      FROM blogs
      WHERE genre IS NOT NULL AND TRIM(genre) != '' ${status ? 'AND status = ?' : ''}
      GROUP BY genre
      ORDER BY count DESC, value ASC
    `).all(...(status ? [status] : []))

    const tagRows = db.prepare(`
      SELECT tags
      FROM blogs
      WHERE tags IS NOT NULL ${status ? 'AND status = ?' : ''}
    `).all(...(status ? [status] : []))

    const tagCounts = new Map()
    tagRows.forEach(row => {
      const uniqueTags = new Set(parseTagsSafely(row.tags))
      uniqueTags.forEach(tag => {
        if (!tag) return
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      })
    })

    const archiveRows = db.prepare(`
      SELECT COALESCE(published_at, created_at) AS date_value
      FROM blogs
      WHERE COALESCE(published_at, created_at) IS NOT NULL ${status ? 'AND status = ?' : ''}
    `).all(...(status ? [status] : []))

    const archiveCounts = new Map()
    archiveRows.forEach(row => {
      const archiveKey = getArchiveKey(row.date_value)
      if (!archiveKey) return
      archiveCounts.set(archiveKey, (archiveCounts.get(archiveKey) || 0) + 1)
    })

    return {
      genres,
      tags: Array.from(tagCounts.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => {
          if (b.count !== a.count) return b.count - a.count
          return a.value.localeCompare(b.value)
        }),
      archives: Array.from(archiveCounts.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.value.localeCompare(a.value))
    }
  }
}
