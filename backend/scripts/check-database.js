import { closeDatabase } from '../src/config/database.js'
import { checkDatabaseHealth } from '../src/config/databaseHealth.js'

try {
  const health = checkDatabaseHealth({ full: true })

  if (!health.ok) {
    console.error('Database health check failed:', health)
    process.exitCode = 1
  } else {
    console.log('Database health check passed:', health)
  }
} catch (error) {
  console.error('Database health check failed with exception:', error)
  process.exitCode = 1
} finally {
  closeDatabase()
}
