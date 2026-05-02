import path from 'path'
import { existsSync, mkdirSync, rmSync } from 'fs'
import { getDatabase, closeDatabase } from '../src/config/database.js'

const escapeSqlString = (value) => String(value).replace(/'/g, "''")

const resolveBackupPath = () => {
  const target = process.argv[2]

  if (!target) {
    throw new Error('Backup target path is required. Usage: node scripts/backup-database.js <output-path>')
  }

  return path.resolve(process.cwd(), target)
}

try {
  const db = getDatabase()
  const backupPath = resolveBackupPath()
  const backupDir = path.dirname(backupPath)

  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true })
  }

  if (existsSync(backupPath)) {
    rmSync(backupPath)
  }

  db.pragma('wal_checkpoint(TRUNCATE)')
  db.exec(`VACUUM INTO '${escapeSqlString(backupPath)}'`)

  console.log(`Database backup created at: ${backupPath}`)
} catch (error) {
  console.error('Database backup failed:', error)
  process.exitCode = 1
} finally {
  closeDatabase()
}
