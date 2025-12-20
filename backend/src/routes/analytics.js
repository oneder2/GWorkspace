/**
 * 统计分析API路由
 * 处理访问统计和数据分析
 */

import express from 'express'
import { Visit } from '../models/Visit.js'

const router = express.Router()

/**
 * 记录访问
 * POST /api/analytics/visits
 */
router.post('/visits', (req, res) => {
  try {
    const {
      blog_id = null,
      path = null
    } = req.body

    const userIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress
    const userAgent = req.headers['user-agent'] || null
    const referer = req.headers['referer'] || null

    const visit = Visit.record({
      blog_id: blog_id ? parseInt(blog_id) : null,
      ip_address: userIp,
      user_agent: userAgent,
      referer,
      path
    })

    res.status(201).json(visit)
  } catch (error) {
    console.error('Error recording visit:', error)
    res.status(500).json({ error: 'Failed to record visit' })
  }
})

/**
 * 获取访问统计
 * GET /api/analytics/visits
 * 查询参数：
 * - startDate: 开始日期
 * - endDate: 结束日期
 */
router.get('/visits', (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const stats = Visit.getOverallStats({ startDate, endDate })
    res.json(stats)
  } catch (error) {
    console.error('Error fetching visit stats:', error)
    res.status(500).json({ error: 'Failed to fetch visit stats' })
  }
})

/**
 * 获取单篇博客的统计
 * GET /api/analytics/blogs/:id/stats
 */
router.get('/blogs/:id/stats', (req, res) => {
  try {
    const blogId = parseInt(req.params.id)
    const { startDate, endDate } = req.query

    const stats = Visit.getBlogStats(blogId, { startDate, endDate })
    res.json(stats)
  } catch (error) {
    console.error('Error fetching blog stats:', error)
    res.status(500).json({ error: 'Failed to fetch blog stats' })
  }
})

/**
 * 获取概览统计
 * GET /api/analytics/overview
 */
router.get('/overview', (req, res) => {
  try {
    const { days = 7 } = req.query
    const trend = Visit.getTrend({ days: parseInt(days) })
    const overall = Visit.getOverallStats()

    res.json({
      trend,
      overall
    })
  } catch (error) {
    console.error('Error fetching overview:', error)
    res.status(500).json({ error: 'Failed to fetch overview' })
  }
})

export default router

