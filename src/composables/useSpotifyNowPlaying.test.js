import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
const hooks = vi.hoisted(() => ({ mount: null, unmount: null }))
vi.mock('vue', async importOriginal => ({ ...await importOriginal(), onMounted: callback => { hooks.mount = callback }, onUnmounted: callback => { hooks.unmount = callback } }))
import { normalizePayload, useSpotifyNowPlaying } from './useSpotifyNowPlaying'

beforeEach(() => { vi.useFakeTimers(); vi.stubGlobal('document', Object.assign(new EventTarget(), { hidden: false })) })
afterEach(() => { hooks.unmount?.(); vi.useRealTimers(); vi.unstubAllGlobals() })
describe('Spotify widget', () => {
  it('preserves the normalized song link and unknown progress', () => {
    expect(normalizePayload({ title: 'Song', externalUrl: 'https://open.spotify.com/track/fixture', progressMs: null, durationMs: null })).toMatchObject({ externalUrl: 'https://open.spotify.com/track/fixture', progressMs: null, durationMs: null })
    expect(normalizePayload({ item: null })).toBeNull()
  })
  it('deduplicates pending requests and cancels on unmount', async () => {
    let signal
    const fetch = vi.fn((_url, options) => { signal = options.signal; return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))) })
    vi.stubGlobal('fetch', fetch)
    const widget = useSpotifyNowPlaying()
    hooks.mount()
    await widget.loadNowPlaying()
    expect(fetch).toHaveBeenCalledTimes(1)
    hooks.unmount()
    expect(signal.aborted).toBe(true)
    await vi.advanceTimersByTimeAsync(120000)
    expect(fetch).toHaveBeenCalledTimes(1)
  })
  it('distinguishes idle playback from unavailable authorization', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response(null, { status: 204 })).mockResolvedValueOnce(new Response(JSON.stringify({ code: 'reauthorization_required' }), { status: 503 })))
    const widget = useSpotifyNowPlaying()
    await widget.loadNowPlaying()
    expect(widget.track.value).toBeNull(); expect(widget.error.value).toBeNull()
    await widget.loadNowPlaying()
    expect(widget.error.value.code).toBe('reauthorization_required')
  })
  it('respects Retry-After even on visibility resume, then resumes polling', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(new Response('{}', { status: 429, headers: { 'Retry-After': '180' } })).mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetch)
    useSpotifyNowPlaying(); hooks.mount()
    await vi.advanceTimersByTimeAsync(1)
    document.hidden = true; document.dispatchEvent(new Event('visibilitychange'))
    await vi.advanceTimersByTimeAsync(60000)
    document.hidden = false; document.dispatchEvent(new Event('visibilitychange'))
    await vi.advanceTimersByTimeAsync(60000)
    expect(fetch).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(60000)
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})
