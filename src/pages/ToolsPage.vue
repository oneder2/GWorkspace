<!--
  工具箱页面组件
  包含多个实用工具：计算器、编码转换、JSON格式化等
  模块化设计，便于添加新工具
  使用 2:8:2 布局（空白：内容：空白）
-->
<template>
  <div class="animate-fade-in w-full">
    <div class="grid grid-cols-12 gap-6 lg:gap-8">
      <!-- 左侧工具导航栏 -->
      <div class="col-span-12 xl:col-span-2">
        <div class="glass-card p-4 rounded-2xl sticky top-6">
          <h3 class="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200">{{ $t('tools.utilities') }}</h3>
          <div class="space-y-2">
            <button 
              v-for="tool in tools" 
              :key="tool.id"
              @click="currentTool = tool.id"
              class="w-full px-4 py-3 rounded-xl text-left text-sm font-bold transition-colors flex items-center gap-3"
              :class="currentTool === tool.id 
                ? 'bg-white dark:bg-slate-700 text-green-600 dark:text-green-400 shadow-md' 
                : 'text-slate-600 dark:text-slate-400'"
            >
              <component :is="tool.icon" class="w-5 h-5 shrink-0" />
              <span class="truncate">{{ tool.name }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 中间工具内容区 -->
      <div class="col-span-12 xl:col-span-8">
        <div class="glass-card p-6 md:p-8 rounded-2xl min-h-[600px] mx-auto max-w-full">
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

      <!-- 右侧空白 -->
      <div class="hidden xl:block xl:col-span-2"></div>
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
