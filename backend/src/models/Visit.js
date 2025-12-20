/**
 * 访问统计数据模型
 * 封装访问统计功能的数据库操作
 */

import { getDatabase } from '../config/database.js'

/**
 * 访问统计模型类
 */
export class Visit {
  /**
   * 记录访问
   * @param {Object} data - 访问数据
   * @param {number} data.blog_id - 文章ID（可选）
   * @param {string} data.ip_address - IP地址
   * @param {string} data.user_agent - 用户代理
   * @param {string} data.referer - 来源页面
   * @param {string} data.path - 访问路径
   * @returns {Object} 创建的访问记录
   */
  static record(data) {
    const db = getDatabase()
    const {
      blog_id = null,
      ip_address = null,
      user_agent = null,
      referer = null,
      path = null
    } = data

    const result = db.prepare(`
      INSERT INTO visits (blog_id, ip_address, user_agent, referer, path, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      blog_id,
      ip_address,
      user_agent,
      referer,
      path,
      new Date().toISOString()
    )

    return {
      id: result.lastInsertRowid,
      blog_id,
      ip_address,
      created_at: new Date().toISOString()
    }
  }

  /**
   * 获取文章的访问统计
   * @param {number} blogId - 文章ID
   * @param {Object} options - 查询选项
   * @param {string} options.startDate - 开始日期
   * @param {string} options.endDate - 结束日期
   * @returns {Object} 统计信息
   */
  static getBlogStats(blogId, options = {}) {
    const db = getDatabase()
    const { startDate = null, endDate = null } = options

    let query = 'SELECT COUNT(*) as total_visits, COUNT(DISTINCT ip_address) as unique_visitors FROM visits WHERE blog_id = ?'
    const params = [blogId]

    if (startDate) {
      query += ' AND created_at >= ?'
      params.push(startDate)
    }

    if (endDate) {
      query += ' AND created_at <= ?'
      params.push(endDate)
    }

    const result = db.prepare(query).get(...params)

    return {
      blog_id: blogId,
      total_visits: result.total_visits || 0,
      unique_visitors: result.unique_visitors || 0
    }
  }

  /**
   * 获取总体访问统计
   * @param {Object} options - 查询选项
   * @param {string} options.startDate - 开始日期
   * @param {string} options.endDate - 结束日期
   * @returns {Object} 统计信息
   */
  static getOverallStats(options = {}) {
    const db = getDatabase()
    const { startDate = null, endDate = null } = options

    let query = 'SELECT COUNT(*) as total_visits, COUNT(DISTINCT ip_address) as unique_visitors FROM visits WHERE 1=1'
    const params = []

    if (startDate) {
      query += ' AND created_at >= ?'
      params.push(startDate)
    }

    if (endDate) {
      query += ' AND created_at <= ?'
      params.push(endDate)
    }

    const result = db.prepare(query).get(...params)

    // 获取最受欢迎的文章
    let popularQuery = `
      SELECT blog_id, COUNT(*) as visit_count 
      FROM visits 
      WHERE blog_id IS NOT NULL
    `
    const popularParams = []

    if (startDate) {
      popularQuery += ' AND created_at >= ?'
      popularParams.push(startDate)
    }

    if (endDate) {
      popularQuery += ' AND created_at <= ?'
      popularParams.push(endDate)
    }

    popularQuery += ' GROUP BY blog_id ORDER BY visit_count DESC LIMIT 10'
    const popularBlogs = db.prepare(popularQuery).all(...popularParams)

    return {
      total_visits: result.total_visits || 0,
      unique_visitors: result.unique_visitors || 0,
      popular_blogs: popularBlogs
    }
  }

  /**
   * 获取访问趋势（按日期）
   * @param {Object} options - 查询选项
   * @param {number} options.days - 天数（默认7天）
   * @returns {Array} 趋势数据
   */
  static getTrend(options = {}) {
    const db = getDatabase()
    const { days = 7 } = options

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString().split('T')[0]

    const query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as visits,
        COUNT(DISTINCT ip_address) as unique_visitors
      FROM visits
      WHERE created_at >= ?
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `

    return db.prepare(query).all(startDateStr)
  }
}

