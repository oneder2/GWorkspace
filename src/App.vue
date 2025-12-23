<!--
  主应用组件
  包含整体布局、导航栏、主题切换、语言切换等功能
-->
<template>
  <div class="overflow-hidden h-screen w-screen text-slate-800 dark:text-slate-200">
    <!-- 全局背景图 -->
    <div 
      class="fixed inset-0 z-0 bg-cover bg-center transition-all duration-1000 transform scale-105" 
      :style="{ backgroundImage: `url('/backgrounds/default.jpg')` }"
    >
      <!-- 背景遮罩层 - 优化文本可读性和对比度 -->
      <!-- 亮色模式：使用浅色渐变提供基础对比度，确保深色文字清晰可读 -->
      <div class="absolute inset-0 bg-gradient-to-br from-white/45 via-white/35 to-white/55 transition-opacity duration-500 dark:opacity-0"></div>
      <!-- 暗色模式：使用深色渐变提供基础对比度，确保浅色文字清晰可读 -->
      <div class="absolute inset-0 bg-gradient-to-br from-slate-900/75 via-slate-800/80 to-slate-900/85 transition-opacity duration-500 opacity-0 dark:opacity-100"></div>
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
    <div v-else class="relative z-10 flex h-full w-full p-2 sm:p-4 gap-2 sm:gap-4 box-border">
      <!-- 左侧导航栏 - 移动端隐藏，平板和桌面显示 -->
      <Sidebar 
        :collapsed="sidebarCollapsed"
        @toggle-collapse="sidebarCollapsed = !sidebarCollapsed"
        :current-tab="currentTab"
        class="hidden md:flex"
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
          class="fixed inset-0 bg-black/50 dark:bg-black/70 z-40 md:hidden"
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
          class="fixed left-0 top-0 bottom-0 w-64 z-50 md:hidden shadow-2xl"
        >
          <Sidebar 
            :collapsed="false"
            @toggle-collapse="showMobileMenu = false"
            :current-tab="currentTab"
            @nav-click="showMobileMenu = false"
            class="h-full"
          />
        </div>
      </transition>

      <!-- 中间主内容区 -->
      <main class="flex-1 glass-main rounded-3xl flex flex-col min-w-0 relative overflow-hidden shadow-2xl">
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
        <div class="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 scroll-smooth relative custom-scrollbar" id="main-scroll">
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
import { useSEO } from './composables/useSEO'
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
const showMobileMenu = ref(false) // 移动端菜单显示状态
const weatherInfo = ref(null)
const showThemeCustomizer = ref(false)

// 初始化自定义主题
useCustomTheme()

// 初始化 SEO（默认配置）
useSEO({
  title: 'GWorkspace - Personal Workspace',
  description: 'Personal workspace website with Vue.js, featuring blog, tools, and portfolio management.',
  keywords: 'workspace, blog, tools, portfolio, vue.js',
  type: 'website'
})

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
 * 切换语言
 * 在中文和英文之间切换
 */
const toggleLanguage = () => {
  locale.value = locale.value === 'zh' ? 'en' : 'zh'
  localStorage.setItem('locale', locale.value)
  // 更新 HTML lang 属性，以便浏览器自动填充等功能识别当前语言
  document.documentElement.lang = locale.value === 'zh' ? 'zh-CN' : 'en'
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
  loadWeather()
  // 初始化 HTML lang 属性，根据当前 locale 设置
  document.documentElement.lang = locale.value === 'zh' ? 'zh-CN' : 'en'
})

// 监听 locale 变化，动态更新 HTML lang 属性
watch(locale, (newLocale) => {
  document.documentElement.lang = newLocale === 'zh' ? 'zh-CN' : 'en'
})

onUnmounted(() => {
  // 清理工作
})
</script>
