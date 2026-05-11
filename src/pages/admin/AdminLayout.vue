<!--
  管理后台布局组件
  提供管理后台的侧边栏导航和主内容区域
-->
<template>
  <div class="animate-fade-in min-h-full flex flex-col p-4 sm:p-6 lg:p-8 gap-6">
    <header class="admin-panel rounded-[28px] p-5 sm:p-6 shrink-0">
      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div class="space-y-3">
          <span class="section-kicker">{{ $t('admin.eyebrow') }}</span>
          <div class="flex items-center gap-4 flex-wrap">
            <h1 class="text-3xl font-extrabold text-main tracking-tight">{{ $t('admin.title') }}</h1>
            <span class="px-2.5 py-0.5 bg-red-500/10 text-red-500 text-[10px] uppercase font-bold rounded-full border border-red-500/20">
          {{ $t('admin.adminOnly') }}
            </span>
          </div>
          <p class="section-copy text-sm sm:text-base">{{ $t('admin.workspaceCopy') }}</p>
        </div>
        <div class="flex items-center gap-3 w-full sm:w-auto">
          <button
            @click="$router.push('/blog')"
            class="action-btn action-btn-secondary flex-1 sm:flex-none text-sm"
          >
            {{ $t('admin.backToBlog') }}
          </button>
          <button
            @click="handleLogout"
            class="action-btn flex-1 sm:flex-none text-sm bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20"
          >
            {{ $t('auth.logout') }}
          </button>
        </div>
      </div>
    </header>

    <main class="flex-1 min-w-0">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../../composables/useAuth'

const router = useRouter()
const { t } = useI18n()
const { logout, isAdmin, user } = useAuth()

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

</script>
