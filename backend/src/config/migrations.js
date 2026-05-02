import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { getDatabase } from './database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const MIGRATION_FILES = [
  '001_initial_schema.sql',
  '002_user_system.sql',
  '003_guestbook.sql',
  '004_guestbook_user_id.sql',
  '005_admin_settings.sql',
  '006_user_favorites.sql'
]

const isIgnorableMigrationError = (message = '') => (
  message.includes('already exists') ||
  message.includes('duplicate column name')
)

const getMigrationStatements = (migrationFile) => {
  const migrationPath = join(__dirname, '../../database/migrations', migrationFile)
  const migrationSQL = readFileSync(migrationPath, 'utf-8')

  return migrationSQL
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map(line => {
      const commentIndex = line.indexOf('--')
      return commentIndex >= 0 ? line.substring(0, commentIndex) : line
    })
    .join('\n')
    .split(';')
    .map(statement => statement.trim())
    .filter(Boolean)
}

export const runMigrations = ({ db = getDatabase(), logger = console } = {}) => {
  const appliedFiles = []

  for (const migrationFile of MIGRATION_FILES) {
    const statements = getMigrationStatements(migrationFile)

    for (const statement of statements) {
      try {
        db.exec(`${statement};`)
      } catch (error) {
        if (!isIgnorableMigrationError(error.message)) {
          throw new Error(`Migration ${migrationFile} failed: ${error.message}`)
        }
      }
    }

    appliedFiles.push(migrationFile)
  }

  if (logger?.info) {
    logger.info(`Database migrations ensured: ${appliedFiles.join(', ')}`)
  } else if (logger?.log) {
    logger.log(`Database migrations ensured: ${appliedFiles.join(', ')}`)
  }

  return appliedFiles
}
