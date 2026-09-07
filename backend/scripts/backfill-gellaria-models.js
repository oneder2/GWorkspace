import { closeDatabase } from '../src/config/database.js'
import { runMigrations } from '../src/config/migrations.js'
import { backfillProjectWorldModels } from '../src/services/gellariaModeling.js'

try {
  runMigrations()
  const force = process.argv.includes('--force')
  const results = await backfillProjectWorldModels({ force })
  console.log(`Gellaria project models ready: ${results.length}`)
  for (const result of results) {
    console.log(`${result.slug}: ${result.model?.provider_mode || 'skipped'} r${result.model?.revision || 0}`)
  }
} finally {
  closeDatabase()
}
