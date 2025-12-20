/**
 * 数据迁移脚本
 * 从文件系统迁移博客文章到SQLite数据库
 * 
 * 使用方法：
 * node scripts/migrate-from-files.js
 */

import { readdir, readFile, stat } from 'fs/promises'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { getDatabase } from '../src/config/database.js'
import { Blog } from '../src/models/Blog.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 文章目录路径（相对于项目根目录）
const POSTS_DIR = join(__dirname, '../../src/posts')

/**
 * 从文件路径提取slug
 * @param {string} path - 文件路径
 * @returns {string} slug
 */
function extractSlugFromPath(path) {
  const match = path.match(/src\/posts\/([^/]+)/)
  return match ? match[1] : null
}

/**
 * 读取文章目录
 * @returns {Promise<Array>} 文章目录列表
 */
async function getPostDirectories() {
  try {
    const entries = await readdir(POSTS_DIR, { withFileTypes: true })
    return entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
  } catch (error) {
    console.error('Error reading posts directory:', error)
    return []
  }
}

/**
 * 读取并解析文章文件
 * @param {string} postDir - 文章目录名
 * @returns {Promise<Object|null>} 文章数据
 */
async function readPostFiles(postDir) {
  try {
    const postPath = join(POSTS_DIR, postDir)
    
    // 读取meta.json
    const metaPath = join(postPath, 'meta.json')
    const metaContent = await readFile(metaPath, 'utf-8')
    const meta = JSON.parse(metaContent)
    
    // 读取index.md
    const contentPath = join(postPath, 'index.md')
    const content = await readFile(contentPath, 'utf-8')
    
    // 提取slug（从目录名或meta.json）
    const slug = meta.slug || extractSlugFromPath(postDir) || postDir
    
    return {
      id: meta.id,
      title: meta.title,
      slug: slug,
      genre: meta.genre || meta.category || 'Uncategorized',
      content: content,
      excerpt: meta.excerpt || '',
      tags: meta.tags || [],
      status: 'published',
      published_at: meta.date || new Date().toISOString()
    }
  } catch (error) {
    console.error(`Error reading post ${postDir}:`, error.message)
    return null
  }
}

/**
 * 初始化数据库表结构
 */
function initializeDatabase() {
  const db = getDatabase()
  
  try {
    const migrationSQL = readFileSync(
      join(__dirname, '../database/migrations/001_initial_schema.sql'),
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
    
    for (const statement of statements) {
      if (statement) {
        try {
          db.exec(statement + ';')
        } catch (error) {
          // 忽略已存在的表/索引错误
          if (!error.message.includes('already exists') && 
              !error.message.includes('duplicate column name')) {
            console.warn('Migration warning:', error.message)
            console.warn('Statement:', statement.substring(0, 100))
          }
        }
      }
    }
    
    // 验证表是否创建成功
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all()
    
    console.log(`Database tables initialized: ${tables.map(t => t.name).join(', ')}`)
    
    if (tables.length === 0) {
      throw new Error('No tables were created')
    }
  } catch (error) {
    console.error('Database initialization error:', error)
    throw error
  }
}

/**
 * 执行迁移
 */
async function migrate() {
  console.log('Starting migration from file system to database...')
  console.log(`Posts directory: ${POSTS_DIR}`)
  
  // 初始化数据库表结构
  console.log('Initializing database tables...')
  initializeDatabase()
  
  // 检查目录是否存在
  try {
    await stat(POSTS_DIR)
  } catch (error) {
    console.error(`Posts directory not found: ${POSTS_DIR}`)
    process.exit(1)
  }
  
  // 获取所有文章目录
  const postDirs = await getPostDirectories()
  console.log(`Found ${postDirs.length} post directories`)
  
  if (postDirs.length === 0) {
    console.log('No posts to migrate')
    return
  }
  
  // 读取所有文章
  const posts = []
  for (const postDir of postDirs) {
    const post = await readPostFiles(postDir)
    if (post) {
      posts.push(post)
      console.log(`✓ Read: ${post.title}`)
    } else {
      console.log(`✗ Failed: ${postDir}`)
    }
  }
  
  console.log(`\nSuccessfully read ${posts.length} posts`)
  
  // 迁移到数据库
  let successCount = 0
  let skipCount = 0
  let errorCount = 0
  
  for (const post of posts) {
    try {
      // 检查是否已存在（通过slug）
      const existing = Blog.getBySlug(post.slug)
      if (existing) {
        console.log(`⊘ Skip (already exists): ${post.title}`)
        skipCount++
        continue
      }
      
      // 创建文章
      const created = Blog.create(post)
      if (created) {
        console.log(`✓ Migrated: ${post.title} (ID: ${created.id})`)
        successCount++
      } else {
        console.log(`✗ Failed: ${post.title}`)
        errorCount++
      }
    } catch (error) {
      console.error(`✗ Error migrating ${post.title}:`, error.message)
      errorCount++
    }
  }
  
  // 输出统计
  console.log('\n=== Migration Summary ===')
  console.log(`Total posts: ${posts.length}`)
  console.log(`Successfully migrated: ${successCount}`)
  console.log(`Skipped (already exists): ${skipCount}`)
  console.log(`Errors: ${errorCount}`)
  console.log('========================\n')
  
  if (errorCount > 0) {
    process.exit(1)
  }
}

// 执行迁移
migrate().catch(error => {
  console.error('Migration failed:', error)
  process.exit(1)
})

