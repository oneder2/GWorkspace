<template>
  <div class="personal-home">
    <header class="landing-navigation">
      <router-link to="/" class="landing-brand" :aria-label="$t('homeV2.backHome')"><GWorkspaceIcon :size="34" variant="monochrome" /><span>GWorkspace</span></router-link>
      <nav :aria-label="$t('common.menu')"><router-link to="/blog">{{ $t('homeV2.allWriting') }}</router-link><router-link to="/portfolio">{{ $t('homeV2.allProjects') }}</router-link><button type="button" @click="$emit('toggle-lang')">{{ locale.startsWith('zh') ? 'EN' : '中文' }}</button><button type="button" @click="$emit('toggle-theme')" :aria-label="$t(isDark ? 'homeV2.light' : 'homeV2.dark')">{{ isDark ? '☼' : '◐' }}</button><router-link to="/workspace" class="landing-enter">{{ $t('homeV2.enter') }} ↗</router-link></nav>
    </header>
    <div v-if="isPreview" class="home-preview">{{ $t('homeV2.preview') }} <a href="https://www.gellaronline.cc/">{{ $t('homeV2.live') }} ↗</a></div>
    <section class="home-portrait" aria-labelledby="home-name">
      <div class="portrait-copy">
        <h1 id="home-name">{{ owner.name }}</h1>
        <p class="portrait-statement">{{ $t('homeV2.statement') }}</p>
        <p class="portrait-bio">{{ owner.bio }}</p>
        <router-link to="/workspace" class="home-primary-link">{{ $t('homeV2.enter') }} <span aria-hidden="true">↗</span></router-link>
        <nav class="portrait-contacts" :aria-label="$t('home.owner.contact')">
          <a v-for="contact in owner.contacts" :key="contact.id" :href="contact.href" :target="external(contact.href) ? '_blank' : undefined" rel="noopener noreferrer">{{ contact.label }} <span aria-hidden="true">↗</span></a>
        </nav>
      </div>
      <GradientAscii class="portrait-art" />
    </section>

    <section id="home-work" class="home-work" aria-labelledby="work-heading">
      <header class="home-section-heading"><h2 id="work-heading">{{ $t('homeV2.work') }}</h2><router-link to="/portfolio">{{ $t('homeV2.allProjects') }} ↗</router-link></header>
      <div class="home-work-layout">
        <article class="home-featured-project">
          <a :href="project.url" :target="external(project.url) ? '_blank' : undefined" rel="noopener noreferrer" class="project-image-link" :aria-label="project.title">
            <img :src="project.image" :alt="project.title" loading="lazy" width="800" height="500" />
          </a>
          <div class="project-description"><h3><a :href="project.url" :target="external(project.url) ? '_blank' : undefined" rel="noopener noreferrer">{{ project.title }} ↗</a></h3><p>{{ project.summary }}</p></div>
        </article>
        <article class="home-writing">
          <p class="home-small-label">{{ $t('homeV2.writing') }}</p>
          <template v-if="article">
            <time>{{ formatBlogDate(getBlogDateValue(article)) }}</time>
            <h3><router-link :to="`/blog/${article.id}`">{{ article.title }}</router-link></h3>
            <p class="writing-excerpt">{{ articleExcerpt }}</p>
            <router-link :to="`/blog/${article.id}`" class="home-reading-link">{{ $t('homeV2.read') }} ↗</router-link>
          </template>
          <template v-else><h3>{{ $t('homeV2.writingTitle') }}</h3><p>{{ $t(articlesLoading ? 'common.loading' : 'homeV2.writingEmpty') }}</p><router-link to="/blog" class="home-reading-link">{{ $t('homeV2.allWriting') }} ↗</router-link></template>
        </article>
      </div>
    </section>

    <section class="home-life" aria-labelledby="life-heading">
      <header class="home-section-heading"><h2 id="life-heading">{{ $t('homeV2.life') }}</h2><span>{{ $t('homeV2.lifeNote') }}</span></header>
      <div class="home-life-layout">
        <article class="home-now"><h3>{{ $t('home.statusTitle') }}</h3><p>{{ profileStatus }}</p>
          <details class="home-tasks" :open="tasks.length <= 3"><summary>{{ $t('home.tasksTitle') }} <span>{{ tasks.length }}</span></summary><ul v-if="tasks.length"><li v-for="(task, index) in tasks" :key="index">{{ task }}</li></ul><p v-else>{{ $t('home.tasksEmpty') }}</p></details>
        </article>
        <component :is="track?.externalUrl ? 'a' : 'article'" class="home-music" :href="track?.externalUrl || undefined" :target="track?.externalUrl ? '_blank' : undefined" :rel="track?.externalUrl ? 'noopener noreferrer' : undefined">
          <div class="music-heading"><h3>{{ $t('home.spotifyTitle') }}</h3><span>{{ spotifyLabel }}</span></div>
          <template v-if="track">
            <div class="music-track"><img v-if="track.coverUrl" :src="track.coverUrl" :alt="track.album || track.title" width="64" height="64" loading="lazy" /><div v-else class="record-disc" aria-hidden="true"></div><div><h4>{{ track.title }}</h4><p>{{ track.artist }}</p><p v-if="track.album" class="music-album">{{ track.album }}</p></div></div>
            <div v-if="hasProgress" class="music-progress"><progress :value="track.progressMs" :max="track.durationMs" :aria-label="$t('homeV2.progress')"></progress><div><span>{{ formatDuration(track.progressMs) }}</span><span>{{ formatDuration(track.durationMs) }}</span></div></div>
          </template>
          <p v-else class="music-empty">{{ $t(spotify.error.value ? 'home.spotifyErrorHint' : 'home.spotifyHint') }}</p>
        </component>
      </div>
    </section>

    <section class="home-letter" aria-labelledby="letter-heading">
      <div><h2 id="letter-heading">{{ $t('common.stationGift') }}</h2><blockquote>{{ capsule?.source_text || profileSlogan }}</blockquote><p v-if="capsule?.thesis">{{ capsule.thesis }}</p></div>
      <GWorkspaceIcon :size="72" variant="monochrome" class="letter-mark" aria-hidden="true" />
    </section>
    <div class="home-colophon"><p>{{ $t('homeV2.colophon') }}</p><button type="button" @click="showUpdates = true">{{ $t('home.updateLog') }} ↗</button></div>
    <UpdateLogModal v-if="showUpdates" @close="showUpdates = false" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import GradientAscii from '../components/home/GradientAscii.vue'
import GWorkspaceIcon from '../components/icons/GWorkspaceIcon.vue'
import UpdateLogModal from '../components/UpdateLogModal.vue'
import { homeProfileConfig } from '../config/home'
import { portfolioConfig, portfolioImages } from '../config/portfolio'
import { useSpotifyNowPlaying } from '../composables/useSpotifyNowPlaying'
import { useDailyCapsule } from '../composables/useDailyCapsule'
import { adminSettingsApi, blogApi, publicContentApi } from '../utils/api'
import { formatBlogDate, getBlogDateValue } from '../utils/blogDate'

const { t, locale } = useI18n()
defineProps({ isDark: Boolean })
defineEmits(['toggle-theme', 'toggle-lang'])
const isPreview = import.meta.env.VITE_HOME_PREVIEW === 'true'
const showUpdates = ref(false), settings = ref(null), remoteProjects = ref([]), article = ref(null), articlesLoading = ref(true)
const spotify = useSpotifyNowPlaying(), track = spotify.track
const { capsule, loadDailyCapsule } = useDailyCapsule()
const lang = computed(() => locale.value.startsWith('zh') ? 'zh' : 'en')
const localized = value => typeof value === 'string' ? value : value?.[lang.value] || value?.zh || value?.en || ''
const profile = computed(() => settings.value?.homepage_content || homeProfileConfig)
const owner = computed(() => {
  const data = settings.value?.profile_content?.owner || homeProfileConfig.owner
  return { name: data.name || homeProfileConfig.owner.name, bio: localized(data.bio || homeProfileConfig.owner.bio), contacts: data.contacts || homeProfileConfig.owner.contacts }
})
const profileStatus = computed(() => localized(profile.value.status))
const profileSlogan = computed(() => localized(profile.value.slogan))
const tasks = computed(() => { const list = localized(profile.value.tasks); return Array.isArray(list) ? list.filter(x => typeof x === 'string' && x.trim()) : [] })
const external = url => /^https?:\/\//i.test(url || '')
const project = computed(() => {
  const remote = remoteProjects.value.find(item => item.slug === 'citeai')
  const local = portfolioConfig.find(item => item.slug === 'citeai')
  const image = remote?.image || portfolioImages.citeai
  return { title: remote?.title || t(local.titleKey), summary: remote?.summary || t(local.descKey), url: remote?.url || local.url, image: image.startsWith('/') ? `${import.meta.env.BASE_URL}${image.slice(1)}` : image }
})
const articleExcerpt = computed(() => String(article.value?.excerpt || article.value?.content || '').replace(/<[^>]*>/g, '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/[#*_`>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 150))
const spotifyLabel = computed(() => {
  if (spotify.error.value) return t('home.spotifyUnavailable')
  if (spotify.isLoading.value) return t('common.loading')
  if (!track.value) return t('home.spotifyIdle')
  return t(track.value.isPlaying ? 'home.spotifyLive' : 'home.spotifyPaused')
})
const hasProgress = computed(() => Number.isFinite(track.value?.progressMs) && Number.isFinite(track.value?.durationMs) && track.value.durationMs > 0)
const formatDuration = ms => { const seconds = Math.floor(Math.max(0, ms || 0) / 1000); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` }
let projectRequest = 0
async function loadProjects() {
  const request = ++projectRequest
  try { const result = await publicContentApi.getProjects(lang.value); if (request === projectRequest) remoteProjects.value = Array.isArray(result) ? result : [] } catch { if (request === projectRequest) remoteProjects.value = [] }
}
watch(lang, loadProjects)
onMounted(() => {
  adminSettingsApi.get().then(data => { settings.value = data }).catch(() => {})
  blogApi.getList({ limit: 1 }).then(data => { article.value = Array.isArray(data) ? data[0] || null : null }).catch(() => {}).finally(() => { articlesLoading.value = false })
  loadProjects()
  loadDailyCapsule().catch(() => {})
})
</script>

<style scoped>
@import '../styles/pages/HomePage.css';
</style>
