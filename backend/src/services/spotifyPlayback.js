import { getCachedSpotifyAccessToken, getSpotifyConfig, getSpotifyMissingFields, normalizeSpotifyCurrentlyPlayingPayload, recordSpotifyPlaybackHealth, spotifyFetch } from '../utils/spotify.js'

const cache = new Map()
const inFlight = new Map()
let retryUntil = 0
let generation = 0
export const clearSpotifyPlaybackCache = () => {
  generation++
  cache.clear()
  inFlight.clear()
  retryUntil = 0
  recordSpotifyPlaybackHealth('unchecked')
}
const failure = (status, code) => ({ status, body: { error: 'Spotify playback is temporarily unavailable.', code } })

async function loadPlayback(market) {
  const config = getSpotifyConfig()
  if (getSpotifyMissingFields(config, ['clientId', 'clientSecret', 'refreshToken']).length) return failure(503, 'not_configured')
  try {
    let token = await getCachedSpotifyAccessToken(config)
    const url = new URL('https://api.spotify.com/v1/me/player/currently-playing')
    url.searchParams.set('additional_types', 'track,episode')
    if (market) url.searchParams.set('market', market)
    const playback = () => spotifyFetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })
    let response = await playback()
    if (response.status === 401) {
      await response.arrayBuffer()
      token = await getCachedSpotifyAccessToken(getSpotifyConfig(), token)
      response = await playback()
    }
    if (response.status === 204) return { status: 204, body: null }
    if (response.status === 429) {
      const seconds = Number(response.headers.get('retry-after')) || 30
      await response.arrayBuffer()
      return { ...failure(429, 'rate_limited'), retryAfter: Math.min(86400, Math.max(1, seconds)) }
    }
    if (!response.ok) {
      await response.arrayBuffer()
      return failure(503, response.status === 401 || response.status === 403 ? 'reauthorization_required' : 'upstream_error')
    }
    const payload = await response.json()
    if (!payload?.item) return { status: 204, body: null }
    return { status: 200, body: normalizeSpotifyCurrentlyPlayingPayload(payload) }
  } catch (error) {
    // No upstream text or token payload in public responses or logs.
    return failure(error.name === 'TimeoutError' || error.name === 'AbortError' ? 504 : 503,
      error.name === 'TimeoutError' || error.name === 'AbortError' ? 'timeout' : error.code || 'upstream_unreachable')
  }
}

export async function getSpotifyPlayback(market = '') {
  if (retryUntil > Date.now()) return { ...failure(429, 'rate_limited'), retryAfter: Math.ceil((retryUntil - Date.now()) / 1000) }
  const saved = cache.get(market)
  if (saved && saved.until > Date.now()) return saved.result
  if (inFlight.has(market)) return inFlight.get(market)
  const requestGeneration = generation
  const pending = loadPlayback(market).then(result => {
    // Reauthorization invalidates even pending responses. Join a fresh request
    // rather than publishing old playback or an old account's rate limit.
    if (requestGeneration !== generation) return getSpotifyPlayback(market)
    if (result.status === 429) retryUntil = Date.now() + result.retryAfter * 1000
    recordSpotifyPlaybackHealth(result.status === 200 ? 'available' : result.status === 204 ? 'idle' : 'error', result.body?.code || null)
    if (cache.size >= 16) cache.delete(cache.keys().next().value)
    cache.set(market, { result, until: Date.now() + 10000 })
    return result
  }).finally(() => { if (inFlight.get(market) === pending) inFlight.delete(market) })
  inFlight.set(market, pending)
  return pending
}
