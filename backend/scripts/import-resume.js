import { resolve } from 'node:path'
import { runMigrations } from '../src/config/migrations.js'
import { closeDatabase } from '../src/config/database.js'
import { importResumeSource } from '../src/services/resumeImport.js'

const args = new Set(process.argv.slice(2))
const valueAfter = (flag, fallback) => {
  const index = process.argv.indexOf(flag)
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback
}
const defaultResumeRoot = resolve(process.cwd(), '../../oneder2.github.io')
const yamlPath = resolve(valueAfter('--source', `${defaultResumeRoot}/data/resume.yaml`))
const schemaPath = resolve(valueAfter('--schema', `${defaultResumeRoot}/schema/resume.schema.json`))

try {
  runMigrations({ logger: null })
  const result = importResumeSource({
    yamlPath,
    schemaPath,
    force: args.has('--force'),
    copyAssets: !args.has('--no-copy-assets')
  })
  console.log(JSON.stringify(result, null, 2))
} catch (error) {
  console.error(`Resume import failed: ${error.message}`)
  process.exitCode = 1
} finally {
  closeDatabase()
}
