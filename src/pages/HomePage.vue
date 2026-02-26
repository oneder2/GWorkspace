<!--
  主页组件 - 居中版
  包含搜索功能、快捷链接及下方的更新日志
  采用垂直流布局，确保主要功能依然是视觉中心
-->
<template>
  <div class="max-w-4xl mx-auto mt-12 px-6 lg:px-8 animate-fade-in pb-24">
    <!-- 主体内容：搜索与快捷方式 -->
    <div class="flex flex-col items-center">
      <div class="mb-12 text-center w-full">
        <!-- 标题 -->
        <h1 class="text-5xl font-bold text-slate-800 dark:text-slate-100 mb-4 tracking-tight">
          {{ $t('home.title') }}
        </h1>
        <!-- 副标题 -->
        <p class="text-slate-700 dark:text-slate-300 text-lg">{{ $t('home.subtitle') }}</p>
      </div>

      <!-- 搜索组件 -->
      <div class="w-full max-w-2xl relative z-20">
        <div class="glass-card rounded-2xl p-2 flex items-center gap-2 transition-all duration-300 ring-4 ring-transparent focus-within:ring-[var(--theme-primary)]/50 dark:focus-within:ring-[var(--theme-primary)]/30">
          <!-- 搜索引擎选择 -->
          <div class="relative group shrink-0">
            <button 
              class="px-4 py-3 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-700/80 flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold transition-colors"
              @click="showEngineMenu = !showEngineMenu"
            >
              <component :is="getEngineIcon(searchEngine)" class="w-5 h-5" />
              <span class="hidden sm:inline">{{ getEngineName(searchEngine) }}</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 opacity-50">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            <!-- 引擎切换下拉菜单 -->
            <div 
              v-if="showEngineMenu"
              class="absolute top-full left-0 mt-2 w-44 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-xl shadow-xl border border-white/50 dark:border-slate-700/50 overflow-hidden z-30 p-1"
              @click.stop
            >
              <div 
                @click="searchEngine = 'google'; showEngineMenu = false" 
                class="px-3 py-2 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg cursor-pointer flex items-center gap-3 text-sm transition-colors"
              >
                <component :is="GoogleIcon" class="w-5 h-5 text-green-500" />
                Google
              </div>
              <div 
                @click="searchEngine = 'duckduckgo'; showEngineMenu = false" 
                class="px-3 py-2 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg cursor-pointer flex items-center gap-3 text-sm transition-colors"
              >
                <component :is="DuckIcon" class="w-5 h-5 text-orange-500" />
                DuckDuckGo
              </div>
              <div 
                @click="searchEngine = 'baidu'; showEngineMenu = false" 
                class="px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg cursor-pointer flex items-center gap-3 text-sm transition-colors"
              >
                <component :is="BaiduIcon" class="w-5 h-5 text-blue-600" />
                百度
              </div>
              <div 
                @click="searchEngine = 'edge'; showEngineMenu = false" 
                class="px-3 py-2 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded-lg cursor-pointer flex items-center gap-3 text-sm transition-colors"
              >
                <component :is="EdgeIcon" class="w-5 h-5 text-cyan-600" />
                Edge
              </div>
            </div>
          </div>
          
          <div class="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1"></div>
          
          <!-- 搜索输入框 -->
          <label for="search-input" class="sr-only">{{ $t('home.searchPlaceholder') }}</label>
          <input 
            id="search-input"
            name="search-input"
            v-model="searchQuery" 
            @keyup.enter="performSearch"
            type="text" 
            class="flex-1 h-12 bg-transparent outline-none text-xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            :placeholder="$t('home.searchPlaceholder')" 
            autofocus
          >
          
          <!-- 搜索按钮 -->
          <button 
            @click="performSearch" 
            class="w-12 h-12 rounded-xl bg-[var(--theme-primary)] flex items-center justify-center hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[var(--theme-primary)]/30 text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 快捷方式 -->
      <div class="mt-16 w-full max-w-3xl">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-slate-800 dark:text-slate-200 tracking-tight">{{ $t('home.quickLinks') }}</h2>
          <button 
            @click="showEditor = true"
            class="px-4 py-2 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-lg text-slate-600 dark:text-slate-400 transition-colors text-xs font-bold flex items-center gap-2 border border-slate-200/30 dark:border-slate-700/30 hover:text-[var(--theme-primary)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            {{ $t('home.edit') }}
          </button>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <a 
            v-for="site in displayLinks" 
            :key="site.id || site.name" 
            :href="site.url" 
            target="_blank" 
            class="glass-card flex flex-col items-center justify-center py-6 rounded-2xl cursor-pointer group hover:-translate-y-1 transition-all border border-white/20 dark:border-slate-700/20"
          >
            <div 
              class="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg transition-transform duration-300 group-hover:scale-110 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50"
            >
              <img 
                v-if="site.url && getCachedFaviconInfo(site.url).url"
                :src="getCachedFaviconInfo(site.url).url" 
                @load="handleIconLoad(site.url)"
                @error="handleIconError($event, site)"
                class="w-10 h-10 rounded-lg opacity-90 group-hover:opacity-100 transition-opacity"
                :alt="site.name"
              >
              <component 
                v-else-if="site.icon" 
                :is="site.icon" 
                class="w-8 h-8 text-slate-700 dark:text-slate-200" 
              />
              <span 
                v-else 
                class="text-slate-700 dark:text-slate-200 text-lg font-bold"
              >
                {{ site.name?.[0] || '?' }}
              </span>
            </div>
            <span class="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-[var(--theme-primary)] transition-colors">
              {{ site.name }}
            </span>
          </a>
        </div>
      </div>
    </div>

    <!-- 更新日志展示区：独立于主体部分，位于下方 -->
    <div class="mt-24 max-w-2xl mx-auto">
      <UpdateLog />
    </div>

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
import QuickLinkEditor from '../components/QuickLinkEditor.vue'
import UpdateLog from '../components/UpdateLog.vue'

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
    case 'google': return 'Google'
    case 'duckduckgo': return 'DuckDuckGo'
    case 'baidu': return '百度'
    case 'edge': return 'Edge'
    default: return 'Google'
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
