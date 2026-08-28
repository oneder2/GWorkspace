import { readdirSync, readFileSync, statSync } from 'fs'
import { join, relative } from 'path'

const backendSrcDir = join(process.cwd(), 'backend', 'src')
const disallowedPatterns = [
  /\[DEBUG\]/,
  /Like toggle request/,
  /Like toggle result/,
  /Error stack/,
  /console\.error\([^)]*error\.stack/,
  /\[Upload\] Attempting/,
  /\[Upload\] Success/
]

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const entryPath = join(dir, entry)
    const stats = statSync(entryPath)

    if (stats.isDirectory()) return walk(entryPath)
    if (stats.isFile() && entry.endsWith('.js')) return [entryPath]
    return []
  })
}

const failures = []
const serverPath = join(backendSrcDir, 'server.js')
const serverSource = readFileSync(serverPath, 'utf-8')

if (serverSource.includes("morgan('dev')") || serverSource.includes('morgan("dev")')) {
  failures.push('backend/src/server.js must not force development request logging in production')
}

if (!serverSource.includes("process.env.NODE_ENV === 'production' ? 'combined' : 'dev'")) {
  failures.push('backend/src/server.js must use combined request logs in production and dev logs locally')
}

if (!serverSource.includes("req.path === '/health'")) {
  failures.push('backend/src/server.js must skip health-check requests in request logs')
}

for (const file of walk(backendSrcDir)) {
  const lines = readFileSync(file, 'utf-8').split('\n')

  lines.forEach((line, index) => {
    if (disallowedPatterns.some((pattern) => pattern.test(line))) {
      failures.push(`${relative(process.cwd(), file)}:${index + 1}: ${line.trim()}`)
    }
  })
}

if (failures.length > 0) {
  console.error('Backend log hygiene check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('backend log hygiene check passed')
