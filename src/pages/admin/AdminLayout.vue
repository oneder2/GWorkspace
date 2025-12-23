<!--
  管理后台布局组件
  提供管理后台的侧边栏导航和主内容区域
-->
<template>
  <div class="animate-fade-in min-h-full flex flex-col">
    <!-- 管理后台头部 - 响应式布局 -->
    <header class="glass-card p-3 sm:p-4 mb-4 sm:mb-6 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shrink-0">
      <div class="flex items-center gap-2 sm:gap-4 flex-wrap">
        <h1 class="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200">{{ $t('admin.title') }}</h1>
        <span class="px-2 sm:px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold rounded-full">
          {{ $t('admin.adminOnly') }}
        </span>
      </div>
      <div class="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
        <button
          @click="$router.push('/blog')"
          class="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 transition-colors"
          style="--hover-color: var(--theme-primary-darker); --hover-color-dark: var(--theme-primary-dark);"
          @mouseenter="handleButtonHoverEnter"
          @mouseleave="handleButtonHoverLeave"
        >
          {{ $t('admin.backToBlog') }}
        </button>
        <button
          @click="handleLogout"
          class="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-red-500 dark:bg-red-600 text-white rounded-lg hover:bg-red-600 dark:hover:bg-red-700 transition-colors text-xs sm:text-sm font-semibold"
        >
          {{ $t('auth.logout') }}
        </button>
      </div>
    </header>

    <!-- 主内容区域 - 响应式布局 -->
    <div class="flex-1 flex flex-col lg:flex-row gap-4 sm:gap-6 min-h-0">
      <!-- 侧边栏导航 - 移动端可折叠 -->
      <AdminSidebar :collapsed="sidebarCollapsed" @toggle-collapse="sidebarCollapsed = !sidebarCollapsed" />

      <!-- 内容区域 -->
      <main class="flex-1 min-w-0">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../../composables/useAuth'
import AdminSidebar from '../../components/admin/AdminSidebar.vue'

const router = useRouter()
const { t } = useI18n()
const { logout, isAdmin } = useAuth()

// 侧边栏折叠状态
const sidebarCollapsed = ref(false)

// 检查是否是管理员
if (!isAdmin.value) {
  router.push('/blog')
}

/**
 * 处理登出
 */
const handleLogout = async () => {
  await logout()
  router.push('/blog')
}

/**
 * 处理按钮hover进入
 * @param {Event} event - 鼠标事件
 */
const handleButtonHoverEnter = (event) => {
  const el = event?.currentTarget
  if (el && typeof document !== 'undefined') {
    const isDark = document.documentElement.classList.contains('dark')
    el.style.color = isDark ? 'var(--hover-color-dark)' : 'var(--hover-color)'
  }
}

/**
 * 处理按钮hover离开
 * @param {Event} event - 鼠标事件
 */
const handleButtonHoverLeave = (event) => {
  const el = event?.currentTarget
  if (el) {
    el.style.color = ''
  }
}
</script>

