/**
 * 留言板数据模型
 * 封装留言板的数据库操作
 */

import { getDatabase } from '../config/database.js'

/**
 * 留言板模型类
 */
export class Guestbook {
  /**
   * 获取所有留言
   * @param {Object} options - 查询选项
   * @param {string} options.status - 状态筛选（approved/pending/spam）
   * @param {number} options.limit - 限制数量
   * @param {number} options.offset - 偏移量
   * @param {string} options.sortBy - 排序字段（created_at）
   * @param {string} options.sortOrder - 排序方向（asc/desc）
   * @returns {Array} 留言列表
   */
  static getAll(options = {}) {
    const db = getDatabase()
    const {
      status = 'approved',
      limit = null,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options

    let query = 'SELECT * FROM guestbook WHERE 1=1'
    const params = []

    if (status) {
      query += ' AND status = ?'
      params.push(status)
    }

    // 排序
    const validSortFields = ['created_at', 'updated_at']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at'
    const sortDir = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC'
    query += ` ORDER BY ${sortField} ${sortDir}`

    // 分页
    if (limit) {
      query += ' LIMIT ? OFFSET ?'
      params.push(limit, offset)
    }

    return db.prepare(query).all(...params)
  }

  /**
   * 根据ID获取留言
   * @param {number} id - 留言ID
   * @returns {Object|null} 留言对象
   */
  static getById(id) {
    const db = getDatabase()
    return db.prepare('SELECT * FROM guestbook WHERE id = ?').get(id)
  }

  /**
   * 创建新留言
   * @param {Object} data - 留言数据
   * @returns {Object} 创建的留言对象
   */
  static create(data) {
    const db = getDatabase()
    const {
      user_id = null,
      author_name = null,
      author_email = null,
      content,
      status = 'approved',
      ip_address = null,
      user_agent = null
    } = data

    if (!content || !content.trim()) {
      throw new Error('Content is required')
    }

    const now = new Date().toISOString()

    // 检查user_id列是否存在（兼容旧数据库）
    let hasUserIdColumn = false
    try {
      const tableInfo = db.prepare("PRAGMA table_info(guestbook)").all()
      hasUserIdColumn = tableInfo.some(col => col.name === 'user_id')
    } catch (error) {
      // 忽略错误
    }

    let query, params
    if (hasUserIdColumn) {
      query = `
        INSERT INTO guestbook (user_id, author_name, author_email, content, status, ip_address, user_agent, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      params = [user_id, author_name, author_email, content.trim(), status, ip_address, user_agent, now, now]
    } else {
      query = `
        INSERT INTO guestbook (author_name, author_email, content, status, ip_address, user_agent, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
      params = [author_name, author_email, content.trim(), status, ip_address, user_agent, now, now]
    }

    const result = db.prepare(query).run(...params)

    return this.getById(result.lastInsertRowid)
  }

  /**
   * 更新留言
   * @param {number} id - 留言ID
   * @param {Object} data - 更新数据
   * @returns {Object|null} 更新后的留言对象
   */
  static update(id, data) {
    const db = getDatabase()
    const guestbook = this.getById(id)
    
    if (!guestbook) return null

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
      updateValues.push(content.trim())
    }
    if (status !== undefined) {
      updateFields.push('status = ?')
      updateValues.push(status)
    }

    // 更新updated_at
    updateFields.push('updated_at = ?')
    updateValues.push(new Date().toISOString())

    updateValues.push(id)

    const query = `UPDATE guestbook SET ${updateFields.join(', ')} WHERE id = ?`
    db.prepare(query).run(...updateValues)

    return this.getById(id)
  }

  /**
   * 删除留言
   * @param {number} id - 留言ID
   * @returns {boolean} 是否删除成功
   */
  static delete(id) {
    const db = getDatabase()
    const result = db.prepare('DELETE FROM guestbook WHERE id = ?').run(id)
    return result.changes > 0
  }

  /**
   * 获取留言总数
   * @param {string} status - 状态筛选
   * @returns {number} 留言总数
   */
  static getCount(status = null) {
    const db = getDatabase()
    if (status) {
      return db.prepare('SELECT COUNT(*) as count FROM guestbook WHERE status = ?').get(status).count
    }
    return db.prepare('SELECT COUNT(*) as count FROM guestbook').get().count
  }
}

