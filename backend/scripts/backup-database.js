import { getDatabase, closeDatabase } from '../src/config/database.js'
import { createDatabaseBackup } from '../src/config/databaseBackup.js'

try {
  const db = getDatabase()
  const target = process.argv[2] || null
  const backup = createDatabaseBackup({ db, outputPath: target })

  console.log(`Database backup created at: ${backup.path}`)
} catch (error) {
  console.error('Database backup failed:', error)
  process.exitCode = 1
} finally {
  closeDatabase()
}
