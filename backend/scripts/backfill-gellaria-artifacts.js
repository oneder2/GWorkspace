import { closeDatabase } from '../src/config/database.js'
import { runMigrations } from '../src/config/migrations.js'
import { backfillArtifacts } from '../src/services/gellariaArtifacts.js'

try {
  runMigrations()
  const records = backfillArtifacts()
  console.log(JSON.stringify({ count: records.length, records }, null, 2))
} finally { closeDatabase() }
