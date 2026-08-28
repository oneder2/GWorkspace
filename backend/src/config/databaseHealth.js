import path from 'path'
import { statfsSync } from 'fs'
import { getDatabase, getDatabasePath } from './database.js'

const REQUIRED_TABLES = ['blogs', 'users', 'comments', 'likes', 'visits', 'guestbook']
const DEFAULT_MIN_FREE_BYTES = 50 * 1024 * 1024

const getMinFreeBytes = () => {
  const configured = Number(process.env.DATABASE_MIN_FREE_BYTES)
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_MIN_FREE_BYTES
}

const getDiskHealth = () => {
  const dbPath = getDatabasePath()
  const dbDir = path.dirname(dbPath)
  const stats = statfsSync(dbDir)
  const availableBytes = stats.bavail * stats.bsize
  const totalBytes = stats.blocks * stats.bsize
  const minFreeBytes = getMinFreeBytes()

  return {
    ok: availableBytes >= minFreeBytes,
    path: dbDir,
    available_bytes: availableBytes,
    total_bytes: totalBytes,
    min_free_bytes: minFreeBytes
  }
}

export const checkDatabaseHealth = ({ db = getDatabase(), full = false } = {}) => {
  const ping = db.prepare('SELECT 1 AS ok').get()
  const tables = db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
  `).all()

  const tableNames = new Set(tables.map(row => row.name))
  const missingTables = REQUIRED_TABLES.filter(name => !tableNames.has(name))
  const disk = getDiskHealth()

  const health = {
    ok: ping?.ok === 1 && missingTables.length === 0 && disk.ok,
    tables: tables.length,
    missingTables,
    disk
  }

  if (full) {
    const integrity = db.pragma('integrity_check', { simple: true })
    health.integrity = integrity
    health.ok = health.ok && integrity === 'ok'
  }

  return health
}
