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

    <div class="relative z-10 flex h-full w-full p-4 gap-4 box-border">
      <!-- 左侧导航栏 -->
      <Sidebar 
        :collapsed="sidebarCollapsed"
        @toggle-collapse="sidebarCollapsed = !sidebarCollapsed"
        :current-tab="currentTab"
        @tab-change="currentTab = $event"
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
        />

        <!-- 内容滚动视口 -->
        <div class="flex-1 overflow-y-auto p-6 md:p-10 scroll-smooth relative custom-scrollbar" id="main-scroll">
          <!-- 主页 -->
          <HomePage v-if="currentTab === 'home'" />
          
          <!-- 常用站点 -->
          <SitesPage v-if="currentTab === 'sites'" />
          
          <!-- 工具箱 -->
          <ToolsPage v-if="currentTab === 'tools'" />
          
          <!-- 博客 -->
          <BlogPage v-if="currentTab === 'blog'" />
          
          <!-- 作品展示 -->
          <PortfolioPage v-if="currentTab === 'portfolio'" />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTheme } from './composables/useTheme'
import { getWeatherInfo } from './utils/weather'
import Sidebar from './components/Sidebar.vue'
import Header from './components/Header.vue'
import HomePage from './pages/HomePage.vue'
import SitesPage from './pages/SitesPage.vue'
import ToolsPage from './pages/ToolsPage.vue'
import BlogPage from './pages/BlogPage.vue'
import PortfolioPage from './pages/PortfolioPage.vue'

// 国际化
const { locale } = useI18n()

// 主题管理
const { isDark, toggleTheme } = useTheme()

// 状态管理
const sidebarCollapsed = ref(false)
const currentTab = ref('home')
const currentTime = ref('')
const weatherInfo = ref(null)

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
