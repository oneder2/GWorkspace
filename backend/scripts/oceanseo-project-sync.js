import { readFileSync } from 'node:fs'
import { closeDatabase } from '../src/config/database.js'
import { runMigrations } from '../src/config/migrations.js'
import {
  importOceanseoProjectUpdate,
  listOceanseoSyncProjects
} from '../src/services/oceanseoProjectUpdateImport.js'

const RESULT_PREFIX = 'OCEANSEO_SYNC_RESULT:'
const [command, inputPath] = process.argv.slice(2)

try {
  runMigrations({ logger: null })
  if (command === 'catalog') {
    console.log(`${RESULT_PREFIX}${JSON.stringify({
      schema_version: '1.0.0',
      projects: listOceanseoSyncProjects()
    })}`)
  } else if (command === 'import' && inputPath) {
    const payload = JSON.parse(readFileSync(inputPath, 'utf8'))
    console.log(`${RESULT_PREFIX}${JSON.stringify(importOceanseoProjectUpdate(payload))}`)
  } else {
    throw new Error('usage: oceanseo-project-sync.js <catalog|import> [file]')
  }
} catch (error) {
  console.error(`Oceanseo project sync failed: ${error.message}`)
  process.exitCode = 1
} finally {
  closeDatabase()
}
