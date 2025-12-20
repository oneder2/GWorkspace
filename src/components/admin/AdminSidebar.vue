<!--
  管理后台侧边栏组件
  提供独立的管理后台导航系统
-->
<template>
  <aside class="glass-card w-64 shrink-0 rounded-2xl p-4">
    <div class="mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
      <h2 class="text-lg font-bold text-slate-800 dark:text-slate-200">{{ $t('admin.title') }}</h2>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">{{ $t('admin.adminOnly') }}</p>
    </div>
    
    <nav class="space-y-1">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group"
        :class="isActive(item.path)
          ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-semibold'
          : 'text-slate-600 dark:text-slate-400 hover:bg-green-50/50 dark:hover:bg-green-900/10 hover:text-green-600 dark:hover:text-green-400'"
      >
        <span v-html="item.icon" class="w-5 h-5 shrink-0"></span>
        <span>{{ item.name }}</span>
      </router-link>
    </nav>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const { t } = useI18n()

/**
 * 图标SVG
 */
const icons = {
  dashboard: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  blog: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>`,
  analytics: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>`,
  comments: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`
}

/**
 * 导航项配置
 */
const navItems = computed(() => [
  {
    path: '/admin',
    name: t('admin.dashboard'),
    icon: icons.dashboard
  },
  {
    path: '/admin/blogs',
    name: t('admin.blogs'),
    icon: icons.blog
  },
  {
    path: '/admin/analytics',
    name: t('admin.analytics'),
    icon: icons.analytics
  },
  {
    path: '/admin/comments',
    name: t('admin.comments'),
    icon: icons.comments
  }
])

/**
 * 检查路由是否激活
 */
const isActive = (path) => {
  if (path === '/admin') {
    return route.path === '/admin'
  }
  return route.path.startsWith(path)
}
</script>

