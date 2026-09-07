/*
 * Data-driven Gellaria project models. The generated specification is a
 * constrained rendering recipe, never executable code.
 */

CREATE TABLE IF NOT EXISTS gellaria_project_models (
  project_id INTEGER PRIMARY KEY,
  source_hash TEXT NOT NULL,
  spec TEXT NOT NULL,
  provider_mode TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS gellaria_model_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  source_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'completed', 'failed', 'superseded')),
  provider_mode TEXT,
  error TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME,
  completed_at DATETIME,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_gellaria_model_jobs_project_status
ON gellaria_model_jobs(project_id, status, updated_at DESC);
