<!--
  管理后台布局组件
  提供管理后台的侧边栏导航和主内容区域
-->
<template>
  <div class="animate-fade-in min-h-full flex flex-col">
    <!-- 管理后台头部 -->
    <header class="glass-card p-4 mb-6 rounded-2xl flex items-center justify-between shrink-0">
      <div class="flex items-center gap-4">
        <h1 class="text-2xl font-bold text-slate-800 dark:text-slate-200">{{ $t('admin.title') }}</h1>
        <span class="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold rounded-full">
          {{ $t('admin.adminOnly') }}
        </span>
      </div>
      <div class="flex items-center gap-4">
        <button
          @click="$router.push('/blog')"
          class="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
        >
          {{ $t('admin.backToBlog') }}
        </button>
        <button
          @click="handleLogout"
          class="px-4 py-2 bg-red-500 dark:bg-red-600 text-white rounded-lg hover:bg-red-600 dark:hover:bg-red-700 transition-colors text-sm font-semibold"
        >
          {{ $t('auth.logout') }}
        </button>
      </div>
    </header>

    <!-- 主内容区域 -->
    <div class="flex-1 flex gap-6 min-h-0">
      <!-- 侧边栏导航 -->
      <AdminSidebar />

      <!-- 内容区域 -->
      <main class="flex-1 min-w-0">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../../composables/useAuth'
import AdminSidebar from '../../components/admin/AdminSidebar.vue'

const router = useRouter()
const { t } = useI18n()
const { logout, isAdmin } = useAuth()

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
</script>

