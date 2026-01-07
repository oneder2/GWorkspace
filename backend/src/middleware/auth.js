/**
 * 认证中间件
 * 验证JWT token并附加用户信息到请求对象
 */

import { User } from '../models/User.js'

/**
 * 认证中间件
 * 验证JWT token，如果有效则将用户信息附加到req.user
 */
export function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    // 验证token
    const decoded = User.verifyToken(token)
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // 检查会话是否有效
    if (!User.isSessionValid(token)) {
      return res.status(401).json({ error: 'Session expired' })
    }

    // 获取用户信息
    const user = User.getById(decoded.id)
    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    // 附加用户信息到请求对象
    req.user = user
    req.token = token

    // 注意：管理员位置更新已改为前端处理
    // 前端会在访问时自动检查并更新位置信息

    next()
  } catch (error) {
    console.error('Authentication error:', error)
    res.status(500).json({ error: 'Authentication failed' })
  }
}

/**
 * 可选认证中间件
 * 如果提供了token则验证，否则继续（用于匿名用户）
 */
export function optionalAuthenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (token) {
      const decoded = User.verifyToken(token)
      if (decoded && User.isSessionValid(token)) {
        const user = User.getById(decoded.id)
        if (user) {
          req.user = user
          req.token = token
        }
      }
    }

    next()
  } catch (error) {
    // 可选认证失败不影响请求继续
    next()
  }
}

/**
 * 管理员权限中间件
 * 要求用户必须是管理员
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }

  next()
}


