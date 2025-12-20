/**
 * 点赞数据模型
 * 封装点赞功能的数据库操作
 */

import { getDatabase } from '../config/database.js'
import { Blog } from './Blog.js'

/**
 * 点赞模型类
 */
export class Like {
  /**
   * 获取文章的点赞数
   * @param {number} blogId - 文章ID
   * @returns {number} 点赞数
   */
  static getCount(blogId) {
    const db = getDatabase()
    const result = db.prepare('SELECT COUNT(*) as count FROM likes WHERE blog_id = ?').get(blogId)
    return result.count || 0
  }

  /**
   * 检查IP是否已点赞
   * @param {number} blogId - 文章ID
   * @param {string} userIp - 用户IP地址
   * @returns {boolean} 是否已点赞
   */
  static hasLiked(blogId, userIp) {
    const db = getDatabase()
    const result = db.prepare('SELECT COUNT(*) as count FROM likes WHERE blog_id = ? AND user_ip = ?').get(blogId, userIp)
    return (result.count || 0) > 0
  }

  /**
   * 添加点赞
   * @param {number} blogId - 文章ID
   * @param {string} userIp - 用户IP地址
   * @param {string} userAgent - 用户代理
   * @returns {Object|null} 点赞对象，如果已存在则返回null
   */
  static add(blogId, userIp, userAgent = null) {
    const db = getDatabase()
    
    // 检查是否已点赞
    if (this.hasLiked(blogId, userIp)) {
      return null
    }

    try {
      const result = db.prepare(`
        INSERT INTO likes (blog_id, user_ip, user_agent, created_at)
        VALUES (?, ?, ?, ?)
      `).run(blogId, userIp, userAgent, new Date().toISOString())

      // 更新文章的点赞数（冗余字段）
      const count = this.getCount(blogId)
      Blog.updateLikesCount(blogId, count)

      return {
        id: result.lastInsertRowid,
        blog_id: blogId,
        user_ip: userIp,
        created_at: new Date().toISOString()
      }
    } catch (error) {
      // 如果是唯一约束错误，说明已存在
      if (error.message.includes('UNIQUE constraint')) {
        return null
      }
      throw error
    }
  }

  /**
   * 取消点赞
   * @param {number} blogId - 文章ID
   * @param {string} userIp - 用户IP地址
   * @returns {boolean} 是否取消成功
   */
  static remove(blogId, userIp) {
    const db = getDatabase()
    const result = db.prepare('DELETE FROM likes WHERE blog_id = ? AND user_ip = ?').run(blogId, userIp)
    
    if (result.changes > 0) {
      // 更新文章的点赞数（冗余字段）
      const count = this.getCount(blogId)
      Blog.updateLikesCount(blogId, count)
      return true
    }
    
    return false
  }

  /**
   * 切换点赞状态（点赞/取消点赞）
   * @param {number} blogId - 文章ID
   * @param {string} userIp - 用户IP地址
   * @param {string} userAgent - 用户代理
   * @param {number} userId - 用户ID（可选，登录用户）
   * @returns {Object} { liked: boolean, count: number }
   */
  static toggle(blogId, userIp, userAgent = null, userId = null) {
    // 如果用户已登录，优先使用user_id检查
    if (userId) {
      const hasLiked = this.hasLikedByUserId(blogId, userId)
      if (hasLiked) {
        this.removeByUserId(blogId, userId)
        return {
          liked: false,
          count: this.getCount(blogId)
        }
      } else {
        this.addWithUserId(blogId, userId, userIp, userAgent)
        return {
          liked: true,
          count: this.getCount(blogId)
        }
      }
    } else {
      // 匿名用户使用IP
      if (this.hasLiked(blogId, userIp)) {
        this.remove(blogId, userIp)
        return {
          liked: false,
          count: this.getCount(blogId)
        }
      } else {
        this.add(blogId, userIp, userAgent)
        return {
          liked: true,
          count: this.getCount(blogId)
        }
      }
    }
  }

  /**
   * 检查用户是否已点赞（基于user_id）
   * @param {number} blogId - 文章ID
   * @param {number} userId - 用户ID
   * @returns {boolean} 是否已点赞
   */
  static hasLikedByUserId(blogId, userId) {
    const db = getDatabase()
    const result = db.prepare('SELECT COUNT(*) as count FROM likes WHERE blog_id = ? AND user_id = ?').get(blogId, userId)
    return (result.count || 0) > 0
  }

  /**
   * 添加点赞（带user_id）
   * @param {number} blogId - 文章ID
   * @param {number} userId - 用户ID
   * @param {string} userIp - 用户IP地址
   * @param {string} userAgent - 用户代理
   * @returns {Object|null} 点赞对象
   */
  static addWithUserId(blogId, userId, userIp, userAgent = null) {
    const db = getDatabase()
    
    // 检查是否已点赞
    if (this.hasLikedByUserId(blogId, userId)) {
      return null
    }

    try {
      const result = db.prepare(`
        INSERT INTO likes (blog_id, user_id, user_ip, user_agent, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(blogId, userId, userIp, userAgent, new Date().toISOString())

      // 更新文章的点赞数
      const count = this.getCount(blogId)
      Blog.updateLikesCount(blogId, count)

      return {
        id: result.lastInsertRowid,
        blog_id: blogId,
        user_id: userId,
        created_at: new Date().toISOString()
      }
    } catch (error) {
      if (error.message.includes('UNIQUE constraint')) {
        return null
      }
      throw error
    }
  }

  /**
   * 取消点赞（基于user_id）
   * @param {number} blogId - 文章ID
   * @param {number} userId - 用户ID
   * @returns {boolean} 是否取消成功
   */
  static removeByUserId(blogId, userId) {
    const db = getDatabase()
    const result = db.prepare('DELETE FROM likes WHERE blog_id = ? AND user_id = ?').run(blogId, userId)
    
    if (result.changes > 0) {
      // 更新文章的点赞数
      const count = this.getCount(blogId)
      Blog.updateLikesCount(blogId, count)
      return true
    }
    
    return false
  }
}

