/**
 * 管理后台API路由
 * 提供管理员专用的API端点
 */

import express from 'express'
import { existsSync, statSync } from 'fs'
import { authenticate, requireAdmin, optionalAuthenticate } from '../middleware/auth.js'
import { Blog } from '../models/Blog.js'
import { Visit } from '../models/Visit.js'
import { AdminSettings } from '../models/AdminSettings.js'
import { Guestbook } from '../models/Guestbook.js'
import { createDatabaseBackup, getBackupDirectory, listDatabaseBackups } from '../config/databaseBackup.js'
import { checkDatabaseHealth } from '../config/databaseHealth.js'
import { getDatabase, getDatabasePath } from '../config/database.js'
import { scanBlogImageReferences } from '../utils/blogImageAssets.js'
import { isCloudflarePurgeConfigured, purgeCloudflareUrls } from '../utils/cloudflare.js'
import { getLocationByIP, isLocalOrReservedIP } from '../utils/ipLocation.js'
import { deleteR2Object, getMissingR2Fields, getUploadCacheControl, isR2Configured, listR2Objects } from '../utils/r2.js'
import { getSpotifyStatus } from '../utils/spotify.js'

const router = express.Router()

const getFileSize = (filePath) => {
  if (!existsSync(filePath)) {
    return 0
  }

  return statSync(filePath).size
}

const parsePositiveInteger = (value, fallback) => {
  const parsed = parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const getSystemHealthPayload = (req) => {
  const db = getDatabase()
  const dbPath = getDatabasePath()
  const recentBackups = listDatabaseBackups({ limit: 5 })
  const backupCount = listDatabaseBackups({ limit: Number.MAX_SAFE_INTEGER }).length
  const database = checkDatabaseHealth({ db, full: false })
  const spotify = getSpotifyStatus(req)

  return {
    api: {
      status: 'ok',
      uptime_seconds: Math.round(process.uptime()),
      node_version: process.version
    },
    database: {
      ...database,
      status: database.ok ? 'ok' : 'degraded',
      path: dbPath,
      size_bytes: getFileSize(dbPath),
      wal_size_bytes: getFileSize(`${dbPath}-wal`),
      shm_size_bytes: getFileSize(`${dbPath}-shm`)
    },
    backups: {
      directory: getBackupDirectory(),
      count: backupCount,
      recent: recentBackups,
      latest: recentBackups[0] || null
    },
    object_storage: {
      configured: isR2Configured(),
      missing_fields: getMissingR2Fields(),
      public_domain: process.env.R2_PUBLIC_DOMAIN || null,
      cache_control: getUploadCacheControl(),
      purge_configured: isCloudflarePurgeConfigured(),
      deletion_policy: 'unreferenced-only'
    },
    spotify: {
      ...spotify,
      status: spotify.configured
        ? 'ok'
        : (spotify.auth_configured || spotify.playback_configured ? 'degraded' : 'missing')
    }
  }
}

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
    // 只返回公开可用的站点信息
    res.json({
      location: settings.location,
      timezone: settings.timezone,
      homepage_content: settings.homepage_content
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

router.get('/blogs/genres', (req, res) => {
  try {
    res.json(Blog.getAllGenres(null))
  } catch (error) {
    console.error('Error fetching admin blog genres:', error)
    res.status(500).json({ error: 'Failed to fetch blog genres' })
  }
})

router.get('/blogs/tags', (req, res) => {
  try {
    res.json(Blog.getAllTags(null))
  } catch (error) {
    console.error('Error fetching admin blog tags:', error)
    res.status(500).json({ error: 'Failed to fetch blog tags' })
  }
})

router.get('/blogs/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const blog = Blog.getById(id)

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' })
    }

    res.json(blog)
  } catch (error) {
    console.error('Error fetching admin blog:', error)
    res.status(500).json({ error: 'Failed to fetch blog' })
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

router.get('/guestbook', (req, res) => {
  try {
    const {
      status = null,
      limit,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query

    const messages = Guestbook.getAll({
      status: status === 'all' ? null : status,
      limit: limit ? parseInt(limit) : null,
      offset: parseInt(offset),
      sortBy,
      sortOrder
    })

    res.json(messages)
  } catch (error) {
    console.error('Error fetching guestbook messages:', error)
    res.status(500).json({ error: 'Failed to fetch guestbook messages' })
  }
})

router.get('/analytics/overview', (req, res) => {
  try {
    const days = parsePositiveInteger(req.query.days, 7)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setUTCHours(0, 0, 0, 0)
    startDate.setUTCDate(startDate.getUTCDate() - (days - 1))

    const trend = Visit.getTrend({ days })
    const overall = Visit.getOverallStats()
    const range = Visit.getOverallStats({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    })

    res.json({
      days,
      trend,
      overall,
      range
    })
  } catch (error) {
    console.error('Error fetching admin analytics overview:', error)
    res.status(500).json({ error: 'Failed to fetch analytics overview' })
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
        COALESCE(SUM(views), 0) as total_views,
        COALESCE(SUM(likes_count), 0) as total_likes,
        COALESCE(SUM(comments_count), 0) as total_comments
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

router.get('/system/health', (req, res) => {
  try {
    res.json(getSystemHealthPayload(req))
  } catch (error) {
    console.error('Error fetching system health:', error)
    res.status(500).json({ error: 'Failed to fetch system health' })
  }
})

router.post('/system/backup', (req, res) => {
  try {
    const backup = createDatabaseBackup()
    const health = getSystemHealthPayload(req)

    res.status(201).json({
      backup,
      backups: health.backups
    })
  } catch (error) {
    console.error('Error creating system backup:', error)
    res.status(500).json({ error: 'Failed to create database backup' })
  }
})

router.get('/system/assets', async (req, res) => {
  try {
    if (!isR2Configured()) {
      return res.json({
        configured: false,
        missing_fields: getMissingR2Fields(),
        cache_control: getUploadCacheControl(),
        purge_configured: isCloudflarePurgeConfigured(),
        summary: {
          total: 0,
          referenced: 0,
          orphaned: 0
        },
        assets: []
      })
    }

    const objects = await listR2Objects({ prefix: 'blog/' })
    const { references } = scanBlogImageReferences()
    const assets = objects
      .map(object => {
        const referencedBy = references.get(object.key) || []

        return {
          ...object,
          referenced: referencedBy.length > 0,
          can_delete: referencedBy.length === 0,
          reference_count: referencedBy.length,
          referenced_by: referencedBy
        }
      })
      .sort((left, right) => {
        if (left.referenced !== right.referenced) {
          return Number(left.referenced) - Number(right.referenced)
        }
        return (right.last_modified || '').localeCompare(left.last_modified || '')
      })

    const referencedCount = assets.filter(asset => asset.referenced).length

    res.json({
      configured: true,
      missing_fields: [],
      cache_control: getUploadCacheControl(),
      purge_configured: isCloudflarePurgeConfigured(),
      summary: {
        total: assets.length,
        referenced: referencedCount,
        orphaned: assets.length - referencedCount
      },
      assets
    })
  } catch (error) {
    console.error('Error fetching system assets:', error)
    res.status(500).json({ error: 'Failed to fetch system assets' })
  }
})

router.delete('/system/assets', async (req, res) => {
  try {
    const requestedKey = typeof req.body?.key === 'string' ? req.body.key.trim().replace(/^\/+/, '') : ''
    if (!requestedKey) {
      return res.status(400).json({ error: 'Asset key is required' })
    }

    if (!requestedKey.startsWith('blog/')) {
      return res.status(400).json({ error: 'Only blog assets can be managed here' })
    }

    if (!isR2Configured()) {
      return res.status(503).json({
        error: 'Cloudflare R2 is not fully configured',
        missingFields: getMissingR2Fields()
      })
    }

    const { references } = scanBlogImageReferences()
    const referencedBy = references.get(requestedKey) || []

    if (referencedBy.length > 0) {
      return res.status(409).json({
        error: 'Asset is still referenced by at least one article',
        referenced_by: referencedBy
      })
    }

    const deletedAsset = await deleteR2Object(requestedKey)
    let purge = {
      attempted: false,
      configured: isCloudflarePurgeConfigured(),
      purged: 0
    }

    if (deletedAsset.url) {
      try {
        purge = await purgeCloudflareUrls([deletedAsset.url])
      } catch (error) {
        purge = {
          attempted: true,
          configured: true,
          purged: 0,
          error: error.message
        }
      }
    }

    res.json({
      deleted: true,
      asset: deletedAsset,
      purge
    })
  } catch (error) {
    console.error('Error deleting system asset:', error)
    res.status(500).json({ error: 'Failed to delete system asset' })
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
    const homepageContent = req.body.homepage_content ?? req.body.homepageContent
    const userId = req.user.id

    // DEBUG: 输出请求参数
    console.debug('[DEBUG] PUT /api/admin/settings - Request body:', {
      ip_address: ip_address || null,
      location: location || null,
      timezone: timezone || null,
      homepage_content: homepageContent ? '[provided]' : null,
      forceRelocate: forceRelocate || false
    })

    const updatePayload = {}

    if (homepageContent !== undefined) {
      updatePayload.homepage_content = homepageContent
    }

    const hasLocationPayload = ip_address !== undefined || location !== undefined || timezone !== undefined || forceRelocate === true

    let locationInfo = { location, timezone, ip_address }

    // 情况1：前端提供了完整的位置信息（推荐方式）
    if (hasLocationPayload && ip_address && location && timezone) {
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
    else if (hasLocationPayload && ip_address && (!location || !timezone)) {
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
    else if (hasLocationPayload && location && timezone && !ip_address) {
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
    else if (hasLocationPayload && forceRelocate === true) {
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
    // 情况5：参数不足，但允许仅更新首页内容
    else if (!homepageContent && !hasLocationPayload) {
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

    if (hasLocationPayload) {
      updatePayload.location = locationInfo.location || null
      updatePayload.timezone = locationInfo.timezone || null
      updatePayload.ip_address = locationInfo.ip_address || null
    }

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Please provide homepage_content or location fields to update.'
      })
    }

    // 更新管理员设置
    const updatedSettings = AdminSettings.update(updatePayload, userId)

    res.json(updatedSettings)
  } catch (error) {
    console.error('Error updating admin settings:', error)
    res.status(500).json({ error: 'Failed to update settings' })
  }
})

export default router
