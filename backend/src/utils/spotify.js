const TOKEN_URL = 'https://accounts.spotify.com/api/token'
const DEFAULT_SPOTIFY_SCOPE = 'user-read-currently-playing'

let runtimeRefreshToken = ''
let accessTokenCache = {
  token: '',
  expiresAt: 0,
  scope: ''
}

const SPOTIFY_FIELD_LABELS = {
  clientId: 'SPOTIFY_CLIENT_ID',
  clientSecret: 'SPOTIFY_CLIENT_SECRET',
  redirectUri: 'SPOTIFY_REDIRECT_URI',
  refreshToken: 'SPOTIFY_REFRESH_TOKEN'
}

const createBasicAuthHeader = (clientId, clientSecret) =>
  `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`

const trimEnv = (key) => (process.env[key] || '').trim()

export const getSpotifyConfig = () => ({
  clientId: trimEnv('SPOTIFY_CLIENT_ID'),
  clientSecret: trimEnv('SPOTIFY_CLIENT_SECRET'),
  redirectUri: trimEnv('SPOTIFY_REDIRECT_URI'),
  refreshToken: runtimeRefreshToken || trimEnv('SPOTIFY_REFRESH_TOKEN'),
  scopes: (trimEnv('SPOTIFY_SCOPES') || DEFAULT_SPOTIFY_SCOPE)
    .split(/\s+/)
    .map(scope => scope.trim())
    .filter(Boolean),
  callbackSuccessUrl: trimEnv('SPOTIFY_CALLBACK_SUCCESS_URL')
})

export const getSpotifyMissingFields = (config, requiredKeys = ['clientId', 'clientSecret', 'redirectUri', 'refreshToken']) =>
  requiredKeys
    .filter((key) => !config[key])
    .map((key) => SPOTIFY_FIELD_LABELS[key] || key)

export const isSecureRequest = (req) => Boolean(req?.secure || req?.headers?.['x-forwarded-proto'] === 'https')

export const getPublicBaseUrl = (req) => {
  if (!req) return ''
  return `${req.protocol}://${req.get('host')}`
}

export const buildSpotifyNowPlayingUrl = (req) => {
  const baseUrl = getPublicBaseUrl(req)
  return baseUrl ? `${baseUrl}/api/spotify/now-playing` : ''
}

export const buildSpotifyLoginUrl = (req) => {
  const baseUrl = getPublicBaseUrl(req)
  return baseUrl ? `${baseUrl}/api/spotify/login` : ''
}

export const setSpotifyRuntimeRefreshToken = (token) => {
  runtimeRefreshToken = typeof token === 'string' ? token.trim() : ''
}

export const setSpotifyAccessTokenCache = ({
  token = '',
  expiresAt = 0,
  expiresInSeconds = 0,
  scope = ''
} = {}) => {
  const nextExpiresAt = Number(expiresAt) > 0
    ? Number(expiresAt)
    : Date.now() + ((Number(expiresInSeconds) || 0) * 1000)

  accessTokenCache = {
    token: typeof token === 'string' ? token : '',
    expiresAt: nextExpiresAt > 0 ? nextExpiresAt : 0,
    scope: typeof scope === 'string' && scope.trim()
      ? scope.trim()
      : accessTokenCache.scope
  }
}

export const getSpotifyAccessTokenCacheSnapshot = () => ({
  ...accessTokenCache
})

export const requestSpotifyToken = async (params, config) => {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: createBasicAuthHeader(config.clientId, config.clientSecret),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams(params)
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = payload.error_description || payload.error || `Spotify token endpoint returned ${response.status}`
    const error = new Error(message)
    error.status = response.status
    error.payload = payload
    throw error
  }

  return payload
}

export const getCachedSpotifyAccessToken = async (config) => {
  const now = Date.now()
  if (accessTokenCache.token && accessTokenCache.expiresAt > now + 30_000) {
    return accessTokenCache.token
  }

  const payload = await requestSpotifyToken({
    grant_type: 'refresh_token',
    refresh_token: config.refreshToken
  }, config)

  if (typeof payload.refresh_token === 'string' && payload.refresh_token.trim()) {
    setSpotifyRuntimeRefreshToken(payload.refresh_token)
  }

  setSpotifyAccessTokenCache({
    token: payload.access_token || '',
    expiresInSeconds: Number(payload.expires_in) || 3600,
    scope: payload.scope || ''
  })

  return accessTokenCache.token
}

export const normalizeSpotifyCurrentlyPlayingPayload = (payload = {}) => {
  const item = payload?.item || {}
  const artists = Array.isArray(item.artists)
    ? item.artists.map(artist => artist?.name).filter(Boolean).join(', ')
    : ''

  return {
    ...payload,
    title: item.name || '',
    artist: artists,
    album: item?.album?.name || '',
    coverUrl: item?.album?.images?.[0]?.url || '',
    externalUrl: item?.external_urls?.spotify || '',
    progressMs: Number.isFinite(payload?.progress_ms) ? payload.progress_ms : null,
    durationMs: Number.isFinite(item?.duration_ms) ? item.duration_ms : null,
    isPlaying: Boolean(payload?.is_playing)
  }
}

export const getSpotifyStatus = (req) => {
  const config = getSpotifyConfig()
  const authMissingFields = getSpotifyMissingFields(config, ['clientId', 'clientSecret', 'redirectUri'])
  const playbackMissingFields = getSpotifyMissingFields(config, ['clientId', 'clientSecret', 'refreshToken'])
  const missingFields = getSpotifyMissingFields(config)
  const now = Date.now()
  const cache = getSpotifyAccessTokenCacheSnapshot()
  const hasRuntimeRefreshToken = Boolean(runtimeRefreshToken)
  const hasEnvRefreshToken = Boolean(trimEnv('SPOTIFY_REFRESH_TOKEN'))
  const grantedScopes = cache.scope
    ? cache.scope.split(/\s+/).map(scope => scope.trim()).filter(Boolean)
    : []

  return {
    configured: missingFields.length === 0,
    auth_configured: authMissingFields.length === 0,
    playback_configured: playbackMissingFields.length === 0,
    missing_fields: missingFields,
    auth_missing_fields: authMissingFields,
    playback_missing_fields: playbackMissingFields,
    redirect_uri: config.redirectUri || null,
    callback_success_url: config.callbackSuccessUrl || null,
    now_playing_url: buildSpotifyNowPlayingUrl(req) || null,
    login_url: buildSpotifyLoginUrl(req) || null,
    scopes: config.scopes,
    granted_scopes: grantedScopes,
    refresh_token_present: Boolean(config.refreshToken),
    refresh_token_source: hasRuntimeRefreshToken ? 'runtime' : (hasEnvRefreshToken ? 'env' : null),
    access_token_cached: Boolean(cache.token && cache.expiresAt > now),
    access_token_expires_at: cache.expiresAt > 0 ? new Date(cache.expiresAt).toISOString() : null
  }
}
