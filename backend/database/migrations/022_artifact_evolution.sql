CREATE TABLE IF NOT EXISTS gellaria_artifact_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  artifact_id TEXT NOT NULL REFERENCES gellaria_artifacts(id) ON DELETE CASCADE,
  revision INTEGER NOT NULL CHECK (revision > 0),
  reason TEXT NOT NULL CHECK (reason IN ('created', 'content', 'tier', 'reading-milestone', 'generator')),
  reading_level INTEGER NOT NULL DEFAULT 0,
  views_at_build INTEGER NOT NULL DEFAULT 0,
  source_hash TEXT NOT NULL,
  spec TEXT NOT NULL CHECK (json_valid(spec)),
  created_at TEXT NOT NULL,
  UNIQUE (artifact_id, revision)
);
CREATE INDEX IF NOT EXISTS idx_artifact_events_owner ON gellaria_artifact_events(artifact_id, revision);
