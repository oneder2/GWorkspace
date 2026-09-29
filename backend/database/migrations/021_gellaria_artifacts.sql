/* Stable, one-to-one content bindings for procedural museum artifacts. */
CREATE TABLE IF NOT EXISTS gellaria_artifacts (
  id TEXT PRIMARY KEY,
  project_id INTEGER UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  blog_id INTEGER UNIQUE REFERENCES blogs(id) ON DELETE CASCADE,
  capsule_id INTEGER UNIQUE REFERENCES daily_capsules(id) ON DELETE CASCADE,
  placement_id INTEGER UNIQUE REFERENCES world_exhibits(id) ON DELETE CASCADE,
  source_hash TEXT NOT NULL,
  spec TEXT NOT NULL CHECK (json_valid(spec)),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
  generator TEXT NOT NULL DEFAULT 'semantic-rules-v2',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK ((project_id IS NOT NULL) + (blog_id IS NOT NULL) +
         (capsule_id IS NOT NULL) + (placement_id IS NOT NULL) = 1)
);
