<!--
  主应用组件
  包含整体布局、导航栏、主题切换、语言切换等功能
-->
<template>
  <div class="overflow-hidden min-h-screen h-[100dvh] w-screen text-slate-800 dark:text-slate-200">
    <!-- 全局背景图 -->
    <div class="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div
        class="absolute inset-0 bg-cover bg-center transition-all duration-1000 transform scale-105"
        :style="backgroundImageStyle"
      ></div>
    </div>

    <!-- 管理后台路由：使用与普通路由类似的布局，但侧边栏和内容组件不同 -->
    <div v-if="isAdminRoute" class="relative z-10 flex h-full w-full p-1.5 sm:p-3 xl:p-4 gap-2.5 sm:gap-3 box-border">
      <!-- 后台侧边栏 -->
      <AdminSidebar 
        :collapsed="sidebarCollapsed"
        @toggle-collapse="sidebarCollapsed = !sidebarCollapsed"
        class="hidden xl:flex"
      />

      <main class="flex-1 admin-shell rounded-[24px] sm:rounded-[28px] xl:rounded-[32px] flex flex-col min-w-0 relative overflow-hidden">
        <div class="flex-1 overflow-y-auto scroll-smooth relative custom-scrollbar">
          <router-view />
        </div>
      </main>
    </div>

    <!-- 普通路由：使用标准布局（侧边栏 + 顶部栏） -->
    <div v-else class="relative z-10 flex h-full w-full p-1.5 sm:p-3 xl:p-4 gap-2.5 sm:gap-3 box-border">
      <!-- 左侧导航栏 - 移动端隐藏，平板和桌面显示 -->
      <Sidebar 
        :collapsed="sidebarCollapsed"
        @toggle-collapse="sidebarCollapsed = !sidebarCollapsed"
        :current-tab="currentTab"
        @open-update-log="showUpdateLogModal = true"
        class="hidden xl:flex"
      />

      <!-- 移动端抽屉式导航遮罩层 -->
      <transition
        enter-active-class="transition-opacity duration-300"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-300"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showMobileMenu"
          @click="showMobileMenu = false"
          class="fixed inset-0 bg-black/50 dark:bg-black/70 z-40 xl:hidden"
        ></div>
      </transition>

      <!-- 移动端抽屉式导航 -->
      <transition
        enter-active-class="transition-transform duration-300 ease-out"
        enter-from-class="-translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transition-transform duration-300 ease-in"
        leave-from-class="translate-x-0"
        leave-to-class="-translate-x-full"
      >
        <div
          v-if="showMobileMenu"
          class="fixed left-0 top-0 bottom-0 w-[min(20rem,86vw)] z-50 xl:hidden shadow-2xl"
        >
          <Sidebar 
            :collapsed="false"
            @toggle-collapse="showMobileMenu = false"
            :current-tab="currentTab"
            @nav-click="showMobileMenu = false"
            @open-update-log="showUpdateLogModal = true; showMobileMenu = false"
            class="h-full"
          />
        </div>
      </transition>

      <!-- 中间主内容区 -->
      <main class="flex-1 surface-shell rounded-[24px] sm:rounded-[28px] xl:rounded-[32px] flex flex-col min-w-0 relative overflow-hidden">
        <!-- 顶部状态栏 -->
        <Header 
          :current-tab="currentTab"
          :weather="weatherInfo"
          :is-dark="isDark"
          :show-mobile-menu="showMobileMenu"
          @toggle-mobile-menu="showMobileMenu = !showMobileMenu"
          @toggle-theme="toggleTheme"
          @toggle-lang="toggleLanguage"
          @open-theme-customizer="showThemeCustomizer = true"
        />

        <!-- 内容滚动视口 - 响应式内边距 -->
        <div
          :class="mainScrollClass"
          id="main-scroll"
        >
          <!-- 使用 router-view 渲染路由组件 -->
          <router-view />
        </div>
      </main>

      <TerminalAgent />
    </div>

    <!-- 主题自定义弹窗 -->
    <ThemeCustomizer 
      v-if="showThemeCustomizer"
      @close="showThemeCustomizer = false"
    />

    <UpdateLogModal
      v-if="showUpdateLogModal"
      @close="showUpdateLogModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTheme } from './composables/useTheme'
import { useKeyboard } from './composables/useKeyboard'
import { useCustomTheme } from './composables/useCustomTheme'
import { useSEO } from './composables/useSEO'
import { getWeatherInfo } from './utils/weather'
import {
  defaultBackgroundSceneId,
  resolveBackgroundPhase
} from './config/backgroundScenes'
import Sidebar from './components/Sidebar.vue'
import Header from './components/Header.vue'
import AdminSidebar from './components/admin/AdminSidebar.vue'
import TerminalAgent from './components/terminal-agent/TerminalAgent.vue'
import ThemeCustomizer from './components/ThemeCustomizer.vue'
import UpdateLogModal from './components/UpdateLogModal.vue'

// 路由
const route = useRoute()

// 国际化
// 主题管理
const { isDark, toggleTheme } = useTheme()

// 状态管理
const sidebarCollapsed = ref(false)
const showMobileMenu = ref(false) // 移动端菜单显示状态
const weatherInfo = ref(null)
const showThemeCustomizer = ref(false)
const showUpdateLogModal = ref(false)
const backgroundHour = ref(new Date().getHours())
let backgroundPhaseTimer = null

// 初始化自定义主题
useCustomTheme()

// 初始化 SEO（默认配置）
useSEO({ type: 'website' })

const activeBackground = computed(() =>
  resolveBackgroundPhase(defaultBackgroundSceneId, backgroundHour.value)
)

const backgroundImageStyle = computed(() => ({
  backgroundImage: `url('${activeBackground.value.src}')`,
  filter: `brightness(${activeBackground.value.brightness})`
}))

/**
 * 检查是否为管理后台路由
 */
const isAdminRoute = computed(() => {
  return route.path.startsWith('/admin')
})

const isBlogIndexRoute = computed(() => route.name === 'blog')
const isHomeRoute = computed(() => route.name === 'home')
const isWorkspaceRoute = computed(() => route.name === 'workspace')

/**
 * 根据当前路由获取当前标签页
 * 映射路由名称到标签页ID
 */
const currentTab = computed(() => {
  const routeToTab = {
    'home': 'home',
    'workspace': 'workspace',
    'blog': 'blog',
    'blog-detail': 'blog',
    'portfolio': 'portfolio'
  }
  return routeToTab[route.name] || 'home'
})

const mainScrollClass = computed(() => [
  'flex-1 scroll-smooth relative flex flex-col min-h-0',
  isHomeRoute.value ? 'overflow-y-auto xl:overflow-hidden' : 'overflow-y-auto',
  isHomeRoute.value || isWorkspaceRoute.value ? '' : 'custom-scrollbar',
  isBlogIndexRoute.value ? '2xl:overflow-hidden' : '',
  isHomeRoute.value ? 'p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6' : 'p-4 sm:p-5 md:p-6 lg:p-8 xl:p-10'
])


/**
 * 切换语言
 * 在中文和英文之间切换
 */
const toggleLanguage = () => {
  const locale = localStorage.getItem('locale') || 'zh'
  const nextLocale = locale === 'zh' ? 'en' : 'zh'
  localStorage.setItem('locale', nextLocale)
  window.location.reload()
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

/**
 * 同步本地小时数，用于驱动同场景的时段化切换
 */
const syncBackgroundHour = () => {
  backgroundHour.value = new Date().getHours()
}

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
  syncBackgroundHour()
  backgroundPhaseTimer = window.setInterval(syncBackgroundHour, 60_000)
  loadWeather()
  const currentLocale = localStorage.getItem('locale') || 'zh'
  document.documentElement.lang = currentLocale === 'zh' ? 'zh-CN' : 'en'
})

onUnmounted(() => {
  if (backgroundPhaseTimer !== null) {
    window.clearInterval(backgroundPhaseTimer)
  }
})
</script>

<style>
/* 全局样式覆盖（如需要） */
</style>
