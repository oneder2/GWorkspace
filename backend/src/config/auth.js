import dotenv from 'dotenv'

dotenv.config()

const INSECURE_JWT_SECRET = 'development-only-jwt-secret'
const PLACEHOLDER_JWT_SECRETS = new Set([
  '',
  'replace_with_a_strong_random_secret',
  'your-secret-key-change-in-production',
  'your-very-secure-secret-key',
  'your-very-secure-secret-key-change-this-in-production'
])

function isProduction() {
  return process.env.NODE_ENV === 'production'
}

function getConfiguredJwtSecret() {
  return (process.env.JWT_SECRET || '').trim()
}

export function getJwtExpiresIn() {
  return process.env.JWT_EXPIRES_IN || '7d'
}

export function getJwtSecret() {
  const secret = getConfiguredJwtSecret()

  if (secret && !PLACEHOLDER_JWT_SECRETS.has(secret)) {
    return secret
  }

  if (isProduction()) {
    throw new Error('JWT_SECRET must be configured with a strong non-placeholder value in production')
  }

  return INSECURE_JWT_SECRET
}

export function validateAuthConfig() {
  getJwtSecret()
}
