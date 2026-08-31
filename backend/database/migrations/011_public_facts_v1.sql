/*
 * Provider-owned storage for the frozen GWorkspace public-facts v1 contract.
 * Numeric database keys and editable slugs remain local implementation details;
 * public_id values are the stable ecosystem identities.
 */

ALTER TABLE projects ADD COLUMN public_id TEXT;
ALTER TABLE projects ADD COLUMN role_zh TEXT;
ALTER TABLE projects ADD COLUMN role_en TEXT;
ALTER TABLE projects ADD COLUMN start_date TEXT;
ALTER TABLE projects ADD COLUMN end_date TEXT;
ALTER TABLE projects ADD COLUMN technologies TEXT NOT NULL DEFAULT '[]';
ALTER TABLE projects ADD COLUMN featured INTEGER NOT NULL DEFAULT 0;
ALTER TABLE projects ADD COLUMN links TEXT NOT NULL DEFAULT '[]';
ALTER TABLE projects ADD COLUMN public_media_id TEXT;

UPDATE projects
SET public_id = 'project:' || lower(hex(randomblob(16)))
WHERE public_id IS NULL OR public_id = '';

UPDATE projects
SET start_date = substr(COALESCE(created_at, CURRENT_TIMESTAMP), 1, 7)
WHERE start_date IS NULL OR start_date = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_public_id ON projects(public_id);

ALTER TABLE blogs ADD COLUMN public_id TEXT;
ALTER TABLE blogs ADD COLUMN public_sort_order INTEGER NOT NULL DEFAULT 0;

UPDATE blogs
SET public_id = 'article:' || lower(hex(randomblob(16)))
WHERE public_id IS NULL OR public_id = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_blogs_public_id ON blogs(public_id);

CREATE TABLE IF NOT EXISTS public_media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT UNIQUE NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('image', 'audio', 'video', 'document')),
  url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  alt_zh TEXT,
  alt_en TEXT,
  width INTEGER,
  height INTEGER,
  duration_seconds REAL,
  sha256 TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_public_media_status_sort
ON public_media(status, sort_order, public_id);

UPDATE projects
SET public_media_id = 'media:' || lower(hex(randomblob(16)))
WHERE image_url IS NOT NULL
  AND trim(image_url) != ''
  AND (public_media_id IS NULL OR public_media_id = '');

INSERT OR IGNORE INTO public_media
  (public_id, kind, url, mime_type, alt_zh, alt_en, status, sort_order, created_at, updated_at)
SELECT
  public_media_id,
  'image',
  image_url,
  CASE
    WHEN lower(image_url) LIKE '%.png%' THEN 'image/png'
    WHEN lower(image_url) LIKE '%.webp%' THEN 'image/webp'
    WHEN lower(image_url) LIKE '%.gif%' THEN 'image/gif'
    ELSE 'image/jpeg'
  END,
  title_zh,
  COALESCE(NULLIF(title_en, ''), title_zh),
  status,
  sort_order,
  COALESCE(created_at, CURRENT_TIMESTAMP),
  COALESCE(updated_at, CURRENT_TIMESTAMP)
FROM projects
WHERE public_media_id IS NOT NULL AND trim(public_media_id) != '';

CREATE TABLE IF NOT EXISTS public_experiences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT UNIQUE NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('employment', 'education', 'volunteering', 'award', 'other')),
  organization_zh TEXT NOT NULL,
  organization_en TEXT,
  title_zh TEXT NOT NULL,
  title_en TEXT,
  location_zh TEXT,
  location_en TEXT,
  summary_zh TEXT NOT NULL,
  summary_en TEXT,
  highlights_zh TEXT NOT NULL DEFAULT '[]',
  highlights_en TEXT NOT NULL DEFAULT '[]',
  start_date TEXT NOT NULL,
  end_date TEXT,
  canonical_url TEXT,
  media_ids TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('published', 'draft')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_public_experiences_status_sort
ON public_experiences(status, sort_order, public_id);
