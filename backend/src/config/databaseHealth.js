import { getDatabase } from './database.js'

const REQUIRED_TABLES = ['blogs', 'users', 'comments', 'likes', 'visits', 'guestbook']

export const checkDatabaseHealth = ({ db = getDatabase(), full = false } = {}) => {
  const ping = db.prepare('SELECT 1 AS ok').get()
  const tables = db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
  `).all()

  const tableNames = new Set(tables.map(row => row.name))
  const missingTables = REQUIRED_TABLES.filter(name => !tableNames.has(name))

  const health = {
    ok: ping?.ok === 1 && missingTables.length === 0,
    tables: tables.length,
    missingTables
  }

  if (full) {
    const integrity = db.pragma('integrity_check', { simple: true })
    health.integrity = integrity
    health.ok = health.ok && integrity === 'ok'
  }

  return health
}
