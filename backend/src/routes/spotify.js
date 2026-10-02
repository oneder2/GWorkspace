import crypto from 'node:crypto'
import express from 'express'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { getSpotifyPlayback, clearSpotifyPlaybackCache } from '../services/spotifyPlayback.js'
import { buildSpotifyNowPlayingUrl, getSpotifyConfig, getSpotifyMissingFields, isSecureRequest, requestSpotifyToken, setSpotifyAccessTokenCache, setSpotifyRuntimeRefreshToken } from '../utils/spotify.js'

const router = express.Router()
const tickets = new Map(), states = new Map()
const cookieName = 'spotify_oauth_state'
const cookie = (value, req, age = 600) => `${cookieName}=${value}; Path=/api/spotify; HttpOnly; SameSite=Lax; Max-Age=${age}${isSecureRequest(req) ? '; Secure' : ''}`
const take = (map, key) => { const until = map.get(key); map.delete(key); return until > Date.now() }
const prune = map => { for (const [key, until] of map) if (until <= Date.now()) map.delete(key) }
router.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next() })

// A short-lived one-use ticket bridges bearer-authenticated admin requests to
// a normal browser redirect, so OAuth cookies are set on the API origin.
router.post('/login', authenticate, requireAdmin, (req, res) => {
  const config = getSpotifyConfig()
  if (getSpotifyMissingFields(config, ['clientId', 'clientSecret', 'redirectUri']).length) return res.status(503).json({ code: 'not_configured', error: 'Configure Spotify credentials and redirect URI first.' })
  prune(tickets)
  const ticket = crypto.randomBytes(32).toString('hex')
  tickets.set(ticket, Date.now() + 60000)
  // Use the configured callback origin rather than trusting a Host header.
  const url = new URL('/api/spotify/login', config.redirectUri)
  url.searchParams.set('ticket', ticket)
  res.json({ url: url.toString() })
})

router.get('/login', (req, res) => {
  if (!take(tickets, req.query.ticket)) return res.status(403).json({ error: 'Start Spotify authorization from the administrator system page.' })
  const config = getSpotifyConfig(), state = crypto.randomBytes(32).toString('hex')
  prune(states); states.set(state, Date.now() + 600000)
  const url = new URL('https://accounts.spotify.com/authorize')
  for (const [key, value] of Object.entries({ client_id: config.clientId, response_type: 'code', redirect_uri: config.redirectUri, scope: config.scopes.join(' '), state, show_dialog: 'true' })) url.searchParams.set(key, value)
  res.setHeader('Set-Cookie', cookie(state, req))
  res.redirect(url.toString())
})

router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query
  const storedState = (req.headers.cookie || '').split(';').map(item => item.trim()).find(item => item.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1)
  res.setHeader('Set-Cookie', cookie('', req, 0))
  if (typeof state !== 'string' || state !== storedState || !take(states, state)) return res.status(400).json({ error: 'Spotify authorization expired or state did not match. Start again in the administrator system page.' })
  if (error || typeof code !== 'string') return res.status(400).json({ error: 'Spotify authorization was not completed.' })
  try {
    const config = getSpotifyConfig()
    const payload = await requestSpotifyToken({ grant_type: 'authorization_code', code, redirect_uri: config.redirectUri }, config)
    if (!payload.refresh_token) return res.status(502).json({ error: 'Spotify returned no refresh token. Authorize again.' })
    setSpotifyRuntimeRefreshToken(payload.refresh_token)
    setSpotifyAccessTokenCache({ token: payload.access_token, expiresInSeconds: payload.expires_in, scope: payload.scope })
    clearSpotifyPlaybackCache()
    if (config.callbackSuccessUrl) {
      const url = new URL(config.callbackSuccessUrl); url.searchParams.set('spotify', 'connected')
      return res.redirect(url.toString())
    }
    // Credentials remain server-side. The persisted refresh token survives a restart.
    res.json({ message: 'Spotify connected. Return to the administrator system page to check playback.', now_playing_url: buildSpotifyNowPlayingUrl(req) })
  } catch (error) {
    res.status(503).json({ error: 'Spotify authorization could not be saved. Please try again.', code: error.code || 'authorization_failed' })
  }
})

router.get('/now-playing', async (req, res) => {
  const market = typeof req.query.market === 'string' ? req.query.market.trim().toUpperCase() : ''
  if (market && !/^[A-Z]{2}$/.test(market)) return res.status(400).json({ error: 'market must be a two-letter country code.' })
  const result = await getSpotifyPlayback(market)
  if (result.retryAfter) res.setHeader('Retry-After', String(result.retryAfter))
  if (result.status === 204) return res.status(204).end()
  res.status(result.status).json(result.body)
})

export default router
