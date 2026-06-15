import { readdirSync } from 'fs'
import { join } from 'path'
import { pathToFileURL } from 'url'

const routesDir = join(process.cwd(), 'backend', 'src', 'routes')

const routeFiles = readdirSync(routesDir)
  .filter((entry) => entry.endsWith('.js'))
  .sort()

if (routeFiles.length === 0) {
  console.error('No backend route modules found')
  process.exit(1)
}

await Promise.all(
  routeFiles.map((file) => import(pathToFileURL(join(routesDir, file)).href))
)

console.log('backend route modules ok', routeFiles.length)
