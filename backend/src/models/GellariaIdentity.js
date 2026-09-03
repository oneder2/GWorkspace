import { createHash, randomBytes } from 'node:crypto'
import { getDatabase } from '../config/database.js'

const HANDOFF_TTL_MS = 2 * 60 * 1000
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

const digest = value => createHash('sha256').update(value).digest('hex')
const expiresAt = ttl => new Date(Date.now() + ttl).toISOString()
const now = () => new Date().toISOString()

function publicAvatar(row) {
  if (!row || row.palette === null || row.form === null) return null
  return { palette: row.palette, form: row.form, updatedAt: row.updated_at }
}

export class GellariaIdentity {
  static getAvatar(userId, db = getDatabase()) {
    return publicAvatar(db.prepare(`
      SELECT palette, form, updated_at
      FROM gellaria_avatars
      WHERE user_id = ?
    `).get(userId))
  }

  static saveAvatar(userId, appearance, db = getDatabase()) {
    const timestamp = now()
    db.prepare(`
      INSERT INTO gellaria_avatars (user_id, palette, form, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        palette = excluded.palette,
        form = excluded.form,
        updated_at = excluded.updated_at
    `).run(userId, appearance.palette, appearance.form, timestamp, timestamp)
    return this.getAvatar(userId, db)
  }

  static createHandoff(userId, db = getDatabase(), ttl = HANDOFF_TTL_MS) {
    this.purgeExpired(db)
    const code = randomBytes(32).toString('base64url')
    const expiry = expiresAt(ttl)
    db.prepare(`
      INSERT INTO gellaria_handoffs (code_hash, user_id, expires_at)
      VALUES (?, ?, ?)
    `).run(digest(code), userId, expiry)
    return { code, expiresAt: expiry }
  }

  static exchangeHandoff(code, db = getDatabase(), ttl = SESSION_TTL_MS) {
    const exchange = db.transaction(() => {
      const timestamp = now()
      const handoff = db.prepare(`
        SELECT user_id
        FROM gellaria_handoffs
        WHERE code_hash = ? AND used_at IS NULL AND expires_at > ?
      `).get(digest(code), timestamp)
      if (!handoff) return null

      const consumed = db.prepare(`
        UPDATE gellaria_handoffs
        SET used_at = ?
        WHERE code_hash = ? AND used_at IS NULL
      `).run(timestamp, digest(code))
      if (consumed.changes !== 1) return null

      const token = randomBytes(32).toString('base64url')
      const expiry = expiresAt(ttl)
      db.prepare(`
        INSERT INTO gellaria_sessions (token_hash, user_id, expires_at, last_used_at)
        VALUES (?, ?, ?, ?)
      `).run(digest(token), handoff.user_id, expiry, timestamp)
      const user = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(handoff.user_id)
      return {
        token,
        expiresAt: expiry,
        user,
        appearance: this.getAvatar(handoff.user_id, db)
      }
    })

    return exchange()
  }

  static getSession(token, db = getDatabase()) {
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{40,80}$/.test(token)) return null
    const timestamp = now()
    const session = db.prepare(`
      SELECT s.user_id, s.expires_at, u.username, u.role
      FROM gellaria_sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > ?
    `).get(digest(token), timestamp)
    if (!session) return null
    db.prepare('UPDATE gellaria_sessions SET last_used_at = ? WHERE token_hash = ?')
      .run(timestamp, digest(token))
    return {
      user: { id: session.user_id, username: session.username, role: session.role },
      expiresAt: session.expires_at
    }
  }

  static revokeSession(token, db = getDatabase()) {
    if (typeof token !== 'string') return false
    return db.prepare('DELETE FROM gellaria_sessions WHERE token_hash = ?').run(digest(token)).changes === 1
  }

  static purgeExpired(db = getDatabase()) {
    const timestamp = now()
    db.prepare('DELETE FROM gellaria_handoffs WHERE expires_at <= ? OR used_at IS NOT NULL').run(timestamp)
    db.prepare('DELETE FROM gellaria_sessions WHERE expires_at <= ?').run(timestamp)
  }
}
