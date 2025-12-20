/**
 * 博客数据模型
 * 封装博客文章的数据库操作
 */

import { getDatabase } from '../config/database.js'

/**
 * 博客模型类
 */
export class Blog {
  /**
   * 获取所有博客文章
   * @param {Object} options - 查询选项
   * @param {string} options.genre - 分类筛选
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
      status = 'published',
      limit = null,
      offset = 0,
      sortBy = 'published_at',
      sortOrder = 'desc'
    } = options

    let query = 'SELECT * FROM blogs WHERE 1=1'
    const params = []

    if (genre) {
      query += ' AND genre = ?'
      params.push(genre)
    }

    // status为null时不过滤状态（用于获取所有博客）
    if (status !== null && status !== undefined) {
      query += ' AND status = ?'
      params.push(status)
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
    
    // 解析tags JSON字符串
    return blogs.map(blog => ({
      ...blog,
      tags: blog.tags ? JSON.parse(blog.tags) : []
    }))
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
    
    return {
      ...blog,
      tags: blog.tags ? JSON.parse(blog.tags) : []
    }
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
    
    return {
      ...blog,
      tags: blog.tags ? JSON.parse(blog.tags) : []
    }
  }

  /**
   * 创建新博客文章
   * @param {Object} data - 文章数据
   * @returns {Object} 创建的文章对象
   */
  static create(data) {
    const db = getDatabase()
    const {
      title,
      slug,
      genre,
      content,
      excerpt,
      tags = [],
      status = 'published',
      published_at = null
    } = data

    const now = new Date().toISOString()
    const publishedAt = published_at || (status === 'published' ? now : null)

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

    const {
      title,
      slug,
      genre,
      content,
      excerpt,
      tags,
      status,
      published_at
    } = data

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
    }
    if (published_at !== undefined) {
      updateFields.push('published_at = ?')
      updateValues.push(published_at)
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
   * @returns {Array} 分类列表
   */
  static getAllGenres() {
    const db = getDatabase()
    const result = db.prepare('SELECT DISTINCT genre FROM blogs WHERE status = ?').all('published')
    return result.map(row => row.genre).filter(Boolean)
  }

  /**
   * 获取所有标签
   * @returns {Array} 标签列表
   */
  static getAllTags() {
    const db = getDatabase()
    const blogs = db.prepare('SELECT tags FROM blogs WHERE status = ? AND tags IS NOT NULL').all('published')
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
}

