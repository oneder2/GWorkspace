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

// 1. CORS 配置 (必须在最前面)
app.use(cors({
  origin: (origin, callback) => {
    // 允许本地开发环境和 gellaronline.cc 及其子域名
    if (!origin || 
        origin.includes('localhost') || 
        origin.includes('127.0.0.1') || 
        origin.endsWith('gellaronline.cc')) {
      callback(null, true)
    } else {
      console.warn(`CORS blocked for origin: ${origin}`)
      callback(null, false)
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}))

// 配置信任代理
app.set('trust proxy', true)

// 2. 其他安全和日志中间件
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))
app.use(morgan('dev'))

// 3. 解析中间件
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

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
      let cleanSQL = migrationSQL
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .map(line => {
          const commentIndex = line.indexOf('--')
          return commentIndex >= 0 ? line.substring(0, commentIndex) : line
        })
        .join('\n')
      
      const statements = cleanSQL.split(';').map(s => s.trim()).filter(s => s.length > 0)
      statements.forEach(statement => {
        if (statement) {
          try {
            db.exec(statement + ';')
          } catch (error) {
            if (!error.message.includes('already exists') && !error.message.includes('duplicate column name')) {
              console.warn(`Migration ${migrationFile} warning:`, error.message)
            }
          }
        }
      })
    } catch (error) {
      if (error.code !== 'ENOENT') console.warn(`Migration ${migrationFile} error:`, error.message)
    }
  })
  console.log('Database migrations completed')
} catch (error) {
  console.error('Database migration error:', error)
}

// 4. API 路由
app.use('/api/auth', authRoutes)
app.use('/api/blogs', likesRoutes)
app.use('/api/blogs', blogRoutes)
app.use('/api/blogs', commentsRoutes)
app.use('/api/comments', commentsRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/guestbook', guestbookRoutes)
app.use('/api/upload', uploadRoutes)

// 健康检查
app.get('/health', (req, res) => res.json({ status: 'ok' }))

app.get('/', (req, res) => {
  res.json({ message: 'GWorkspace API Server', version: '1.0.0' })
})

// 404处理
app.use((req, res) => res.status(404).json({ error: 'Not Found' }))

// 错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

process.on('SIGINT', () => { closeDatabase(); process.exit(0); })
process.on('SIGTERM', () => { closeDatabase(); process.exit(0); })
