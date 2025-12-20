<!--
  主应用组件
  包含整体布局、导航栏、主题切换、语言切换等功能
-->
<template>
  <div class="overflow-hidden h-screen w-screen text-slate-800 dark:text-slate-200">
    <!-- 全局背景图 -->
    <div 
      class="fixed inset-0 z-0 bg-cover bg-center transition-all duration-1000 transform scale-105" 
      :style="{ backgroundImage: `url('https://images.unsplash.com/photo-1497250681960-ef046c08a56e?q=80&w=2574&auto=format&fit=crop')` }"
    >
      <!-- 遮罩层，让文字更清晰 - 支持暗色模式 -->
      <div class="absolute inset-0 bg-gradient-to-br from-green-50/30 to-slate-100/40 dark:from-slate-900/60 dark:to-slate-800/70"></div>
    </div>

    <!-- 管理后台路由：使用完全独立的布局 -->
    <div v-if="isAdminRoute" class="relative z-10 flex h-full w-full p-4 gap-4 box-border">
      <main class="flex-1 glass-main rounded-3xl flex flex-col min-w-0 relative overflow-hidden shadow-2xl">
        <div class="flex-1 overflow-y-auto p-6 md:p-10 scroll-smooth relative custom-scrollbar">
          <router-view />
        </div>
      </main>
    </div>

    <!-- 普通路由：使用标准布局（侧边栏 + 顶部栏） -->
    <div v-else class="relative z-10 flex h-full w-full p-4 gap-4 box-border">
      <!-- 左侧导航栏 -->
      <Sidebar 
        :collapsed="sidebarCollapsed"
        @toggle-collapse="sidebarCollapsed = !sidebarCollapsed"
        :current-tab="currentTab"
      />

      <!-- 中间主内容区 -->
      <main class="flex-1 glass-main rounded-3xl flex flex-col min-w-0 relative overflow-hidden shadow-2xl">
        <!-- 顶部状态栏 -->
        <Header 
          :current-tab="currentTab"
          :weather="weatherInfo"
          :current-time="currentTime"
          :is-dark="isDark"
          @toggle-theme="toggleTheme"
          @toggle-lang="toggleLanguage"
          @open-theme-customizer="showThemeCustomizer = true"
        />

        <!-- 内容滚动视口 -->
        <div class="flex-1 overflow-y-auto p-6 md:p-10 scroll-smooth relative custom-scrollbar" id="main-scroll">
          <!-- 使用 router-view 渲染路由组件 -->
          <router-view />
        </div>
      </main>
    </div>

    <!-- 主题自定义弹窗 -->
    <ThemeCustomizer 
      v-if="showThemeCustomizer"
      @close="showThemeCustomizer = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useTheme } from './composables/useTheme'
import { useKeyboard } from './composables/useKeyboard'
import { useCustomTheme } from './composables/useCustomTheme'
import { getWeatherInfo } from './utils/weather'
import Sidebar from './components/Sidebar.vue'
import Header from './components/Header.vue'
import ThemeCustomizer from './components/ThemeCustomizer.vue'

// 路由
const route = useRoute()
const router = useRouter()

// 国际化
const { locale } = useI18n()

// 主题管理
const { isDark, toggleTheme } = useTheme()

// 状态管理
const sidebarCollapsed = ref(false)
const currentTime = ref('')
const weatherInfo = ref(null)
const showThemeCustomizer = ref(false)

// 初始化自定义主题
useCustomTheme()

/**
 * 检查是否为管理后台路由
 */
const isAdminRoute = computed(() => {
  return route.path.startsWith('/admin')
})

/**
 * 根据当前路由获取当前标签页
 * 映射路由名称到标签页ID
 */
const currentTab = computed(() => {
  const routeToTab = {
    'home': 'home',
    'sites': 'sites',
    'tools': 'tools',
    'blog': 'blog',
    'blog-detail': 'blog',
    'portfolio': 'portfolio'
  }
  return routeToTab[route.name] || 'home'
})

/**
 * 更新当前时间
 * 每秒更新一次，格式为 HH:MM
 */
const updateTime = () => {
  const now = new Date()
  currentTime.value = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
}

/**
 * 切换语言
 * 在中文和英文之间切换
 */
const toggleLanguage = () => {
  locale.value = locale.value === 'zh' ? 'en' : 'zh'
  localStorage.setItem('locale', locale.value)
}

/**
 * 加载天气信息
 * 根据IP地址获取当地天气
 */
const loadWeather = async () => {
  try {
    weatherInfo.value = await getWeatherInfo()
  } catch (error) {
    console.error('Failed to load weather:', error)
  }
}

let timer = null

/**
 * 注册全局快捷键
 */
useKeyboard({
  toggleSidebar: () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  },
  toggleTheme: toggleTheme,
  closeModal: () => {
    // 可以在这里添加关闭弹窗的逻辑
  }
})

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
  loadWeather()
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>
