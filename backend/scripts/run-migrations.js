import { closeDatabase } from '../src/config/database.js'
import { runMigrations } from '../src/config/migrations.js'

try {
  runMigrations()
  console.log('Database migrations completed successfully.')
} catch (error) {
  console.error('Database migration failed:', error)
  process.exitCode = 1
} finally {
  closeDatabase()
}
