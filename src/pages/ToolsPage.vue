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
            ? 'bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-900/30 dark:to-emerald-900/20 text-green-700 dark:text-green-400 shadow-md shadow-green-500/10 dark:shadow-green-500/20 border border-green-200/50 dark:border-green-700/50 rounded-2xl' 
            : 'text-slate-600 dark:text-slate-400 hover:bg-green-50/40 dark:hover:bg-green-900/15 hover:text-green-700 dark:hover:text-green-400 hover:shadow-sm hover:border-green-200/30 dark:hover:border-green-700/20 border border-transparent rounded-xl'"
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
            class="absolute right-2 w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400"
          ></div>
        </button>
      </div>
    </div>

    <!-- 分割线 - 更精致的样式 -->
    <div class="hidden xl:block w-px bg-gradient-to-b from-transparent via-slate-300 dark:via-slate-600 to-transparent shrink-0"></div>

    <!-- 中间工具内容区 - 使用flex-1占据全部剩余空间，填充到底部 -->
    <div class="flex-1 min-w-0 flex flex-col min-h-full">
      <!-- 移动端工具选择器 -->
      <div class="xl:hidden mb-6">
        <div class="glass-card-tools p-4 rounded-2xl shadow-lg">
          <h3 class="text-base font-bold mb-4 text-slate-800 dark:text-slate-200 uppercase tracking-wider text-xs">
            {{ $t('tools.utilities') }}
          </h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button 
              v-for="tool in tools" 
              :key="tool.id"
              @click="currentTool = tool.id"
              class="px-4 py-4 text-left text-sm font-semibold transition-all duration-300 flex items-center gap-2"
              :class="currentTool === tool.id 
                ? 'bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-900/30 dark:to-emerald-900/20 text-green-700 dark:text-green-400 shadow-md border border-green-200/50 dark:border-green-700/50 rounded-2xl' 
                : 'text-slate-600 dark:text-slate-400 bg-slate-100/40 dark:bg-slate-800/40 hover:bg-green-50/50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-400 border border-transparent hover:border-green-200/30 dark:hover:border-green-700/20 rounded-xl'"
            >
              <component :is="tool.icon" class="w-4 h-4 shrink-0" />
              <span class="truncate text-xs">{{ tool.name }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 工具内容区域 - 使用flex-1填充剩余空间，优化样式和间距 -->
      <div 
        class="glass-card-tools rounded-2xl flex-1 shadow-lg transition-all duration-300 flex flex-col"
        :class="{
          'p-6 md:p-8 lg:p-10': !['calc', 'pomodoro', 'stopwatch'].includes(currentTool),
          'p-4 md:p-6': ['calc', 'pomodoro', 'stopwatch'].includes(currentTool)
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
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
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

const { t } = useI18n()
const currentTool = ref('calc')

// 从配置文件加载工具列表，并映射图标组件和国际化名称
const tools = computed(() => {
  return toolsConfig.map(tool => ({
    ...tool,
    name: t(tool.nameKey),
    icon: getIcon(tool.iconName)
  }))
})
</script>
