/**
 * 认证API路由
 * 处理用户注册、登录、登出等认证相关操作
 */

import express from 'express'
import { body, validationResult } from 'express-validator'
import { User } from '../models/User.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

/**
 * 获取用户收藏站点
 * GET /api/auth/favorites
 */
router.get('/favorites', authenticate, (req, res) => {
  try {
    const favorites = User.getFavorites(req.user.id)
    res.json(favorites)
  } catch (error) {
    console.error('Fetch favorites error:', error)
    res.status(500).json({ error: 'Failed to fetch favorites' })
  }
})

/**
 * 更新用户收藏站点
 * POST /api/auth/favorites
 */
router.post('/favorites', authenticate, (req, res) => {
  try {
    const { favorites } = req.body
    if (!Array.isArray(favorites)) {
      return res.status(400).json({ error: 'Favorites must be an array' })
    }
    const success = User.updateFavorites(req.user.id, favorites)
    if (success) {
      res.json({ message: 'Favorites updated successfully' })
    } else {
      res.status(500).json({ error: 'Failed to update favorites' })
    }
  } catch (error) {
    console.error('Update favorites error:', error)
    res.status(500).json({ error: 'Failed to update favorites' })
  }
})

/**
 * 用户注册
 * POST /api/auth/register
 */
router.post('/register', [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { username, email, password } = req.body

    // 创建用户
    const user = await User.create({ username, email, password })

    // 生成token
    const token = User.generateToken(user)

    // 计算过期时间（7天后）
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // 保存会话
    User.saveSession(user.id, token, expiresAt)

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token,
      expiresAt: expiresAt.toISOString()
    })
  } catch (error) {
    console.error('Registration error:', error)
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message })
    }
    
    res.status(500).json({ error: 'Failed to register user' })
  }
})

/**
 * 用户登录
 * POST /api/auth/login
 */
router.post('/login', [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { username, password } = req.body

    // 验证用户密码
    const user = await User.verifyPassword(username, password)
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }

    // 注意：管理员位置更新已改为前端处理
    // 前端会在登录成功后自动获取IP并更新位置信息

    // 生成token
    const token = User.generateToken(user)

    // 计算过期时间（7天后）
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // 保存会话
    User.saveSession(user.id, token, expiresAt)

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      },
      token,
      expiresAt: expiresAt.toISOString()
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Failed to login' })
  }
})

/**
 * 用户登出
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (token) {
      User.deleteSession(token)
    }

    res.json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ error: 'Failed to logout' })
  }
})

/**
 * 删除账户（注销）
 * DELETE /api/auth/account?force=true
 * 需要认证，用户只能删除自己的账户
 * 删除管理员账户需要传递 force=true 参数
 */
router.delete('/account', async (req, res) => {
  try {
    // 获取token并验证用户身份
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    // 验证token并获取用户信息
    const decoded = User.verifyToken(token)
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // 检查会话是否有效
    if (!User.isSessionValid(token)) {
      return res.status(401).json({ error: 'Session expired' })
    }

    const userId = decoded.id
    const user = User.getById(userId)
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // 如果尝试删除管理员账户，需要 force=true 参数
    if (user.role === 'admin' && req.query.force !== 'true') {
      return res.status(403).json({ 
        error: 'Cannot delete admin account without force parameter',
        hint: 'Add ?force=true to the request URL to delete admin account'
      })
    }

    // 删除用户的所有会话
    User.deleteAllSessions(userId)
    
    // 删除用户账户
    const success = User.delete(userId)
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to delete account' })
    }

    res.json({ message: 'Account deleted successfully' })
  } catch (error) {
    console.error('Delete account error:', error)
    res.status(500).json({ error: 'Failed to delete account' })
  }
})

/**
 * 验证token
 * GET /api/auth/verify
 */
router.get('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = User.verifyToken(token)
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // 检查会话是否有效
    if (!User.isSessionValid(token)) {
      return res.status(401).json({ error: 'Session expired' })
    }

    const user = User.getById(decoded.id)
    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    })
  } catch (error) {
    console.error('Token verification error:', error)
    res.status(500).json({ error: 'Failed to verify token' })
  }
})

/**
 * 刷新token
 * POST /api/auth/refresh
 */
router.post('/refresh', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = User.verifyToken(token)
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    const user = User.getById(decoded.id)
    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    // 生成新token
    const newToken = User.generateToken(user)

    // 计算过期时间
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // 删除旧会话，保存新会话
    User.deleteSession(token)
    User.saveSession(user.id, newToken, expiresAt)

    res.json({
      token: newToken,
      expiresAt: expiresAt.toISOString()
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    res.status(500).json({ error: 'Failed to refresh token' })
  }
})

export default router


