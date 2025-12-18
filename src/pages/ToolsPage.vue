<!--
  工具箱页面组件
  包含多个实用工具：计算器、编码转换、JSON格式化等
  模块化设计，便于添加新工具
-->
<template>
  <div class="animate-fade-in max-w-5xl mx-auto h-full flex flex-col">
    <div class="glass-card rounded-2xl flex-1 flex flex-col md:flex-row overflow-hidden border border-white/60 dark:border-slate-700/60 shadow-xl opacity-90">
      <!-- 工具菜单 -->
      <div class="w-full md:w-56 bg-white/30 dark:bg-slate-800/30 border-b md:border-b-0 md:border-r border-white/30 dark:border-slate-700/30 p-3 flex md:flex-col gap-2 overflow-x-auto backdrop-blur-md custom-scrollbar">
        <div class="px-3 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 hidden md:block">
          {{ $t('tools.utilities') }}
        </div>
        <button 
          v-for="tool in tools" 
          :key="tool.id"
          @click="currentTool = tool.id"
          class="px-4 py-3 rounded-xl text-left text-sm font-bold transition-all whitespace-nowrap md:whitespace-normal flex items-center gap-3"
          :class="currentTool === tool.id 
            ? 'bg-white dark:bg-slate-700 text-green-600 dark:text-green-400 shadow-md' 
            : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'"
        >
          <component :is="tool.icon" class="w-5 h-5" />
          {{ tool.name }}
        </button>
      </div>

      <!-- 工具内容区 -->
      <div class="flex-1 p-6 md:p-8 bg-white/20 dark:bg-slate-900/20 backdrop-blur-sm overflow-y-auto relative custom-scrollbar">
        <div class="absolute inset-0 bg-white/10 dark:bg-slate-900/10 pointer-events-none"></div>
        <div class="relative z-10 h-full">
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
        </div>
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
