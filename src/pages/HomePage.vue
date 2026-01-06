<!--
  主页组件
  包含搜索功能和快捷链接
  支持多搜索引擎切换
-->
<template>
  <div class="max-w-4xl mx-auto mt-12 flex flex-col items-center animate-fade-in">
    <div class="mb-12 text-center">
      <!-- 标题：亮色模式使用深色以确保在浅色背景遮罩上有足够对比度，暗色模式使用浅色 -->
      <h1 class="text-5xl font-bold text-slate-800 dark:text-slate-100 mb-4 tracking-tight">
        {{ $t('home.title') }}
      </h1>
      <!-- 副标题：使用中等深度颜色，确保可读性 -->
      <p class="text-slate-700 dark:text-slate-300 text-lg">{{ $t('home.subtitle') }}</p>
    </div>

    <!-- 搜索组件 -->
    <div class="w-full max-w-2xl relative z-20">
      <div class="glass-card rounded-2xl p-2 flex items-center gap-2 transition-all duration-300 ring-4 ring-transparent focus-within:ring-theme-primary/50 dark:focus-within:ring-theme-primary-darker/50">
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
          class="w-12 h-12 rounded-xl dark:bg-theme-primary-darker flex items-center justify-center hover:bg-theme-primary-darker dark:hover:bg-theme-primary-darker hover:scale-105 active:scale-95 transition-all shadow-lg shadow-theme-primary/30"
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
        <h2 class="text-lg font-bold text-slate-800 dark:text-slate-200">{{ $t('home.quickLinks') }}</h2>
        <button 
          @click="showEditor = true"
          class="px-4 py-2 bg-white/50 dark:bg-slate-800/50 rounded-lg text-slate-600 dark:text-slate-400 transition-colors text-sm font-medium flex items-center gap-2"
          style="--hover-bg: color-mix(in srgb, var(--theme-primary-lighter) 30%, transparent); --hover-bg-dark: color-mix(in srgb, var(--theme-primary) 20%, transparent); --hover-text: var(--theme-primary-darker); --hover-text-dark: var(--theme-primary-light);"
          @mouseenter="const el = $event.currentTarget; const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark'); el.style.backgroundColor = isDark ? 'var(--hover-bg-dark)' : 'var(--hover-bg)'; el.style.color = isDark ? 'var(--hover-text-dark)' : 'var(--hover-text)';"
          @mouseleave="const el = $event.currentTarget; el.style.backgroundColor = ''; el.style.color = '';"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          {{ $t('home.edit') }}
        </button>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <a 
          v-for="site in displayLinks" 
          :key="site.id || site.name" 
          :href="site.url" 
          target="_blank" 
          class="glass-card flex flex-col items-center justify-center py-6 rounded-2xl cursor-pointer group hover:-translate-y-1"
        >
          <!-- 动态获取网站图标 -->
          <div 
            class="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg transition-transform duration-300 group-hover:scale-110 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            <!-- 优先使用动态获取的favicon -->
            <img 
              v-if="site.url"
              :src="getFaviconUrl(site.url, 64)" 
              @error="handleIconError($event, site)"
              class="w-10 h-10 rounded-lg opacity-90 group-hover:opacity-100 transition-opacity"
              :alt="site.name"
            >
            <!-- 如果favicon加载失败，回退到SVG图标 -->
            <component 
              v-else-if="site.icon" 
              :is="site.icon" 
              class="w-8 h-8 text-slate-700 dark:text-slate-200" 
            />
            <!-- 最后回退到首字母 -->
            <span 
              v-else 
              class="text-slate-700 dark:text-slate-200 text-lg font-bold"
            >
              {{ site.name?.[0] || '?' }}
            </span>
          </div>
          <span class="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
            {{ site.name }}
          </span>
        </a>
      </div>
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
import { quickLinksConfig } from '../config/home'
import { useLocalStorage } from '../composables/useStorage'
import { getIcon } from '../utils/iconMapper'
import { getFaviconUrl } from '../utils/urlHelper'
import GoogleIcon from '../components/icons/GoogleIcon.vue'
import DuckIcon from '../components/icons/DuckIcon.vue'
import BaiduIcon from '../components/icons/BaiduIcon.vue'
import EdgeIcon from '../components/icons/EdgeIcon.vue'
import QuickLinkEditor from '../components/QuickLinkEditor.vue'

// 搜索相关
const searchEngine = ref('google')
const searchQuery = ref('')
const showEngineMenu = ref(false)

// 编辑器显示状态
const showEditor = ref(false)

// 从存储加载自定义链接（使用空数组作为默认值）
// useLocalStorage 返回 { value: ref, update, reset }
const customLinksStorage = useLocalStorage('customQuickLinks', [])
const customLinks = customLinksStorage.value

// 默认链接（从配置加载）
const defaultLinks = computed(() => {
  return quickLinksConfig.map(link => ({
    ...link,
    icon: getIcon(link.iconName)
  }))
})

// 显示的链接（优先使用自定义链接）
const displayLinks = computed(() => {
  // customLinks 是 ref，所以访问 customLinks.value
  const customLinksArray = Array.isArray(customLinks.value) ? customLinks.value : []
  if (customLinksArray.length > 0) {
    return customLinksArray.map(link => {
      // 保留iconName用于回退，但主要使用动态favicon
      const icon = link.iconName ? getIcon(link.iconName) : null
      return {
        ...link,
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
  // 确保保存的链接包含必要的字段
  const linksToSave = links.map(link => ({
    id: link.id || `link-${Date.now()}-${Math.random()}`,
    name: link.name,
    url: link.url,
    iconName: link.iconName || 'HomeIcon',
    color: link.color || 'bg-slate-500'
  }))
  console.log('[HomePage] Links to save:', linksToSave)
  customLinksStorage.update(linksToSave)
  showEditor.value = false
}

/**
 * 获取搜索引擎图标
 */
const getEngineIcon = (engine) => {
  switch (engine) {
    case 'google':
      return GoogleIcon
    case 'duckduckgo':
      return DuckIcon
    case 'baidu':
      return BaiduIcon
    case 'edge':
      return EdgeIcon
    default:
      return GoogleIcon
  }
}

/**
 * 获取搜索引擎名称
 */
const getEngineName = (engine) => {
  switch (engine) {
    case 'google':
      return 'Google'
    case 'duckduckgo':
      return 'DuckDuckGo'
    case 'baidu':
      return '百度'
    case 'edge':
      return 'Edge'
    default:
      return 'Google'
  }
}

/**
 * 执行搜索
 * 根据选择的搜索引擎打开搜索结果
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
    default:
      url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery.value)}`
  }
  window.open(url, '_blank')
}

/**
 * 处理图标加载错误
 * 当favicon加载失败时，隐藏图片元素
 * @param {Event} event - 错误事件
 * @param {Object} site - 网站对象
 */
const handleIconError = (event, site) => {
  // 隐藏图片，让回退方案（SVG图标或首字母）显示
  if (event.target) {
    event.target.style.display = 'none'
  }
}
</script>
