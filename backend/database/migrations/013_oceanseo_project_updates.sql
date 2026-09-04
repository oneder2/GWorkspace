/* Idempotency receipts for reviewed, local Oceanseo project updates. */

CREATE TABLE IF NOT EXISTS oceanseo_project_update_imports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  update_id TEXT UNIQUE NOT NULL,
  target_project_id TEXT NOT NULL,
  source_scan_id TEXT NOT NULL,
  source_sha256 TEXT NOT NULL,
  imported_at TEXT NOT NULL,
  result_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_oceanseo_project_updates_target
ON oceanseo_project_update_imports(target_project_id, imported_at);
