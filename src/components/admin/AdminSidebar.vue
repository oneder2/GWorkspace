<!--
  管理后台侧边栏组件
  提供独立的管理后台导航系统
  完全套用 Sidebar.vue 的视觉样式和状态逻辑，确保全站一致
-->
<template>
  <aside 
    class="glass-sidebar rounded-none md:rounded-2xl sm:md:rounded-3xl flex flex-col shrink-0 transition-all duration-300 h-full shadow-lg" 
    :class="collapsed ? 'w-16 lg:w-20' : 'w-full lg:w-64'"
  >
    <!-- 头部 Logo - 管理后台标识 -->
    <div class="py-4 px-4 flex flex-col items-center relative">
      <div 
        @click="$emit('toggle-collapse')" 
        class="flex items-center gap-3 transition-opacity duration-300 cursor-pointer group hover:opacity-80 active:scale-95 transition-all w-full"
        v-if="!collapsed"
        :title="$t('common.collapse')"
      >
        <div class="p-2 bg-border-base/50 rounded-lg shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 text-main">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
        </div>
        <span class="font-bold text-xl tracking-tight text-main transition-colors group-hover:[color:var(--theme-primary)]">{{ $t('admin.title') }}</span>
      </div>
      <div 
        @click="$emit('toggle-collapse')" 
        v-else
        class="cursor-pointer group hover:opacity-80 active:scale-95 transition-all"
        :title="$t('common.expand')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 text-main">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
      </div>
    </div>

    <!-- 导航菜单 - 同步 Sidebar.vue 的逻辑，解决 sticky hover -->
    <nav class="flex-1 overflow-y-auto px-4 space-y-2 py-4 custom-scrollbar">
      <template v-for="item in navItems" :key="item.path">
        <div 
          @click="handleNavClick(item)"
          data-nav-item
          class="px-4 py-3.5 rounded-xl cursor-pointer flex items-center gap-4 transition-all duration-200 group border"
          :class="[
            isActive(item.path) ? 'nav-active border-border-base text-main' : 'border-transparent text-secondary',
            isActive(item.path) && isThemeTransparent ? 'nav-active-fallback' : ''
          ]"
          :style="getNavItemStyle(item.path)"
          @mouseenter="hoveredId = item.path"
          @mouseleave="hoveredId = null"
        >
          <span v-html="item.icon" class="w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110"></span>
          <span v-if="!collapsed" :class="isActive(item.path) ? 'font-bold whitespace-nowrap' : 'font-medium whitespace-nowrap'">{{ item.name }}</span>
        </div>
      </template>
    </nav>
  </aside>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false
  }
})

defineEmits(['toggle-collapse'])

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const isThemeTransparent = ref(false)
const hoveredId = ref(null)

const checkThemeTransparent = () => {
  if (typeof document !== 'undefined') {
    const themePrimary = getComputedStyle(document.documentElement).getPropertyValue('--theme-primary').trim()
    isThemeTransparent.value = themePrimary === 'transparent'
  }
}

onMounted(() => {
  checkThemeTransparent()
  const observer = new MutationObserver(() => {
    checkThemeTransparent()
  })
  if (typeof document !== 'undefined') {
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style', 'class']
    })
  }
})

const icons = {
  dashboard: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  blog: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>`,
  analytics: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>`,
  comments: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  guestbook: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h6"/><path d="M8 11h8"/><path d="M8 15h4"/></svg>`
}

const navItems = computed(() => [
  { path: '/admin', name: t('admin.dashboard'), icon: icons.dashboard },
  { path: '/admin/blogs', name: t('admin.blogs'), icon: icons.blog },
  { path: '/admin/analytics', name: t('admin.analytics'), icon: icons.analytics },
  { path: '/admin/comments', name: t('admin.comments'), icon: icons.comments },
  { path: '/admin/guestbook', name: t('admin.guestbook'), icon: icons.guestbook }
])

const isActive = (path) => {
  if (path === '/admin') return route.path === '/admin'
  return route.path.startsWith(path)
}

/**
 * 动态计算导航项样式，取代 JS 直接操作 DOM，解决 sticky hover 问题
 */
const getNavItemStyle = (path) => {
  if (isActive(path)) return {}
  
  if (hoveredId.value === path) {
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
    if (isDark) {
      return {
        backgroundColor: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)',
        color: isThemeTransparent.value ? '#f1f5f9' : 'var(--text-main)',
        borderColor: 'var(--border-base)'
      }
    } else {
      return {
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        color: 'var(--text-main)',
        borderColor: 'var(--border-base)'
      }
    }
  }
  
  return {}
}

const handleNavClick = (item) => {
  hoveredId.value = null // 点击即刻清除所有 hover 状态
  router.push(item.path)
}
</script>
