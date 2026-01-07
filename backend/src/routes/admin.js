/**
 * 管理后台API路由
 * 提供管理员专用的API端点
 */

import express from 'express'
import { authenticate, requireAdmin, optionalAuthenticate } from '../middleware/auth.js'
import { Blog } from '../models/Blog.js'
import { Comment } from '../models/Comment.js'
import { Visit } from '../models/Visit.js'
import { User } from '../models/User.js'
import { AdminSettings } from '../models/AdminSettings.js'
import { getDatabase } from '../config/database.js'
import { getLocationByIP, isLocalOrReservedIP } from '../utils/ipLocation.js'

const router = express.Router()

/**
 * 获取管理员设置（公开访问，仅返回位置和时区信息）
 * GET /api/admin/settings
 * 允许未登录访问，用于显示管理员位置信息
 */
router.get('/settings', optionalAuthenticate, (req, res) => {
  try {
    const settings = AdminSettings.get()
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' })
    }
    // 只返回位置和时区信息，不返回其他敏感设置
    res.json({
      location: settings.location,
      timezone: settings.timezone,
      ip_address: settings.ip_address
    })
  } catch (error) {
    console.error('Error fetching admin settings:', error)
    res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

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
 * 更新管理员设置（位置、时区）
 * PUT /api/admin/settings
 * 请求体：
 * - ip_address: 前端获取的真实公网IP地址（推荐，前端自动提供）
 * - location: 地区字符串（可选，如 "Beijing, China"）
 * - timezone: 时区字符串（可选，如 "Asia/Shanghai"）
 * - forceRelocate: 布尔值（可选，已废弃，保留兼容性）
 * 
 * 推荐方式：前端提供 ip_address, location, timezone
 * 如果只提供了 ip_address，后端会根据IP获取位置信息
 */
router.put('/settings', async (req, res) => {
  try {
    const { location, timezone, ip_address, forceRelocate } = req.body
    const userId = req.user.id

    // DEBUG: 输出请求参数
    console.debug('[DEBUG] PUT /api/admin/settings - Request body:', {
      ip_address: ip_address || null,
      location: location || null,
      timezone: timezone || null,
      forceRelocate: forceRelocate || false
    })

    let locationInfo = { location, timezone, ip_address }

    // 情况1：前端提供了完整的位置信息（推荐方式）
    if (ip_address && location && timezone) {
      // 验证IP地址不是本地/保留IP
      if (isLocalOrReservedIP(ip_address)) {
        return res.status(400).json({ 
          error: 'Invalid IP address',
          message: 'Cannot use local or reserved IP address. Please provide a valid public IP.'
        })
      }
      
      // DEBUG: 输出使用前端提供的位置信息
      console.debug('[DEBUG] PUT /api/admin/settings - Using frontend-provided location info:', {
        ip: ip_address,
        location: location,
        timezone: timezone
      })
      
      // 直接使用前端提供的信息
      locationInfo = { ip_address, location, timezone }
    }
    // 情况2：前端只提供了IP地址，后端根据IP获取位置信息
    else if (ip_address && (!location || !timezone)) {
      // 验证IP地址
      if (isLocalOrReservedIP(ip_address)) {
        return res.status(400).json({ 
          error: 'Invalid IP address',
          message: 'Cannot use local or reserved IP address. Please provide a valid public IP.'
        })
      }
      
      const processedIp = ip_address.split(',')[0].trim()
      
      // DEBUG: 输出接收到的IP地址
      console.debug('[DEBUG] PUT /api/admin/settings - Received IP from frontend:', processedIp)
      
      // 根据IP获取位置信息
      const autoLocationInfo = await getLocationByIP(processedIp, {
        useCache: false, // 不使用缓存，确保获取最新位置
        maxRetries: 2,
        retryDelay: 2000
      })
      
      // DEBUG: 输出API获取到的位置信息
      console.debug('[DEBUG] PUT /api/admin/settings - API Response:', {
        location: autoLocationInfo?.location || null,
        timezone: autoLocationInfo?.timezone || null
      })
      
      if (autoLocationInfo && autoLocationInfo.location && autoLocationInfo.timezone) {
        locationInfo = {
          ip_address: processedIp,
          location: autoLocationInfo.location,
          timezone: autoLocationInfo.timezone
        }
      } else {
        return res.status(503).json({ 
          error: 'Failed to get location from IP address',
          message: 'IP location service is temporarily unavailable. Please try again later.'
        })
      }
    }
    // 情况3：只提供了location和timezone，没有IP（兼容旧代码）
    else if (location && timezone && !ip_address) {
      // 尝试从请求中获取IP作为备用
      const userIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress
      if (userIp && !isLocalOrReservedIP(userIp)) {
        locationInfo.ip_address = userIp.split(',')[0].trim()
      }
      
      console.debug('[DEBUG] PUT /api/admin/settings - Manual location info (no IP from frontend):', {
        location: location,
        timezone: timezone,
        ip_address: locationInfo.ip_address || null
      })
    }
    // 情况4：forceRelocate为true（已废弃，保留兼容性）
    else if (forceRelocate === true) {
      // 尝试从请求中获取IP
      const userIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress
      
      if (userIp && !isLocalOrReservedIP(userIp)) {
        const processedIp = userIp.split(',')[0].trim()
        const autoLocationInfo = await getLocationByIP(processedIp, {
          useCache: false,
          maxRetries: 2,
          retryDelay: 2000
        })
        
        if (autoLocationInfo && autoLocationInfo.location && autoLocationInfo.timezone) {
          locationInfo = {
            ip_address: processedIp,
            location: autoLocationInfo.location,
            timezone: autoLocationInfo.timezone
          }
        } else {
          return res.status(503).json({ 
            error: 'Failed to relocate automatically',
            message: 'IP location service is temporarily unavailable.'
          })
        }
      } else {
        return res.status(400).json({ 
          error: 'Cannot determine location from IP address',
          message: 'Please provide location and timezone manually, or use frontend IP detection.'
        })
      }
    }
    // 情况5：参数不足
    else {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        message: 'Please provide ip_address (from frontend), or location and timezone manually.'
      })
    }

    // DEBUG: 输出最终要更新的位置信息
    console.debug('[DEBUG] PUT /api/admin/settings - Final location info to update:', {
      location: locationInfo.location || null,
      timezone: locationInfo.timezone || null,
      ip_address: locationInfo.ip_address || null
    })

    // 更新管理员设置
    const updatedSettings = AdminSettings.update(locationInfo, userId)

    res.json(updatedSettings)
  } catch (error) {
    console.error('Error updating admin settings:', error)
    res.status(500).json({ error: 'Failed to update settings' })
  }
})

export default router

