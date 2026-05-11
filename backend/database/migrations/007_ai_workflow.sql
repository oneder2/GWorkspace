/**
 * 迁移脚本：新增轻量 AI 工作流表
 */

CREATE TABLE IF NOT EXISTS ai_seeds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_text TEXT NOT NULL,
  source_label TEXT NOT NULL DEFAULT 'manual',
  source_url TEXT,
  source_domain TEXT,
  language TEXT DEFAULT 'zh-CN',
  status TEXT DEFAULT 'active',
  imported_from TEXT DEFAULT 'manual',
  weight INTEGER DEFAULT 1,
  notes TEXT,
  used_at DATETIME,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_seeds_status ON ai_seeds(status);
CREATE INDEX IF NOT EXISTS idx_ai_seeds_used_at ON ai_seeds(used_at);
CREATE INDEX IF NOT EXISTS idx_ai_seeds_source_domain ON ai_seeds(source_domain);

CREATE TABLE IF NOT EXISTS daily_capsules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  capsule_date TEXT NOT NULL UNIQUE,
  seed_id INTEGER,
  source_text TEXT NOT NULL,
  source_label TEXT,
  source_url TEXT,
  greeting TEXT NOT NULL,
  thesis TEXT NOT NULL,
  boundary TEXT NOT NULL,
  takeaway TEXT NOT NULL,
  provider_mode TEXT DEFAULT 'local-fallback',
  status TEXT DEFAULT 'active',
  raw_payload TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seed_id) REFERENCES ai_seeds(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_daily_capsules_date ON daily_capsules(capsule_date);
CREATE INDEX IF NOT EXISTS idx_daily_capsules_seed_id ON daily_capsules(seed_id);
