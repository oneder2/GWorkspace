/**
 * 后端服务器入口文件
 * 配置Express服务器，连接数据库，注册路由
 */

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { getDatabase, closeDatabase } from './config/database.js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// 导入路由
import blogRoutes from './routes/blog.js'
import likesRoutes from './routes/likes.js'
import commentsRoutes from './routes/comments.js'
import analyticsRoutes from './routes/analytics.js'
import authRoutes from './routes/auth.js'
import adminRoutes from './routes/admin.js'
import guestbookRoutes from './routes/guestbook.js'
import uploadRoutes from './routes/upload.js'

// 加载环境变量
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// 配置信任代理（用于正确获取客户端真实IP）
// 如果部署在反向代理（如Nginx）后面，需要设置trust proxy
app.set('trust proxy', true)

// 中间件配置
app.use(helmet()) // 安全头

// CORS 配置 - 支持环境变量配置允许的源
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : (process.env.NODE_ENV === 'production' 
      ? ['https://gellaronline.cc', 'https://www.gellaronline.cc', 'https://workspace.gellaronline.cc']
      : ['*'])

app.use(cors({
  origin: (origin, callback) => {
    // 允许无源请求
    if (!origin) return callback(null, true)
    
    // 开发环境或通配符允许
    if (process.env.NODE_ENV !== 'production' || allowedOrigins.includes('*')) {
      return callback(null, true)
    }
    
    // 检查 origin 是否在允许列表中，或者是否是 gellaronline.cc 的子域名
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed === origin) return true
      if (allowed.startsWith('.') && origin.endsWith(allowed)) return true
      return false
    })

    if (isAllowed || origin.endsWith('gellaronline.cc')) {
      return callback(null, true)
    }
    
    console.warn(`CORS blocked for origin: ${origin}`)
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(morgan('dev')) // 请求日志

// JSON解析中间件 - 添加错误处理和大小限制
app.use(express.json({ 
  limit: '10mb', // 限制请求体大小为10MB
  strict: true // 严格模式，只接受数组和对象
}))

// URL编码解析中间件
app.use(express.urlencoded({ 
  extended: true,
  limit: '10mb'
}))

// 初始化数据库
const db = getDatabase()

// 执行数据库迁移
const migrationFiles = [
  '001_initial_schema.sql',
  '002_user_system.sql',
  '003_guestbook.sql',
  '004_guestbook_user_id.sql',
  '005_admin_settings.sql',
  '006_user_favorites.sql'
]

try {
  migrationFiles.forEach(migrationFile => {
    try {
      const migrationSQL = readFileSync(
        join(__dirname, '../database/migrations', migrationFile),
        'utf-8'
      )
      
      // 移除注释和多行注释
      let cleanSQL = migrationSQL
        .replace(/\/\*[\s\S]*?\*\//g, '') // 移除多行注释
        .split('\n')
        .map(line => {
          // 移除单行注释
          const commentIndex = line.indexOf('--')
          if (commentIndex >= 0) {
            return line.substring(0, commentIndex)
          }
          return line
        })
        .join('\n')
      
      // 执行迁移SQL（按语句分割执行）
      const statements = cleanSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0)
      
      statements.forEach(statement => {
        if (statement) {
          try {
            db.exec(statement + ';')
          } catch (error) {
            // 忽略已存在的表/索引/列错误
            if (!error.message.includes('already exists') && 
                !error.message.includes('duplicate column name')) {
              console.warn(`Migration ${migrationFile} warning:`, error.message)
            }
          }
        }
      })
    } catch (error) {
      // 如果文件不存在，忽略（可能是新迁移）
      if (error.code !== 'ENOENT') {
        console.warn(`Migration ${migrationFile} error:`, error.message)
      }
    }
  })
  
  console.log('Database migrations completed')
} catch (error) {
  console.error('Database migration error:', error)
}

// API路由
app.use('/api/auth', authRoutes)
// 注意：likesRoutes 必须在 blogRoutes 之前注册，否则 /:id 路由会拦截 /:id/likes 请求
app.use('/api/blogs', likesRoutes)
app.use('/api/blogs', blogRoutes)
app.use('/api/blogs', commentsRoutes) // 博客相关的评论路由
app.use('/api/comments', commentsRoutes) // 评论管理路由
app.use('/api/analytics', analyticsRoutes)
app.use('/api/admin', adminRoutes) // 管理后台路由
app.use('/api/guestbook', guestbookRoutes) // 留言板路由
app.use('/api/upload', uploadRoutes) // 上传路由

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'connected'
  })
})

// 根路径
app.get('/', (req, res) => {
  res.json({ 
    message: 'GWorkspace API Server',
    version: '1.0.0',
    endpoints: {
      blogs: '/api/blogs',
      likes: '/api/blogs/:id/likes',
      comments: '/api/blogs/:id/comments',
      analytics: '/api/analytics',
      guestbook: '/api/guestbook'
    }
  })
})

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' })
})

// 错误处理中间件 - 捕获所有错误，包括JSON解析错误
app.use((err, req, res, next) => {
  // 处理JSON解析错误
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('JSON parsing error:', err.message)
    console.error('Request URL:', req.url)
    console.error('Request method:', req.method)
    return res.status(400).json({ 
      error: 'Invalid JSON in request body',
      message: 'The request body contains invalid JSON. Please check your data format.'
    })
  }
  
  // 处理其他错误
  console.error('Error:', err)
  console.error('Request URL:', req.url)
  console.error('Request method:', req.method)
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\nShutting down server...')
  closeDatabase()
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\nShutting down server...')
  closeDatabase()
  process.exit(0)
})

