import { execFileSync } from 'child_process'

const allowedHigh = 2

function runBackendAudit() {
  try {
    return execFileSync('npm', ['audit', '--omit=dev', '--json'], {
      cwd: 'backend',
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe']
    })
  } catch (error) {
    if (error.stdout) return error.stdout.toString()
    throw error
  }
}

const audit = JSON.parse(runBackendAudit())
const counts = audit.metadata?.vulnerabilities || {}
const critical = counts.critical || 0
const high = counts.high || 0
const total = counts.total || 0

if (critical > 0 || high > allowedHigh) {
  console.error('Backend dependency audit exceeded the accepted risk boundary.')
  console.error(`Allowed: critical=0, high<=${allowedHigh}`)
  console.error(`Actual: critical=${critical}, high=${high}, total=${total}`)
  console.error('Known accepted high findings are currently tied to better-sqlite3/prebuild-install/tar.')
  process.exit(1)
}

console.log(`backend dependency audit within boundary: critical=${critical}, high=${high}, total=${total}`)
