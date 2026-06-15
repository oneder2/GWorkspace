import { execFileSync } from 'child_process'

const allowedVulnerabilities = {
  'better-sqlite3': {
    severity: 'high',
    via: new Set(['tar'])
  },
  tar: {
    severity: 'high',
    advisoryUrls: new Set([
      'https://github.com/advisories/GHSA-34x7-hfp2-rc4v',
      'https://github.com/advisories/GHSA-8qq5-rm4j-mr97',
      'https://github.com/advisories/GHSA-83g3-92jg-28cx',
      'https://github.com/advisories/GHSA-qffp-2rhf-9h96',
      'https://github.com/advisories/GHSA-9ppj-qmqm-q256',
      'https://github.com/advisories/GHSA-r6q2-hw4h-h46w',
      'https://github.com/advisories/GHSA-vmf3-w455-68vh'
    ])
  }
}

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
const vulnerabilities = audit.vulnerabilities || {}
const unexpected = []

for (const [name, vulnerability] of Object.entries(vulnerabilities)) {
  const allowed = allowedVulnerabilities[name]

  if (!allowed) {
    unexpected.push(`${name}: not in allowlist`)
    continue
  }

  if (vulnerability.severity !== allowed.severity) {
    unexpected.push(`${name}: severity ${vulnerability.severity} !== ${allowed.severity}`)
  }

  if (allowed.via) {
    const via = vulnerability.via || []
    const viaNames = via.map((item) => (typeof item === 'string' ? item : item.name)).filter(Boolean)
    const hasOnlyAllowedVia = viaNames.length === allowed.via.size && viaNames.every((item) => allowed.via.has(item))

    if (!hasOnlyAllowedVia) {
      unexpected.push(`${name}: unexpected via chain ${viaNames.join(', ') || '(empty)'}`)
    }
  }

  if (allowed.advisoryUrls) {
    const advisoryUrls = (vulnerability.via || [])
      .filter((item) => typeof item === 'object' && item.url)
      .map((item) => item.url)
    const hasOnlyAllowedAdvisories =
      advisoryUrls.length === allowed.advisoryUrls.size &&
      advisoryUrls.every((item) => allowed.advisoryUrls.has(item))

    if (!hasOnlyAllowedAdvisories) {
      unexpected.push(`${name}: unexpected advisory set ${advisoryUrls.join(', ') || '(empty)'}`)
    }
  }
}

if (critical > 0 || unexpected.length > 0) {
  console.error('Backend dependency audit exceeded the accepted risk boundary.')
  console.error('Allowed: critical=0 and only the documented better-sqlite3/tar findings.')
  console.error(`Actual: critical=${critical}, high=${high}, total=${total}`)
  for (const item of unexpected) {
    console.error(`Unexpected: ${item}`)
  }
  process.exit(1)
}

console.log(`backend dependency audit within allowlist: critical=${critical}, high=${high}, total=${total}`)
