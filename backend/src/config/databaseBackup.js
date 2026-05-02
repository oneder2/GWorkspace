import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'fs'
import { getDatabase, getDatabasePath } from './database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const escapeSqlString = (value) => String(value).replace(/'/g, "''")

const resolveConfiguredPath = (targetPath) => {
  if (!targetPath) return null
  if (path.isAbsolute(targetPath)) {
    return targetPath
  }
  return path.resolve(__dirname, '../../', targetPath)
}

export const getBackupDirectory = () => (
  resolveConfiguredPath(process.env.DATABASE_BACKUP_DIR) ||
  path.resolve(__dirname, '../../backups')
)

const ensureBackupDirectory = (directoryPath) => {
  if (!existsSync(directoryPath)) {
    mkdirSync(directoryPath, { recursive: true })
  }
}

const buildBackupFileName = (date = new Date()) => {
  const timestamp = date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z')

  return `gworkspace-${timestamp}.sqlite`
}

const toBackupRecord = (filePath) => {
  const stats = statSync(filePath)

  return {
    filename: path.basename(filePath),
    path: filePath,
    size_bytes: stats.size,
    created_at: new Date(stats.birthtimeMs || stats.mtimeMs).toISOString(),
    updated_at: new Date(stats.mtimeMs).toISOString()
  }
}

export const listDatabaseBackups = ({ limit = 10 } = {}) => {
  const backupDir = getBackupDirectory()
  if (!existsSync(backupDir)) {
    return []
  }

  const files = readdirSync(backupDir)
    .map(fileName => path.join(backupDir, fileName))
    .filter(filePath => {
      const stats = statSync(filePath)
      return stats.isFile() && /\.(sqlite|db)$/i.test(path.basename(filePath))
    })
    .sort((left, right) => statSync(right).mtimeMs - statSync(left).mtimeMs)

  return files.slice(0, limit).map(toBackupRecord)
}

export const getLatestDatabaseBackup = () => listDatabaseBackups({ limit: 1 })[0] || null

export const createDatabaseBackup = ({ db = getDatabase(), outputPath = null } = {}) => {
  const resolvedOutputPath = outputPath
    ? path.resolve(process.cwd(), outputPath)
    : path.join(getBackupDirectory(), buildBackupFileName())
  const backupDir = path.dirname(resolvedOutputPath)

  ensureBackupDirectory(backupDir)

  if (existsSync(resolvedOutputPath)) {
    rmSync(resolvedOutputPath)
  }

  db.pragma('wal_checkpoint(TRUNCATE)')
  db.exec(`VACUUM INTO '${escapeSqlString(resolvedOutputPath)}'`)

  const backupRecord = toBackupRecord(resolvedOutputPath)

  return {
    ...backupRecord,
    database_path: getDatabasePath()
  }
}
