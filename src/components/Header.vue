<!--
  顶部状态栏组件
  包含页面标题、天气信息、时间、主题切换、语言切换等功能
-->
<template>
  <header class="h-16 px-8 flex items-center justify-between border-b border-white/30 dark:border-slate-700/30 shrink-0 relative">
    <!-- 新文章通知横幅 -->
    <transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="transform opacity-0 -translate-y-full"
      enter-to-class="transform opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="transform opacity-100 translate-y-0"
      leave-to-class="transform opacity-0 -translate-y-full"
    >
      <div 
        v-if="newArticleNotification"
        class="absolute top-full left-0 right-0 bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600 text-white px-6 py-3 shadow-lg z-50 flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 animate-pulse">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <div>
            <span class="font-semibold">{{ $t('blog.newArticleNotification') }}:</span>
            <span class="ml-2">{{ newArticleNotification.title }}</span>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <button
            @click="viewNewArticle"
            class="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition-colors"
          >
            {{ $t('blog.viewNewArticle') }}
          </button>
          <button
            @click="dismissNotification"
            class="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            :title="$t('common.close')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    </transition>

    <div class="flex items-center gap-4">
      <h2 class="text-xl font-bold text-slate-800 dark:text-slate-200 tracking-tight">{{ currentTabName }}</h2>
      <span 
        v-if="currentTab === 'tools'" 
        class="px-2 py-0.5 rounded-md bg-green-100/50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-mono"
      >
        v2.0
      </span>
    </div>
    
    <div class="flex items-center gap-4">
      <!-- 天气信息 -->
      <div 
        v-if="weather" 
        class="hidden md:flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 bg-white/40 dark:bg-slate-800/40 px-3 py-1.5 rounded-full border border-white/50 dark:border-slate-700/50"
      >
        <!-- 使用SVG太阳图标 -->
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-orange-400">
          <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
        </svg>
        <span>{{ weather.temp }}°C</span>
      </div>
      
      <!-- 语言切换按钮 -->
      <button
        @click="$emit('toggle-lang')"
        class="p-2 rounded-lg hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors"
        :title="$t('common.language')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-slate-600 dark:text-slate-300">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
      </button>
      
      <!-- 主题自定义按钮 -->
      <button
        @click="$emit('open-theme-customizer')"
        class="p-2 rounded-lg hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors"
        :title="$t('theme.customize')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-slate-600 dark:text-slate-300">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
        </svg>
      </button>

      <!-- 主题切换按钮 -->
      <button
        @click="$emit('toggle-theme')"
        class="p-2 rounded-lg hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors"
        :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      >
        <!-- 太阳图标（亮色模式时显示） -->
        <svg 
          v-if="!isDark"
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          class="w-5 h-5 text-slate-600"
        >
          <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
        </svg>
        <!-- 月亮图标（暗色模式时显示） -->
        <svg 
          v-else
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          class="w-5 h-5 text-slate-300"
        >
          <path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clip-rule="evenodd" />
        </svg>
      </button>
      
      <!-- 时间显示 -->
      <div class="text-2xl font-light text-slate-700 dark:text-slate-300 font-mono tracking-wider w-24 text-right">
        {{ currentTime }}
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const props = defineProps({
  currentTab: {
    type: String,
    required: true
  },
  weather: {
    type: Object,
    default: null
  },
  currentTime: {
    type: String,
    required: true
  },
  isDark: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle-theme', 'toggle-lang', 'open-theme-customizer'])

const { t } = useI18n()
const router = useRouter()

/**
 * 新文章通知
 */
const newArticleNotification = ref(null)

/**
 * 检查并显示新文章通知
 */
const checkNewArticles = () => {
  try {
    const notifications = JSON.parse(localStorage.getItem('blog-new-articles') || '[]')
    
    if (notifications.length > 0) {
      // 获取最新的通知（第一条）
      const latest = notifications[0]
      
      // 检查通知是否在24小时内（避免显示过旧的通知）
      const notificationAge = Date.now() - latest.timestamp
      const oneDay = 24 * 60 * 60 * 1000
      
      if (notificationAge < oneDay) {
        newArticleNotification.value = latest
      } else {
        // 清除过期通知
        localStorage.setItem('blog-new-articles', JSON.stringify([]))
      }
    }
  } catch (error) {
    console.error('Failed to check new articles:', error)
  }
}

/**
 * 监听新文章创建事件
 */
const handleArticleCreated = (event) => {
  const articleInfo = event.detail
  newArticleNotification.value = articleInfo
  
  // 更新localStorage
  const notifications = JSON.parse(localStorage.getItem('blog-new-articles') || '[]')
  notifications.unshift(articleInfo)
  localStorage.setItem('blog-new-articles', JSON.stringify(notifications.slice(0, 5)))
}

/**
 * 查看新文章
 */
const viewNewArticle = () => {
  if (newArticleNotification.value) {
    router.push(`/blog/${newArticleNotification.value.id}`)
    dismissNotification()
  }
}

/**
 * 关闭通知
 */
const dismissNotification = () => {
  newArticleNotification.value = null
}

// 获取当前标签页名称
const currentTabName = computed(() => {
  const tabMap = {
    'home': t('nav.home'),
    'sites': t('nav.sites'),
    'tools': t('nav.tools'),
    'blog': t('nav.blog'),
    'portfolio': t('nav.portfolio')
  }
  return tabMap[props.currentTab] || 'GWorkspace'
})

// 初始化
onMounted(() => {
  checkNewArticles()
  // 监听新文章创建事件
  window.addEventListener('blog-article-created', handleArticleCreated)
})

onUnmounted(() => {
  window.removeEventListener('blog-article-created', handleArticleCreated)
})
</script>
