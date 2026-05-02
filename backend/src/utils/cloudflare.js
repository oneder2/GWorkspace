import dotenv from 'dotenv'

dotenv.config()

const getZoneId = () => (
  process.env.CF_ZONE_ID ||
  process.env.CLOUDFLARE_ZONE_ID ||
  ''
).trim()

const getApiToken = () => (
  process.env.CF_API_TOKEN ||
  process.env.CLOUDFLARE_API_TOKEN ||
  ''
).trim()

export const isCloudflarePurgeConfigured = () => Boolean(getZoneId() && getApiToken())

export const purgeCloudflareUrls = async (urls = []) => {
  const uniqueUrls = [...new Set(urls.filter(Boolean))]

  if (!uniqueUrls.length) {
    return {
      attempted: false,
      configured: isCloudflarePurgeConfigured(),
      purged: 0
    }
  }

  if (!isCloudflarePurgeConfigured()) {
    return {
      attempted: false,
      configured: false,
      purged: 0
    }
  }

  const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${getZoneId()}/purge_cache`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiToken()}`
    },
    body: JSON.stringify({
      files: uniqueUrls
    })
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.success) {
    const message = payload?.errors?.map(error => error.message).filter(Boolean).join('; ')
    throw new Error(message || `Cloudflare purge failed with status ${response.status}`)
  }

  return {
    attempted: true,
    configured: true,
    purged: uniqueUrls.length
  }
}
