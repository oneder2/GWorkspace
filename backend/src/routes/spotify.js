import crypto from 'node:crypto'
import express from 'express'
import {
  buildSpotifyLoginUrl,
  buildSpotifyNowPlayingUrl,
  getCachedSpotifyAccessToken,
  getSpotifyConfig,
  getSpotifyMissingFields,
  isSecureRequest,
  normalizeSpotifyCurrentlyPlayingPayload,
  requestSpotifyToken,
  setSpotifyAccessTokenCache,
  setSpotifyRuntimeRefreshToken
} from '../utils/spotify.js'

const router = express.Router()

const AUTHORIZE_URL = 'https://accounts.spotify.com/authorize'
const CURRENTLY_PLAYING_URL = 'https://api.spotify.com/v1/me/player/currently-playing'
const OAUTH_STATE_COOKIE = 'spotify_oauth_state'

const parseCookies = (cookieHeader = '') => cookieHeader
  .split(';')
  .map(entry => entry.trim())
  .filter(Boolean)
  .reduce((cookies, entry) => {
    const separatorIndex = entry.indexOf('=')
    if (separatorIndex === -1) return cookies

    const key = entry.slice(0, separatorIndex).trim()
    const value = entry.slice(separatorIndex + 1).trim()
    cookies[key] = decodeURIComponent(value)
    return cookies
  }, {})

const buildCookie = (name, value, req, maxAgeSeconds = 600) => {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`
  ]

  if (isSecureRequest(req)) {
    parts.push('Secure')
  }

  return parts.join('; ')
}

const clearCookie = (name, req) => {
  const parts = [
    `${name}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0'
  ]

  if (isSecureRequest(req)) {
    parts.push('Secure')
  }

  return parts.join('; ')
}

const sendConfigError = (res, missing) => {
  res.status(503).json({
    error: 'Spotify integration is not fully configured.',
    missing
  })
}

const renderCallbackHtml = ({
  refreshToken,
  req,
  config,
  accessToken,
  expiresIn,
  scope
}) => {
  const envSnippet = [
    `SPOTIFY_CLIENT_ID=${config.clientId}`,
    'SPOTIFY_CLIENT_SECRET=YOUR_CLIENT_SECRET',
    `SPOTIFY_REDIRECT_URI=${config.redirectUri}`,
    `SPOTIFY_REFRESH_TOKEN=${refreshToken || 'PASTE_REFRESH_TOKEN_HERE'}`,
    `VITE_SPOTIFY_NOW_PLAYING_URL=${buildSpotifyNowPlayingUrl(req)}`,
    'VITE_SPOTIFY_NOW_PLAYING_REFRESH_MS=60000'
  ].join('\n')

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Spotify Connected</title>
    <style>
      :root { color-scheme: light dark; }
      body { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; margin: 0; padding: 32px; background: #0f172a; color: #e2e8f0; }
      main { max-width: 860px; margin: 0 auto; background: rgba(15, 23, 42, 0.72); border: 1px solid rgba(148, 163, 184, 0.24); border-radius: 20px; padding: 24px; }
      h1 { margin-top: 0; font-size: 24px; }
      p, li { line-height: 1.65; color: #cbd5e1; }
      code, pre { background: rgba(15, 23, 42, 0.9); border-radius: 12px; }
      pre { padding: 16px; overflow-x: auto; border: 1px solid rgba(148, 163, 184, 0.22); }
      .token { color: #f8fafc; word-break: break-all; }
      .pill { display: inline-block; padding: 6px 10px; border-radius: 999px; background: rgba(16, 185, 129, 0.18); color: #a7f3d0; font-size: 12px; font-weight: 700; }
      a { color: #93c5fd; }
    </style>
  </head>
  <body>
    <main>
      <span class="pill">Spotify connected</span>
      <h1>Spotify authorization completed</h1>
      <p>The backend has exchanged the authorization code for tokens. To keep this working after a restart, copy the refresh token into your backend environment.</p>
      <p><strong>Refresh token</strong></p>
      <pre class="token">${refreshToken || 'Spotify did not return a refresh token in this response.'}</pre>
      <p><strong>Suggested environment variables</strong></p>
      <pre>${envSnippet}</pre>
      <ul>
        <li>Current scope: <code>${scope || config.scopes.join(' ')}</code></li>
        <li>Access token lifetime: <code>${expiresIn || 'unknown'}</code> seconds</li>
        <li>Now-playing endpoint: <a href="${buildSpotifyNowPlayingUrl(req)}">${buildSpotifyNowPlayingUrl(req)}</a></li>
        <li>Authorize again: <a href="${buildSpotifyLoginUrl(req)}">${buildSpotifyLoginUrl(req)}</a></li>
      </ul>
      ${accessToken ? '<p>The server has also cached an access token for the current process, so the now-playing route can work immediately.</p>' : ''}
    </main>
  </body>
</html>`
}

router.get('/login', (req, res) => {
  const config = getSpotifyConfig()
  const missing = getSpotifyMissingFields(config, ['clientId', 'clientSecret', 'redirectUri'])

  if (missing.length > 0) {
    return sendConfigError(res, missing)
  }

  const state = crypto.randomBytes(16).toString('hex')
  const showDialog = req.query.show_dialog === 'true' ? 'true' : 'false'
  const authorizeUrl = new URL(AUTHORIZE_URL)

  authorizeUrl.searchParams.set('client_id', config.clientId)
  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('redirect_uri', config.redirectUri)
  authorizeUrl.searchParams.set('scope', config.scopes.join(' '))
  authorizeUrl.searchParams.set('state', state)
  authorizeUrl.searchParams.set('show_dialog', showDialog)

  res.setHeader('Set-Cookie', buildCookie(OAUTH_STATE_COOKIE, state, req))
  res.redirect(authorizeUrl.toString())
})

router.get('/callback', async (req, res) => {
  const config = getSpotifyConfig()
  const missing = getSpotifyMissingFields(config, ['clientId', 'clientSecret', 'redirectUri'])

  if (missing.length > 0) {
    return sendConfigError(res, missing)
  }

  const { code, error, state } = req.query
  const cookies = parseCookies(req.headers.cookie)
  const storedState = cookies[OAUTH_STATE_COOKIE]

  res.setHeader('Set-Cookie', clearCookie(OAUTH_STATE_COOKIE, req))

  if (error) {
    return res.status(400).send(`Spotify authorization failed: ${error}`)
  }

  if (!code || !state || !storedState || state !== storedState) {
    return res.status(400).send('Spotify authorization failed: state mismatch or missing code.')
  }

  try {
    const tokenPayload = await requestSpotifyToken({
      grant_type: 'authorization_code',
      code: String(code),
      redirect_uri: config.redirectUri
    }, config)

    if (typeof tokenPayload.refresh_token === 'string' && tokenPayload.refresh_token.trim()) {
      setSpotifyRuntimeRefreshToken(tokenPayload.refresh_token)
    }

    setSpotifyAccessTokenCache({
      token: tokenPayload.access_token || '',
      expiresInSeconds: Number(tokenPayload.expires_in) || 3600,
      scope: tokenPayload.scope || ''
    })

    if ((req.query.format === 'json' || req.accepts(['json', 'html']) === 'json') && !config.callbackSuccessUrl) {
      return res.json({
        message: 'Spotify authorization completed.',
        refresh_token: tokenPayload.refresh_token || null,
        scope: tokenPayload.scope || config.scopes.join(' '),
        expires_in: tokenPayload.expires_in || null,
        now_playing_url: buildSpotifyNowPlayingUrl(req)
      })
    }

    if (config.callbackSuccessUrl) {
      const successUrl = new URL(config.callbackSuccessUrl)
      successUrl.searchParams.set('spotify', 'connected')
      if (tokenPayload.refresh_token) {
        successUrl.searchParams.set('refresh_token_captured', 'true')
      }
      return res.redirect(successUrl.toString())
    }

    res.send(renderCallbackHtml({
      refreshToken: tokenPayload.refresh_token || '',
      req,
      config,
      accessToken: tokenPayload.access_token || '',
      expiresIn: tokenPayload.expires_in || null,
      scope: tokenPayload.scope || ''
    }))
  } catch (requestError) {
    console.error('Spotify callback error:', requestError)
    res.status(requestError.status || 500).json({
      error: 'Failed to exchange Spotify authorization code.',
      message: requestError.message
    })
  }
})

router.get('/now-playing', async (req, res) => {
  const config = getSpotifyConfig()
  const missing = getSpotifyMissingFields(config, ['clientId', 'clientSecret', 'refreshToken'])

  if (missing.length > 0) {
    return sendConfigError(res, missing)
  }

  try {
    const accessToken = await getCachedSpotifyAccessToken(config)
    const spotifyUrl = new URL(CURRENTLY_PLAYING_URL)
    const market = typeof req.query.market === 'string' ? req.query.market.trim() : ''

    if (market) {
      spotifyUrl.searchParams.set('market', market)
    }

    const response = await fetch(spotifyUrl.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json'
      }
    })

    if (response.status === 204) {
      res.status(204).end()
      return
    }

    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Spotify currently playing request failed.',
        message: payload.error?.message || payload.error_description || `Spotify returned ${response.status}`
      })
    }

    res.setHeader('Cache-Control', 'no-store')
    res.json(normalizeSpotifyCurrentlyPlayingPayload(payload))
  } catch (requestError) {
    console.error('Spotify now-playing error:', requestError)
    res.status(requestError.status || 500).json({
      error: 'Failed to fetch Spotify now-playing data.',
      message: requestError.message
    })
  }
})

export default router
