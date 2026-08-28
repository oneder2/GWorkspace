import { existsSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'

const distDir = join(process.cwd(), 'dist')

const budgets = {
  maxSingleJsBytes: 1_100_000,
  maxTotalJsBytes: 2_100_000,
  maxSingleCssBytes: 120_000,
  maxTotalCssBytes: 200_000
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(dir, entry.name)

    if (entry.isDirectory()) return walk(entryPath)
    if (entry.isFile()) return [entryPath]
    return []
  })
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`
}

function summarize(files) {
  const entries = files
    .map((file) => ({ file, size: statSync(file).size }))
    .sort((a, b) => b.size - a.size)

  return {
    entries,
    total: entries.reduce((sum, entry) => sum + entry.size, 0),
    largest: entries[0] || null
  }
}

function assertBudget(condition, message, failures) {
  if (!condition) failures.push(message)
}

if (!existsSync(distDir)) {
  console.error('dist directory is missing. Run npm run build before checking frontend budgets.')
  process.exit(1)
}

const distFiles = walk(distDir)
const js = summarize(distFiles.filter((file) => file.endsWith('.js')))
const css = summarize(distFiles.filter((file) => file.endsWith('.css')))
const failures = []

assertBudget(js.entries.length > 0, 'No JavaScript assets found in dist.', failures)
assertBudget(css.entries.length > 0, 'No CSS assets found in dist.', failures)

if (js.largest) {
  assertBudget(
    js.largest.size <= budgets.maxSingleJsBytes,
    `Largest JS asset exceeds budget: ${relative(distDir, js.largest.file)} is ${formatBytes(js.largest.size)} > ${formatBytes(budgets.maxSingleJsBytes)}`,
    failures
  )
}

if (css.largest) {
  assertBudget(
    css.largest.size <= budgets.maxSingleCssBytes,
    `Largest CSS asset exceeds budget: ${relative(distDir, css.largest.file)} is ${formatBytes(css.largest.size)} > ${formatBytes(budgets.maxSingleCssBytes)}`,
    failures
  )
}

assertBudget(
  js.total <= budgets.maxTotalJsBytes,
  `Total JS size exceeds budget: ${formatBytes(js.total)} > ${formatBytes(budgets.maxTotalJsBytes)}`,
  failures
)
assertBudget(
  css.total <= budgets.maxTotalCssBytes,
  `Total CSS size exceeds budget: ${formatBytes(css.total)} > ${formatBytes(budgets.maxTotalCssBytes)}`,
  failures
)

if (failures.length > 0) {
  console.error('Frontend budget checks failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  `frontend budgets ok: js=${formatBytes(js.total)}, css=${formatBytes(css.total)}, largest-js=${formatBytes(js.largest.size)}, largest-css=${formatBytes(css.largest.size)}`
)
