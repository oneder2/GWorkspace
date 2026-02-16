/**
 * 评论API路由
 * 处理博客文章的评论功能
 */

import express from 'express'
import { Comment } from '../models/Comment.js'
import { authenticate } from '../middleware/auth.js'
import { containsSensitiveWords } from '../utils/contentFilter.js'
import rateLimit from 'express-rate-limit'

const router = express.Router()

/**
 * 评论速率限制
 * 限制每个IP/用户在短时间内的评论次数，防止滥用
 */
const commentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 10, // 每个窗口期内最多 10 条评论
  message: { error: 'Too many comments from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  // 如果已经通过认证，可以考虑结合用户ID进行更精确的限制
  keyGenerator: (req) => {
    return req.user ? `user_${req.user.id}` : req.ip
  }
})

/**
 * 获取文章的评论列表
 * GET /api/blogs/:id/comments
 * 查询参数：
 * - limit: 限制数量
 * - offset: 偏移量
 * - status: 状态筛选（approved/pending/spam）
 */
router.get('/:id/comments', (req, res) => {
  try {
    const blogId = parseInt(req.params.id)
    const {
      limit,
      offset = 0,
      status = 'approved'
    } = req.query

    const options = {
      limit: limit ? parseInt(limit) : null,
      offset: parseInt(offset),
      status
    }

    const comments = Comment.getByBlogId(blogId, options)
    res.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    res.status(500).json({ error: 'Failed to fetch comments' })
  }
})

/**
 * 发表评论
 * POST /api/blogs/:id/comments
 * 严格要求用户必须注册并登录后才能评论
 */
router.post('/:id/comments', authenticate, commentRateLimiter, (req, res) => {
  try {
    const blogId = parseInt(req.params.id)
    const {
      content,
      parent_id = null
    } = req.body

    // 基础验证
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content cannot be empty' })
    }

    // 屏蔽词检查
    if (containsSensitiveWords(content)) {
      return res.status(403).json({ error: 'Comment contains sensitive words' })
    }

    // 必须是登录用户
    const userId = req.user.id
    const finalAuthorName = req.user.username
    const finalAuthorEmail = req.user.email

    const comment = Comment.create({
      blog_id: blogId,
      parent_id,
      user_id: userId,
      author_name: finalAuthorName,
      author_email: finalAuthorEmail,
      content,
      status: 'approved'
    })

    res.status(201).json(comment)
  } catch (error) {
    console.error('Error creating comment:', error)
    res.status(500).json({ error: 'Failed to create comment' })
  }
})

/**
 * 更新评论
 * PUT /api/comments/:id
 * 需要认证
 */
router.put('/:id', authenticate, (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const comment = Comment.getById(id)

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' })
    }

    // 仅管理员或评论作者可修改
    if (req.user.role !== 'admin' && req.user.id !== comment.user_id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const updated = Comment.update(id, req.body)

    if (!updated) {
      return res.status(500).json({ error: 'Failed to update comment' })
    }

    res.json(updated)
  } catch (error) {
    console.error('Error updating comment:', error)
    res.status(500).json({ error: 'Failed to update comment' })
  }
})

/**
 * 删除评论
 * DELETE /api/comments/:id
 * 需要认证
 */
router.delete('/:id', authenticate, (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const comment = Comment.getById(id)

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' })
    }

    // 仅管理员或评论作者可删除
    if (req.user.role !== 'admin' && req.user.id !== comment.user_id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const success = Comment.delete(id)

    if (!success) {
      return res.status(404).json({ error: 'Comment not found' })
    }

    res.json({ message: 'Comment deleted successfully' })
  } catch (error) {
    console.error('Error deleting comment:', error)
    res.status(500).json({ error: 'Failed to delete comment' })
  }
})

/**
 * 回复评论
 * POST /api/comments/:id/reply
 * 同样要求登录和限速
 */
router.post('/:id/reply', authenticate, commentRateLimiter, (req, res) => {
  try {
    const parentId = parseInt(req.params.id)
    const {
      content
    } = req.body

    // 基础验证
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Reply content cannot be empty' })
    }

    // 屏蔽词检查
    if (containsSensitiveWords(content)) {
      return res.status(403).json({ error: 'Reply contains sensitive words' })
    }

    const comment = Comment.reply(parentId, {
      user_id: req.user.id,
      author_name: req.user.username,
      author_email: req.user.email,
      content,
      status: 'approved'
    })

    res.status(201).json(comment)
  } catch (error) {
    console.error('Error replying to comment:', error)
    res.status(500).json({ error: error.message || 'Failed to reply to comment' })
  }
})

export default router

