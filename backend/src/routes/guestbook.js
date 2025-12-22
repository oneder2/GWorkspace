/**
 * 留言板API路由
 * 处理留言板的CRUD操作
 */

import express from 'express'
import { Guestbook } from '../models/Guestbook.js'

const router = express.Router()

/**
 * 获取留言列表
 * GET /api/guestbook
 * 查询参数：
 * - status: 状态筛选（approved/pending/spam）
 * - limit: 限制数量
 * - offset: 偏移量
 * - sortBy: 排序字段（created_at）
 * - sortOrder: 排序方向（asc/desc）
 */
router.get('/', (req, res) => {
  try {
    const {
      status = 'approved',
      limit,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query

    const options = {
      status: status === 'all' ? null : status,
      limit: limit ? parseInt(limit) : null,
      offset: parseInt(offset),
      sortBy,
      sortOrder
    }

    const messages = Guestbook.getAll(options)
    res.json(messages)
  } catch (error) {
    console.error('Error fetching guestbook messages:', error)
    res.status(500).json({ error: 'Failed to fetch guestbook messages' })
  }
})

/**
 * 创建新留言
 * POST /api/guestbook
 */
router.post('/', (req, res) => {
  try {
    const {
      author_name,
      author_email,
      content
    } = req.body

    // 基础验证
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' })
    }

    // 获取用户IP和User-Agent
    const userIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress
    const userAgent = req.headers['user-agent'] || null

    const message = Guestbook.create({
      author_name: author_name || null,
      author_email: author_email || null,
      content,
      status: 'approved', // 默认审核通过，可以根据需要改为pending
      ip_address: userIp,
      user_agent: userAgent
    })

    res.status(201).json(message)
  } catch (error) {
    console.error('Error creating guestbook message:', error)
    res.status(500).json({ error: error.message || 'Failed to create guestbook message' })
  }
})

/**
 * 获取单条留言
 * GET /api/guestbook/:id
 */
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const message = Guestbook.getById(id)

    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    res.json(message)
  } catch (error) {
    console.error('Error fetching guestbook message:', error)
    res.status(500).json({ error: 'Failed to fetch guestbook message' })
  }
})

/**
 * 更新留言
 * PUT /api/guestbook/:id
 * 需要认证（后续实现）
 */
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const message = Guestbook.getById(id)

    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    const updated = Guestbook.update(id, req.body)

    if (!updated) {
      return res.status(500).json({ error: 'Failed to update message' })
    }

    res.json(updated)
  } catch (error) {
    console.error('Error updating guestbook message:', error)
    res.status(500).json({ error: 'Failed to update guestbook message' })
  }
})

/**
 * 删除留言
 * DELETE /api/guestbook/:id
 * 需要认证（后续实现）
 */
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const success = Guestbook.delete(id)

    if (!success) {
      return res.status(404).json({ error: 'Message not found' })
    }

    res.json({ message: 'Message deleted successfully' })
  } catch (error) {
    console.error('Error deleting guestbook message:', error)
    res.status(500).json({ error: 'Failed to delete guestbook message' })
  }
})

/**
 * 获取留言总数
 * GET /api/guestbook/stats/count
 */
router.get('/stats/count', (req, res) => {
  try {
    const { status } = req.query
    const count = Guestbook.getCount(status || null)
    res.json({ count })
  } catch (error) {
    console.error('Error fetching guestbook count:', error)
    res.status(500).json({ error: 'Failed to fetch guestbook count' })
  }
})

export default router

