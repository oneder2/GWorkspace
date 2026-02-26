<!--
  管理后台布局组件
  提供管理后台的侧边栏导航和主内容区域
-->
<template>
  <div class="animate-fade-in min-h-full flex flex-col p-4 sm:p-6 lg:p-8">
    <!-- 管理后台头部 - 简洁化 -->
    <header class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 shrink-0">
      <div class="flex items-center gap-4">
        <h1 class="text-2xl font-extrabold text-main tracking-tight">{{ $t('admin.title') }}</h1>
        <span class="px-2.5 py-0.5 bg-red-500/10 text-red-500 text-[10px] uppercase font-bold rounded-full border border-red-500/20">
          {{ $t('admin.adminOnly') }}
        </span>
      </div>
      <div class="flex items-center gap-3 w-full sm:w-auto">
        <button
          @click="$router.push('/blog')"
          class="flex-1 sm:flex-none px-4 py-2 text-sm font-bold text-secondary hover:text-main transition-colors"
        >
          {{ $t('admin.backToBlog') }}
        </button>
        <button
          @click="handleLogout"
          class="flex-1 sm:flex-none px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all font-bold text-sm shadow-lg shadow-red-500/20 active:scale-95"
        >
          {{ $t('auth.logout') }}
        </button>
      </div>
    </header>

    <!-- 内容区域 -->
    <main class="flex-1 min-w-0">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../../composables/useAuth'
import AdminSidebar from '../../components/admin/AdminSidebar.vue'

const router = useRouter()
const { t } = useI18n()
const { logout, isAdmin, user } = useAuth()

// 侧边栏折叠状态
const sidebarCollapsed = ref(false)

// 检查是否是管理员 - 增加容错，等待用户信息加载
watch([isAdmin, user], ([newIsAdmin, newUser], [oldIsAdmin, oldUser]) => {
  // 只有当用户信息已加载完成且不是管理员时才跳转
  if (newUser !== null && !newIsAdmin) {
    router.push('/blog')
  }
}, { immediate: true })

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

