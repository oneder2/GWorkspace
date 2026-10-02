import { computed, onMounted, onUnmounted, ref } from 'vue'
import { API_BASE_URL } from '../utils/api'

const SPOTIFY_NOW_PLAYING_URL = (
  import.meta.env.VITE_SPOTIFY_NOW_PLAYING_URL ||
  `${API_BASE_URL}/spotify/now-playing`
).trim()
const SPOTIFY_REFRESH_MS = Math.max(
  Number.parseInt(import.meta.env.VITE_SPOTIFY_NOW_PLAYING_REFRESH_MS || '60000', 10) || 60000,
  15000
)

const pickString = (...values) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return ''
}

const pickArtist = (artists) => {
  if (!artists) return ''
  if (typeof artists === 'string') return artists.trim()
  if (Array.isArray(artists)) {
    return artists
      .map((artist) => {
        if (!artist) return ''
        if (typeof artist === 'string') return artist.trim()
        return pickString(artist.name, artist.title, artist.artist)
      })
      .filter(Boolean)
      .join(', ')
  }
  if (typeof artists === 'object') {
    return pickString(artists.name, artists.title, artists.artist)
  }
  return ''
}

const pickImageUrl = (payload, source) => {
  const candidates = [
    payload?.coverUrl,
    payload?.cover_url,
    payload?.image,
    payload?.imageUrl,
    payload?.image_url,
    source?.album?.images?.[0]?.url,
    payload?.album?.images?.[0]?.url,
    source?.images?.[0]?.url
  ]

  return candidates.find(candidate => typeof candidate === 'string' && candidate.trim()) || ''
}

export const normalizePayload = (payload) => {
  if (!payload || typeof payload !== 'object') return null

  const source = payload.item || payload.track || payload.data || payload
  const title = pickString(
    source?.name,
    source?.title,
    payload.title,
    payload.song,
    payload.track_name,
    payload.trackTitle
  )

  if (!title) return null

  const numeric = value => value == null ? NaN : Number(value)
  const progressMs = numeric(payload.progress_ms ?? payload.progressMs ?? source?.progress_ms ?? source?.progressMs)
  const durationMs = numeric(source?.duration_ms ?? source?.durationMs ?? payload.duration_ms ?? payload.durationMs)
  const isPlaying = Boolean(
    payload.is_playing ??
    payload.isPlaying ??
    source?.is_playing ??
    source?.isPlaying
  )

  return {
    title,
    artist: pickArtist(source?.artists || payload.artists || payload.artist),
    album: pickString(source?.album?.name, payload.album, payload.album_name, source?.album_name),
    coverUrl: pickImageUrl(payload, source),
    externalUrl: pickString(
      source?.external_urls?.spotify,
      payload.externalUrl,
      payload.url,
      payload.spotify_url,
      source?.url
    ),
    progressMs: Number.isFinite(progressMs) ? progressMs : null,
    durationMs: Number.isFinite(durationMs) ? durationMs : null,
    isPlaying,
    updatedAt: new Date().toISOString()
  }
}

export function useSpotifyNowPlaying() {
  const track = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const hasEndpoint = computed(() => Boolean(SPOTIFY_NOW_PLAYING_URL))
  let timerId = null
  let activeController = null
  let disposed = false
  let retryAt = 0

  const loadNowPlaying = async () => {
    if (disposed || activeController || Date.now() < retryAt) return track.value
    clearTimeout(timerId)
    if (!hasEndpoint.value) {
      track.value = null
      return null
    }

    isLoading.value = true
    error.value = null

    const controller = new AbortController()
    activeController = controller
    // Allows one bounded refresh + a 401 retry on the backend.
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    try {
      const response = await fetch(SPOTIFY_NOW_PLAYING_URL, {
        cache: 'no-store',
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      })

      if (response.status === 204) {
        track.value = null
        return null
      }

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        if (response.status === 429) retryAt = Date.now() + Math.max(15, Number(response.headers.get('retry-after')) || 30) * 1000
        throw Object.assign(new Error('Spotify playback unavailable'), { code: payload.code || 'unavailable', status: response.status })
      }

      const payload = await response.json()
      track.value = normalizePayload(payload)
      return track.value
    } catch (loadError) {
      if (!disposed) { error.value = loadError; track.value = null }
      return null
    } finally {
      clearTimeout(timeoutId)
      activeController = null
      if (!disposed) {
        isLoading.value = false
        if (!document.hidden) timerId = setTimeout(loadNowPlaying, Math.max(SPOTIFY_REFRESH_MS, retryAt - Date.now()))
      }
    }
  }

  onMounted(() => {
    disposed = false
    loadNowPlaying()
    document.addEventListener('visibilitychange', resume)
  })

  const resume = () => {
    clearTimeout(timerId)
    if (!document.hidden) {
      if (Date.now() < retryAt) timerId = setTimeout(loadNowPlaying, retryAt - Date.now())
      else loadNowPlaying()
    }
  }

  onUnmounted(() => {
    disposed = true
    clearTimeout(timerId)
    activeController?.abort()
    document.removeEventListener('visibilitychange', resume)
  })

  return {
    track,
    isLoading,
    error,
    hasEndpoint,
    loadNowPlaying
  }
}
