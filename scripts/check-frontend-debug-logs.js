import { readdirSync, readFileSync, statSync } from 'fs'
import { join, relative } from 'path'

const srcDir = join(process.cwd(), 'src')
const disallowedPatterns = [
  /\[DEBUG\]/,
  /\[useTodo\]/,
  /\[useLocalStorage\]/,
  /\[QuickLinkEditor\]/,
  /Admin location updated successfully/
]

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const entryPath = join(dir, entry)
    const stats = statSync(entryPath)

    if (stats.isDirectory()) return walk(entryPath)
    if (stats.isFile() && /\.(js|vue)$/.test(entry)) return [entryPath]
    return []
  })
}

const failures = []

for (const file of walk(srcDir)) {
  const lines = readFileSync(file, 'utf-8').split('\n')

  lines.forEach((line, index) => {
    if (disallowedPatterns.some((pattern) => pattern.test(line))) {
      failures.push(`${relative(process.cwd(), file)}:${index + 1}: ${line.trim()}`)
    }
  })
}

if (failures.length > 0) {
  console.error('Frontend debug log check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('frontend debug log check passed')
