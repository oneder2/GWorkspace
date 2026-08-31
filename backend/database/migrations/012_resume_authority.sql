/*
 * Structured resume authority. API is a transport, not a display surface:
 * status controls publication and surfaces controls each presentation target.
 */

CREATE TABLE IF NOT EXISTS resume_profile (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  public_id TEXT UNIQUE NOT NULL DEFAULT 'profile:owner',
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL,
  full_name_zh TEXT NOT NULL,
  full_name_en TEXT NOT NULL,
  headline_zh TEXT NOT NULL,
  headline_en TEXT NOT NULL,
  location_zh TEXT NOT NULL,
  location_en TEXT NOT NULL,
  summary_zh TEXT NOT NULL,
  summary_en TEXT NOT NULL,
  avatar_media_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('published', 'draft')),
  surfaces TEXT NOT NULL DEFAULT '[]',
  default_language TEXT NOT NULL DEFAULT 'en' CHECK (default_language IN ('en', 'zh')),
  pdf_project_limit INTEGER NOT NULL DEFAULT 6,
  pdf_filename_zh TEXT NOT NULL DEFAULT 'Gellar-Resume-ZH.pdf',
  pdf_filename_en TEXT NOT NULL DEFAULT 'Gellar-Resume-EN.pdf',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO resume_profile
  (id, name_zh, name_en, full_name_zh, full_name_en, headline_zh, headline_en,
   location_zh, location_en, summary_zh, summary_en, status, surfaces, created_at, updated_at)
SELECT
  1,
  COALESCE(json_extract(profile_content, '$.owner.name'), 'Gellar'),
  COALESCE(json_extract(profile_content, '$.owner.name'), 'Gellar'),
  COALESCE(json_extract(profile_content, '$.owner.name'), 'Gellar'),
  COALESCE(json_extract(profile_content, '$.owner.name'), 'Gellar'),
  COALESCE(json_extract(profile_content, '$.owner.role.zh'), '站长'),
  COALESCE(json_extract(profile_content, '$.owner.role.en'), 'Site owner'),
  COALESCE(location, ''),
  COALESCE(location, ''),
  COALESCE(json_extract(profile_content, '$.owner.bio.zh'), 'GWorkspace 公开资料。'),
  COALESCE(json_extract(profile_content, '$.owner.bio.en'), 'GWorkspace public profile.'),
  'draft',
  '[]',
  COALESCE(updated_at, CURRENT_TIMESTAMP),
  COALESCE(updated_at, CURRENT_TIMESTAMP)
FROM admin_settings
WHERE id = 1;

CREATE TABLE IF NOT EXISTS resume_contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'phone', 'website', 'github', 'linkedin', 'location', 'other')),
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('published', 'draft')),
  surfaces TEXT NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_resume_contacts_publish
ON resume_contacts(status, sort_order, public_id);

CREATE TABLE IF NOT EXISTS resume_skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT UNIQUE NOT NULL,
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL,
  items TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('published', 'draft')),
  surfaces TEXT NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_resume_skills_publish
ON resume_skills(status, sort_order, public_id);

ALTER TABLE public_experiences ADD COLUMN section TEXT NOT NULL DEFAULT 'experience';
ALTER TABLE public_experiences ADD COLUMN surfaces TEXT NOT NULL DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_public_experiences_section_publish
ON public_experiences(section, status, sort_order, public_id);

ALTER TABLE projects ADD COLUMN involvement TEXT NOT NULL DEFAULT 'creator';
ALTER TABLE projects ADD COLUMN highlights_zh TEXT NOT NULL DEFAULT '[]';
ALTER TABLE projects ADD COLUMN highlights_en TEXT NOT NULL DEFAULT '[]';
ALTER TABLE projects ADD COLUMN surfaces TEXT NOT NULL DEFAULT '[]';
ALTER TABLE projects ADD COLUMN gallery_media_ids TEXT NOT NULL DEFAULT '[]';

UPDATE projects
SET surfaces = '["portfolio","gellaria"]'
WHERE surfaces IS NULL OR surfaces = '' OR surfaces = '[]';

CREATE INDEX IF NOT EXISTS idx_projects_resume_publish
ON projects(status, sort_order, public_id);

CREATE TABLE IF NOT EXISTS resume_imports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_path TEXT NOT NULL,
  source_sha256 TEXT UNIQUE NOT NULL,
  source_schema_version TEXT NOT NULL,
  imported_at DATETIME NOT NULL,
  result_json TEXT NOT NULL
);
