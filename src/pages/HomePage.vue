<!--
  主页组件 - 个人仪表盘版
  采用无底色线框卡片，并压缩为单页无滚动布局
-->
<template>
  <div class="home-page-shell animate-fade-in">
    <section class="home-dashboard-shell">
      <div class="home-main-grid">
        <header class="home-outline-card home-intro-card">
          <div class="space-y-3">
            <h1 class="section-title home-title">{{ $t('home.title') }}</h1>
            <p class="section-copy home-copy">{{ $t('home.subtitle') }}</p>
          </div>
        </header>

        <section class="home-outline-card home-search-card" :class="{ 'home-search-card-active': showEngineMenu }">
          <div class="home-search-row">
            <div class="home-search-engine">
              <button
                ref="engineButtonRef"
                :aria-expanded="showEngineMenu ? 'true' : 'false'"
                aria-haspopup="listbox"
                :aria-label="getEngineName(searchEngine)"
                :title="getEngineName(searchEngine)"
                class="home-control-btn"
                @click="toggleSearchEngineMenu"
              >
                <component :is="getEngineIcon(searchEngine)" class="home-engine-current-icon" />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="home-engine-chevron"
                  :class="{ 'is-open': showEngineMenu }"
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              <transition name="engine-menu">
                <div
                  v-if="showEngineMenu"
                  ref="engineMenuRef"
                  class="home-engine-menu surface-float"
                  @click.stop
                  role="listbox"
                >
                  <button
                    v-for="engine in searchEngines"
                    :key="engine.id"
                    type="button"
                    class="home-engine-option"
                    :class="{ 'is-active': searchEngine === engine.id }"
                    @click="selectSearchEngine(engine.id)"
                  >
                    <component :is="engine.icon" class="home-engine-option-icon" />
                    <span class="truncate">{{ $t(engine.labelKey) }}</span>
                    <svg
                      v-if="searchEngine === engine.id"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.4"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="home-engine-check"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </button>
                </div>
              </transition>
            </div>

            <div class="home-search-input-shell">
              <label for="search-input" class="sr-only">{{ $t('home.searchPlaceholder') }}</label>
              <input
                id="search-input"
                name="search-input"
                v-model="searchQuery"
                @keyup.enter="performSearch"
                @keydown.esc="showEngineMenu = false"
                type="text"
                class="glass-input home-search-input"
                :placeholder="$t('home.searchPlaceholder')"
                autofocus
              >
              <button
                @click="performSearch"
                class="home-search-submit"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </button>
            </div>
          </div>
        </section>

        <article class="home-outline-card home-status-card">
          <div class="home-card-head">
            <div>
              <div class="section-kicker">{{ $t('home.statusTitle') }}</div>
              <h2 class="text-lg sm:text-xl font-bold text-main">{{ $t('home.statusTitle') }}</h2>
            </div>
            <span class="status-pill status-pill-success">{{ $t('home.statusBadge') }}</span>
          </div>
          <p class="home-highlight-copy">
            {{ profileStatus }}
          </p>
          <div class="home-outline-subcard">
            <div class="text-[11px] uppercase tracking-[0.22em] text-muted">{{ $t('home.sloganTitle') }}</div>
            <p class="home-slogan-copy mt-1 text-sm sm:text-base leading-6">{{ profileSlogan }}</p>
          </div>
        </article>

        <article class="home-outline-card home-spotify-card">
          <div class="home-card-head">
            <div>
              <div class="section-kicker">{{ $t('home.spotifyTitle') }}</div>
              <h2 class="text-lg sm:text-xl font-bold text-main">{{ $t('home.spotifyTitle') }}</h2>
            </div>
            <span class="status-pill" :class="spotifyStateTone">{{ spotifyStateLabel }}</span>
          </div>

          <div v-if="spotifyTrack" class="flex gap-3 sm:gap-4 min-w-0">
            <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-[22px] overflow-hidden shrink-0 border border-[color:var(--border-strong)]">
              <img
                v-if="spotifyTrack.coverUrl"
                :src="spotifyTrack.coverUrl"
                :alt="spotifyTrack.title"
                class="w-full h-full object-cover"
              >
              <div v-else class="w-full h-full flex items-center justify-center bg-transparent">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-7 h-7 text-secondary">
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </div>
            </div>

            <div class="min-w-0 flex-1">
              <h3 class="text-base sm:text-lg font-bold text-main truncate">{{ spotifyTrack.title }}</h3>
              <p class="text-sm text-secondary truncate">{{ spotifyTrack.artist || $t('home.spotifyTitle') }}</p>
              <p v-if="spotifyTrack.album" class="mt-1 text-xs text-muted truncate">{{ spotifyTrack.album }}</p>

              <div v-if="hasSpotifyProgress" class="mt-3 space-y-1">
                <div class="h-1.5 rounded-full bg-transparent border border-[color:var(--border-strong)] overflow-hidden">
                  <div class="h-full rounded-full bg-theme-primary transition-all" :style="{ width: `${spotifyProgressPercent}%` }"></div>
                </div>
                <div class="flex justify-between text-[11px] text-muted font-mono">
                  <span>{{ formatDuration(spotifyTrack.progressMs) }}</span>
                  <span>{{ formatDuration(spotifyTrack.durationMs) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="home-outline-subcard">
            <p class="text-sm text-secondary leading-6">{{ $t('home.spotifyHint') }}</p>
          </div>

          <div v-if="spotifyTrack?.externalUrl" class="flex items-center justify-end">
            <a
              :href="spotifyTrack.externalUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="action-btn action-btn-secondary text-xs py-2.5 px-3.5"
            >
              {{ $t('home.spotifyOpen') }}
            </a>
          </div>
        </article>

        <article class="home-outline-card home-tasks-card">
          <div class="home-card-head">
            <div>
              <div class="section-kicker">{{ $t('home.tasksTitle') }}</div>
              <h2 class="text-lg sm:text-xl font-bold text-main">{{ $t('home.tasksTitle') }}</h2>
            </div>
          </div>
          <p class="text-sm text-secondary leading-6">{{ $t('home.tasksCopy') }}</p>

          <div v-if="displayTasks.length" class="space-y-2">
            <div
              v-for="task in displayTasks"
              :key="task.key"
              class="home-outline-subcard"
            >
              <p class="home-task-copy text-sm sm:text-base font-medium leading-6">{{ task.text }}</p>
            </div>
          </div>
          <p v-else class="text-sm text-secondary leading-6">{{ $t('home.tasksEmpty') }}</p>
        </article>

        <section class="home-outline-card home-links-card">
          <div class="home-card-head">
            <div>
              <div class="section-kicker">{{ $t('home.launchPad') }}</div>
              <h2 class="text-lg sm:text-xl font-bold text-main tracking-tight">{{ $t('home.quickAccess') }}</h2>
              <p class="section-copy mt-1 text-sm">{{ $t('home.quickAccessCopy') }}</p>
            </div>
            <button
              @click="showEditor = true"
              class="action-btn action-btn-secondary text-xs py-2.5 px-3.5 shrink-0"
              :title="$t('home.edit')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              {{ $t('home.edit') }}
            </button>
          </div>

          <div class="home-links-grid">
            <a
              v-for="site in displayLinks"
              :key="site.id || site.name"
              :href="site.url"
              target="_blank"
              rel="noopener noreferrer"
              class="home-outline-link group"
            >
              <div class="home-link-icon">
                <img
                  v-if="site.url && !failedFaviconUrls.has(site.url) && getCachedFaviconInfo(site.url).url"
                  :src="getCachedFaviconInfo(site.url).url"
                  @load="handleIconLoad(site.url)"
                  @error="handleIconError($event, site)"
                  class="w-5 h-5 sm:w-6 sm:h-6 rounded-md transition-transform group-hover:scale-110"
                  :alt="site.name"
                >
                <component v-else-if="site.icon" :is="site.icon" class="w-4.5 h-4.5 text-secondary" />
                <span v-else class="text-secondary text-sm font-bold">{{ site.name?.[0] || '?' }}</span>
              </div>
              <div class="min-w-0">
                <div class="text-sm font-bold text-main truncate">{{ site.name }}</div>
                <div class="text-[11px] text-muted truncate">{{ site.url }}</div>
              </div>
            </a>
          </div>
        </section>
      </div>
    </section>

    <QuickLinkEditor
      v-if="showEditor"
      :links="displayLinks"
      @close="showEditor = false"
      @save="handleSaveLinks"
    />
  </div>
</template>

<script setup>
import { ref, computed, markRaw, reactive, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { quickLinksConfig, homeProfileConfig } from '../config/home'
import { useLocalStorage } from '../composables/useStorage'
import { useSpotifyNowPlaying } from '../composables/useSpotifyNowPlaying'
import { adminSettingsApi } from '../utils/api'
import { getIcon } from '../utils/iconMapper'
import { getCachedFaviconUrl, markFaviconSuccess, markFaviconError } from '../utils/faviconCache'
import { ensureAbsoluteUrl } from '../utils/urlHelper'
import GoogleIcon from '../components/icons/GoogleIcon.vue'
import DuckIcon from '../components/icons/DuckIcon.vue'
import BaiduIcon from '../components/icons/BaiduIcon.vue'
import BingIcon from '../components/icons/BingIcon.vue'
import QuickLinkEditor from '../components/QuickLinkEditor.vue'

const { t, locale } = useI18n()

const profileLocale = computed(() => {
  const current = String(locale.value || 'zh').toLowerCase()
  return current.startsWith('zh') ? 'zh' : 'en'
})

const resolveLocalizedValue = (value) => {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    return value[profileLocale.value] || value.zh || value.en || ''
  }
  return ''
}

const resolveLocalizedList = (value) => {
  const resolved = resolveLocalizedValue(value)
  return Array.isArray(resolved) ? resolved.filter(item => typeof item === 'string' && item.trim()) : []
}

const searchEngine = ref('google')
const searchQuery = ref('')
const showEngineMenu = ref(false)
const engineButtonRef = ref(null)
const engineMenuRef = ref(null)
const homepageContent = ref(null)

const searchEngines = [
  {
    id: 'google',
    labelKey: 'home.searchEngines.google',
    icon: markRaw(GoogleIcon),
    buildUrl: (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}`
  },
  {
    id: 'duckduckgo',
    labelKey: 'home.searchEngines.duckduckgo',
    icon: markRaw(DuckIcon),
    buildUrl: (query) => `https://duckduckgo.com/?q=${encodeURIComponent(query)}`
  },
  {
    id: 'baidu',
    labelKey: 'home.searchEngines.baidu',
    icon: markRaw(BaiduIcon),
    buildUrl: (query) => `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`
  },
  {
    id: 'bing',
    labelKey: 'home.searchEngines.bing',
    icon: markRaw(BingIcon),
    buildUrl: (query) => `https://www.bing.com/search?q=${encodeURIComponent(query)}`
  }
]

const searchEngineLookup = Object.fromEntries(searchEngines.map(engine => [engine.id, engine]))

const showEditor = ref(false)
const failedFaviconUrls = reactive(new Set())

const customLinksStorage = useLocalStorage('customQuickLinks', [])
const customLinks = customLinksStorage.value
const spotifyNowPlaying = useSpotifyNowPlaying()

const homepageContentSource = computed(() => homepageContent.value || homeProfileConfig)
const profileStatus = computed(() => resolveLocalizedValue(homepageContentSource.value.status))
const profileSlogan = computed(() => resolveLocalizedValue(homepageContentSource.value.slogan))
const profileTasks = computed(() => resolveLocalizedList(homepageContentSource.value.tasks))

const defaultLinks = computed(() => quickLinksConfig.map(link => ({
  ...link,
  name: t(link.nameKey),
  url: ensureAbsoluteUrl(link.url),
  icon: getIcon(link.iconName)
})))

const displayLinks = computed(() => {
  const customLinksArray = Array.isArray(customLinks.value) ? customLinks.value : []
  if (customLinksArray.length > 0) {
    return customLinksArray.map(link => {
      const icon = link.iconName ? getIcon(link.iconName) : null
      return {
        ...link,
        url: ensureAbsoluteUrl(link.url),
        icon: icon ? markRaw(icon) : null
      }
    })
  }
  return defaultLinks.value
})

const displayTasks = computed(() => {
  return profileTasks.value.map((text, index) => ({
    key: `fallback-${index}-${text}`,
    text
  }))
})

const spotifyTrack = spotifyNowPlaying.track
const spotifyProgressPercent = computed(() => {
  const progress = spotifyTrack.value?.progressMs
  const duration = spotifyTrack.value?.durationMs
  if (!Number.isFinite(progress) || !Number.isFinite(duration) || duration <= 0) return 0
  return Math.min(100, Math.max(0, (progress / duration) * 100))
})

const hasSpotifyProgress = computed(() => Boolean(
  Number.isFinite(spotifyTrack.value?.progressMs) &&
  Number.isFinite(spotifyTrack.value?.durationMs) &&
  spotifyTrack.value?.durationMs > 0
))

const spotifyStateTone = computed(() => {
  if (spotifyNowPlaying.isLoading.value) return 'status-pill-neutral'
  if (!spotifyNowPlaying.hasEndpoint.value) return 'status-pill-neutral'
  if (!spotifyTrack.value) return 'status-pill-neutral'
  return spotifyTrack.value.isPlaying ? 'status-pill-success' : 'status-pill-warm'
})

const spotifyStateLabel = computed(() => {
  if (spotifyNowPlaying.isLoading.value) return t('common.loading')
  if (!spotifyNowPlaying.hasEndpoint.value) return t('home.spotifyIdle')
  if (!spotifyTrack.value) return t('home.spotifyIdle')
  return spotifyTrack.value.isPlaying ? t('home.spotifyLive') : t('home.spotifyPaused')
})

const formatDuration = (milliseconds) => {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) return '--:--'
  const totalSeconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const handleSaveLinks = (links) => {
  const linksToSave = links.map(link => ({
    id: link.id || `link-${Date.now()}-${Math.random()}`,
    name: link.name,
    url: ensureAbsoluteUrl(link.url),
    iconName: link.iconName || 'HomeIcon',
    color: link.color || 'bg-slate-500'
  }))
  customLinksStorage.update(linksToSave)
  showEditor.value = false
}

const toggleSearchEngineMenu = () => {
  showEngineMenu.value = !showEngineMenu.value
}

const selectSearchEngine = (engine) => {
  searchEngine.value = engine
  showEngineMenu.value = false
}

const handleDocumentPointerDown = (event) => {
  if (!showEngineMenu.value) return
  const target = event?.target
  if (engineButtonRef.value?.contains(target) || engineMenuRef.value?.contains(target)) return
  showEngineMenu.value = false
}

const getSearchEngine = (engine) => searchEngineLookup[engine] || searchEngineLookup.google

const getEngineIcon = (engine) => getSearchEngine(engine).icon

const getEngineName = (engine) => t(getSearchEngine(engine).labelKey)

const performSearch = () => {
  const query = searchQuery.value.trim()
  if (!query) return

  const url = getSearchEngine(searchEngine.value).buildUrl(query)
  showEngineMenu.value = false
  openExternalUrl(url)
}

const openExternalUrl = (url) => {
  const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
  if (newWindow) newWindow.opener = null
}

const getCachedFaviconInfo = (url) => getCachedFaviconUrl(url, 64)

const handleIconLoad = (url) => {
  failedFaviconUrls.delete(url)
  markFaviconSuccess(url, 64)
}

const handleIconError = (event, site) => {
  if (site.url) markFaviconError(site.url)
  if (site?.url) failedFaviconUrls.add(site.url)
}

const loadHomepageContent = async () => {
  try {
    const settings = await adminSettingsApi.get()
    homepageContent.value = settings?.homepage_content || null
  } catch (error) {
    console.debug('Failed to load homepage content:', error)
    homepageContent.value = null
  }
}

onMounted(() => {
  loadHomepageContent()
  document.addEventListener('pointerdown', handleDocumentPointerDown)
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
})
</script>

<style scoped>
.home-page-shell {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 强制单页无滚动 */
}

.home-dashboard-shell {
  flex: 1;
  width: 100%;
  padding: clamp(0.75rem, 1.2vw, 1.25rem);
  display: flex;
  flex-direction: column;
  min-height: 0; /* 允许 flex 子项收缩 */
}

.home-main-grid {
  flex: 1;
  display: grid;
  gap: clamp(0.75rem, 1.1vw, 1rem);
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-template-rows: auto auto minmax(0, 1fr);
  grid-template-areas:
    "intro intro intro intro intro intro intro intro status status spotify spotify"
    "search search search search search search search search status status spotify spotify"
    "links links links links links links links links tasks tasks tasks tasks";
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
  min-height: 0;
}

.home-outline-card {
  position: relative;
  min-width: 0;
  min-height: 0;
  border: 1px solid var(--border-strong);
  background: color-mix(in srgb, var(--surface-panel) 20%, transparent);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: clamp(1rem, 1.5vw, 1.25rem);
  border-radius: var(--radius-card);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
}

.home-outline-card:hover {
  border-color: color-mix(in srgb, var(--theme-primary) 30%, var(--border-strong));
  background: color-mix(in srgb, var(--surface-panel) 35%, transparent);
}

.home-intro-card { 
  grid-area: intro; 
  justify-content: center;
  background: linear-gradient(135deg, color-mix(in srgb, var(--theme-primary) 5%, var(--surface-panel) 20%), color-mix(in srgb, var(--surface-panel) 20%, transparent));
}

.home-search-card { 
  grid-area: search; 
  align-self: stretch;
  justify-content: center;
  background: color-mix(in srgb, var(--theme-primary) 2%, var(--surface-panel) 15%);
  overflow: visible;
  z-index: 10;
}

.home-search-card-active {
  z-index: 60;
}

.home-status-card { grid-area: status; }
.home-spotify-card { grid-area: spotify; }

.home-links-card { 
  grid-area: links;
  background: color-mix(in srgb, var(--surface-panel) 15%, transparent);
  min-height: 0; /* 关键：允许内容在内部滚动 */
}

.home-tasks-card { 
  grid-area: tasks;
  min-height: 0;
}

.home-title {
  font-size: clamp(1.4rem, 2.8vw, 2.4rem);
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: -0.03em;
  margin-bottom: 0.5rem;
}

.home-copy {
  font-size: clamp(0.85rem, 1vw, 1rem);
  line-height: 1.5;
  opacity: 0.8;
  margin-bottom: 0.75rem;
}

.home-tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.home-search-row {
  display: flex;
  align-items: stretch;
  gap: 0.75rem;
  min-width: 0;
}

.home-search-engine {
  position: relative;
  flex-shrink: 0;
}

.home-control-btn {
  width: 4.25rem;
  min-width: 4.25rem;
  height: 3.5rem;
  padding: 0 0.85rem;
  border-radius: 1.1rem;
  background: color-mix(in srgb, var(--bg-input) 60%, transparent);
  font-weight: 700;
  transition: all 0.3s ease;
  border: 1px solid var(--border-strong);
  color: var(--text-main);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.home-control-btn:hover {
  border-color: color-mix(in srgb, var(--theme-primary) 26%, var(--border-strong));
  background: color-mix(in srgb, var(--bg-input) 74%, transparent);
  transform: translateY(-1px);
}

.home-control-btn:focus-visible {
  outline: none;
  border-color: var(--theme-primary-light);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--theme-primary) 12%, transparent);
}

.home-engine-current-icon {
  width: 1.55rem;
  height: 1.55rem;
  flex-shrink: 0;
}

.home-engine-chevron {
  width: 0.8rem;
  height: 0.8rem;
  opacity: 0.55;
  flex-shrink: 0;
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.home-engine-chevron.is-open {
  transform: rotate(180deg);
  opacity: 0.85;
}

.home-engine-menu {
  position: absolute;
  top: calc(100% + 0.75rem);
  left: 0;
  width: min(17rem, calc(100vw - 2.5rem));
  padding: 0.5rem;
  border-radius: 1.4rem;
  border: 1px solid var(--border-strong);
  overflow: hidden;
  z-index: 12;
}

.home-engine-option {
  width: 100%;
  min-height: 3rem;
  padding: 0.85rem 0.95rem;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-align: left;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-secondary);
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.home-engine-option:hover {
  background: color-mix(in srgb, var(--theme-primary) 7%, transparent);
  color: var(--text-main);
}

.home-engine-option.is-active {
  background: color-mix(in srgb, var(--theme-primary) 11%, var(--surface-panel));
  color: var(--text-main);
}

.home-engine-option-icon {
  width: 1.45rem;
  height: 1.45rem;
  flex-shrink: 0;
}

.home-engine-check {
  width: 0.95rem;
  height: 0.95rem;
  margin-left: auto;
  color: var(--theme-primary);
}

.home-search-input-shell {
  position: relative;
  flex: 1;
  min-width: 0;
}

.home-search-input {
  width: 100%;
  height: 3.5rem;
  border-radius: 1.1rem;
  background: color-mix(in srgb, var(--bg-input) 40%, transparent);
  padding-left: 1.1rem;
  padding-right: 4.15rem;
  font-size: 1rem;
}

.home-search-input::placeholder {
  color: color-mix(in srgb, var(--text-muted) 70%, transparent);
}

.home-search-submit {
  position: absolute;
  top: 0.375rem;
  right: 0.375rem;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 1rem;
  background: var(--theme-primary);
  color: white;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 14px 28px color-mix(in srgb, var(--theme-primary) 24%, transparent);
}

.home-search-submit:hover {
  background: var(--theme-primary-dark);
  transform: translateY(-1px);
}

.home-search-submit:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--theme-primary) 14%, transparent);
}

.home-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  flex-shrink: 0;
}

.home-highlight-copy {
  margin-top: 0.5rem;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--theme-primary);
  border-left: 3px solid var(--theme-primary);
  padding-left: 0.85rem;
}

.home-links-grid {
  flex: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
  padding-right: 0.5rem;
  margin-right: -0.5rem; /* 抵消内边距以让滚动条靠边 */
}

/* 自定义内部滚动条 */
.home-links-grid::-webkit-scrollbar {
  width: 4px;
}
.home-links-grid::-webkit-scrollbar-track {
  background: transparent;
}
.home-links-grid::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--text-muted) 20%, transparent);
  border-radius: 10px;
}
.home-links-grid::-webkit-scrollbar-thumb:hover {
  background: color-mix(in srgb, var(--text-muted) 40%, transparent);
}

.home-outline-link {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-strong);
  background: color-mix(in srgb, var(--surface-panel) 10%, transparent);
  border-radius: 1.1rem;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.home-link-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.85rem;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.dark .home-link-icon {
  background: color-mix(in srgb, var(--surface-panel) 80%, black);
}

.home-outline-subcard {
  margin-top: 0.75rem;
  padding: 0.85rem;
  background: color-mix(in srgb, var(--surface-panel) 10%, transparent);
  border: 1px solid var(--border-strong);
  border-radius: 0.85rem;
}

.home-slogan-copy {
  color: color-mix(in srgb, var(--text-main) 94%, var(--theme-primary-dark) 6%);
  font-weight: 600;
}

.dark .home-slogan-copy {
  color: color-mix(in srgb, var(--text-main) 94%, white 6%);
}

.home-task-copy {
  color: color-mix(in srgb, var(--text-main) 90%, var(--theme-primary-darker) 10%);
  font-weight: 600;
}

.dark .home-task-copy {
  color: color-mix(in srgb, var(--text-main) 95%, white 5%);
}

@media (max-width: 1200px) {
  .home-main-grid {
    grid-template-areas:
      "intro intro intro intro intro intro intro intro status status status status"
      "search search search search search search search search status status status status"
      "links links links links links links links links tasks tasks tasks tasks";
  }
}

@media (max-width: 1023px) {
  .home-dashboard-shell {
    overflow-y: auto; /* 移动端/平板允许滚动整体 */
  }
  .home-page-shell {
    overflow: auto;
  }
  .home-main-grid {
    display: flex;
    flex-direction: column;
    height: auto;
  }
  .home-links-grid {
    overflow: visible;
    height: auto;
  }
}

@media (max-width: 640px) {
  .home-search-row {
    gap: 0.625rem;
  }

  .home-control-btn {
    width: 3.9rem;
    min-width: 3.9rem;
  }

  .home-search-input {
    font-size: 0.95rem;
    padding-right: 3.95rem;
  }

  .home-engine-menu {
    width: min(15rem, calc(100vw - 2rem));
  }
}
</style>
