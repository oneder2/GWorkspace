/*
 * Gellaria public content foundation.
 * Projects remain ordinary portfolio records; world_exhibits only describes
 * how a source record is placed inside the shared 3D world.
 */

ALTER TABLE admin_settings ADD COLUMN profile_content TEXT;

UPDATE admin_settings
SET profile_content = '{"owner":{"name":"Eclospy732","role":{"zh":"GWorkspace 站长与维护者","en":"Owner and maintainer of GWorkspace"},"bio":{"zh":"我在这里整理写作、作品和日常工具，也持续调整这个站点本身。GWorkspace 既是公开档案，也是我真正使用的个人工作空间。","en":"I use this place to organize writing, projects, and everyday tools while continuously shaping the site itself. GWorkspace is both a public archive and a personal workspace I actually use."},"responsibilities":{"zh":["设计并维护 GWorkspace 的页面与交互","整理写作、独立项目与公开档案","把个人工作流沉淀为站内工具"],"en":["Design and maintain GWorkspace pages and interactions","Organize writing, independent projects, and public archives","Turn personal workflows into tools within the site"]},"contacts":[{"id":"github","label":"GitHub","href":"https://github.com/oneder2/GWorkspace"},{"id":"email","label":"eclospy@duck.com","href":"mailto:eclospy@duck.com"}]}}'
WHERE profile_content IS NULL OR profile_content = '';

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title_zh TEXT NOT NULL,
  title_en TEXT,
  summary_zh TEXT NOT NULL,
  summary_en TEXT,
  url TEXT NOT NULL,
  image_url TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_status_sort
ON projects(status, sort_order, updated_at);

CREATE TABLE IF NOT EXISTS world_exhibits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  region_id TEXT NOT NULL CHECK (region_id IN ('workshop', 'observatory', 'memory-grove')),
  source_type TEXT NOT NULL CHECK (source_type IN ('project', 'blog', 'guestbook', 'external')),
  source_key TEXT NOT NULL,
  label_zh TEXT,
  label_en TEXT,
  title_zh TEXT,
  title_en TEXT,
  summary_zh TEXT,
  summary_en TEXT,
  href TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(region_id, source_type, source_key)
);

CREATE INDEX IF NOT EXISTS idx_world_exhibits_region_status_sort
ON world_exhibits(region_id, status, sort_order, updated_at);

INSERT OR IGNORE INTO projects
  (slug, title_zh, title_en, summary_zh, summary_en, url, image_url, tags, status, sort_order)
VALUES
  ('gworkspace', '玻璃仪表盘', 'Glass Dashboard', '以毛玻璃和高饱和渐变为核心的个人控制台模板。', 'A personal dashboard template centered on heavy glassmorphism and vivid gradients.', '/workspace', '/images/portfolio/glass-dashboard.jpg', '["Vue 3","Tailwind"]', 'published', 10),
  ('citeai', 'CiteAI', 'CiteAI', '面向学术写作与资料整理的 AI 引用辅助工具。', 'An AI-assisted citation and research tool for academic writing workflows.', 'https://citeai.co', '/images/portfolio/citeai.jpg', '["AI","Research"]', 'published', 20),
  ('portfolio-site', '作品集站点', 'Portfolio', '展示项目经历与视觉作品的个人作品集网站。', 'A personal portfolio site for projects and visual work.', 'https://portfolio.gellaronline.cc', '/images/portfolio/portfolio.jpg', '["Web","Portfolio"]', 'published', 30);

INSERT OR IGNORE INTO world_exhibits
  (region_id, source_type, source_key, label_zh, label_en, sort_order, status)
VALUES
  ('workshop', 'project', 'gworkspace', '正在维护', 'Maintained project', 10, 'published'),
  ('workshop', 'project', 'citeai', '独立项目', 'Independent project', 20, 'published'),
  ('workshop', 'project', 'portfolio-site', '视觉档案', 'Visual archive', 30, 'published');
