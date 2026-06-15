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
import { runMigrations } from './config/migrations.js'
import { checkDatabaseHealth } from './config/databaseHealth.js'

// 导入路由
import blogRoutes from './routes/blog.js'
import likesRoutes from './routes/likes.js'
import commentsRoutes from './routes/comments.js'
import analyticsRoutes from './routes/analytics.js'
import authRoutes from './routes/auth.js'
import adminRoutes from './routes/admin.js'
import adminAiRoutes from './routes/adminAi.js'
import aiRoutes from './routes/ai.js'
import guestbookRoutes from './routes/guestbook.js'
import uploadRoutes from './routes/upload.js'
import seoRoutes from './routes/seo.js'
import spotifyRoutes from './routes/spotify.js'
import { startAiDailyCapsuleScheduler } from './services/aiScheduler.js'

// 加载环境变量
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// 避免在生产响应中暴露 Express 指纹。
app.disable('x-powered-by')

// 配置信任代理 (关键：确保能正确识别来自 Nginx 的 Origin)
app.set('trust proxy', true)

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  strictTransportSecurity: false
}))

/**
 * 极其稳健的 CORS 配置：
 * 1. 允许 credentials (带 Token 请求必须)
 * 2. 支持显式域名列表，解决子域名跨域问题
 */
const allowedOrigins = [
  'https://www.gellaronline.cc',
  'https://gellaronline.cc',
  'https://workspace.gellaronline.cc'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      callback(null, true);
    } else {
      console.warn('CORS Blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

app.use(morgan('dev'))

// 解析中间件
app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ extended: true, limit: '20mb' }))

// 初始化数据库
const db = getDatabase()

try {
  runMigrations({ db })
} catch (error) {
  console.error('Migration error:', error)
  process.exit(1)
}

// API 路由
app.use('/api/auth', authRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/blogs', likesRoutes)
app.use('/api/blogs', blogRoutes)
app.use('/api/blogs', commentsRoutes)
app.use('/api/comments', commentsRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/admin/ai', adminAiRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/guestbook', guestbookRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/seo', seoRoutes)
app.use('/api/spotify', spotifyRoutes)

// 健康检查
app.get('/health', (req, res) => {
  try {
    const health = checkDatabaseHealth({ db, full: false })

    if (!health.ok) {
      return res.status(503).json({
        status: 'degraded',
        checks: {
          database: 'error'
        },
        details: health
      })
    }

    res.json({
      status: 'ok',
      checks: {
        database: 'ok'
      }
    })
  } catch (error) {
    console.error('Health check failed:', error)
    res.status(503).json({
      status: 'error',
      checks: {
        database: 'error'
      },
      error: error.message
    })
  }
})
app.get('/', (req, res) => res.json({ message: 'GWorkspace API Server' }))

app.use((req, res) => res.status(404).json({ error: 'Not Found' }))
app.use((err, req, res, next) => {
  console.error('Server Error:', err)
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  startAiDailyCapsuleScheduler({ logger: console })
})

process.on('SIGINT', () => { closeDatabase(); process.exit(0); })
process.on('SIGTERM', () => { closeDatabase(); process.exit(0); })
