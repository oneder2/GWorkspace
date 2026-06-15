import { readFileSync } from 'fs'
import { join } from 'path'

const serverPath = join(process.cwd(), 'backend', 'src', 'server.js')
const serverSource = readFileSync(serverPath, 'utf-8')
const failures = []

if (!serverSource.includes("app.disable('x-powered-by')") && !serverSource.includes('app.disable("x-powered-by")')) {
  failures.push("backend/src/server.js must disable Express x-powered-by header")
}

if (!serverSource.includes("import helmet from 'helmet'") && !serverSource.includes('import helmet from "helmet"')) {
  failures.push('backend/src/server.js must import helmet')
}

if (!serverSource.includes('app.use(helmet(')) {
  failures.push('backend/src/server.js must enable helmet middleware')
}

const requiredHelmetOptions = [
  'contentSecurityPolicy: false',
  'crossOriginEmbedderPolicy: false',
  'crossOriginOpenerPolicy: false',
  'crossOriginResourcePolicy: false',
  'strictTransportSecurity: false'
]

for (const option of requiredHelmetOptions) {
  if (!serverSource.includes(option)) {
    failures.push(`backend/src/server.js must configure helmet option: ${option}`)
  }
}

if (failures.length > 0) {
  console.error('Backend security checks failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('backend security checks passed')
