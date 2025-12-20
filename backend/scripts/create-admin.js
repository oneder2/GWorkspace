/**
 * 创建管理员账户脚本
 * 使用方法：node scripts/create-admin.js
 */

import bcrypt from 'bcrypt'
import { getDatabase } from '../src/config/database.js'
import { createDatabase } from '../src/config/database.js'

// 配置管理员信息（请修改为你的信息）
const ADMIN_CONFIG = {
  username: 'admin',
  email: 'admin@example.com',
  password: '1q2w3e4r5t^Y', // 请修改为你的密码
  role: 'admin'
}

/**
 * 创建管理员账户
 */
async function createAdmin() {
  try {
    // 确保数据库已初始化
    createDatabase()
    const db = getDatabase()

    // 检查用户是否已存在
    const existingUser = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(
      ADMIN_CONFIG.username,
      ADMIN_CONFIG.email
    )

    if (existingUser) {
      console.log('❌ 用户已存在：')
      console.log(`   用户名: ${existingUser.username}`)
      console.log(`   邮箱: ${existingUser.email}`)
      console.log(`   角色: ${existingUser.role}`)
      return
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(ADMIN_CONFIG.password, 10)

    // 创建用户
    const now = new Date().toISOString()
    const result = db.prepare(`
      INSERT INTO users (username, email, password_hash, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      ADMIN_CONFIG.username,
      ADMIN_CONFIG.email,
      passwordHash,
      ADMIN_CONFIG.role,
      now,
      now
    )

    console.log('✅ 管理员账户创建成功！')
    console.log(`   用户名: ${ADMIN_CONFIG.username}`)
    console.log(`   邮箱: ${ADMIN_CONFIG.email}`)
    console.log(`   角色: ${ADMIN_CONFIG.role}`)
    console.log(`   用户ID: ${result.lastInsertRowid}`)
    console.log('\n⚠️  请记住你的密码，并考虑在生产环境中修改默认密码！')
  } catch (error) {
    console.error('❌ 创建管理员账户失败：', error.message)
    process.exit(1)
  }
}

// 执行创建
createAdmin()

