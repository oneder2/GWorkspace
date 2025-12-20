/**
 * 点赞API路由
 * 处理博客文章的点赞功能
 */

import express from 'express'
import { Like } from '../models/Like.js'

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
 */
router.get('/:id/liked', (req, res) => {
  try {
    const blogId = parseInt(req.params.id)
    const userIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress
    const liked = Like.hasLiked(blogId, userIp)
    res.json({ liked })
  } catch (error) {
    console.error('Error checking like status:', error)
    res.status(500).json({ error: 'Failed to check like status' })
  }
})

/**
 * 点赞/取消点赞
 * POST /api/blogs/:id/likes
 */
router.post('/:id/likes', (req, res) => {
  try {
    const blogId = parseInt(req.params.id)
    const userIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress
    const userAgent = req.headers['user-agent'] || null

    const result = Like.toggle(blogId, userIp, userAgent)

    res.json(result)
  } catch (error) {
    console.error('Error toggling like:', error)
    res.status(500).json({ error: 'Failed to toggle like' })
  }
})

export default router

