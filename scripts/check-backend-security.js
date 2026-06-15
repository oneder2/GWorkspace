import { readFileSync } from 'fs'
import { join } from 'path'

const serverPath = join(process.cwd(), 'backend', 'src', 'server.js')
const serverSource = readFileSync(serverPath, 'utf-8')
const failures = []

if (!serverSource.includes("app.disable('x-powered-by')") && !serverSource.includes('app.disable("x-powered-by")')) {
  failures.push("backend/src/server.js must disable Express x-powered-by header")
}

if (serverSource.includes("origin.includes('localhost')") || serverSource.includes('origin.includes("localhost")')) {
  failures.push('backend/src/server.js must not use substring matching for localhost CORS origins')
}

if (serverSource.includes("origin.includes('127.0.0.1')") || serverSource.includes('origin.includes("127.0.0.1")')) {
  failures.push('backend/src/server.js must not use substring matching for 127.0.0.1 CORS origins')
}

if (!serverSource.includes('function isAllowedCorsOrigin(origin)')) {
  failures.push('backend/src/server.js must centralize CORS origin checks in isAllowedCorsOrigin')
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
