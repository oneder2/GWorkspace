/**
 * 评论数据模型
 * 封装评论功能的数据库操作
 */

import { getDatabase } from '../config/database.js'
import { Blog } from './Blog.js'

/**
 * 评论模型类
 */
export class Comment {
  /**
   * 获取文章的所有评论
   * @param {number} blogId - 文章ID
   * @param {Object} options - 查询选项
   * @param {number} options.limit - 限制数量
   * @param {number} options.offset - 偏移量
   * @param {string} options.status - 状态筛选（approved/pending/spam）
   * @returns {Array} 评论列表
   */
  static getByBlogId(blogId, options = {}) {
    const db = getDatabase()
    const {
      limit = null,
      offset = 0,
      status = 'approved'
    } = options

    let query = 'SELECT * FROM comments WHERE blog_id = ? AND status = ? ORDER BY created_at ASC'
    const params = [blogId, status]

    if (limit) {
      query += ' LIMIT ? OFFSET ?'
      params.push(limit, offset)
    }

    const comments = db.prepare(query).all(...params)
    
    // 构建嵌套结构（父子关系）
    return this.buildNestedStructure(comments)
  }

  /**
   * 构建嵌套评论结构
   * @param {Array} comments - 评论列表
   * @returns {Array} 嵌套结构的评论列表
   */
  static buildNestedStructure(comments) {
    const commentMap = new Map()
    const rootComments = []

    // 第一遍：创建所有评论的映射
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] })
    })

    // 第二遍：构建父子关系
    comments.forEach(comment => {
      const commentObj = commentMap.get(comment.id)
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id)
        if (parent) {
          parent.replies.push(commentObj)
        }
      } else {
        rootComments.push(commentObj)
      }
    })

    return rootComments
  }

  /**
   * 根据ID获取评论
   * @param {number} id - 评论ID
   * @returns {Object|null} 评论对象
   */
  static getById(id) {
    const db = getDatabase()
    return db.prepare('SELECT * FROM comments WHERE id = ?').get(id) || null
  }

  /**
   * 创建新评论
   * @param {Object} data - 评论数据
   * @returns {Object} 创建的评论对象
   */
  static create(data) {
    const db = getDatabase()
    const {
      blog_id,
      parent_id = null,
      author_name,
      author_email = null,
      content,
      status = 'approved'
    } = data

    const now = new Date().toISOString()

    const result = db.prepare(`
      INSERT INTO comments (blog_id, parent_id, author_name, author_email, content, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      blog_id,
      parent_id,
      author_name,
      author_email,
      content,
      status,
      now,
      now
    )

    // 更新文章的评论数（冗余字段）
    const count = this.getCountByBlogId(blog_id)
    Blog.updateCommentsCount(blog_id, count)

    return this.getById(result.lastInsertRowid)
  }

  /**
   * 更新评论
   * @param {number} id - 评论ID
   * @param {Object} data - 更新数据
   * @returns {Object|null} 更新后的评论对象
   */
  static update(id, data) {
    const db = getDatabase()
    const comment = this.getById(id)
    
    if (!comment) return null

    const {
      author_name,
      author_email,
      content,
      status
    } = data

    const updateFields = []
    const updateValues = []

    if (author_name !== undefined) {
      updateFields.push('author_name = ?')
      updateValues.push(author_name)
    }
    if (author_email !== undefined) {
      updateFields.push('author_email = ?')
      updateValues.push(author_email)
    }
    if (content !== undefined) {
      updateFields.push('content = ?')
      updateValues.push(content)
    }
    if (status !== undefined) {
      updateFields.push('status = ?')
      updateValues.push(status)
    }

    // 更新updated_at
    updateFields.push('updated_at = ?')
    updateValues.push(new Date().toISOString())

    updateValues.push(id)

    const query = `UPDATE comments SET ${updateFields.join(', ')} WHERE id = ?`
    db.prepare(query).run(...updateValues)

    // 如果状态改变，更新评论数
    if (status !== undefined && comment.blog_id) {
      const count = this.getCountByBlogId(comment.blog_id)
      Blog.updateCommentsCount(comment.blog_id, count)
    }

    return this.getById(id)
  }

  /**
   * 删除评论
   * @param {number} id - 评论ID
   * @returns {boolean} 是否删除成功
   */
  static delete(id) {
    const db = getDatabase()
    const comment = this.getById(id)
    
    if (!comment) return false

    const result = db.prepare('DELETE FROM comments WHERE id = ?').run(id)
    
    if (result.changes > 0) {
      // 更新文章的评论数（冗余字段）
      const count = this.getCountByBlogId(comment.blog_id)
      Blog.updateCommentsCount(comment.blog_id, count)
      return true
    }
    
    return false
  }

  /**
   * 获取文章的评论数
   * @param {number} blogId - 文章ID
   * @param {string} status - 状态筛选（可选）
   * @returns {number} 评论数
   */
  static getCountByBlogId(blogId, status = 'approved') {
    const db = getDatabase()
    const result = db.prepare('SELECT COUNT(*) as count FROM comments WHERE blog_id = ? AND status = ?').get(blogId, status)
    return result.count || 0
  }

  /**
   * 回复评论
   * @param {number} parentId - 父评论ID
   * @param {Object} data - 评论数据
   * @returns {Object} 创建的评论对象
   */
  static reply(parentId, data) {
    const parent = this.getById(parentId)
    if (!parent) {
      throw new Error('Parent comment not found')
    }

    return this.create({
      ...data,
      blog_id: parent.blog_id,
      parent_id: parentId
    })
  }
}

