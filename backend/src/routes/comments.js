/**
 * 评论API路由
 * 处理博客文章的评论功能
 */

import express from 'express'
import { Comment } from '../models/Comment.js'

const router = express.Router()

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
 */
router.post('/:id/comments', (req, res) => {
  try {
    const blogId = parseInt(req.params.id)
    const {
      author_name,
      author_email,
      content,
      parent_id = null
    } = req.body

    // 基础验证
    if (!author_name || !content) {
      return res.status(400).json({ error: 'Missing required fields: author_name and content' })
    }

    const comment = Comment.create({
      blog_id: blogId,
      parent_id,
      author_name,
      author_email,
      content,
      status: 'approved' // 初期自动批准，后续可添加审核机制
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
 * 需要认证（后续实现）
 */
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const comment = Comment.getById(id)

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' })
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
 * 需要认证（后续实现）
 */
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id)
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
 */
router.post('/:id/reply', (req, res) => {
  try {
    const parentId = parseInt(req.params.id)
    const {
      author_name,
      author_email,
      content
    } = req.body

    // 基础验证
    if (!author_name || !content) {
      return res.status(400).json({ error: 'Missing required fields: author_name and content' })
    }

    const comment = Comment.reply(parentId, {
      author_name,
      author_email,
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

