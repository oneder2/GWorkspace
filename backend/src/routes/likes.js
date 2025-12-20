/**
 * 点赞API路由
 * 处理博客文章的点赞功能
 */

import express from 'express'
import { Like } from '../models/Like.js'
import { optionalAuthenticate } from '../middleware/auth.js'

const router = express.Router()

/**
 * 获取文章的点赞数
 * GET /api/blogs/:id/likes
 */
router.get('/:id/likes', (req, res) => {
  try {
    const blogId = parseInt(req.params.id)
    const count = Like.getCount(blogId)
    res.json({ count })
  } catch (error) {
    console.error('Error fetching likes:', error)
    res.status(500).json({ error: 'Failed to fetch likes' })
  }
})

/**
 * 检查是否已点赞
 * GET /api/blogs/:id/liked
 * 支持用户登录和匿名用户
 */
router.get('/:id/liked', optionalAuthenticate, (req, res) => {
  try {
    const blogId = parseInt(req.params.id)
    const userId = req.user?.id || null
    let liked = false

    if (userId) {
      // 登录用户使用user_id检查
      liked = Like.hasLikedByUserId(blogId, userId)
    } else {
      // 匿名用户使用IP检查
      const userIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress
      liked = Like.hasLiked(blogId, userIp)
    }

    res.json({ liked })
  } catch (error) {
    console.error('Error checking like status:', error)
    res.status(500).json({ error: 'Failed to check like status' })
  }
})

/**
 * 点赞/取消点赞
 * POST /api/blogs/:id/likes
 * 支持用户登录和匿名用户（基于IP）
 */
router.post('/:id/likes', optionalAuthenticate, (req, res) => {
  try {
    const blogId = parseInt(req.params.id)
    const userId = req.user?.id || null
    const userIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress
    const userAgent = req.headers['user-agent'] || null

    const result = Like.toggle(blogId, userIp, userAgent, userId)

    res.json(result)
  } catch (error) {
    console.error('Error toggling like:', error)
    res.status(500).json({ error: 'Failed to toggle like' })
  }
})

export default router

