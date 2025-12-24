/**
 * 管理后台API路由
 * 提供管理员专用的API端点
 */

import express from 'express'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { Blog } from '../models/Blog.js'
import { Comment } from '../models/Comment.js'
import { Visit } from '../models/Visit.js'
import { User } from '../models/User.js'
import { AdminSettings } from '../models/AdminSettings.js'
import { getDatabase } from '../config/database.js'
import { getLocationByIP } from '../utils/ipLocation.js'

const router = express.Router()

// 所有管理后台路由都需要认证和管理员权限
router.use(authenticate)
router.use(requireAdmin)

/**
 * 获取所有博客（包括草稿）
 * GET /api/admin/blogs
 */
router.get('/blogs', (req, res) => {
  try {
    const {
      genre,
      status = null, // 默认获取所有状态
      limit,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query

    const options = {
      genre: genre || null,
      status: status === 'all' ? null : status,
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
 * 获取所有评论
 * GET /api/admin/comments
 */
router.get('/comments', (req, res) => {
  try {
    const {
      status = null, // 默认获取所有状态
      limit,
      offset = 0
    } = req.query

    const db = getDatabase()
    let query = 'SELECT * FROM comments WHERE 1=1'
    const params = []

    if (status && status !== 'all') {
      query += ' AND status = ?'
      params.push(status)
    }

    query += ' ORDER BY created_at DESC'

    if (limit) {
      query += ' LIMIT ? OFFSET ?'
      params.push(parseInt(limit), parseInt(offset))
    }

    const comments = db.prepare(query).all(...params)
    res.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    res.status(500).json({ error: 'Failed to fetch comments' })
  }
})

/**
 * 获取统计数据
 * GET /api/admin/stats
 */
router.get('/stats', (req, res) => {
  try {
    const db = getDatabase()

    // 获取博客统计
    const blogStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft,
        SUM(views) as total_views,
        SUM(likes_count) as total_likes,
        SUM(comments_count) as total_comments
      FROM blogs
    `).get()

    // 获取访问统计
    const visitStats = Visit.getOverallStats()

    // 获取用户统计
    const userStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
        COUNT(CASE WHEN role = 'user' THEN 1 END) as users
      FROM users
    `).get()

    res.json({
      blogs: blogStats,
      visits: visitStats,
      users: userStats
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

/**
 * 获取管理员设置
 * GET /api/admin/settings
 */
router.get('/settings', (req, res) => {
  try {
    const settings = AdminSettings.get()
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' })
    }
    res.json(settings)
  } catch (error) {
    console.error('Error fetching admin settings:', error)
    res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

/**
 * 更新管理员设置（位置、时区）
 * PUT /api/admin/settings
 * 请求体：
 * - location: 地区字符串（可选，如 "Beijing, China"）
 * - timezone: 时区字符串（可选，如 "Asia/Shanghai"）
 * 如果都不提供，则根据当前IP自动获取
 */
router.put('/settings', async (req, res) => {
  try {
    const { location, timezone } = req.body
    const userId = req.user.id

    let locationInfo = { location, timezone }

    // 如果都没有提供，根据IP自动获取
    if (!location && !timezone) {
      const userIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress
      if (userIp && !userIp.startsWith('127.') && !userIp.startsWith('192.168.') && !userIp.startsWith('10.')) {
        locationInfo = await getLocationByIP(userIp.split(',')[0].trim())
        locationInfo.ip_address = userIp.split(',')[0].trim()
      }
    } else {
      // 如果提供了location或timezone，也更新IP地址
      const userIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress
      if (userIp && !userIp.startsWith('127.') && !userIp.startsWith('192.168.') && !userIp.startsWith('10.')) {
        locationInfo.ip_address = userIp.split(',')[0].trim()
      }
    }

    // 更新管理员设置
    const updatedSettings = AdminSettings.update(locationInfo, userId)

    res.json(updatedSettings)
  } catch (error) {
    console.error('Error updating admin settings:', error)
    res.status(500).json({ error: 'Failed to update settings' })
  }
})

export default router

