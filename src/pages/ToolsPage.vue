<!--
  工具箱页面组件
  包含多个实用工具：计算器、编码转换、JSON格式化等
  模块化设计，便于添加新工具
  布局：工具栏放在左侧空白区域，中间内容区域使用max-w-6xl居中显示
-->
<template>
  <div class="animate-fade-in rounded-3xl flex gap-6 xl:gap-8 min-h-full overflow-hidden">
    <!-- 左侧工具筛选栏 - 放在左侧空白区域，桌面端显示，玻璃卡片背景，无标题 -->
    <div class="glass-card w-56 hidden xl:block shrink-0 rounded-2xl">
      <div class="sticky top-6 space-y-1.5 p-2.5">
        <button 
          v-for="tool in tools" 
          :key="tool.id"
          @click="currentTool = tool.id"
          class="w-full px-5 py-4 text-left text-sm font-semibold transition-all duration-300 flex items-center gap-3 group relative"
          :class="currentTool === tool.id 
            ? 'rounded-2xl border shadow-md' 
            : 'text-slate-600 dark:text-slate-400 border border-transparent rounded-xl hover:shadow-sm'"
          :style="currentTool === tool.id 
            ? (isThemeTransparent 
                ? (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
                    ? {
                        background: 'rgba(148, 163, 184, 0.3)',
                        color: '#cbd5e1',
                        boxShadow: '0 4px 6px -1px rgba(148, 163, 184, 0.35)',
                        borderColor: 'rgba(255, 255, 255, 0.1)'
                      }
                    : {
                        background: 'rgba(100, 116, 139, 0.2)',
                        color: '#475569',
                        boxShadow: '0 4px 6px -1px rgba(100, 116, 139, 0.25)',
                        borderColor: 'rgba(0, 0, 0, 0.15)'
                      }
                  )
                : {
                    background: 'linear-gradient(to right, color-mix(in srgb, var(--theme-primary-lighter) 80%, transparent), color-mix(in srgb, var(--theme-primary-emerald-lighter) 80%, transparent))',
                    color: 'var(--theme-primary-darker)',
                    boxShadow: '0 4px 6px -1px color-mix(in srgb, var(--theme-primary) 10%, transparent)',
                    borderColor: 'color-mix(in srgb, var(--theme-primary-lighter) 50%, transparent)'
                  }
              )
              : {
                  '--hover-bg': 'color-mix(in srgb, var(--theme-primary-lighter) 40%, transparent)',
                  '--hover-bg-dark': 'color-mix(in srgb, var(--theme-primary) 15%, transparent)',
                  '--hover-text': 'var(--theme-primary-darker)',
                  '--hover-text-dark': 'var(--theme-primary-dark)',
                  '--hover-border': 'rgba(0, 0, 0, 0.15)',
                  '--hover-border-dark': 'rgba(255, 255, 255, 0.1)'
                }"
            @mouseenter="if (currentTool !== tool.id) { 
              const el = $event?.currentTarget;
              if (el) {
                const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
                if (isDark) {
                  el.style.backgroundColor = 'var(--hover-bg-dark)';
                  el.style.borderColor = 'var(--hover-border-dark)';
                } else {
                  el.style.backgroundColor = 'var(--hover-bg)';
                  el.style.borderColor = 'var(--hover-border)';
                }
              }
            }"
            @mouseleave="if (currentTool !== tool.id) { 
              const el = $event?.currentTarget;
              if (el) {
                el.style.backgroundColor = '';
                el.style.borderColor = '';
              }
            }"
        >
          <component 
            :is="tool.icon" 
            class="w-5 h-5 shrink-0 transition-transform duration-200"
            :class="currentTool === tool.id 
              ? 'scale-110' 
              : 'group-hover:scale-110'"
          />
          <span class="truncate flex-1">{{ tool.name }}</span>
          <!-- 选中指示器 -->
          <div 
            v-if="currentTool === tool.id"
            class="absolute right-2 w-1.5 h-1.5 rounded-full"
                      :style="isThemeTransparent 
                        ? { backgroundColor: '#475569' }
                        : { backgroundColor: 'var(--theme-primary)' }"
          ></div>
        </button>
      </div>
    </div>

    <!-- 分割线 - 更精致的样式 -->
    <div class="hidden xl:block w-px bg-gradient-to-b from-transparent via-slate-300 dark:via-slate-600 to-transparent shrink-0"></div>

    <!-- 中间工具内容区 - 使用flex-1占据全部剩余空间，填充到底部 -->
    <div class="flex-1 min-w-0 flex flex-col min-h-full">
      <!-- 移动端工具选择器 - 下拉栏形式 -->
      <div class="xl:hidden mb-4 sm:mb-6">
        <div class="glass-card-tools rounded-xl sm:rounded-2xl shadow-lg overflow-hidden" data-tool-dropdown>
          <div class="relative">
            <!-- 下拉按钮 -->
            <button
              @click="showToolDropdown = !showToolDropdown"
              class="w-full px-4 py-3 sm:py-4 flex items-center justify-between text-left transition-all duration-200"
              style="--hover-bg: color-mix(in srgb, var(--theme-primary-lighter) 30%, transparent); --hover-bg-dark: color-mix(in srgb, var(--theme-primary) 20%, transparent);"
              @mouseenter="const el = $event?.currentTarget; if (el) { const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark'); el.style.backgroundColor = isDark ? 'var(--hover-bg-dark)' : 'var(--hover-bg)'; }"
              @mouseleave="const el = $event?.currentTarget; if (el) { el.style.backgroundColor = ''; }"
            >
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <component 
                  :is="currentToolData.icon" 
                  class="w-5 h-5 shrink-0"
                  style="color: var(--theme-primary-darker);"
                  :style="{ '--dark-color': 'var(--theme-primary-dark)' }"
                />
                <span class="font-semibold text-sm sm:text-base text-slate-800 dark:text-slate-200 truncate">
                  {{ currentToolData.name }}
                </span>
              </div>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                stroke-width="2" 
                stroke-linecap="round" 
                stroke-linejoin="round" 
                class="w-5 h-5 text-slate-500 dark:text-slate-400 transition-transform duration-200 flex-shrink-0 ml-2"
                :class="{ 'rotate-180': showToolDropdown }"
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            <!-- 下拉选项列表 -->
            <transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="opacity-0 max-h-0"
              enter-to-class="opacity-100 max-h-96"
              leave-active-class="transition-all duration-200 ease-in"
              leave-from-class="opacity-100 max-h-96"
              leave-to-class="opacity-0 max-h-0"
            >
              <div
                v-if="showToolDropdown"
                class="border-t border-slate-200/50 dark:border-slate-700/50 overflow-hidden"
              >
                <div class="max-h-64 overflow-y-auto custom-scrollbar">
                  <button
                    v-for="tool in tools"
                    :key="tool.id"
                    @click="selectTool(tool.id)"
                    class="w-full px-4 py-3 sm:py-3.5 flex items-center gap-3 text-left transition-all duration-200 border border-transparent rounded-lg"
                    style="--hover-bg: color-mix(in srgb, var(--theme-primary-lighter) 50%, transparent); --hover-bg-dark: color-mix(in srgb, var(--theme-primary) 20%, transparent);"
                    :class="currentTool === tool.id 
                      ? 'font-semibold' 
                      : 'text-slate-600 dark:text-slate-400'"
                    :style="currentTool === tool.id 
                      ? (isThemeTransparent 
                          ? (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
                              ? {
                                  backgroundColor: 'rgba(148, 163, 184, 0.3)',
                                  color: '#cbd5e1'
                                }
                              : {
                                  backgroundColor: 'rgba(100, 116, 139, 0.2)',
                                  color: '#475569'
                                }
                            )
                          : {
                              backgroundColor: 'color-mix(in srgb, var(--theme-primary-lighter) 80%, transparent)',
                              color: 'var(--theme-primary-darker)',
                              '--dark-bg': 'color-mix(in srgb, var(--theme-primary) 30%, transparent)',
                              '--dark-color': 'var(--theme-primary-dark)'
                            }
                        )
                      : {
                          '--hover-text': 'var(--theme-primary-darker)',
                          '--hover-text-dark': 'var(--theme-primary-dark)'
                        }"
                    @mouseenter="if (currentTool !== tool.id) { 
                      const el = $event?.currentTarget;
                      if (el) {
                        const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
                        if (isDark) {
                          el.style.backgroundColor = 'var(--hover-bg-dark)';
                          el.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                        } else {
                          el.style.backgroundColor = 'var(--hover-bg)';
                          el.style.borderColor = 'rgba(0, 0, 0, 0.15)';
                        }
                      }
                    }"
                    @mouseleave="if (currentTool !== tool.id) { 
                      const el = $event?.currentTarget;
                      if (el) {
                        el.style.backgroundColor = '';
                        el.style.borderColor = '';
                      }
                    }"
                  >
                    <component 
                      :is="tool.icon" 
                      class="w-5 h-5 shrink-0"
                      :class="currentTool === tool.id 
                        ? '' 
                        : 'text-slate-500 dark:text-slate-400'"
                      :style="currentTool === tool.id 
                        ? (isThemeTransparent 
                            ? { color: '#475569', '--dark-color': '#cbd5e1' }
                            : { color: 'var(--theme-primary-darker)', '--dark-color': 'var(--theme-primary-dark)' }
                          )
                        : {}"
                    />
                    <span class="text-sm sm:text-base flex-1 truncate">{{ tool.name }}</span>
                    <!-- 选中指示器 -->
                    <div 
                      v-if="currentTool === tool.id"
                      class="w-2 h-2 rounded-full flex-shrink-0"
                      :style="isThemeTransparent 
                        ? { backgroundColor: '#475569' }
                        : { backgroundColor: 'var(--theme-primary)' }"
                    ></div>
                  </button>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>

      <!-- 工具内容区域 - 使用flex-1填充剩余空间，优化样式和间距 -->
      <div 
        class="glass-card-tools rounded-2xl flex-1 shadow-lg transition-all duration-300 flex flex-col"
        :class="{
          'p-6 md:p-8 lg:p-10': !['calc', 'pomodoro', 'stopwatch', 'worldclock'].includes(currentTool),
          'p-4 md:p-6': ['calc', 'pomodoro', 'stopwatch', 'worldclock'].includes(currentTool)
        }"
      >
          <!-- 计算器 -->
          <CalculatorTool v-if="currentTool === 'calc'" />
          
          <!-- 编码转换 -->
          <EncoderTool v-if="currentTool === 'encode'" />
          
          <!-- JSON格式化 -->
          <JsonTool v-if="currentTool === 'json'" />
          
          <!-- 秒表 -->
          <StopwatchTool v-if="currentTool === 'stopwatch'" />
          
          <!-- 番茄钟 -->
          <PomodoroTool v-if="currentTool === 'pomodoro'" />
          
          <!-- 颜色选择器 -->
          <ColorPickerTool v-if="currentTool === 'colorpicker'" />
          
          <!-- 二维码生成器 -->
          <QRCodeTool v-if="currentTool === 'qrcode'" />
          
          <!-- Markdown 编辑器 -->
          <MarkdownTool v-if="currentTool === 'markdown'" />
          
          <!-- 待办事项 -->
          <TodoTool v-if="currentTool === 'todo'" />
          
          <!-- 世界时钟 -->
          <WorldClockTool v-if="currentTool === 'worldclock'" />
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { toolsConfig } from '../config/tools'
import { getIcon } from '../utils/iconMapper'
import CalculatorTool from '../components/tools/CalculatorTool.vue'
import EncoderTool from '../components/tools/EncoderTool.vue'
import JsonTool from '../components/tools/JsonTool.vue'
import StopwatchTool from '../components/tools/StopwatchTool.vue'
import PomodoroTool from '../components/tools/PomodoroTool.vue'
import ColorPickerTool from '../components/tools/ColorPickerTool.vue'
import QRCodeTool from '../components/tools/QRCodeTool.vue'
import MarkdownTool from '../components/tools/MarkdownTool.vue'
import TodoTool from '../components/tools/TodoTool.vue'
import WorldClockTool from '../components/tools/WorldClockTool.vue'

const { t } = useI18n()
const currentTool = ref('todo') // 默认工具改为 todo
const showToolDropdown = ref(false) // 移动端下拉栏显示状态

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

// 从配置文件加载工具列表，并映射图标组件和国际化名称
const tools = computed(() => {
  return toolsConfig.map(tool => ({
    ...tool,
    name: t(tool.nameKey),
    icon: getIcon(tool.iconName)
  }))
})

/**
 * 当前选中的工具数据
 */
const currentToolData = computed(() => {
  return tools.value.find(tool => tool.id === currentTool.value) || tools.value[0]
})

/**
 * 选择工具
 * 移动端选择后自动关闭下拉栏
 */
const selectTool = (toolId) => {
  currentTool.value = toolId
  showToolDropdown.value = false
}

/**
 * 点击外部关闭下拉栏
 */
const handleClickOutside = (event) => {
  // 检查点击是否在下拉栏外部
  const dropdownElement = event.target.closest('[data-tool-dropdown]')
  if (!dropdownElement && showToolDropdown.value) {
    showToolDropdown.value = false
  }
}

onMounted(() => {
  // 监听点击事件，用于关闭下拉栏
  document.addEventListener('click', handleClickOutside)
  // 检查主题色状态
  checkThemeTransparent()
  // 监听主题变化
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

onUnmounted(() => {
  // 清理事件监听
  document.removeEventListener('click', handleClickOutside)
})
</script>
