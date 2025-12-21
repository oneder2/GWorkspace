/**
 * 数据库初始化迁移脚本
 * 创建所有必要的表结构和索引
 */

-- 博客文章表
CREATE TABLE IF NOT EXISTS blogs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  genre TEXT NOT NULL,
  content TEXT NOT NULL,           -- Markdown内容
  excerpt TEXT NOT NULL,
  tags TEXT,                        -- JSON数组字符串
  views INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,   -- 冗余字段，提高查询性能
  comments_count INTEGER DEFAULT 0, -- 冗余字段
  status TEXT DEFAULT 'published',  -- published, draft
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  published_at DATETIME
);

-- 博客表索引
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_genre ON blogs(genre);
CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status);
CREATE INDEX IF NOT EXISTS idx_blogs_published_at ON blogs(published_at);

-- 点赞表
CREATE TABLE IF NOT EXISTS likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  blog_id INTEGER NOT NULL,
  user_ip TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE,
  UNIQUE(blog_id, user_ip)
);

-- 点赞表索引
CREATE INDEX IF NOT EXISTS idx_likes_blog_id ON likes(blog_id);

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  blog_id INTEGER NOT NULL,
  parent_id INTEGER,                -- 回复的评论ID（支持嵌套回复）
  author_name TEXT NOT NULL,
  author_email TEXT,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'approved',   -- approved, pending, spam
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- 评论表索引
CREATE INDEX IF NOT EXISTS idx_comments_blog_id ON comments(blog_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);

-- 访问统计表
CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  blog_id INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  referer TEXT,                    -- 来源页面
  path TEXT,                       -- 访问路径
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE SET NULL
);

-- 访问统计表索引
CREATE INDEX IF NOT EXISTS idx_visits_blog_id ON visits(blog_id);
CREATE INDEX IF NOT EXISTS idx_visits_created_at ON visits(created_at);
CREATE INDEX IF NOT EXISTS idx_visits_path ON visits(path);


