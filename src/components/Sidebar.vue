<!--
  侧边栏导航组件
  包含Logo、导航菜单、用户信息等
  支持折叠/展开功能
-->
<template>
  <aside 
    class="glass-sidebar rounded-none md:rounded-2xl sm:md:rounded-3xl flex flex-col shrink-0 transition-all duration-300 h-full shadow-lg" 
    :class="collapsed ? 'w-16 sm:w-20' : 'w-full md:w-56 sm:md:w-64'"
  >
    <!-- 头部 Logo - 点击可收起/展开（桌面端）或关闭（移动端） -->
    <div class="py-4 px-4 flex flex-col items-center relative">
      <div 
        @click="$emit('toggle-collapse')" 
        class="flex items-center gap-3 transition-opacity duration-300 cursor-pointer group hover:opacity-80 active:scale-95 transition-all w-full"
        v-if="!collapsed"
        :title="$t('common.collapse')"
      >
        <!-- Logo图标：亮色模式使用黑色，暗色模式使用白色 -->
        <GWorkspaceIcon :size="60" variant="black" class="dark:brightness-0 dark:invert" />
        <span class="font-bold text-xl tracking-tight text-slate-800 dark:text-slate-200 transition-colors group-hover:[color:var(--theme-primary)]">GWorkspace</span>
        <!-- 移动端关闭按钮 -->
        <button
          @click.stop="$emit('nav-click')"
          class="md:hidden ml-auto p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          :title="$t('common.close')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-slate-600 dark:text-slate-400">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div 
        @click="$emit('toggle-collapse')" 
        v-else
        class="cursor-pointer group hover:opacity-80 active:scale-95 transition-all"
        :title="$t('common.expand')"
      >
        <!-- Logo图标（折叠状态）：亮色模式使用黑色，暗色模式使用白色 -->
        <GWorkspaceIcon :size="48" variant="black" class="dark:brightness-0 dark:invert" />
      </div>
    </div>

    <!-- 导航菜单 -->
    <nav class="flex-1 overflow-y-auto px-4 space-y-2 py-4 custom-scrollbar">
      <template v-for="item in navItems" :key="item.id">
        <div 
          @click="handleNavClick(item)"
          data-nav-item
          class="px-4 py-3.5 rounded-xl cursor-pointer flex items-center gap-4 transition-all duration-200 group text-slate-800 dark:text-slate-400 border"
          :class="{
            'nav-active': currentTab === item.id,
            'nav-active-fallback': currentTab === item.id && isThemeTransparent,
            'border-transparent': currentTab !== item.id,
            'border-slate-300 dark:border-slate-600': currentTab === item.id
          }"
          :style="currentTab !== item.id 
            ? {
                '--hover-bg': 'rgba(255, 255, 255, 0.6)',
                '--hover-bg-dark': 'color-mix(in srgb, var(--theme-primary) 15%, transparent)',
                '--hover-text': '#1e293b',
                '--hover-text-dark': 'var(--theme-primary-dark)',
                '--hover-border': 'rgba(0, 0, 0, 0.1)',
                '--hover-border-dark': 'rgba(255, 255, 255, 0.1)'
              }
            : {}"
          @mouseenter="handleNavHoverEnter($event, item.id)"
          @mouseleave="handleNavHoverLeave($event, item.id)"
        >
          <!-- 使用SVG图标替代Phosphor Icons -->
          <component :is="item.icon" class="w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
          <span v-if="!collapsed" :class="currentTab === item.id ? 'font-bold whitespace-nowrap' : 'font-medium whitespace-nowrap'">{{ item.name }}</span>
        </div>
      </template>
    </nav>

    <!-- 底部页面信息区 -->
    <div class="p-5 mt-auto space-y-2" v-if="!collapsed">
      <!-- GitHub入口 -->
      <a 
        href="https://github.com/oneder2/GWorkspace" 
        target="_blank"
        class="bg-white/50 dark:bg-slate-800/50 rounded-xl p-3 flex items-center gap-3 border border-white/60 dark:border-slate-700/60 shadow-sm backdrop-blur-sm transition-colors group"
        style="--hover-bg: color-mix(in srgb, var(--theme-primary-lighter) 50%, transparent); --hover-bg-dark: color-mix(in srgb, var(--theme-primary) 20%, transparent);"
        @mouseenter="const el = $event.currentTarget; if (el) { const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark'); el.style.backgroundColor = isDark ? 'var(--hover-bg-dark)' : 'var(--hover-bg)'; }"
        @mouseleave="const el = $event.currentTarget; if (el) { el.style.backgroundColor = ''; }"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-slate-700 dark:text-slate-300 transition-colors"
             style="--hover-color: var(--theme-primary-darker); --hover-color-dark: var(--theme-primary-dark);"
             @mouseenter="const el = $event.currentTarget; if (el) { const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark'); el.style.color = isDark ? 'var(--hover-color-dark)' : 'var(--hover-color)'; }"
             @mouseleave="const el = $event.currentTarget; if (el) { el.style.color = ''; }">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
        <span class="text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors"
              style="--hover-color: var(--theme-primary-darker); --hover-color-dark: var(--theme-primary-dark);"
              @mouseenter="const el = $event.currentTarget; if (el) { const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark'); el.style.color = isDark ? 'var(--hover-color-dark)' : 'var(--hover-color)'; }"
              @mouseleave="const el = $event.currentTarget; if (el) { el.style.color = ''; }">GitHub</span>
      </a>
      
      <!-- 电子邮件 -->
      <a 
        href="mailto:eclospy@duck.com" 
        class="bg-white/50 dark:bg-slate-800/50 rounded-xl p-3 flex items-center gap-3 border border-white/60 dark:border-slate-700/60 shadow-sm backdrop-blur-sm transition-colors group"
        style="--hover-bg: color-mix(in srgb, var(--theme-primary-lighter) 50%, transparent); --hover-bg-dark: color-mix(in srgb, var(--theme-primary) 20%, transparent);"
        @mouseenter="const el = $event.currentTarget; if (el) { const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark'); el.style.backgroundColor = isDark ? 'var(--hover-bg-dark)' : 'var(--hover-bg)'; }"
        @mouseleave="const el = $event.currentTarget; if (el) { el.style.backgroundColor = ''; }"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-slate-700 dark:text-slate-300 transition-colors"
             style="--hover-color: var(--theme-primary-darker); --hover-color-dark: var(--theme-primary-dark);"
             @mouseenter="const el = $event.currentTarget; if (el) { const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark'); el.style.color = isDark ? 'var(--hover-color-dark)' : 'var(--hover-color)'; }"
             @mouseleave="const el = $event.currentTarget; if (el) { el.style.color = ''; }">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
        <span class="text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors"
              style="--hover-color: var(--theme-primary-darker); --hover-color-dark: var(--theme-primary-dark);"
              @mouseenter="const el = $event.currentTarget; if (el) { const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark'); el.style.color = isDark ? 'var(--hover-color-dark)' : 'var(--hover-color)'; }"
              @mouseleave="const el = $event.currentTarget; if (el) { el.style.color = ''; }">eclospy@duck.com</span>
      </a>
      
      <!-- 所有权声明 -->
      <div class="bg-white/50 dark:bg-slate-800/50 rounded-xl p-3 border border-white/60 dark:border-slate-700/60 shadow-sm backdrop-blur-sm">
        <p class="text-xs text-slate-500 dark:text-slate-400 text-center">
          © 2025 GWorkspace
        </p>
        <p class="text-xs text-slate-400 dark:text-slate-500 text-center mt-1">
          All rights reserved
        </p>
      </div>
    </div>
    <div v-else class="p-4 flex flex-col items-center gap-2 mt-auto">
      <a 
        href="https://github.com" 
        target="_blank"
        class="w-10 h-10 rounded-xl bg-white/50 dark:bg-slate-800/50 flex items-center justify-center border border-white/60 dark:border-slate-700/60 shadow-sm backdrop-blur-sm transition-colors"
        style="--hover-bg: color-mix(in srgb, var(--theme-primary-lighter) 50%, transparent); --hover-bg-dark: color-mix(in srgb, var(--theme-primary) 20%, transparent);"
        @mouseenter="const el = $event.currentTarget; if (el) { const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark'); el.style.backgroundColor = isDark ? 'var(--hover-bg-dark)' : 'var(--hover-bg)'; }"
        @mouseleave="const el = $event.currentTarget; if (el) { el.style.backgroundColor = ''; }"
        title="GitHub"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-slate-700 dark:text-slate-300">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      </a>
    </div>
  </aside>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import HomeIcon from './icons/HomeIcon.vue'
import CompassIcon from './icons/CompassIcon.vue'
import WrenchIcon from './icons/WrenchIcon.vue'
import ArticleIcon from './icons/ArticleIcon.vue'
import BriefcaseIcon from './icons/BriefcaseIcon.vue'
import GWorkspaceIcon from './icons/GWorkspaceIcon.vue'

const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false
  },
  currentTab: {
    type: String,
    default: 'home'
  }
})

const emit = defineEmits(['toggle-collapse', 'nav-click', 'close-mobile-sidebar'])

const { t } = useI18n()
const router = useRouter()

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

// 初始化时检查
onMounted(() => {
  checkThemeTransparent()
  // 监听主题变化（如果有主题切换）
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

/**
 * 导航项配置 - 使用国际化文本和路由
 */
const navItems = computed(() => [
  { id: 'home', name: t('nav.home'), icon: HomeIcon, route: '/' },
  { id: 'sites', name: t('nav.sites'), icon: CompassIcon, route: '/sites' },
  { id: 'tools', name: t('nav.tools'), icon: WrenchIcon, route: '/tools' },
  { id: 'blog', name: t('nav.blog'), icon: ArticleIcon, route: '/blog' },
  { id: 'portfolio', name: t('nav.portfolio'), icon: BriefcaseIcon, route: '/portfolio' },
])

/**
 * 检查是否为暗色模式
 */
const isDarkMode = () => {
  if (typeof document === 'undefined') return false
  return document.documentElement.classList.contains('dark')
}

/**
 * 处理导航hover进入
 */
/**
 * 处理导航hover进入
 */
/**
 * 处理导航hover进入
 */
const handleNavHoverEnter = (event, itemId) => {
  if (props.currentTab === itemId) return // 当前激活项不处理hover
  
  const el = event?.currentTarget
  if (!el) return
  
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  if (isDark) {
    el.style.backgroundColor = 'var(--hover-bg-dark)'
    // 使用明确的颜色，避免主题色为透明时文字变透明
    if (isThemeTransparent.value) {
      el.style.color = '#cbd5e1' // slate-300
    } else {
      // 获取主题色并确保不是透明的
      const themePrimary = getComputedStyle(document.documentElement).getPropertyValue('--theme-primary-dark').trim()
      el.style.color = themePrimary && themePrimary !== 'transparent' ? themePrimary : '#cbd5e1'
    }
    el.style.borderColor = 'var(--hover-border-dark)'
  } else {
    el.style.backgroundColor = 'var(--hover-bg)'
    el.style.color = 'var(--hover-text)'
    el.style.borderColor = 'var(--hover-border)'
  }
}

/**
 * 处理导航hover离开
 */
const handleNavHoverLeave = (event, itemId) => {
  if (props.currentTab === itemId) return // 当前激活项不处理hover
  
  const el = event?.currentTarget
  if (!el) return
  
  el.style.backgroundColor = ''
  el.style.color = ''
  el.style.borderColor = ''
}

/**
 * 处理导航点击
 */
const handleNavClick = (item) => {
  // 清除所有导航项的hover状态
  if (typeof document !== 'undefined') {
    const navElements = document.querySelectorAll('[data-nav-item]')
    navElements.forEach((el) => {
      el.style.backgroundColor = ''
      el.style.color = ''
      el.style.borderColor = ''
    })
  }
  
  router.push(item.route)
  // 如果是移动端抽屉模式，关闭侧边栏
  if (props.isMobileDrawer) {
    emit('close-mobile-sidebar')
  } else {
    emit('nav-click')
  }
}
</script>
