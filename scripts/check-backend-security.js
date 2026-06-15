import { readFileSync } from 'fs'
import { join } from 'path'

const serverPath = join(process.cwd(), 'backend', 'src', 'server.js')
const userModelPath = join(process.cwd(), 'backend', 'src', 'models', 'User.js')
const authConfigPath = join(process.cwd(), 'backend', 'src', 'config', 'auth.js')
const serverSource = readFileSync(serverPath, 'utf-8')
const userModelSource = readFileSync(userModelPath, 'utf-8')
const authConfigSource = readFileSync(authConfigPath, 'utf-8')
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

if (!serverSource.includes('validateAuthConfig()')) {
  failures.push('backend/src/server.js must validate auth configuration during startup')
}

if (userModelSource.includes('your-secret-key-change-in-production')) {
  failures.push('backend/src/models/User.js must not include a hardcoded production JWT fallback')
}

if (!userModelSource.includes('getJwtSecret()')) {
  failures.push('backend/src/models/User.js must resolve JWT secrets through backend/src/config/auth.js')
}

if (!authConfigSource.includes("process.env.NODE_ENV === 'production'")) {
  failures.push('backend/src/config/auth.js must distinguish production JWT validation from local development')
}

if (!authConfigSource.includes('JWT_SECRET must be configured')) {
  failures.push('backend/src/config/auth.js must fail loudly when production JWT_SECRET is missing or placeholder')
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
