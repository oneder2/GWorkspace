/**
 * SQLite数据库配置
 * 使用better-sqlite3进行数据库连接和操作
 */

import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * 获取数据库路径
 * 优先使用环境变量，否则使用默认路径
 */
const getDatabasePath = () => {
  if (process.env.DATABASE_PATH) {
    // 如果是相对路径，转换为绝对路径
    if (process.env.DATABASE_PATH.startsWith('./') || process.env.DATABASE_PATH.startsWith('../')) {
      return path.resolve(__dirname, '../../', process.env.DATABASE_PATH)
    }
    return process.env.DATABASE_PATH
  }
  // 默认路径
  return path.resolve(__dirname, '../../database/gworkspace.db')
}

/**
 * 创建数据库连接
 * @returns {Database} SQLite数据库实例
 */
export function createDatabase() {
  const dbPath = getDatabasePath()
  
  // 确保数据库目录存在
  const dbDir = path.dirname(dbPath)
  import('fs').then(fs => {
    if (!fs.default.existsSync(dbDir)) {
      fs.default.mkdirSync(dbDir, { recursive: true })
    }
  })

  const db = new Database(dbPath)
  
  // 启用外键约束
  db.pragma('foreign_keys = ON')
  
  // 设置WAL模式（提高并发性能）
  db.pragma('journal_mode = WAL')
  
  console.log(`Database connected: ${dbPath}`)
  
  return db
}

/**
 * 获取数据库实例（单例模式）
 */
let dbInstance = null

export function getDatabase() {
  if (!dbInstance) {
    dbInstance = createDatabase()
  }
  return dbInstance
}

/**
 * 关闭数据库连接
 */
export function closeDatabase() {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
    console.log('Database connection closed')
  }
}

