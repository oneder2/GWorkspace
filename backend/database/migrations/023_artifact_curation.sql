CREATE TABLE IF NOT EXISTS gellaria_artifact_controls (
  artifact_id TEXT PRIMARY KEY REFERENCES gellaria_artifacts(id) ON DELETE CASCADE,
  locked INTEGER NOT NULL DEFAULT 0 CHECK (locked IN (0, 1)),
  collection TEXT NOT NULL DEFAULT 'auto' CHECK (collection IN ('auto', 'featured', 'archive')),
  overrides TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(overrides)),
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS gellaria_artifact_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  artifact_id TEXT NOT NULL REFERENCES gellaria_artifacts(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  detail TEXT NOT NULL CHECK (json_valid(detail)),
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS blog_read_receipts (
  blog_id INTEGER NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
  reader_hash TEXT NOT NULL,
  counted_at INTEGER NOT NULL,
  PRIMARY KEY (blog_id, reader_hash)
);
CREATE INDEX IF NOT EXISTS idx_blog_receipts_time ON blog_read_receipts(counted_at);
