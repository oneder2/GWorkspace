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
          ? getActiveStyle(item.path)
          : {
              '--hover-bg': 'color-mix(in srgb, var(--theme-primary-lighter) 50%, transparent)',
              '--hover-bg-dark': 'color-mix(in srgb, var(--theme-primary) 10%, transparent)',
              '--hover-text': 'var(--theme-primary-darker)',
              '--hover-text-dark': 'var(--theme-primary-dark)'
            }"
        @mouseenter="(event) => handleNavHoverEnter(event, item.path)"
        @mouseleave="(event) => handleNavHoverLeave(event, item.path)"
        :title="collapsed ? item.name : ''"
      >
        <span v-html="item.icon" class="w-4 sm:w-5 h-4 sm:h-5 shrink-0"></span>
        <span v-if="!collapsed" class="text-sm sm:text-base">{{ item.name }}</span>
      </router-link>
    </nav>
  </aside>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
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
 * 检查主题色是否为透明
 */
const isThemeTransparent = ref(false)

/**
 * 检查主题色状态
 */
const checkThemeTransparent = () => {
  if (typeof document !== 'undefined') {
    const themePrimary = getComputedStyle(document.documentElement).getPropertyValue('--theme-primary').trim()
    isThemeTransparent.value = themePrimary === 'transparent'
  }
}

/**
 * 检查是否为暗色模式
 */
const isDarkMode = ref(false)

/**
 * 更新暗色模式状态
 */
const updateDarkMode = () => {
  if (typeof document !== 'undefined') {
    isDarkMode.value = document.documentElement.classList.contains('dark')
  }
}

// 初始化时检查
onMounted(() => {
  checkThemeTransparent()
  updateDarkMode()
  // 监听主题变化
  const observer = new MutationObserver(() => {
    checkThemeTransparent()
    updateDarkMode()
  })
  if (typeof document !== 'undefined') {
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style', 'class']
    })
  }
})

/**
 * 图标SVG
 */
const icons = {
  dashboard: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  blog: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>`,
  analytics: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>`,
  comments: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  guestbook: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h6"/><path d="M8 11h8"/><path d="M8 15h4"/></svg>`
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
  },
  {
    path: '/admin/guestbook',
    name: t('admin.guestbook'),
    icon: icons.guestbook
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

/**
 * 获取激活状态的样式
 */
const getActiveStyle = (itemPath) => {
  if (!isActive(itemPath)) return {}
  
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  
  if (isThemeTransparent.value) {
    return {
      backgroundColor: isDark ? 'rgba(148, 163, 184, 0.3)' : 'rgba(100, 116, 139, 0.2)',
      color: isDark ? '#cbd5e1' : '#475569',
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.15)'
    }
  }
  
  // 获取主题色并确保不是透明的
  let themeColorDarker = ''
  let themeColorDark = ''
  if (typeof document !== 'undefined') {
    themeColorDarker = getComputedStyle(document.documentElement).getPropertyValue('--theme-primary-darker').trim()
    themeColorDark = getComputedStyle(document.documentElement).getPropertyValue('--theme-primary-dark').trim()
  }
  
  const finalColor = isDark 
    ? (themeColorDark && themeColorDark !== 'transparent' ? themeColorDark : '#cbd5e1')
    : (themeColorDarker && themeColorDarker !== 'transparent' ? themeColorDarker : '#475569')
  
  const bgColor = isDark 
    ? 'color-mix(in srgb, var(--theme-primary) 20%, transparent)'
    : 'color-mix(in srgb, var(--theme-primary-lighter) 50%, transparent)'
  
  return {
    backgroundColor: bgColor,
    color: finalColor,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.15)'
  }
}

/**
 * 处理导航hover进入
 * @param {Event} event - 鼠标事件
 * @param {string} itemPath - 导航项路径
 */
const handleNavHoverEnter = (event, itemPath) => {
  if (isActive(itemPath)) return
  
  const el = event?.currentTarget
  if (!el || typeof document === 'undefined') return
  
  updateDarkMode() // 更新暗色模式状态
  
  // 如果主题是透明的，使用固定颜色避免文字变透明
  if (isThemeTransparent.value) {
    if (isDarkMode.value) {
      el.style.backgroundColor = 'rgba(148, 163, 184, 0.2)'
      el.style.color = '#cbd5e1' // 固定颜色，确保文字可见
      el.style.borderColor = 'rgba(255, 255, 255, 0.1)'
    } else {
      el.style.backgroundColor = 'rgba(100, 116, 139, 0.15)'
      el.style.color = '#475569' // 固定颜色，确保文字可见
      el.style.borderColor = 'rgba(0, 0, 0, 0.15)'
    }
  } else {
    // 使用主题色，但需要检查颜色是否透明
    if (isDarkMode.value) {
      const hoverTextDark = getComputedStyle(document.documentElement).getPropertyValue('--hover-text-dark').trim()
      const finalColor = hoverTextDark && hoverTextDark !== 'transparent' ? hoverTextDark : '#cbd5e1'
      el.style.backgroundColor = 'var(--hover-bg-dark)'
      el.style.color = finalColor
      el.style.borderColor = 'rgba(255, 255, 255, 0.1)'
    } else {
      const hoverText = getComputedStyle(document.documentElement).getPropertyValue('--hover-text').trim()
      const finalColor = hoverText && hoverText !== 'transparent' ? hoverText : '#475569'
      el.style.backgroundColor = 'var(--hover-bg)'
      el.style.color = finalColor
      el.style.borderColor = 'rgba(0, 0, 0, 0.15)'
    }
  }
}

/**
 * 处理导航hover离开
 * @param {Event} event - 鼠标事件
 * @param {string} itemPath - 导航项路径
 */
const handleNavHoverLeave = (event, itemPath) => {
  if (isActive(itemPath)) return
  
  const el = event?.currentTarget
  if (el) {
    el.style.backgroundColor = ''
    el.style.color = ''
    el.style.borderColor = ''
  }
}
</script>

