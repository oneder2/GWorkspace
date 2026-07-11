import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'

const backendSrcDir = join(process.cwd(), 'backend', 'src')
const serverPath = join(backendSrcDir, 'server.js')
const routesDir = join(backendSrcDir, 'routes')

const routeMethodPattern = /\b(?:router|app)\.(get|post|put|patch|delete|options|head)\s*\(/gi
const corsMethodsPattern = /methods\s*:\s*\[([\s\S]*?)\]/m
const stringLiteralPattern = /['"`]([A-Za-z]+)['"`]/g

function readText(filePath) {
  return readFileSync(filePath, 'utf-8')
}

function walkJavaScriptFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const entryPath = join(dir, entry)
    const stats = statSync(entryPath)

    if (stats.isDirectory()) return walkJavaScriptFiles(entryPath)
    if (stats.isFile() && entry.endsWith('.js')) return [entryPath]
    return []
  })
}

function collectRouteMethods() {
  const routeFiles = [serverPath, ...walkJavaScriptFiles(routesDir)]
  const methods = new Set()

  for (const filePath of routeFiles) {
    const source = readText(filePath)
    for (const match of source.matchAll(routeMethodPattern)) {
      methods.add(match[1].toUpperCase())
    }
  }

  return [...methods].sort()
}

function collectCorsMethods() {
  const serverSource = readText(serverPath)
  const methodsMatch = serverSource.match(corsMethodsPattern)

  if (!methodsMatch) {
    throw new Error('Could not find CORS methods array in backend/src/server.js')
  }

  const methods = new Set()
  for (const match of methodsMatch[1].matchAll(stringLiteralPattern)) {
    methods.add(match[1].toUpperCase())
  }

  return [...methods].sort()
}

function main() {
  const routeMethods = collectRouteMethods()
  const corsMethods = collectCorsMethods()
  const requiredMethods = [...new Set([...routeMethods, 'OPTIONS'])].sort()
  const missingMethods = requiredMethods.filter((method) => !corsMethods.includes(method))

  if (missingMethods.length > 0) {
    console.error('CORS methods are missing backend route methods.')
    console.error(`Required: ${requiredMethods.join(', ')}`)
    console.error(`Configured: ${corsMethods.join(', ') || '(none)'}`)
    console.error(`Missing: ${missingMethods.join(', ')}`)
    process.exit(1)
  }

  console.log(`backend CORS methods ok: ${corsMethods.join(', ')}`)
}

main()
