<!--
  管理后台侧边栏组件
  提供独立的管理后台导航系统
-->
<template>
  <aside 
    class="glass-card shrink-0 rounded-xl sm:rounded-2xl p-3 sm:p-4 transition-all duration-300"
    :class="collapsed ? 'w-16 lg:w-20' : 'w-full lg:w-64'"
  >
    <!-- 头部 - 可折叠 -->
    <div class="mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-slate-200 dark:border-slate-700">
      <div v-if="!collapsed" class="flex items-center justify-between">
        <div>
          <h2 class="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200">{{ $t('admin.title') }}</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 hidden sm:block">{{ $t('admin.adminOnly') }}</p>
        </div>
        <button
          @click="$emit('toggle-collapse')"
          class="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          :title="$t('common.collapse')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-slate-600 dark:text-slate-400">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
      <button
        v-else
        @click="$emit('toggle-collapse')"
        class="w-full flex items-center justify-center p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        :title="$t('common.expand')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-slate-600 dark:text-slate-400">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
    </div>
    
    <nav class="space-y-1">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-200 group border border-transparent"
        :class="isActive(item.path)
          ? 'font-semibold' 
          : 'text-slate-600 dark:text-slate-400'"
        :style="isActive(item.path)
          ? {
              backgroundColor: 'color-mix(in srgb, var(--theme-primary-lighter) 50%, transparent)',
              color: 'var(--theme-primary-darker)',
              '--dark-bg': 'color-mix(in srgb, var(--theme-primary) 20%, transparent)',
              '--dark-color': 'var(--theme-primary-dark)'
            }
          : {
              '--hover-bg': 'color-mix(in srgb, var(--theme-primary-lighter) 50%, transparent)',
              '--hover-bg-dark': 'color-mix(in srgb, var(--theme-primary) 10%, transparent)',
              '--hover-text': 'var(--theme-primary-darker)',
              '--hover-text-dark': 'var(--theme-primary-dark)'
            }"
        @mouseenter="if (!isActive(item.path)) {
          const el = $event?.currentTarget;
          if (el) {
            const isDark = document.documentElement.classList.contains('dark');
            if (isDark) {
              el.style.backgroundColor = 'var(--hover-bg-dark)';
              el.style.color = 'var(--hover-text-dark)';
              el.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            } else {
              el.style.backgroundColor = 'var(--hover-bg)';
              el.style.color = 'var(--hover-text)';
              el.style.borderColor = 'rgba(0, 0, 0, 0.15)';
            }
          }
        }"
        @mouseleave="if (!isActive(item.path)) {
          const el = $event?.currentTarget;
          if (el) {
            el.style.backgroundColor = '';
            el.style.color = '';
            el.style.borderColor = '';
          }
        }"
        :title="collapsed ? item.name : ''"
      >
        <span v-html="item.icon" class="w-4 sm:w-5 h-4 sm:h-5 shrink-0"></span>
        <span v-if="!collapsed" class="text-sm sm:text-base">{{ item.name }}</span>
      </router-link>
    </nav>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false
  }
})

defineEmits(['toggle-collapse'])

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

