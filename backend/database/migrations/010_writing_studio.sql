/*
 * 私人写作间：项目、分块文档、版本与小说设定。
 * 所有记录都归属于管理员用户，不直接暴露给公共 API。
 */

CREATE TABLE IF NOT EXISTS writing_projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('essay', 'novel')),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revising', 'completed', 'archived')),
  target_words INTEGER DEFAULT 0,
  genre TEXT DEFAULT '',
  excerpt TEXT DEFAULT '',
  tags TEXT DEFAULT '[]',
  blog_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_writing_projects_owner ON writing_projects(owner_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_writing_projects_type ON writing_projects(type, status);

CREATE TABLE IF NOT EXISTS writing_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  parent_id INTEGER,
  kind TEXT NOT NULL DEFAULT 'chapter' CHECK (kind IN ('essay', 'part', 'chapter', 'scene', 'note')),
  title TEXT NOT NULL,
  synopsis TEXT DEFAULT '',
  content TEXT DEFAULT '',
  position INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'drafting' CHECK (status IN ('planned', 'drafting', 'revising', 'done')),
  word_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES writing_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES writing_documents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_writing_documents_project ON writing_documents(project_id, position, id);
CREATE INDEX IF NOT EXISTS idx_writing_documents_parent ON writing_documents(parent_id, position, id);

CREATE TABLE IF NOT EXISTS writing_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,
  reason TEXT DEFAULT 'manual',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES writing_documents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_writing_revisions_document ON writing_revisions(document_id, created_at DESC);

CREATE TABLE IF NOT EXISTS writing_entities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'character' CHECK (entity_type IN ('character', 'location', 'organization', 'object', 'rule')),
  name TEXT NOT NULL,
  aliases TEXT DEFAULT '[]',
  summary TEXT DEFAULT '',
  details TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES writing_projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_writing_entities_project ON writing_entities(project_id, entity_type, name);
