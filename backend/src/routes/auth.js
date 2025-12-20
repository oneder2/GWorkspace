/**
 * 认证API路由
 * 处理用户注册、登录、登出等认证相关操作
 */

import express from 'express'
import { body, validationResult } from 'express-validator'
import { User } from '../models/User.js'

const router = express.Router()

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

