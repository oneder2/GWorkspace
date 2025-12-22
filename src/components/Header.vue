<!--
  顶部状态栏组件
  包含页面标题、天气信息、时间、主题切换、语言切换等功能
-->
<template>
  <header class="h-14 sm:h-16 px-4 sm:px-6 md:px-8 flex items-center justify-between border-b border-white/30 dark:border-slate-700/30 shrink-0 relative gap-2 sm:gap-4">
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
        class="absolute top-full left-0 right-0 text-white px-6 py-3 shadow-lg z-50 flex items-center justify-between"
        style="background: linear-gradient(to right, var(--theme-primary), var(--theme-primary-emerald)); box-shadow: 0 4px 12px color-mix(in srgb, var(--theme-primary) 30%, transparent);"
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

    <div class="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
      <!-- 移动端菜单按钮 -->
      <button
        @click="$emit('toggle-mobile-menu')"
        class="md:hidden p-2 rounded-lg hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors flex-shrink-0"
        :title="$t('common.menu')"
      >
        <svg 
          v-if="!showMobileMenu"
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2" 
          stroke-linecap="round" 
          stroke-linejoin="round" 
          class="w-6 h-6 text-slate-600 dark:text-slate-300"
        >
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
        <svg 
          v-else
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2" 
          stroke-linecap="round" 
          stroke-linejoin="round" 
          class="w-6 h-6 text-slate-600 dark:text-slate-300"
        >
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      <h2 class="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-200 tracking-tight truncate">{{ currentTabName }}</h2>
      <span 
        v-if="currentTab === 'tools'" 
        class="px-2 py-0.5 rounded-md text-xs font-mono"
        style="background-color: color-mix(in srgb, var(--theme-primary-lighter) 50%, transparent); color: var(--theme-primary-darker);"
        :style="{ '--dark-bg': 'color-mix(in srgb, var(--theme-primary) 30%, transparent)', '--dark-text': 'var(--theme-primary-light)' }"
        @mouseenter="const el = $event.currentTarget; const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark'); if (isDark) { el.style.backgroundColor = 'var(--dark-bg)'; el.style.color = 'var(--dark-text)'; }"
        @mouseleave="const el = $event.currentTarget; const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark'); if (isDark) { el.style.backgroundColor = ''; el.style.color = ''; }"
      >
        v2.0
      </span>
    </div>
    
    <!-- 最新文章推荐 - 仅在桌面端显示，当有文章时显示，移到左侧 -->
    <div 
      v-if="latestArticles.length > 0 && showLatestArticles"
      class="hidden lg:flex items-center gap-2 mr-4 pr-4 border-r border-white/30 dark:border-slate-700/30"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
      <div class="flex items-center gap-2 max-w-xs overflow-x-auto scrollbar-hide">
        <a
          v-for="article in latestArticles"
          :key="article.id"
          :href="`/blog/${article.id}`"
          @click.prevent="goToArticle(article.id)"
          class="shrink-0 px-2 py-1 rounded text-xs transition-all duration-200 whitespace-nowrap text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          style="--hover-bg: color-mix(in srgb, var(--theme-primary-lighter) 50%, transparent); --hover-bg-dark: color-mix(in srgb, var(--theme-primary) 20%, transparent);"
          @mouseenter="const el = $event.currentTarget; if (el) { const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark'); el.style.backgroundColor = isDark ? 'var(--hover-bg-dark)' : 'var(--hover-bg)'; }"
          @mouseleave="$event.currentTarget.style.backgroundColor = ''"
        >
          {{ article.title }}
        </a>
      </div>
      <button
        @click="showLatestArticles = false"
        class="shrink-0 p-1 rounded hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors"
        :title="$t('common.close')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3 text-slate-500 dark:text-slate-400">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    
    <div class="flex items-center gap-4">
      <!-- 位置信息 -->
      <div 
        v-if="weather && (weather.city || weather.country)" 
        class="hidden md:flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 bg-white/40 dark:bg-slate-800/40 px-3 py-1.5 rounded-full border border-white/50 dark:border-slate-700/50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        <span>{{ formatLocation(weather) }}</span>
      </div>
      
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
      
      <!-- 用户菜单 -->
      <div class="relative">
        <button
          v-if="!user"
          @click="showAuthModal = true"
          class="p-2 rounded-lg hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors"
          :title="$t('auth.login')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-slate-600 dark:text-slate-300">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </button>
        <div v-else class="relative" ref="userMenuContainer">
          <button
            @click.stop="toggleUserMenu"
            class="p-2 rounded-lg hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors flex items-center gap-2"
            :title="user.username"
            ref="userMenuButton"
          >
            <div class="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white font-semibold text-sm">
              {{ user.username.charAt(0).toUpperCase() }}
            </div>
          </button>
          <!-- 用户下拉菜单 -->
          <transition
            enter-active-class="transition ease-out duration-200"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition ease-in duration-150"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-if="showUserMenu"
              v-click-outside="handleClickOutside"
              class="absolute right-0 top-full mt-2 w-48 glass-card rounded-xl shadow-lg py-2 z-50"
            >
              <div class="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                <p class="text-sm font-semibold text-slate-800 dark:text-slate-200">{{ user.username }}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ user.email }}</p>
              </div>
              <button
                v-if="isAdmin"
                @click.stop="goToAdmin"
                class="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 transition-colors"
                style="--hover-bg: color-mix(in srgb, var(--theme-primary-lighter) 50%, transparent); --hover-bg-dark: color-mix(in srgb, var(--theme-primary) 20%, transparent);"
                @mouseenter="const el = $event.currentTarget; const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark'); el.style.backgroundColor = isDark ? 'var(--hover-bg-dark)' : 'var(--hover-bg)'"
                @mouseleave="$event.currentTarget.style.backgroundColor = ''"
              >
                {{ $t('auth.adminPanel') }}
              </button>
              <button
                @click.stop="handleLogout"
                class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                {{ $t('auth.logout') }}
              </button>
            </div>
          </transition>
        </div>
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
    </div>

    <!-- 认证弹窗 -->
    <AuthModal
      v-if="showAuthModal"
      @close="showAuthModal = false"
      @success="showAuthModal = false"
    />
  </header>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { blogApi } from '../utils/api'
import AuthModal from './AuthModal.vue'

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
  },
  showMobileMenu: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle-theme', 'toggle-lang', 'open-theme-customizer', 'toggle-mobile-menu'])

const { t } = useI18n()
const router = useRouter()
const { user, isAdmin, logout } = useAuth()

const showAuthModal = ref(false)
const showUserMenu = ref(false)
const userMenuContainer = ref(null)
const userMenuButton = ref(null)

// 最新文章
const latestArticles = ref([])
const showLatestArticles = ref(true)

/**
 * 切换用户菜单
 */
const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

/**
 * 处理点击外部关闭菜单
 */
const handleClickOutside = (event) => {
  // 如果点击的是用户菜单容器内的元素（包括按钮），不关闭
  if (userMenuContainer.value && userMenuContainer.value.contains(event.target)) {
    return
  }
  // 如果点击的是按钮本身，也不关闭（因为已经用@click.stop处理了）
  if (userMenuButton.value && userMenuButton.value.contains(event.target)) {
    return
  }
  showUserMenu.value = false
}

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

/**
 * 处理登出
 */
const handleLogout = async () => {
  await logout()
  showUserMenu.value = false
}

/**
 * 跳转到管理后台
 */
const goToAdmin = () => {
  router.push('/admin')
  showUserMenu.value = false
}

/**
 * 点击外部关闭菜单的指令
 * 改进版：使用nextTick延迟检查，避免点击按钮时立即关闭
 */
const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = (event) => {
      // 使用nextTick确保DOM更新完成后再检查
      setTimeout(() => {
        if (!(el === event.target || el.contains(event.target))) {
          // 如果绑定的是函数，直接调用；如果是值，则调用函数
          if (typeof binding.value === 'function') {
            binding.value(event)
          } else {
            binding.value()
          }
        }
      }, 0)
    }
    // 使用捕获阶段，确保在其他事件之前处理
    document.addEventListener('click', el.clickOutsideEvent, true)
  },
  unmounted(el) {
    document.removeEventListener('click', el.clickOutsideEvent, true)
  }
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

/**
 * 格式化位置信息
 * @param {Object} weather - 天气信息对象
 * @returns {string} 格式化后的位置字符串
 */
const formatLocation = (weather) => {
  if (weather.city && weather.country) {
    return `${weather.city}, ${weather.country}`
  } else if (weather.city) {
    return weather.city
  } else if (weather.country) {
    return weather.country
  }
  return ''
}

/**
 * 加载最新文章
 */
const loadLatestArticles = async () => {
  try {
    const articles = await blogApi.getList({
      status: 'published',
      limit: 3, // 只显示3篇最新文章，避免Header过长
      sortBy: 'published_at',
      sortOrder: 'desc'
    })
    latestArticles.value = articles || []
  } catch (error) {
    console.error('Failed to load latest articles:', error)
  }
}

/**
 * 跳转到文章
 */
const goToArticle = (articleId) => {
  router.push(`/blog/${articleId}`)
}

// 初始化
onMounted(() => {
  checkNewArticles()
  loadLatestArticles()
  // 监听新文章创建事件
  window.addEventListener('blog-article-created', handleArticleCreated)
})

onUnmounted(() => {
  window.removeEventListener('blog-article-created', handleArticleCreated)
})
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
