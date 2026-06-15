import { readFileSync } from 'fs'
import { join } from 'path'

const root = process.cwd()
const frontendEnv = readFileSync(join(root, '.env.example'), 'utf-8')
const backendEnv = readFileSync(join(root, 'backend', '.env.example'), 'utf-8')

const requiredFrontendKeys = [
  'VITE_API_URL',
  'VITE_SPOTIFY_NOW_PLAYING_URL',
  'VITE_SPOTIFY_NOW_PLAYING_REFRESH_MS',
  'SITE_URL',
  'SITEMAP_SOURCE',
  'SITEMAP_BLOG_API_URL'
]

const requiredBackendKeys = [
  'NODE_ENV',
  'PORT',
  'SITE_URL',
  'PUBLIC_SITE_URL',
  'DATABASE_PATH',
  'DATABASE_BACKUP_DIR',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
  'R2_PUBLIC_DOMAIN',
  'CF_ZONE_ID',
  'CF_API_TOKEN',
  'CLOUDFLARE_ZONE_ID',
  'CLOUDFLARE_API_TOKEN',
  'SPOTIFY_CLIENT_ID',
  'SPOTIFY_CLIENT_SECRET',
  'SPOTIFY_REDIRECT_URI',
  'SPOTIFY_REFRESH_TOKEN',
  'SPOTIFY_SCOPES',
  'SPOTIFY_CALLBACK_SUCCESS_URL',
  'AI_PROVIDER',
  'AI_API_KEY',
  'AI_API_URL',
  'AI_MODEL',
  'AI_TIMEOUT_MS',
  'AI_SEED_IMPORT_WHITELIST'
]

function hasKey(content, key) {
  return new RegExp(`^${key}=`, 'm').test(content)
}

const missingFrontendKeys = requiredFrontendKeys.filter((key) => !hasKey(frontendEnv, key))
const missingBackendKeys = requiredBackendKeys.filter((key) => !hasKey(backendEnv, key))

if (missingFrontendKeys.length > 0 || missingBackendKeys.length > 0) {
  if (missingFrontendKeys.length > 0) {
    console.error(`.env.example is missing: ${missingFrontendKeys.join(', ')}`)
  }

  if (missingBackendKeys.length > 0) {
    console.error(`backend/.env.example is missing: ${missingBackendKeys.join(', ')}`)
  }

  process.exit(1)
}

console.log('environment examples ok')
