/*
 * Gellaria owns only its scoped handoff/session records and per-user avatar.
 * GWorkspace users remain the identity authority.
 */

CREATE TABLE IF NOT EXISTS gellaria_avatars (
  user_id INTEGER PRIMARY KEY,
  palette INTEGER NOT NULL CHECK (palette BETWEEN 0 AND 4),
  form INTEGER NOT NULL CHECK (form BETWEEN 0 AND 2),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS gellaria_handoffs (
  code_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_gellaria_handoffs_expiry
  ON gellaria_handoffs(expires_at);

CREATE TABLE IF NOT EXISTS gellaria_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at DATETIME NOT NULL,
  last_used_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_gellaria_sessions_user
  ON gellaria_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_gellaria_sessions_expiry
  ON gellaria_sessions(expires_at);
