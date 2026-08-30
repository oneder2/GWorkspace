<!--
  主页组件 - 个人仪表盘版
  采用无底色线框卡片，并压缩为单页无滚动布局
-->
<template>
  <div class="home-page-shell animate-fade-in">
    <section class="home-dashboard-shell">
      <div class="home-main-grid">
        <header class="home-outline-card home-solid-card home-intro-card">
          <div class="home-intro-copy space-y-3">
            <h1 class="section-title home-title">{{ $t('home.title') }}</h1>
            <p class="section-copy home-copy">{{ $t('home.subtitle') }}</p>
          </div>

          <section class="home-traces" :aria-label="traceCopy.title">
            <div class="home-traces-head">
              <div>
                <span class="home-traces-kicker">{{ traceCopy.kicker }}</span>
                <h2 class="home-traces-title">{{ traceCopy.title }}</h2>
              </div>
              <span class="home-traces-count">{{ todayEntries.length }}</span>
            </div>

            <div v-if="todayEntries.length" class="home-traces-list">
              <button
                v-for="entry in todayEntries.slice(0, 3)"
                :key="entry.id"
                type="button"
                class="home-trace-item"
                @click="openTerminal()"
              >
                <component :is="entry.type === 'analysis' ? BrainIcon : FileTextIcon" class="home-trace-icon" />
                <span class="home-trace-copy">
                  <span class="home-trace-summary">{{ entry.summary }}</span>
                  <span class="home-trace-meta">{{ formatTraceTime(entry.createdAt) }} · {{ entry.type === 'analysis' ? traceCopy.analysis : traceCopy.note }}</span>
                </span>
              </button>
            </div>

            <button v-else type="button" class="home-traces-empty" @click="openTerminal('capture')">
              <FileTextIcon class="home-trace-icon" />
              <span>{{ traceCopy.empty }}</span>
            </button>
          </section>
        </header>

        <article class="home-outline-card home-status-card">
          <div class="home-card-head">
            <div>
              <div class="section-kicker">{{ $t('home.statusTitle') }}</div>
              <h2 class="text-base sm:text-lg font-bold text-main">{{ $t('home.statusTitle') }}</h2>
            </div>
            <span class="status-pill status-pill-success">{{ $t('home.statusBadge') }}</span>
          </div>
          <p class="home-highlight-copy">
            {{ profileStatus }}
          </p>
        </article>

        <article class="home-spotify-card">
          <component
            :is="spotifyTrack?.externalUrl ? 'a' : 'div'"
            class="home-spotify-panel"
            :href="spotifyTrack?.externalUrl || undefined"
            :target="spotifyTrack?.externalUrl ? '_blank' : undefined"
            :rel="spotifyTrack?.externalUrl ? 'noopener noreferrer' : undefined"
          >
            <div class="home-card-head home-spotify-head">
              <div>
                <div class="section-kicker">{{ $t('home.spotifyTitle') }}</div>
                <h2 class="text-base sm:text-lg font-bold text-main">{{ $t('home.spotifyTitle') }}</h2>
              </div>
              <span class="status-pill" :class="spotifyStateTone">{{ spotifyStateLabel }}</span>
            </div>

            <template v-if="spotifyTrack">
              <div class="home-spotify-media">
                <div class="home-spotify-cover">
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

                <div class="home-spotify-meta">
                  <h3 class="home-spotify-title">{{ spotifyTrack.title }}</h3>
                  <p class="home-spotify-artist">{{ spotifyTrack.artist || $t('home.spotifyTitle') }}</p>
                  <p v-if="spotifyTrack.album" class="home-spotify-album">{{ spotifyTrack.album }}</p>

                  <div v-if="hasSpotifyProgress" class="home-spotify-progress">
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
            </template>

            <div v-else class="home-spotify-empty">
              <p class="text-sm text-secondary leading-6">{{ $t('home.spotifyHint') }}</p>
            </div>
          </component>
        </article>

        <article class="home-outline-card home-tasks-card">
          <div class="home-card-head">
            <div>
              <div class="section-kicker">{{ $t('home.tasksTitle') }}</div>
              <h2 class="text-lg sm:text-xl font-bold text-main">{{ $t('home.tasksTitle') }}</h2>
            </div>
          </div>
          <p class="text-sm text-secondary leading-6">{{ $t('home.tasksCopy') }}</p>

          <div v-if="displayTasks.length" class="home-tasks-list space-y-2">
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

        <section class="home-outline-card home-solid-card home-owner-card">
          <div class="home-owner-head">
            <div>
              <div class="section-kicker">{{ $t('home.owner.kicker') }}</div>
              <h2 class="home-owner-section-title">{{ $t('home.owner.title') }}</h2>
            </div>
            <span class="home-owner-active">
              <span class="home-owner-active-dot"></span>
              {{ $t('home.owner.active') }}
            </span>
          </div>

          <div class="home-owner-layout">
            <div class="home-owner-identity">
              <div class="home-owner-person">
                <div class="home-owner-mark" aria-hidden="true">
                  <GWorkspaceIcon :size="62" variant="monochrome" />
                </div>
                <div class="home-owner-name-block">
                  <p class="home-owner-role">{{ ownerProfile.role }}</p>
                  <h3 class="home-owner-name">{{ ownerProfile.name }}</h3>
                </div>
              </div>

              <p class="home-owner-bio">{{ ownerProfile.bio }}</p>

              <nav class="home-owner-contacts" :aria-label="$t('home.owner.contact')">
                <a
                  v-for="contact in ownerProfile.contacts"
                  :key="contact.id"
                  :href="contact.href"
                  :target="contact.id === 'github' ? '_blank' : undefined"
                  :rel="contact.id === 'github' ? 'noopener noreferrer' : undefined"
                  class="home-owner-contact"
                >
                  <GitHubIcon v-if="contact.id === 'github'" class="home-owner-contact-icon is-filled" />
                  <svg v-else viewBox="0 0 24 24" class="home-owner-contact-icon" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>
                  <span>{{ contact.label }}</span>
                </a>
              </nav>
            </div>

            <div class="home-owner-details">
              <div class="home-owner-responsibilities">
                <p class="home-owner-detail-label">{{ $t('home.owner.responsibilities') }}</p>
                <ol class="home-owner-list">
                  <li v-for="(item, index) in ownerProfile.responsibilities" :key="item">
                    <span>{{ String(index + 1).padStart(2, '0') }}</span>
                    <p>{{ item }}</p>
                  </li>
                </ol>
              </div>

              <blockquote class="home-owner-quote">
                <span>{{ $t('home.owner.quote') }}</span>
                <p>{{ profileSlogan }}</p>
              </blockquote>
            </div>
          </div>
        </section>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { homeProfileConfig } from '../config/home'
import { useSpotifyNowPlaying } from '../composables/useSpotifyNowPlaying'
import { useWorkspaceJournal } from '../composables/useWorkspaceJournal'
import { adminSettingsApi } from '../utils/api'
import BrainIcon from '../components/icons/BrainIcon.vue'
import FileTextIcon from '../components/icons/FileTextIcon.vue'
import GitHubIcon from '../components/icons/GitHubIcon.vue'
import GWorkspaceIcon from '../components/icons/GWorkspaceIcon.vue'

const { t, locale } = useI18n()
const { todayEntries } = useWorkspaceJournal()

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

const homepageContent = ref(null)
const profileContent = ref(null)
const spotifyNowPlaying = useSpotifyNowPlaying()

const homepageContentSource = computed(() => homepageContent.value || homeProfileConfig)
const profileStatus = computed(() => resolveLocalizedValue(homepageContentSource.value.status))
const profileSlogan = computed(() => resolveLocalizedValue(homepageContentSource.value.slogan))
const profileTasks = computed(() => resolveLocalizedList(homepageContentSource.value.tasks))
const ownerProfile = computed(() => ({
  name: profileContent.value?.owner?.name || homeProfileConfig.owner.name,
  role: resolveLocalizedValue(profileContent.value?.owner?.role || homeProfileConfig.owner.role),
  bio: resolveLocalizedValue(profileContent.value?.owner?.bio || homeProfileConfig.owner.bio),
  responsibilities: resolveLocalizedList(profileContent.value?.owner?.responsibilities || homeProfileConfig.owner.responsibilities),
  contacts: profileContent.value?.owner?.contacts || homeProfileConfig.owner.contacts
}))

const traceCopy = computed(() => profileLocale.value === 'zh'
  ? {
      kicker: 'WORK LOG',
      title: '今日痕迹',
      note: '记录',
      analysis: 'AI 拆解',
      empty: '还没有记录。写下第一条需要继续推进的线索。'
    }
  : {
      kicker: 'WORK LOG',
      title: 'Today\'s traces',
      note: 'Record',
      analysis: 'AI analysis',
      empty: 'No records yet. Capture the first thread you want to continue.'
    })

const formatTraceTime = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(profileLocale.value === 'zh' ? 'zh-CN' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const openTerminal = (action) => {
  window.dispatchEvent(new CustomEvent('gworkspace:terminal-open', { detail: { action } }))
}

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

const loadHomepageContent = async () => {
  try {
    const settings = await adminSettingsApi.get()
    homepageContent.value = settings?.homepage_content || null
    profileContent.value = settings?.profile_content || null
  } catch (error) {
    console.debug('Failed to load homepage content:', error)
    homepageContent.value = null
    profileContent.value = null
  }
}

onMounted(() => {
  loadHomepageContent()
})
</script>

<style scoped>
.home-page-shell {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.home-dashboard-shell {
  flex: 1;
  width: 100%;
  padding: clamp(0.6rem, 1vw, 1rem);
  display: flex;
  flex-direction: column;
  min-height: 0; /* 允许 flex 子项收缩 */
}

.home-main-grid {
  flex: 1;
  display: grid;
  gap: clamp(0.65rem, 0.95vw, 0.9rem);
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-template-rows: auto minmax(0, 0.84fr) minmax(0, 1.16fr);
  grid-template-areas:
    "intro intro intro intro intro intro intro intro status status status status"
    "owner owner owner owner owner owner owner owner spotify spotify spotify spotify"
    "owner owner owner owner owner owner owner owner tasks tasks tasks tasks";
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
  min-height: 0;
}

.home-outline-card {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  isolation: isolate;
  border: 1px solid color-mix(in srgb, var(--theme-primary) 10%, var(--border-strong));
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--surface-panel) 92%, transparent),
    color-mix(in srgb, var(--surface-elevated) 74%, transparent)
  );
  backdrop-filter: blur(var(--blur-panel));
  -webkit-backdrop-filter: blur(var(--blur-panel));
  padding: clamp(1rem, 1.5vw, 1.25rem);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-soft), inset 0 1px 0 rgba(255, 255, 255, 0.18);
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease, background 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
}

.home-outline-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--theme-primary) 16%, transparent), transparent 48%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.12), transparent 38%);
  opacity: 0.75;
  pointer-events: none;
}

.home-outline-card::after {
  content: "";
  position: absolute;
  inset: 1px;
  border-radius: calc(var(--radius-card) - 1px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  pointer-events: none;
}

.home-outline-card > * {
  position: relative;
  z-index: 1;
}

.home-outline-card:hover {
  border-color: color-mix(in srgb, var(--theme-primary) 30%, var(--border-strong));
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--surface-panel) 96%, transparent),
    color-mix(in srgb, var(--surface-elevated) 82%, transparent)
  );
  box-shadow: var(--shadow-medium), inset 0 1px 0 rgba(255, 255, 255, 0.22);
  transform: translateY(-1px);
}

.home-solid-card {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--surface-admin-panel) 96%, white 4%),
    color-mix(in srgb, var(--surface-panel) 98%, transparent)
  );
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  box-shadow: 0 16px 40px -18px rgba(15, 23, 42, 0.24);
}

.home-solid-card::before {
  opacity: 0;
}

.home-solid-card::after {
  border-color: color-mix(in srgb, var(--theme-primary) 10%, var(--border-strong));
}

.home-solid-card:hover {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--surface-admin-panel) 98%, white 2%),
    color-mix(in srgb, var(--surface-panel) 100%, transparent)
  );
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  box-shadow: 0 22px 46px -20px rgba(15, 23, 42, 0.28);
}

.dark .home-solid-card {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--surface-admin-panel) 96%, black 4%),
    color-mix(in srgb, var(--surface-panel) 98%, transparent)
  );
  box-shadow: 0 20px 44px -18px rgba(2, 6, 23, 0.5);
}

.dark .home-solid-card:hover {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--surface-admin-panel) 98%, black 2%),
    color-mix(in srgb, var(--surface-panel) 100%, transparent)
  );
  box-shadow: 0 24px 52px -20px rgba(2, 6, 23, 0.58);
}

.home-intro-card { 
  grid-area: intro; 
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(18rem, 0.72fr);
  align-items: center;
  gap: clamp(1.25rem, 2.4vw, 2.5rem);
  background: linear-gradient(135deg, color-mix(in srgb, var(--theme-primary) 8%, var(--surface-panel) 26%), color-mix(in srgb, var(--surface-panel) 24%, transparent));
}

.home-intro-copy {
  min-width: 0;
}

.home-traces {
  min-width: 0;
  padding-left: clamp(1rem, 2vw, 1.75rem);
  border-left: 1px solid color-mix(in srgb, var(--theme-primary) 15%, var(--border-strong));
}

.home-traces-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.55rem;
}

.home-traces-kicker {
  display: block;
  color: var(--text-muted);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.home-traces-title {
  margin-top: 0.12rem;
  color: var(--text-main);
  font-size: 0.92rem;
  font-weight: 800;
}

.home-traces-count {
  display: inline-flex;
  width: 1.7rem;
  height: 1.7rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--theme-primary) 20%, var(--border-strong));
  border-radius: 50%;
  color: var(--theme-primary-darker);
  font-size: 0.72rem;
  font-weight: 800;
}

.home-traces-list {
  display: grid;
}

.home-trace-item,
.home-traces-empty {
  display: grid;
  width: 100%;
  grid-template-columns: 1.2rem minmax(0, 1fr);
  align-items: start;
  gap: 0.6rem;
  padding: 0.42rem 0;
  color: var(--text-secondary);
  text-align: left;
}

.home-trace-item + .home-trace-item {
  border-top: 1px solid color-mix(in srgb, var(--border-strong) 72%, transparent);
}

.home-trace-item:hover .home-trace-summary,
.home-traces-empty:hover {
  color: var(--theme-primary-darker);
}

.home-trace-icon {
  width: 0.95rem;
  height: 0.95rem;
  margin-top: 0.15rem;
  color: var(--theme-primary-darker);
}

.home-trace-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.08rem;
}

.home-trace-summary {
  overflow: hidden;
  color: var(--text-main);
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.home-trace-meta {
  color: var(--text-muted);
  font-size: 0.64rem;
}

.home-traces-empty {
  border-top: 1px solid color-mix(in srgb, var(--border-strong) 72%, transparent);
  font-size: 0.74rem;
  line-height: 1.45;
  transition: color 0.2s ease;
}

.home-solid-card.home-intro-card {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--surface-admin-panel) 94%, var(--theme-primary) 6%),
    color-mix(in srgb, var(--surface-panel) 98%, white 2%)
  );
}

.dark .home-solid-card.home-intro-card {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--surface-admin-panel) 94%, var(--theme-primary) 6%),
    color-mix(in srgb, var(--surface-panel) 98%, black 2%)
  );
}

.home-status-card {
  grid-area: status;
  background: linear-gradient(155deg, color-mix(in srgb, var(--theme-primary) 8%, var(--surface-panel) 92%), color-mix(in srgb, var(--surface-elevated) 74%, transparent));
}

.home-spotify-card {
  grid-area: spotify;
  position: relative;
  min-width: 0;
  min-height: 0;
}

.home-owner-card {
  grid-area: owner;
  min-height: 0;
  justify-content: space-between;
}

.home-solid-card.home-owner-card {
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--surface-admin-panel) 97%, transparent),
    color-mix(in srgb, var(--theme-primary) 5%, var(--surface-panel) 95%)
  );
}

.home-tasks-card { 
  grid-area: tasks;
  min-height: 0;
  background: linear-gradient(155deg, color-mix(in srgb, var(--surface-panel) 90%, transparent), color-mix(in srgb, var(--surface-elevated) 72%, transparent));
}

.home-tasks-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 0.4rem;
  margin-right: -0.4rem;
}

.home-tasks-list::-webkit-scrollbar {
  width: 4px;
}

.home-tasks-list::-webkit-scrollbar-track {
  background: transparent;
}

.home-tasks-list::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--text-muted) 20%, transparent);
  border-radius: 10px;
}

.home-tasks-list::-webkit-scrollbar-thumb:hover {
  background: color-mix(in srgb, var(--text-muted) 40%, transparent);
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

.home-owner-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.9rem;
  border-bottom: 1px solid color-mix(in srgb, var(--theme-primary) 12%, var(--border-strong));
}

.home-owner-section-title {
  margin-top: 0.15rem;
  color: var(--text-main);
  font-size: 1.2rem;
  font-weight: 800;
}

.home-owner-active {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  flex-shrink: 0;
  border: 1px solid color-mix(in srgb, var(--accent-success) 24%, var(--border-strong));
  border-radius: 5px;
  padding: 0.35rem 0.55rem;
  color: var(--text-secondary);
  font-size: 0.68rem;
  font-weight: 700;
}

.home-owner-active-dot {
  width: 0.42rem;
  height: 0.42rem;
  border-radius: 50%;
  background: var(--accent-success);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-success) 12%, transparent);
}

.home-owner-layout {
  display: grid;
  flex: 1;
  grid-template-columns: minmax(15rem, 0.86fr) minmax(0, 1.14fr);
  gap: clamp(1.25rem, 2vw, 2.25rem);
  padding-top: 1rem;
}

.home-owner-identity {
  display: flex;
  min-width: 0;
  flex-direction: column;
  padding-right: clamp(1rem, 2vw, 2rem);
  border-right: 1px solid color-mix(in srgb, var(--theme-primary) 12%, var(--border-strong));
}

.home-owner-person {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.home-owner-mark {
  display: flex;
  width: 4.8rem;
  height: 4.8rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--theme-primary) 18%, var(--border-strong));
  border-radius: 7px;
  background: color-mix(in srgb, var(--theme-primary) 7%, var(--surface-base));
  color: var(--text-main);
}

.home-owner-name-block {
  min-width: 0;
}

.home-owner-role {
  color: var(--theme-primary-darker);
  font-size: 0.72rem;
  font-weight: 800;
  line-height: 1.4;
}

.dark .home-owner-role,
.dark .home-owner-list li > span {
  color: color-mix(in srgb, var(--theme-primary) 58%, white);
}

.home-owner-name {
  margin-top: 0.18rem;
  color: var(--text-main);
  font-size: 1.6rem;
  font-weight: 850;
  line-height: 1.1;
  overflow-wrap: anywhere;
}

.home-owner-bio {
  margin-top: 1rem;
  color: var(--text-secondary);
  font-size: 0.88rem;
  line-height: 1.7;
}

.home-owner-contacts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-top: auto;
  padding-top: 1rem;
}

.home-owner-contact {
  display: inline-flex;
  min-width: 0;
  min-height: 2.45rem;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid color-mix(in srgb, var(--theme-primary) 14%, var(--border-strong));
  border-radius: 6px;
  padding: 0.55rem 0.7rem;
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 700;
  transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.home-owner-contact:hover,
.home-owner-contact:focus-visible {
  border-color: color-mix(in srgb, var(--theme-primary) 38%, var(--border-strong));
  background: color-mix(in srgb, var(--theme-primary) 7%, var(--surface-panel));
  color: var(--text-main);
  outline: none;
}

.home-owner-contact-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.home-owner-contact-icon.is-filled {
  fill: currentColor;
  stroke: none;
}

.home-owner-details {
  display: grid;
  min-width: 0;
  grid-template-rows: 1fr auto;
  gap: 1rem;
}

.home-owner-detail-label,
.home-owner-quote > span {
  color: var(--text-muted);
  font-size: 0.65rem;
  font-weight: 800;
}

.home-owner-list {
  display: grid;
  margin-top: 0.5rem;
}

.home-owner-list li {
  display: grid;
  grid-template-columns: 1.7rem minmax(0, 1fr);
  gap: 0.7rem;
  padding: 0.62rem 0;
  border-top: 1px solid color-mix(in srgb, var(--border-strong) 72%, transparent);
}

.home-owner-list li > span {
  color: var(--theme-primary-darker);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.68rem;
  font-weight: 800;
}

.home-owner-list li > p {
  color: var(--text-main);
  font-size: 0.82rem;
  font-weight: 650;
  line-height: 1.45;
}

.home-owner-quote {
  padding: 0.8rem 0 0.1rem 0.9rem;
  border-left: 2px solid color-mix(in srgb, var(--theme-primary) 48%, var(--border-strong));
}

.home-owner-quote p {
  margin-top: 0.25rem;
  color: var(--text-main);
  font-size: 0.86rem;
  font-weight: 650;
  line-height: 1.55;
}

.home-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.6rem;
  flex-shrink: 0;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.home-highlight-copy {
  margin-top: 0.2rem;
  font-size: 0.9rem;
  line-height: 1.38;
  color: var(--theme-primary);
  border-left: 3px solid var(--theme-primary);
  padding-left: 0.65rem;
  padding-top: 0.42rem;
  padding-bottom: 0.42rem;
  border-radius: 0 1rem 1rem 0;
  background: color-mix(in srgb, var(--surface-elevated) 38%, transparent);
  backdrop-filter: blur(calc(var(--glass-blur) + 1px));
  -webkit-backdrop-filter: blur(calc(var(--glass-blur) + 1px));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.home-outline-subcard {
  margin-top: 0.45rem;
  padding: 0.62rem 0.75rem;
  background: color-mix(in srgb, var(--surface-elevated) 28%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-primary) 8%, var(--border-strong));
  border-radius: 0.85rem;
  backdrop-filter: blur(calc(var(--glass-blur) + 2px));
  -webkit-backdrop-filter: blur(calc(var(--glass-blur) + 2px));
  box-shadow: var(--shadow-soft), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.home-task-copy {
  color: color-mix(in srgb, var(--text-main) 90%, var(--theme-primary-darker) 10%);
  font-weight: 600;
}

.dark .home-task-copy {
  color: color-mix(in srgb, var(--text-main) 95%, white 5%);
}

.home-spotify-panel {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  isolation: isolate;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0.78rem 0.9rem;
  border-radius: var(--radius-card);
  border: 1px solid color-mix(in srgb, var(--theme-primary) 10%, var(--border-strong));
  background: linear-gradient(155deg, color-mix(in srgb, var(--theme-primary) 7%, var(--surface-panel) 91%), color-mix(in srgb, var(--surface-elevated) 72%, transparent));
  backdrop-filter: blur(var(--blur-panel));
  -webkit-backdrop-filter: blur(var(--blur-panel));
  box-shadow: var(--shadow-soft), inset 0 1px 0 rgba(255, 255, 255, 0.18);
  text-decoration: none;
}

.home-spotify-panel::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--theme-primary) 16%, transparent), transparent 48%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.12), transparent 38%);
  opacity: 0.75;
  pointer-events: none;
}

.home-spotify-panel::after {
  content: "";
  position: absolute;
  inset: 1px;
  border-radius: calc(var(--radius-card) - 1px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  pointer-events: none;
}

.home-spotify-panel > * {
  position: relative;
  z-index: 1;
}

a.home-spotify-panel {
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease, background 0.3s ease, box-shadow 0.3s ease;
}

a.home-spotify-panel:hover {
  border-color: color-mix(in srgb, var(--theme-primary) 28%, var(--border-strong));
  background: linear-gradient(155deg, color-mix(in srgb, var(--theme-primary) 9%, var(--surface-panel) 94%), color-mix(in srgb, var(--surface-elevated) 80%, transparent));
  box-shadow: var(--shadow-medium), inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

a.home-spotify-panel:focus-visible {
  outline: none;
  border-color: var(--theme-primary-light);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--theme-primary) 14%, transparent), var(--shadow-medium);
}

.home-spotify-head {
  margin-bottom: 0.45rem;
}

.home-spotify-media {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.8rem;
  min-width: 0;
}

.home-spotify-cover {
  width: 3.7rem;
  height: 3.7rem;
  border-radius: 0.95rem;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid color-mix(in srgb, var(--theme-primary) 10%, var(--border-strong));
  background: color-mix(in srgb, var(--surface-panel) 42%, transparent);
  box-shadow: var(--shadow-soft);
}

.home-spotify-meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.home-spotify-title,
.home-spotify-artist,
.home-spotify-album {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.home-spotify-title {
  -webkit-line-clamp: 2;
  font-size: 0.92rem;
  line-height: 1.22;
  font-weight: 700;
  color: var(--text-main);
}

.home-spotify-artist {
  -webkit-line-clamp: 2;
  margin-top: 0.08rem;
  font-size: 0.8rem;
  line-height: 1.26;
  color: var(--text-secondary);
}

.home-spotify-album {
  -webkit-line-clamp: 1;
  margin-top: 0.18rem;
  font-size: 0.72rem;
  line-height: 1.3;
  color: var(--text-muted);
}

.home-spotify-progress {
  margin-top: 0.45rem;
  padding-top: 0.45rem;
  border-top: 1px solid color-mix(in srgb, var(--theme-primary) 10%, var(--border-strong));
}

.home-spotify-empty {
  min-width: 0;
}

.home-status-card {
  padding-top: 0.78rem;
  padding-bottom: 0.78rem;
}

.home-status-card .home-card-head {
  margin-bottom: 0.45rem;
}

@media (max-width: 1200px) {
  .home-main-grid {
    grid-template-columns: repeat(12, minmax(0, 1fr));
    grid-template-rows: auto auto minmax(0, 1fr) minmax(0, 1fr);
    grid-template-areas:
      "intro intro intro intro intro intro intro intro intro intro intro intro"
      "status status status status status status spotify spotify spotify spotify spotify spotify"
      "owner owner owner owner owner owner owner owner owner owner owner owner"
      "tasks tasks tasks tasks tasks tasks tasks tasks tasks tasks tasks tasks";
  }
}

@media (max-width: 1023px) {
  .home-page-shell {
    overflow: visible;
    height: auto;
  }

  .home-dashboard-shell {
    overflow: visible;
    min-height: auto;
  }

  .home-main-grid {
    display: flex;
    flex-direction: column;
    height: auto;
    gap: 0.8rem;
  }

  .home-outline-card,
  .home-spotify-card,
  .home-spotify-panel {
    min-height: auto;
    height: auto;
  }

  .home-tasks-list::-webkit-scrollbar {
    display: none;
  }

  .home-tasks-list {
    overflow: visible;
    max-height: none;
    padding-right: 0;
    margin-right: 0;
    scrollbar-width: auto;
  }

  .home-outline-card {
    min-height: auto;
  }

  .home-intro-card {
    grid-template-columns: minmax(0, 1fr);
    gap: 1rem;
  }

  .home-traces {
    padding-top: 0.85rem;
    padding-left: 0;
    border-top: 1px solid color-mix(in srgb, var(--theme-primary) 15%, var(--border-strong));
    border-left: 0;
  }

  .home-intro-card,
  .home-status-card,
  .home-spotify-card,
  .home-tasks-card,
  .home-owner-card {
    order: initial;
  }

  .home-spotify-media {
    grid-template-columns: auto minmax(0, 1fr);
  }
}

@media (max-width: 1023px) and (min-width: 641px) {
  .home-dashboard-shell {
    padding: 0.5rem;
  }

  .home-main-grid {
    gap: 0.85rem;
  }

  .home-intro-card {
    order: 1;
  }

  .home-owner-card {
    order: 2;
  }

  .home-status-card {
    order: 3;
  }

  .home-spotify-card {
    order: 4;
  }

  .home-tasks-card {
    order: 5;
  }

  .home-tasks-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .home-tasks-list > .home-outline-subcard {
    margin-top: 0;
  }
}

@media (max-width: 640px) {
  .home-dashboard-shell {
    padding: 0.25rem 0;
  }

  .home-outline-card {
    padding: 0.8rem;
  }

  .home-main-grid {
    gap: 0.7rem;
  }

  .home-intro-card {
    order: 1;
  }

  .home-trace-summary {
    white-space: normal;
  }

  .home-owner-card {
    order: 2;
  }

  .home-status-card {
    order: 3;
  }

  .home-spotify-card {
    order: 4;
  }

  .home-tasks-card {
    order: 5;
  }

  .home-owner-head {
    align-items: center;
  }

  .home-owner-layout {
    grid-template-columns: minmax(0, 1fr);
    gap: 1rem;
  }

  .home-owner-identity {
    padding-right: 0;
    padding-bottom: 1rem;
    border-right: 0;
    border-bottom: 1px solid color-mix(in srgb, var(--theme-primary) 12%, var(--border-strong));
  }

  .home-owner-mark {
    width: 4.2rem;
    height: 4.2rem;
  }

  .home-owner-name {
    font-size: 1.35rem;
  }

  .home-owner-contacts {
    margin-top: 0;
  }

  .home-tasks-list {
    display: block;
  }

  .home-spotify-media {
    grid-template-columns: minmax(0, 1fr);
  }

  .home-spotify-cover {
    width: 4rem;
    height: 4rem;
  }

  .home-card-head {
    align-items: flex-start;
  }

  .home-title {
    font-size: 1.9rem;
  }

  .home-copy {
    font-size: 0.92rem;
    line-height: 1.55;
  }
}
</style>
