/**
 * 用户数据模型
 * 封装用户相关的数据库操作
 */

import { getDatabase } from '../config/database.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

/**
 * 用户模型类
 */
export class User {
  /**
   * 根据ID获取用户
   * @param {number} id - 用户ID
   * @returns {Object|null} 用户对象（不包含密码）
   */
  static getById(id) {
    const db = getDatabase()
    const user = db.prepare('SELECT id, username, email, role, avatar, created_at, updated_at, last_login_at FROM users WHERE id = ?').get(id)
    return user || null
  }

  /**
   * 根据用户名获取用户
   * @param {string} username - 用户名
   * @returns {Object|null} 用户对象（包含密码哈希）
   */
  static getByUsername(username) {
    const db = getDatabase()
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
    return user || null
  }

  /**
   * 根据邮箱获取用户
   * @param {string} email - 邮箱
   * @returns {Object|null} 用户对象（包含密码哈希）
   */
  static getByEmail(email) {
    const db = getDatabase()
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
    return user || null
  }

  /**
   * 创建新用户
   * @param {Object} data - 用户数据
   * @param {string} data.username - 用户名
   * @param {string} data.email - 邮箱
   * @param {string} data.password - 密码（明文）
   * @param {string} data.role - 角色（可选，默认'user'）
   * @returns {Object} 创建的用户对象（不包含密码）
   */
  static async create(data) {
    const db = getDatabase()
    const { username, email, password, role = 'user', avatar = null } = data

    // 检查用户名是否已存在
    if (this.getByUsername(username)) {
      throw new Error('Username already exists')
    }

    // 检查邮箱是否已存在
    if (this.getByEmail(email)) {
      throw new Error('Email already exists')
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10)

    const now = new Date().toISOString()

    const result = db.prepare(`
      INSERT INTO users (username, email, password_hash, role, avatar, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(username, email, passwordHash, role, avatar, now, now)

    return this.getById(result.lastInsertRowid)
  }

  /**
   * 验证用户密码
   * @param {string} username - 用户名
   * @param {string} password - 密码（明文）
   * @returns {Object|null} 用户对象（不包含密码），验证失败返回null
   */
  static async verifyPassword(username, password) {
    const user = this.getByUsername(username)
    if (!user) {
      return null
    }

    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      return null
    }

    // 更新最后登录时间（地区信息由登录API负责更新）
    const db = getDatabase()
    db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(new Date().toISOString(), user.id)

    // 返回不包含密码的用户对象
    return this.getById(user.id)
  }

  /**
   * 生成JWT token
   * @param {Object} user - 用户对象
   * @returns {string} JWT token
   */
  static generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )
  }

  /**
   * 验证JWT token
   * @param {string} token - JWT token
   * @returns {Object|null} 解码后的token数据，验证失败返回null
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return null
    }
  }

  /**
   * 保存会话
   * @param {number} userId - 用户ID
   * @param {string} token - JWT token
   * @param {Date} expiresAt - 过期时间
   * @returns {Object} 会话对象
   */
  static saveSession(userId, token, expiresAt) {
    const db = getDatabase()
    
    // 删除过期的会话
    db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(new Date().toISOString())

    const result = db.prepare(`
      INSERT INTO sessions (user_id, token, expires_at, created_at)
      VALUES (?, ?, ?, ?)
    `).run(userId, token, expiresAt.toISOString(), new Date().toISOString())

    return {
      id: result.lastInsertRowid,
      user_id: userId,
      token,
      expires_at: expiresAt
    }
  }

  /**
   * 删除会话
   * @param {string} token - JWT token
   * @returns {boolean} 是否删除成功
   */
  static deleteSession(token) {
    const db = getDatabase()
    const result = db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
    return result.changes > 0
  }

  /**
   * 删除用户的所有会话
   * @param {number} userId - 用户ID
   * @returns {number} 删除的会话数量
   */
  static deleteAllSessions(userId) {
    const db = getDatabase()
    const result = db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId)
    return result.changes
  }

  /**
   * 检查会话是否有效
   * @param {string} token - JWT token
   * @returns {boolean} 会话是否有效
   */
  static isSessionValid(token) {
    const db = getDatabase()
    const session = db.prepare('SELECT * FROM sessions WHERE token = ? AND expires_at > ?').get(token, new Date().toISOString())
    return !!session
  }

  /**
   * 更新用户信息
   * @param {number} id - 用户ID
   * @param {Object} data - 更新数据
   * @returns {Object|null} 更新后的用户对象
   */
  static update(id, data) {
    const db = getDatabase()
    const user = this.getById(id)
    
    if (!user) return null

    const { username, email, avatar, role } = data
    const updateFields = []
    const updateValues = []

    if (username !== undefined) {
      // 检查用户名是否冲突
      const existing = this.getByUsername(username)
      if (existing && existing.id !== id) {
        throw new Error('Username already exists')
      }
      updateFields.push('username = ?')
      updateValues.push(username)
    }

    if (email !== undefined) {
      // 检查邮箱是否冲突
      const existing = this.getByEmail(email)
      if (existing && existing.id !== id) {
        throw new Error('Email already exists')
      }
      updateFields.push('email = ?')
      updateValues.push(email)
    }

    if (avatar !== undefined) {
      updateFields.push('avatar = ?')
      updateValues.push(avatar)
    }

    if (role !== undefined) {
      updateFields.push('role = ?')
      updateValues.push(role)
    }

    // 更新updated_at
    updateFields.push('updated_at = ?')
    updateValues.push(new Date().toISOString())

    updateValues.push(id)

    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`
    db.prepare(query).run(...updateValues)

    return this.getById(id)
  }

  /**
   * 更新用户密码
   * @param {number} id - 用户ID
   * @param {string} newPassword - 新密码（明文）
   * @returns {boolean} 是否更新成功
   */
  static async updatePassword(id, newPassword) {
    const db = getDatabase()
    const passwordHash = await bcrypt.hash(newPassword, 10)
    
    const result = db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(
      passwordHash,
      new Date().toISOString(),
      id
    )

    return result.changes > 0
  }

  /**
   * 删除用户
   * @param {number} id - 用户ID
   * @returns {boolean} 是否删除成功
   */
  static delete(id) {
    const db = getDatabase()
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(id)
    return result.changes > 0
  }

  /**
   * 获取所有用户（管理员功能）
   * @param {Object} options - 查询选项
   * @returns {Array} 用户列表
   */
  static getAll(options = {}) {
    const db = getDatabase()
    const { limit = null, offset = 0, role = null } = options

    let query = 'SELECT id, username, email, role, avatar, created_at, updated_at, last_login_at FROM users WHERE 1=1'
    const params = []

    if (role) {
      query += ' AND role = ?'
      params.push(role)
    }

    query += ' ORDER BY created_at DESC'

    if (limit) {
      query += ' LIMIT ? OFFSET ?'
      params.push(limit, offset)
    }

    return db.prepare(query).all(...params)
  }
}


