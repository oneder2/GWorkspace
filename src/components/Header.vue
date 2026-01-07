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
              <!-- 管理员时区 -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <div class="text-xs font-semibold text-slate-500 dark:text-slate-400">{{ $t('tools.worldClock.admin') }}</div>
                  <div class="flex items-center gap-2">
                    <div v-if="isAdmin && adminTimeDiff !== null" class="text-xs text-slate-500 dark:text-slate-400">
                      {{ formatTimeDifference(adminTimeDiff) }}
                    </div>
                    <button
                      v-if="isAdmin"
                      @click="relocateAdmin"
                      :disabled="isRelocating"
                      class="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      :title="$t('tools.worldClock.relocate') || 'Relocate'"
                    >
                      <svg 
                        v-if="!isRelocating"
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        stroke-width="2" 
                        stroke-linecap="round" 
                        stroke-linejoin="round" 
                        class="w-3.5 h-3.5 text-slate-500 dark:text-slate-400"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      <svg 
                        v-else
                        class="animate-spin w-3.5 h-3.5 text-slate-500 dark:text-slate-400"
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24"
                      >
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </button>
                  </div>
                </div>
                <div v-if="adminSettings?.timezone" class="text-base font-mono font-bold text-slate-800 dark:text-slate-200">{{ formatTimeByTimezone(adminSettings.timezone) }}</div>
                <div v-else class="text-base font-mono font-bold text-slate-500 dark:text-slate-400">--:--:--</div>
                <div v-if="adminSettings?.timezone" class="text-xs text-slate-500 dark:text-slate-400 font-mono">{{ formatDateByTimezone(adminSettings.timezone) }}</div>
                <div v-else class="text-xs text-slate-500 dark:text-slate-400 font-mono">--</div>
                <!-- 修复：只显示location，不要回退到timezone -->
                <div class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{{ adminSettings?.location || 'Click to locate' }}</div>
              </div>
              
              <!-- 访客位置 -->
              <div v-if="weather && (weather.city || weather.country)">
                <div class="flex items-center justify-between mb-1">
                  <div class="text-xs font-semibold text-slate-500 dark:text-slate-400">{{ $t('tools.worldClock.visitor') }}</div>
                  <div v-if="visitorTimeDiff !== null" class="text-xs text-slate-500 dark:text-slate-400">
                    {{ formatTimeDifference(visitorTimeDiff) }}
                  </div>
                </div>
                <div class="text-base font-mono font-bold text-slate-800 dark:text-slate-200">{{ formatTimeByTimezone(visitorTimezone) }}</div>
                <div class="text-xs text-slate-500 dark:text-slate-400 font-mono">{{ formatDateByTimezone(visitorTimezone) }}</div>
                <!-- 修复：从weather获取位置信息，而不是显示时区字符串 -->
                <div class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{{ formatLocation(weather) }}</div>
              </div>
              
              <!-- 分隔线 -->
              <div v-if="(adminSettings && adminSettings.timezone) || (weather && (weather.city || weather.country))" class="border-t border-slate-200 dark:border-slate-700 my-2"></div>
              
              <!-- 预设时区 -->
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
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
              style="background: linear-gradient(to right, var(--theme-primary), var(--theme-primary-darker));">
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
              <div class="border-t border-slate-200 dark:border-slate-700 my-1"></div>
              <button
                @click.stop="handleLogout"
                class="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
              >
                {{ $t('auth.logout') }}
              </button>
              <button
                @click.stop="handleDeleteAccount"
                class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                {{ $t('auth.deleteAccount') }}
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
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { adminSettingsApi } from '../utils/api'
import { getClientLocationInfo } from '../utils/ipLocation'
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
const { user, isAdmin, logout, deleteAccount } = useAuth()

const showAuthModal = ref(false)
const showUserMenu = ref(false)
const userMenuContainer = ref(null)
const userMenuButton = ref(null)
const showWorldClockDropdown = ref(false)

// 世界时钟相关
const currentTime = ref(new Date())
let clockTimer = null

// 管理员设置
const adminSettings = ref(null)

// 重新定位状态
const isRelocating = ref(false)

// 访客时区（使用浏览器API获取）
const visitorTimezone = ref(Intl.DateTimeFormat().resolvedOptions().timeZone || null)

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
 * 根据时区格式化时间
 * @param {string} timezone - 时区字符串（如 "Asia/Shanghai"）
 * @returns {string} 格式化后的时间字符串（HH:MM:SS）
 */
const formatTimeByTimezone = (timezone) => {
  if (!currentTime.value || !timezone) return '00:00:00'
  try {
    const timeStr = currentTime.value.toLocaleString('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
    return timeStr
  } catch (error) {
    console.warn('Failed to format time for timezone:', timezone, error)
    return '00:00:00'
  }
}

/**
 * 根据时区格式化日期
 * @param {string} timezone - 时区字符串（如 "Asia/Shanghai"）
 * @returns {string} 格式化后的日期字符串（YYYY-MM-DD）
 */
const formatDateByTimezone = (timezone) => {
  if (!currentTime.value || !timezone) return ''
  try {
    const dateStr = currentTime.value.toLocaleString('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
    const [month, day, year] = dateStr.split('/')
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  } catch (error) {
    console.warn('Failed to format date for timezone:', timezone, error)
    return ''
  }
}

/**
 * 计算两个时区之间的时差（小时）
 * @param {string} timezone1 - 第一个时区
 * @param {string} timezone2 - 第二个时区（默认为本地时区）
 * @returns {number|null} 时差（小时），timezone1相对于timezone2，正数表示timezone1在前，负数表示在后
 */
const calculateTimeDifference = (timezone1, timezone2 = null) => {
  if (!timezone1 || !currentTime.value) return null
  
  try {
    const tz2 = timezone2 || Intl.DateTimeFormat().resolvedOptions().timeZone
    if (timezone1 === tz2) return 0
    
    // 使用UTC时间作为基准，比较两个时区的小时数
    const utcTime = currentTime.value
    
    // 获取两个时区在当前UTC时间显示的小时数
    const parts1 = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone1,
      hour: '2-digit',
      hour12: false,
      day: '2-digit'
    }).formatToParts(utcTime)
    
    const parts2 = new Intl.DateTimeFormat('en-US', {
      timeZone: tz2,
      hour: '2-digit',
      hour12: false,
      day: '2-digit'
    }).formatToParts(utcTime)
    
    const hour1 = parseInt(parts1.find(p => p.type === 'hour')?.value || '0')
    const hour2 = parseInt(parts2.find(p => p.type === 'hour')?.value || '0')
    const day1 = parseInt(parts1.find(p => p.type === 'day')?.value || '0')
    const day2 = parseInt(parts2.find(p => p.type === 'day')?.value || '0')
    
    // 计算时差
    let diffHours = hour1 - hour2
    
    // 处理跨日期的情况
    if (day1 !== day2) {
      // 如果day1大于day2，说明timezone1更早（时间更快），需要加24小时
      // 如果day1小于day2，说明timezone1更晚（时间更慢），需要减24小时
      diffHours += (day1 > day2 ? 24 : -24)
    }
    
    // 规范化到-12到+12的范围（处理超过24小时的情况）
    if (diffHours > 12) diffHours -= 24
    if (diffHours < -12) diffHours += 24
    
    return diffHours
  } catch (error) {
    console.warn('Failed to calculate time difference:', error)
    return null
  }
}

/**
 * 格式化时差显示
 * @param {number} diffHours - 时差（小时）
 * @returns {string} 格式化后的时差字符串
 */
const formatTimeDifference = (diffHours) => {
  if (diffHours === null || diffHours === undefined) return ''
  if (diffHours === 0) return t('tools.worldClock.sameTime')
  if (diffHours > 0) {
    return t('tools.worldClock.hoursAhead', { hours: Math.abs(diffHours) })
  } else {
    return t('tools.worldClock.hoursBehind', { hours: Math.abs(diffHours) })
  }
}

// 计算管理员和访客的时差（相对于本地时间）
const adminTimeDiff = computed(() => {
  if (!adminSettings.value || !adminSettings.value.timezone) return null
  return calculateTimeDifference(adminSettings.value.timezone)
})

const visitorTimeDiff = computed(() => {
  if (!visitorTimezone.value) return null
  return calculateTimeDifference(visitorTimezone.value)
})

/**
 * 加载管理员设置
 */
const loadAdminSettings = async () => {
  try {
    adminSettings.value = await adminSettingsApi.get()
  } catch (error) {
    // 如果获取失败（可能不是管理员或未登录），静默忽略
    console.debug('Failed to load admin settings:', error)
    adminSettings.value = null
  }
}

/**
 * 重新定位管理员位置
 * 前端获取真实公网IP并发送给后端更新
 */
const relocateAdmin = async () => {
  if (isRelocating.value) return
  
  try {
    isRelocating.value = true
    
    // 前端获取真实公网IP和位置信息
    const locationInfo = await getClientLocationInfo()
    
    if (locationInfo && locationInfo.ip && locationInfo.location && locationInfo.timezone) {
      // DEBUG: 输出获取到的位置信息
      console.debug('[DEBUG] relocateAdmin - Client location info:', {
        ip: locationInfo.ip,
        location: locationInfo.location,
        timezone: locationInfo.timezone
      })
      
      // 发送给后端更新
      const updatedSettings = await adminSettingsApi.update({
        ip_address: locationInfo.ip,
        location: locationInfo.location,
        timezone: locationInfo.timezone
      })
      
      // 更新本地状态
      adminSettings.value = updatedSettings
      
      console.log('Admin location updated successfully:', updatedSettings.location)
    } else {
      throw new Error('Failed to get location information. Please try again later.')
    }
  } catch (error) {
    console.error('Failed to relocate admin:', error)
    alert(error.message || 'Failed to relocate. Please try again later.')
  } finally {
    isRelocating.value = false
  }
}

/**
 * 访问时更新管理员位置信息
 * 检查是否需要更新（位置为空或是默认值），如果需要则自动更新
 */
async function updateAdminLocationOnVisit() {
  try {
    // 获取客户端真实IP和位置信息
    const locationInfo = await getClientLocationInfo()
    
    if (locationInfo && locationInfo.ip && locationInfo.location && locationInfo.timezone) {
      // DEBUG: 输出获取到的位置信息
      console.debug('[DEBUG] updateAdminLocationOnVisit - Client location info:', {
        ip: locationInfo.ip,
        location: locationInfo.location,
        timezone: locationInfo.timezone
      })
      
      // 发送给后端更新
      await adminSettingsApi.update({
        ip_address: locationInfo.ip,
        location: locationInfo.location,
        timezone: locationInfo.timezone
      })
      
      // 重新加载设置
      await loadAdminSettings()
      console.log('[DEBUG] Admin location updated on visit:', locationInfo.location)
    } else {
      console.warn('[DEBUG] Failed to get location info on visit:', locationInfo)
    }
  } catch (error) {
    console.error('Failed to update admin location on visit:', error)
  }
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
 * 处理删除账户（注销）
 */
const handleDeleteAccount = async () => {
  if (!confirm(t('auth.confirmDeleteAccount'))) {
    return
  }

  // 如果是管理员账户，需要额外确认
  const isAdminAccount = isAdmin.value
  const forceDelete = isAdminAccount
  
  if (isAdminAccount) {
    if (!confirm(t('auth.confirmDeleteAdminAccount'))) {
      return
    }
    // 管理员删除需要最终确认
    if (!confirm(t('auth.confirmDeleteAccountFinal'))) {
      return
    }
  } else {
    // 普通用户再次确认（删除账户是危险操作）
    if (!confirm(t('auth.confirmDeleteAccountFinal'))) {
      return
    }
  }

  const result = await deleteAccount(forceDelete)
  
  if (result.success) {
    showUserMenu.value = false
    // 可以显示成功消息或重定向
    alert(t('auth.accountDeleted'))
  } else {
    alert(result.error || t('auth.deleteAccountFailed'))
  }
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

  // 加载管理员设置
  loadAdminSettings()
})

// 监听管理员登录状态，登录后重新加载设置并检查是否需要更新位置
watch([isAdmin, user], async ([newIsAdmin, newUser]) => {
  // 加载管理员设置
  await loadAdminSettings()
  
  // 如果是管理员，检查是否需要更新位置信息
  if (newIsAdmin && newUser) {
    const settings = adminSettings.value
    // 定义默认位置值（可能是错误的默认值）
    const DEFAULT_LOCATIONS = ['Beijing, China', 'Beijing', 'China']
    const isDefaultLocation = settings?.location && 
      DEFAULT_LOCATIONS.some(defaultLoc => settings.location.includes(defaultLoc))
    
    // 如果位置为空或是默认值，自动更新
    if (!settings?.location || !settings?.timezone || isDefaultLocation) {
      // 异步更新位置信息，不阻塞UI
      updateAdminLocationOnVisit().catch(error => {
        console.debug('Failed to update admin location on visit:', error)
      })
    }
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
