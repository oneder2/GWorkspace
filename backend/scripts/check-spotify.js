import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

const directory = mkdtempSync(join(tmpdir(), 'gworkspace-spotify-'))
Object.assign(process.env, { DATABASE_PATH: join(directory, 'check.db'), JWT_SECRET: randomUUID(), SPOTIFY_CLIENT_ID: 'fixture-client', SPOTIFY_CLIENT_SECRET: 'fixture-secret', SPOTIFY_REFRESH_TOKEN: 'fixture-refresh', SPOTIFY_REDIRECT_URI: 'http://localhost/api/spotify/callback', SPOTIFY_CALLBACK_SUCCESS_URL: '' })
const originalFetch = globalThis.fetch
const { getDatabase, closeDatabase } = await import('../src/config/database.js')
const { runMigrations } = await import('../src/config/migrations.js')
const { getCachedSpotifyAccessToken, setSpotifyAccessTokenCache, getSpotifyConfig, getSpotifyStatus } = await import('../src/utils/spotify.js')
const { getSpotifyPlayback, clearSpotifyPlaybackCache } = await import('../src/services/spotifyPlayback.js')
const json = (payload, status = 200, headers = {}) => new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json', ...headers } })
const track = { is_playing: true, progress_ms: 500, item: { name: 'Fixture song', duration_ms: 10000, artists: [{ name: 'Artist' }], album: { name: 'Album', images: [{ url: 'https://example.test/cover' }] }, external_urls: { spotify: 'https://example.test/song' } } }
try {
  runMigrations({ logger: null })
  let tokenCalls = 0, playbackCalls = 0
  globalThis.fetch = async (url, options) => {
    assert.ok(options.signal, 'Every upstream request has a deadline')
    if (String(url).includes('/api/token')) { tokenCalls++; return json({ access_token: 'fresh-token', refresh_token: 'rotated-refresh', expires_in: 3600 }) }
    playbackCalls++
    return options.headers.Authorization === 'Bearer rejected-token' ? json({}, 401) : json(track)
  }
  await Promise.all(Array.from({ length: 10 }, () => getCachedSpotifyAccessToken(getSpotifyConfig())))
  assert.equal(tokenCalls, 1, 'Token refresh is shared')
  assert.equal(getDatabase().prepare('SELECT spotify_refresh_token FROM admin_settings WHERE id=1').get().spotify_refresh_token, 'rotated-refresh')
  setSpotifyAccessTokenCache({ token: 'rejected-token', expiresInSeconds: 3600 })
  const simultaneous = await Promise.all(Array.from({ length: 10 }, () => getSpotifyPlayback()))
  assert.ok(simultaneous.every(result => result.status === 200 && result.body.title === 'Fixture song'))
  assert.equal(tokenCalls, 2, '401 refreshes once')
  assert.equal(playbackCalls, 2, 'Playback requests and retry are shared')
  await getSpotifyPlayback()
  assert.equal(playbackCalls, 2, 'Public polling uses short server cache')
  assert.equal(getSpotifyStatus().playback_health.state, 'available')

  clearSpotifyPlaybackCache()
  globalThis.fetch = async () => new Response(null, { status: 204 })
  assert.equal((await getSpotifyPlayback()).status, 204)
  assert.equal(getSpotifyStatus().playback_health.state, 'idle')
  clearSpotifyPlaybackCache()
  globalThis.fetch = async () => json({ item: { name: 'Episode', show: { publisher: 'Host', name: 'Podcast' }, images: [{ url: 'https://example.test/episode' }] }, is_playing: false })
  assert.equal((await getSpotifyPlayback()).body.artist, 'Host')

  clearSpotifyPlaybackCache(); setSpotifyAccessTokenCache({ token: '', expiresInSeconds: 0 })
  globalThis.fetch = async () => json({ error: 'invalid_grant', error_description: 'secret upstream detail' }, 400)
  const revoked = await getSpotifyPlayback()
  assert.equal(revoked.body.code, 'reauthorization_required')
  assert.ok(!JSON.stringify(revoked).includes('secret'))
  assert.equal(getSpotifyStatus().playback_health.state, 'error')

  clearSpotifyPlaybackCache(); setSpotifyAccessTokenCache({ token: 'good-token', expiresInSeconds: 3600 })
  globalThis.fetch = async () => json({}, 403)
  assert.equal((await getSpotifyPlayback()).body.code, 'reauthorization_required')
  clearSpotifyPlaybackCache()
  globalThis.fetch = async () => { throw new DOMException('deadline', 'TimeoutError') }
  assert.equal((await getSpotifyPlayback()).status, 504)
  clearSpotifyPlaybackCache()
  let throttledCalls = 0
  globalThis.fetch = async () => { throttledCalls++; return json({}, 429, { 'Retry-After': '45' }) }
  assert.equal((await getSpotifyPlayback()).retryAfter, 45)
  assert.equal((await getSpotifyPlayback('US')).status, 429)
  assert.equal(throttledCalls, 1, 'Rate-limit wait applies across markets')

  const { default: router } = await import('../src/routes/spotify.js')
  const { User } = await import('../src/models/User.js')
  // Exercise the real Express route + authentication middleware in-process.
  // No listening socket is needed, so these checks also run in restricted CI.
  const get = (path, options = {}) => new Promise((resolve, reject) => {
    const url = new URL(path, 'http://localhost')
    const headers = new Headers(options.headers)
    const req = { url: url.pathname + url.search, method: options.method || 'GET', query: Object.fromEntries(url.searchParams), headers: Object.fromEntries(headers), protocol: 'http', get: name => headers.get(name) || 'localhost' }
    const responseHeaders = new Headers()
    let status = 200
    const res = {
      setHeader: (key, value) => responseHeaders.set(key, value),
      status(code) { status = code; return this },
      json(body) { responseHeaders.set('Content-Type', 'application/json'); resolve(new Response(JSON.stringify(body), { status, headers: responseHeaders })) },
      end() { resolve(new Response(null, { status, headers: responseHeaders })) },
      redirect(location) { status = 302; responseHeaders.set('Location', location); this.end() }
    }
    router.handle(req, res, error => reject(error || new Error(`Unhandled route: ${path}`)))
  })
  const limited = await get('/now-playing')
  assert.equal(limited.status, 429)
  assert.ok(Number(limited.headers.get('retry-after')) > 0)
  assert.equal(limited.headers.get('cache-control'), 'no-store')
  assert.equal((await get('/now-playing?market=INVALID')).status, 400)
  assert.equal((await get('/login')).status, 403)
  assert.equal((await get('/login', { method: 'POST' })).status, 401)
  assert.equal((await get('/callback?code=fake&state=fake', { headers: { Cookie: 'spotify_oauth_state=%garbage' } })).status, 400)
  const admin = await User.create({ username: 'spotify-check', email: 'spotify@example.test', password: 'Only-for-this-isolated-check', role: 'admin' })
  const token = User.generateToken(admin); User.saveSession(admin.id, token, new Date(Date.now() + 60000))
  const authorization = await (await get('/login', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })).json()
  const ticket = new URL(authorization.url).search
  const start = await get(`/login${ticket}`, { redirect: 'manual' })
  assert.equal(start.status, 302)
  assert.equal((await get(`/login${ticket}`)).status, 403, 'Ticket is single-use')
  const state = new URL(start.headers.get('location')).searchParams.get('state')
  globalThis.fetch = async () => json({ access_token: 'oauth-access', refresh_token: 'oauth-refresh', expires_in: 3600 })
  const callback = await get(`/callback?code=fixture-code&state=${state}`, { headers: { Cookie: start.headers.get('set-cookie').split(';')[0] } })
  assert.equal(callback.status, 200)
  assert.ok(!(await callback.text()).includes('oauth-refresh'), 'Never expose refresh credentials')
  assert.equal((await get(`/callback?code=fixture-code&state=${state}`, { headers: { Cookie: start.headers.get('set-cookie').split(';')[0] } })).status, 400)
  clearSpotifyPlaybackCache()
  globalThis.fetch = async () => new Response(null, { status: 204 })
  const idle = await get('/now-playing'); assert.equal(idle.status, 204); assert.equal(idle.headers.get('cache-control'), 'no-store')
  // An old refresh finishing after reauthorization must not replace new tokens.
  setSpotifyAccessTokenCache({ token: '', expiresInSeconds: 0 })
  let finishOldRefresh
  globalThis.fetch = () => new Promise(resolve => { finishOldRefresh = resolve })
  const oldRefresh = getCachedSpotifyAccessToken(getSpotifyConfig())
  setSpotifyAccessTokenCache({ token: 'new-connection', expiresInSeconds: 3600 })
  finishOldRefresh(json({ access_token: 'obsolete-access', refresh_token: 'obsolete-refresh', expires_in: 3600 }))
  assert.equal(await oldRefresh, 'new-connection')
  assert.equal(getDatabase().prepare('SELECT spotify_refresh_token FROM admin_settings WHERE id=1').get().spotify_refresh_token, 'oauth-refresh')

  // An old playback/rate-limit response cannot repopulate the cleared cache.
  clearSpotifyPlaybackCache()
  let finishOldPlayback
  let markPlaybackStarted
  const playbackStarted = new Promise(resolve => { markPlaybackStarted = resolve })
  globalThis.fetch = () => { markPlaybackStarted(); return new Promise(resolve => { finishOldPlayback = resolve }) }
  const oldPlayback = getSpotifyPlayback()
  await playbackStarted
  clearSpotifyPlaybackCache()
  globalThis.fetch = async () => json(track)
  finishOldPlayback(json({}, 429, { 'Retry-After': '999' }))
  assert.equal((await oldPlayback).status, 200)
  assert.equal((await getSpotifyPlayback()).body.title, 'Fixture song')
  assert.equal(getSpotifyStatus().playback_health.state, 'available')
  console.log('Spotify checks passed: shared refresh and playback, 401 retry, rotation persistence, idle, episodes, revoked authorization, 403, timeout, 429 backoff, cache headers, admin OAuth, one-use state, no credential disclosure and reauthorization races.')
} finally {
  globalThis.fetch = originalFetch
  closeDatabase(); rmSync(directory, { recursive: true, force: true })
}
