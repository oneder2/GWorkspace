<!--
  快捷链接编辑组件
  支持添加、编辑、删除和拖拽排序快捷链接
-->
<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm" @click.self="$emit('close')">
    <div class="glass-card rounded-3xl p-6 md:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200">{{ $t('home.editQuickLinks') }}</h2>
        <button 
          @click="$emit('close')"
          class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- 链接列表 -->
      <div class="space-y-3 mb-6">
        <div 
          v-for="(link, index) in localLinks" 
          :key="link.id || index"
          class="glass-card p-4 rounded-xl flex items-center gap-4 group"
        >
          <!-- 拖拽手柄 -->
          <div class="cursor-move text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
              <circle cx="9" cy="12" r="1"/>
              <circle cx="9" cy="5" r="1"/>
              <circle cx="9" cy="19" r="1"/>
              <circle cx="15" cy="12" r="1"/>
              <circle cx="15" cy="5" r="1"/>
              <circle cx="15" cy="19" r="1"/>
            </svg>
          </div>

          <!-- 图标预览 - 动态获取favicon -->
          <div 
            class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            <!-- 优先使用动态获取的favicon -->
            <img 
              v-if="link.url"
              :src="getFaviconUrl(link.url, 64)" 
              @error="handleIconError($event, link)"
              class="w-10 h-10 rounded-lg opacity-90 transition-opacity"
              :alt="link.name"
            >
            <!-- 如果favicon加载失败，回退到SVG图标 -->
            <component 
              v-else-if="link.icon" 
              :is="link.icon" 
              class="w-6 h-6 text-slate-700 dark:text-slate-200" 
            />
            <!-- 最后回退到首字母 -->
            <span 
              v-else 
              class="text-slate-700 dark:text-slate-200 text-lg font-bold"
            >
              {{ link.name?.[0] || '?' }}
            </span>
          </div>

          <!-- 链接信息 -->
          <div class="flex-1 min-w-0">
            <label :for="`link-name-${index}`" class="sr-only">{{ $t('home.linkName') }}</label>
            <input 
              :id="`link-name-${index}`"
              :name="`link-name-${index}`"
              v-model="link.name"
              type="text"
              :placeholder="$t('home.linkName')"
              class="w-full bg-transparent border-b border-slate-300 dark:border-slate-600 outline-none text-slate-800 dark:text-slate-200 font-bold mb-2 transition-colors"
              style="--focus-border: var(--theme-primary);"
              @focus="$event.currentTarget.style.borderColor = 'var(--focus-border)'"
              @blur="$event.currentTarget.style.borderColor = ''"
            >
            <label :for="`link-url-${index}`" class="sr-only">{{ $t('home.linkUrl') }}</label>
            <input 
              :id="`link-url-${index}`"
              :name="`link-url-${index}`"
              v-model="link.url"
              type="url"
              :placeholder="$t('home.linkUrl')"
              class="w-full bg-transparent border-b border-slate-300 dark:border-slate-600 outline-none text-slate-600 dark:text-slate-400 text-sm transition-colors"
              style="--focus-border: var(--theme-primary);"
              @focus="$event.currentTarget.style.borderColor = 'var(--focus-border)'"
              @blur="$event.currentTarget.style.borderColor = ''"
            >
          </div>

          <!-- 删除按钮 -->
          <button 
            @click="removeLink(index)"
            class="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 添加新链接按钮 -->
      <button 
        @click="addLink"
        class="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-400 transition-colors flex items-center justify-center gap-2"
        style="--hover-border: var(--theme-primary); --hover-text: var(--theme-primary-darker); --hover-text-dark: var(--theme-primary-light);"
        @mouseenter="const el = $event.currentTarget; const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark'); el.style.borderColor = 'var(--hover-border)'; el.style.color = isDark ? 'var(--hover-text-dark)' : 'var(--hover-text)';"
        @mouseleave="const el = $event.currentTarget; el.style.borderColor = ''; el.style.color = '';"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span>{{ $t('home.addLink') }}</span>
      </button>

      <!-- 操作按钮 -->
      <div class="flex gap-3 mt-6">
        <button 
          @click="saveLinks"
          class="flex-1 py-3 text-white rounded-xl font-bold transition-colors"
          style="background: linear-gradient(to right, var(--theme-primary), var(--theme-primary-darker));"
          @mouseenter="$event.currentTarget.style.background = 'linear-gradient(to right, var(--theme-primary-light), var(--theme-primary))'"
          @mouseleave="$event.currentTarget.style.background = 'linear-gradient(to right, var(--theme-primary), var(--theme-primary-darker))'"
        >
          {{ $t('common.save') }}
        </button>
        <button 
          @click="$emit('close')"
          class="flex-1 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 font-bold transition-colors"
        >
          {{ $t('common.cancel') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, markRaw } from 'vue'
import { getIcon } from '../utils/iconMapper'
import { getFaviconUrl } from '../utils/urlHelper'

const props = defineProps({
  links: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['close', 'save'])

// 本地链接副本，用于编辑
const localLinks = ref(
  props.links.map((link, index) => {
    // 统一使用 getIcon 获取图标
    const icon = getIcon(link.iconName)
    return {
      ...link,
      id: link.id || `link-${index}`,
      icon: icon ? markRaw(icon) : null,
      iconName: link.iconName || 'HomeIcon' // 确保有 iconName
    }
  })
)

/**
 * 添加新链接
 */
const addLink = () => {
  const icon = getIcon('HomeIcon')
  localLinks.value.push({
    id: `link-${Date.now()}`,
    name: '',
    url: '',
    iconName: 'HomeIcon',
    icon: icon ? markRaw(icon) : null,
    color: 'bg-slate-500'
  })
}

/**
 * 删除链接
 */
const removeLink = (index) => {
  localLinks.value.splice(index, 1)
}

/**
 * 处理图标加载错误
 * 当favicon加载失败时，隐藏图片元素
 * @param {Event} event - 错误事件
 * @param {Object} link - 链接对象
 */
const handleIconError = (event, link) => {
  // 隐藏图片，让回退方案（SVG图标或首字母）显示
  if (event.target) {
    event.target.style.display = 'none'
  }
}

/**
 * 保存链接
 */
const saveLinks = () => {
  console.log('[QuickLinkEditor] saveLinks called, localLinks:', localLinks.value)
  // 过滤掉空链接，并清理图标对象（只保留iconName作为回退）
  const validLinks = localLinks.value
    .filter(link => link.name && link.url)
    .map(link => {
      const { icon, ...rest } = link
      return {
        ...rest,
        // iconName保留作为回退方案，但主要使用动态favicon
        iconName: link.iconName || 'HomeIcon'
      }
    })
  console.log('[QuickLinkEditor] Valid links to emit:', validLinks)
  emit('save', validLinks)
  emit('close')
}
</script>
