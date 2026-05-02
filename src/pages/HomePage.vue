<!--
  主页组件 - 居中版
  包含搜索功能、快捷链接及下方的更新日志
  采用垂直流布局，确保主要功能依然是视觉中心
-->
<template>
  <div class="max-w-6xl mx-auto mt-4 sm:mt-8 px-1 sm:px-2 animate-fade-in pb-24 space-y-8">
    <section class="hero-panel rounded-[32px] p-6 sm:p-8 lg:p-12">
      <div class="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] items-start">
        <div class="space-y-6 min-w-0">
          <span class="eyebrow">{{ $t('home.eyebrow') }}</span>
          <div class="space-y-4">
            <h1 class="section-title max-w-3xl">{{ $t('home.title') }}</h1>
            <p class="section-copy text-base sm:text-lg text-slate-600 dark:text-slate-300">{{ $t('home.subtitle') }}</p>
          </div>

          <div class="surface-panel rounded-[28px] p-3 sm:p-4 relative z-20">
            <div class="flex flex-col sm:flex-row sm:items-center gap-3">
              <div class="relative group shrink-0">
                <button 
                  class="w-full sm:w-auto px-4 py-3 rounded-2xl bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 flex items-center gap-2 text-secondary font-bold transition-colors border border-border-base"
                  @click="showEngineMenu = !showEngineMenu"
                >
                  <component :is="getEngineIcon(searchEngine)" class="w-5 h-5" />
                  <span>{{ getEngineName(searchEngine) }}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 opacity-50">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                <div 
                  v-if="showEngineMenu"
                  class="absolute top-full left-0 mt-2 w-48 surface-float rounded-2xl shadow-xl overflow-hidden z-30 p-2"
                  @click.stop
                >
                  <div @click="searchEngine = 'google'; showEngineMenu = false" class="px-3 py-2.5 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-xl cursor-pointer flex items-center gap-3 text-sm transition-colors text-secondary">
                    <component :is="GoogleIcon" class="w-5 h-5 text-green-500" />
                    {{ $t('home.searchEngines.google') }}
                  </div>
                  <div @click="searchEngine = 'duckduckgo'; showEngineMenu = false" class="px-3 py-2.5 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-xl cursor-pointer flex items-center gap-3 text-sm transition-colors text-secondary">
                    <component :is="DuckIcon" class="w-5 h-5 text-orange-500" />
                    {{ $t('home.searchEngines.duckduckgo') }}
                  </div>
                  <div @click="searchEngine = 'baidu'; showEngineMenu = false" class="px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl cursor-pointer flex items-center gap-3 text-sm transition-colors text-secondary">
                    <component :is="BaiduIcon" class="w-5 h-5 text-blue-600" />
                    {{ $t('home.searchEngines.baidu') }}
                  </div>
                  <div @click="searchEngine = 'edge'; showEngineMenu = false" class="px-3 py-2.5 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded-xl cursor-pointer flex items-center gap-3 text-sm transition-colors text-secondary">
                    <component :is="EdgeIcon" class="w-5 h-5 text-cyan-600" />
                    {{ $t('home.searchEngines.edge') }}
                  </div>
                </div>
              </div>

              <label for="search-input" class="sr-only">{{ $t('home.searchPlaceholder') }}</label>
              <input 
                id="search-input"
                name="search-input"
                v-model="searchQuery" 
                @keyup.enter="performSearch"
                type="text" 
                class="glass-input flex-1 h-14 px-5 rounded-2xl outline-none text-lg sm:text-xl text-main placeholder:text-muted"
                :placeholder="$t('home.searchPlaceholder')" 
                autofocus
              >

              <button 
                @click="performSearch" 
                class="action-btn action-btn-primary w-full sm:w-auto min-w-[60px] h-14"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="surface-card rounded-[28px] p-5 sm:p-6 space-y-4 min-w-0">
          <div class="section-heading mb-1 pb-4 divider-strong-b">
            <div>
              <div class="section-kicker">{{ $t('home.quickStart') }}</div>
              <h2 class="text-2xl font-bold text-main tracking-tight">{{ $t('home.workspaceAreas') }}</h2>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <router-link
              v-for="item in workspaceLinks"
              :key="item.id"
              :to="item.route"
              class="surface-card rounded-2xl p-4 flex items-center gap-3 group min-w-0"
            >
              <div class="w-12 h-12 rounded-2xl flex items-center justify-center bg-white dark:bg-slate-900 border border-border-base shadow-sm">
                <component :is="item.icon" class="w-6 h-6 text-secondary transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div class="min-w-0">
                <div class="text-sm font-bold text-main truncate">{{ item.name }}</div>
                <div class="text-xs text-muted truncate">{{ item.description }}</div>
              </div>
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <section>
      <div class="surface-card rounded-[28px] p-6 sm:p-8 min-w-0">
        <div class="section-heading flex-col items-start sm:flex-row sm:items-center mb-5 pb-5 divider-strong-b">
          <div>
            <div class="section-kicker">{{ $t('home.launchPad') }}</div>
            <h2 class="text-2xl font-bold text-main tracking-tight">{{ $t('home.quickAccess') }}</h2>
            <p class="section-copy mt-3 text-sm sm:text-base">{{ $t('home.quickAccessCopy') }}</p>
          </div>
          <button 
            @click="showEditor = true"
            class="action-btn action-btn-secondary text-xs sm:text-sm w-full sm:w-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            {{ $t('home.edit') }}
          </button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-stagger-in">
          <a 
            v-for="site in displayLinks" 
            :key="site.id || site.name" 
            :href="site.url" 
            target="_blank" 
            class="surface-card rounded-[24px] p-5 flex flex-col items-start gap-4 group min-w-0 overflow-hidden"
          >
            <div class="w-14 h-14 rounded-[20px] flex items-center justify-center bg-white dark:bg-slate-900 border border-border-base shadow-sm">
              <img 
                v-if="site.url && getCachedFaviconInfo(site.url).url"
                :src="getCachedFaviconInfo(site.url).url" 
                @load="handleIconLoad(site.url)"
                @error="handleIconError($event, site)"
                class="w-9 h-9 rounded-lg opacity-90 group-hover:opacity-100 transition-opacity"
                :alt="site.name"
              >
              <component v-else-if="site.icon" :is="site.icon" class="w-7 h-7 text-secondary" />
              <span v-else class="text-secondary text-lg font-bold">{{ site.name?.[0] || '?' }}</span>
            </div>
            <div class="min-w-0">
              <div class="text-sm font-bold text-main truncate">{{ site.name }}</div>
              <div class="text-xs text-muted truncate">{{ site.url }}</div>
            </div>
          </a>
        </div>
      </div>
    </section>

    <!-- 编辑弹窗 -->
    <QuickLinkEditor 
      v-if="showEditor"
      :links="displayLinks"
      @close="showEditor = false"
      @save="handleSaveLinks"
    />
  </div>
</template>

<script setup>
import { ref, computed, markRaw } from 'vue'
import { useI18n } from 'vue-i18n'
import { quickLinksConfig } from '../config/home'
import { useLocalStorage } from '../composables/useStorage'
import { getIcon } from '../utils/iconMapper'
import { getCachedFaviconUrl, markFaviconSuccess, markFaviconError } from '../utils/faviconCache'
import { ensureAbsoluteUrl } from '../utils/urlHelper'
import GoogleIcon from '../components/icons/GoogleIcon.vue'
import DuckIcon from '../components/icons/DuckIcon.vue'
import BaiduIcon from '../components/icons/BaiduIcon.vue'
import EdgeIcon from '../components/icons/EdgeIcon.vue'
import CompassIcon from '../components/icons/CompassIcon.vue'
import WrenchIcon from '../components/icons/WrenchIcon.vue'
import ArticleIcon from '../components/icons/ArticleIcon.vue'
import BriefcaseIcon from '../components/icons/BriefcaseIcon.vue'
import QuickLinkEditor from '../components/QuickLinkEditor.vue'

const { t } = useI18n()

// 搜索相关
const searchEngine = ref('google')
const searchQuery = ref('')
const showEngineMenu = ref(false)

// 编辑器显示状态
const showEditor = ref(false)

// 从存储加载自定义链接
const customLinksStorage = useLocalStorage('customQuickLinks', [])
const customLinks = customLinksStorage.value

// 默认链接
const defaultLinks = computed(() => {
  return quickLinksConfig.map(link => ({
    ...link,
    name: t(link.nameKey),
    url: ensureAbsoluteUrl(link.url),
    icon: getIcon(link.iconName)
  }))
})

// 显示的链接
const displayLinks = computed(() => {
  const customLinksArray = Array.isArray(customLinks.value) ? customLinks.value : []
  if (customLinksArray.length > 0) {
    return customLinksArray.map(link => {
      const icon = link.iconName ? getIcon(link.iconName) : null
      return {
        ...link,
        url: ensureAbsoluteUrl(link.url), // 强制格式化 URL (三重保险)
        icon: icon ? markRaw(icon) : null
      }
    })
  }
  return defaultLinks.value
})

const workspaceLinks = computed(() => ([
  {
    id: 'sites',
    name: t('nav.sites'),
    description: t('sites.title'),
    route: '/sites',
    icon: markRaw(CompassIcon)
  },
  {
    id: 'tools',
    name: t('nav.tools'),
    description: t('tools.title'),
    route: '/tools',
    icon: markRaw(WrenchIcon)
  },
  {
    id: 'blog',
    name: t('nav.blog'),
    description: t('blog.latestArticles'),
    route: '/blog',
    icon: markRaw(ArticleIcon)
  },
  {
    id: 'portfolio',
    name: t('nav.portfolio'),
    description: t('nav.portfolio'),
    route: '/portfolio',
    icon: markRaw(BriefcaseIcon)
  }
]))

/**
 * 保存自定义链接
 */
const handleSaveLinks = (links) => {
  console.log('[HomePage] handleSaveLinks called with:', links)
  const linksToSave = links.map(link => ({
    id: link.id || `link-${Date.now()}-${Math.random()}`,
    name: link.name,
    url: ensureAbsoluteUrl(link.url), // 保存时也强制格式化
    iconName: link.iconName || 'HomeIcon',
    color: link.color || 'bg-slate-500'
  }))
  customLinksStorage.update(linksToSave)
  showEditor.value = false
}

/**
 * 获取搜索引擎图标
 */
const getEngineIcon = (engine) => {
  switch (engine) {
    case 'google': return GoogleIcon
    case 'duckduckgo': return DuckIcon
    case 'baidu': return BaiduIcon
    case 'edge': return EdgeIcon
    default: return GoogleIcon
  }
}

/**
 * 获取搜索引擎名称
 */
const getEngineName = (engine) => {
  switch (engine) {
    case 'google': return t('home.searchEngines.google')
    case 'duckduckgo': return t('home.searchEngines.duckduckgo')
    case 'baidu': return t('home.searchEngines.baidu')
    case 'edge': return t('home.searchEngines.edge')
    default: return t('home.searchEngines.google')
  }
}

/**
 * 执行搜索
 */
const performSearch = () => {
  if (!searchQuery.value) return
  let url = ''
  switch (searchEngine.value) {
    case 'google':
      url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery.value)}`
      break
    case 'duckduckgo':
      url = `https://duckduckgo.com/?q=${encodeURIComponent(searchQuery.value)}`
      break
    case 'baidu':
      url = `https://www.baidu.com/s?wd=${encodeURIComponent(searchQuery.value)}`
      break
    case 'edge':
      url = `https://www.bing.com/search?q=${encodeURIComponent(searchQuery.value)}`
      break
  }
  window.open(url, '_blank')
}

/**
 * 获取缓存的Favicon信息
 */
const getCachedFaviconInfo = (url) => {
  return getCachedFaviconUrl(url, 64)
}

const handleIconLoad = (url) => {
  markFaviconSuccess(url, 64)
}

const handleIconError = (event, site) => {
  if (site.url) markFaviconError(site.url)
  if (event.target) event.target.style.display = 'none'
}
</script>
