/**
 * 用户系统数据库迁移脚本
 * 创建用户表、会话表，并更新现有表以支持用户关联
 */

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',  -- user, admin
  avatar TEXT,                -- 头像URL（可选）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME
);

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 会话表（用于JWT token管理）
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 会话表索引
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- 更新likes表，添加user_id字段（可选，保留user_ip用于匿名用户）
ALTER TABLE likes ADD COLUMN user_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);

-- 更新comments表，添加user_id字段（可选，保留author_name用于匿名用户）
ALTER TABLE comments ADD COLUMN user_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

