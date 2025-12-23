<!--
  顶部状态栏组件
  包含页面标题、天气信息、时间、主题切换、语言切换等功能
-->
<template>
  <header class="h-14 sm:h-16 px-4 sm:px-6 md:px-8 flex items-center justify-between border-b border-white/30 dark:border-slate-700/30 shrink-0 relative gap-2 sm:gap-4">
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
      <!-- 页面标题：亮色模式使用深色，暗色模式使用浅色，确保在背景上有足够对比度 -->
      <h2 class="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight truncate drop-shadow-sm">{{ currentTabName }}</h2>
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
    
    <div class="flex items-center gap-4">
      <!-- 世界时钟 - 显示本地时间，其他地区时间在下拉栏（放在右侧） -->
      <div class="relative">
        <button
          @click.stop="showWorldClockDropdown = !showWorldClockDropdown"
          class="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors"
          :title="$t('tools.worldClock.local')"
    >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-slate-600 dark:text-slate-300">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span class="text-sm font-mono text-slate-700 dark:text-slate-200">{{ localTime }}</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3 text-slate-500 dark:text-slate-400">
            <polyline points="6 9 12 15 18 9"/>
      </svg>
        </button>
        <!-- 下拉菜单 - 显示其他地区时间 -->
        <transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition ease-in duration-150"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="showWorldClockDropdown"
            v-click-outside="() => showWorldClockDropdown = false"
            class="absolute right-0 top-full mt-2 w-64 glass-card rounded-xl shadow-lg py-2 z-50"
          >
            <div class="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
              <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{{ $t('tools.worldClock.local') }}</div>
              <div class="text-lg font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">{{ formatLocalTimeWithSeconds() }}</div>
              <div class="text-xs text-slate-500 dark:text-slate-400 font-mono">{{ localDate }}</div>
            </div>
            <div class="px-4 py-2 space-y-3">
              <div>
                <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{{ $t('tools.worldClock.china') }}</div>
                <div class="text-base font-mono font-bold text-slate-800 dark:text-slate-200">{{ formatTime('china') }}</div>
                <div class="text-xs text-slate-500 dark:text-slate-400 font-mono">{{ formatDate('china') }}</div>
      </div>
              <div>
                <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{{ $t('tools.worldClock.usEast') }}</div>
                <div class="text-base font-mono font-bold text-slate-800 dark:text-slate-200">{{ formatTime('usEast') }}</div>
                <div class="text-xs text-slate-500 dark:text-slate-400 font-mono">{{ formatDate('usEast') }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{{ $t('tools.worldClock.usWest') }}</div>
                <div class="text-base font-mono font-bold text-slate-800 dark:text-slate-200">{{ formatTime('usWest') }}</div>
                <div class="text-xs text-slate-500 dark:text-slate-400 font-mono">{{ formatDate('usWest') }}</div>
              </div>
            </div>
          </div>
        </transition>
    </div>
    
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
const showWorldClockDropdown = ref(false)


// 世界时钟相关
const currentTime = ref(new Date())
let clockTimer = null

// 时区配置
const timezones = {
  china: 'Asia/Shanghai',
  usEast: 'America/New_York',
  usWest: 'America/Los_Angeles'
}

/**
 * 更新时钟时间
 */
const updateClock = () => {
  currentTime.value = new Date()
}

/**
 * 格式化本地时间（HH:MM）
 */
const localTime = computed(() => {
  if (!currentTime.value) return '00:00'
  const hours = currentTime.value.getHours().toString().padStart(2, '0')
  const minutes = currentTime.value.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
})

/**
 * 格式化本地日期
 */
const localDate = computed(() => {
  if (!currentTime.value) return ''
  const year = currentTime.value.getFullYear()
  const month = (currentTime.value.getMonth() + 1).toString().padStart(2, '0')
  const day = currentTime.value.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
})

/**
 * 格式化时间（HH:MM:SS）
 * @param {string} timezone - 时区标识
 * @returns {string} 格式化后的时间字符串
 */
const formatTime = (timezone) => {
  if (!currentTime.value) return '00:00:00'
  const timeStr = currentTime.value.toLocaleString('en-US', {
    timeZone: timezones[timezone],
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  return timeStr
}

/**
 * 格式化日期（YYYY-MM-DD）
 * @param {string} timezone - 时区标识
 * @returns {string} 格式化后的日期字符串
 */
const formatDate = (timezone) => {
  if (!currentTime.value) return ''
  const dateStr = currentTime.value.toLocaleString('en-US', {
    timeZone: timezones[timezone],
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  const [month, day, year] = dateStr.split('/')
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

/**
 * 格式化本地时间（包含秒数，用于下拉菜单）
 * @returns {string} 格式化后的时间字符串（HH:MM:SS）
 */
const formatLocalTimeWithSeconds = () => {
  if (!currentTime.value) return '00:00:00'
  const hours = currentTime.value.getHours().toString().padStart(2, '0')
  const minutes = currentTime.value.getMinutes().toString().padStart(2, '0')
  const seconds = currentTime.value.getSeconds().toString().padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

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

// 初始化
onMounted(() => {
  updateClock()
  // 每秒更新一次时钟
  clockTimer = setInterval(updateClock, 1000)
  
  // 清理localStorage中的新文章通知数据（如果存在）
  try {
    localStorage.removeItem('blog-new-articles')
  } catch (error) {
    // 忽略错误
  }
})

onUnmounted(() => {
  // 清理定时器
  if (clockTimer) {
    clearInterval(clockTimer)
  }
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
