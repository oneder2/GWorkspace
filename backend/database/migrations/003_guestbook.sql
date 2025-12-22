/**
 * 留言板数据库迁移脚本
 * 创建留言板表结构
 */

-- 留言板表
CREATE TABLE IF NOT EXISTS guestbook (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_name TEXT,
  author_email TEXT,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'approved',   -- approved, pending, spam
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 留言板表索引
CREATE INDEX IF NOT EXISTS idx_guestbook_status ON guestbook(status);
CREATE INDEX IF NOT EXISTS idx_guestbook_created_at ON guestbook(created_at);

