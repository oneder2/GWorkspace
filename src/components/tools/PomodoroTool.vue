<!--
  番茄钟工具组件
  提供25分钟工作/5分钟休息的番茄工作法计时
-->
<template>
  <div class="h-full flex items-center justify-center">
    <div class="bg-white dark:bg-slate-800/90 p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-lg md:max-w-xl border border-slate-200 dark:border-slate-600/50">
      <!-- 模式选择 -->
      <div class="flex gap-2 mb-6">
        <button 
          @click="setMode('work')"
          class="flex-1 py-2 rounded-xl font-bold transition-colors border"
          :class="mode === 'work' 
            ? 'bg-green-500 dark:bg-green-500 text-white border-green-400/30 dark:border-green-400/30' 
            : 'bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600/50 hover:bg-slate-200 dark:hover:bg-slate-600'"
        >
          工作 (25分钟)
        </button>
        <button 
          @click="setMode('break')"
          class="flex-1 py-2 rounded-xl font-bold transition-colors border"
          :class="mode === 'break' 
            ? 'bg-blue-500 dark:bg-blue-500 text-white border-blue-400/30 dark:border-blue-400/30' 
            : 'bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600/50 hover:bg-slate-200 dark:hover:bg-slate-600'"
        >
          休息 (5分钟)
        </button>
      </div>
      
      <!-- 时间显示 -->
      <div class="bg-slate-100 dark:bg-black/60 rounded-2xl p-8 mb-6 text-center border border-slate-300 dark:border-slate-600/30">
        <div class="text-slate-900 dark:text-slate-100 font-mono text-6xl mb-2 tracking-wider">
          {{ formatTime(remainingTime) }}
        </div>
        <div class="text-slate-500 dark:text-slate-400 text-sm">
          {{ mode === 'work' ? '专注时间' : '休息时间' }}
        </div>
      </div>
      
      <!-- 控制按钮 -->
      <div class="flex gap-3">
        <button 
          @click="startPause" 
          class="flex-1 h-14 rounded-xl font-bold text-white transition-colors border"
          :class="isRunning 
            ? 'bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-500 dark:hover:bg-yellow-600 border-yellow-400/30 dark:border-yellow-400/30' 
            : 'bg-green-500 hover:bg-green-600 dark:bg-green-500 dark:hover:bg-green-600 border-green-400/30 dark:border-green-400/30'"
        >
          {{ isRunning ? '暂停' : '开始' }}
        </button>
        <button 
          @click="reset"
          class="flex-1 h-14 rounded-xl bg-slate-100 dark:bg-slate-700/80 text-slate-900 dark:text-slate-100 font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border border-slate-300 dark:border-slate-600/50"
        >
          重置
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'

const mode = ref('work') // 'work' 或 'break'
const remainingTime = ref(25 * 60 * 1000) // 剩余时间（毫秒）
const isRunning = ref(false)
let interval = null

const WORK_TIME = 25 * 60 * 1000 // 25分钟
const BREAK_TIME = 5 * 60 * 1000 // 5分钟

/**
 * 格式化时间显示
 * @param {number} ms - 毫秒数
 * @returns {string} 格式化的时间字符串 (MM:SS)
 */
const formatTime = (ms) => {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

/**
 * 设置模式
 */
const setMode = (newMode) => {
  if (isRunning.value) return
  mode.value = newMode
  remainingTime.value = newMode === 'work' ? WORK_TIME : BREAK_TIME
}

/**
 * 开始/暂停
 */
const startPause = () => {
  if (isRunning.value) {
    clearInterval(interval)
    isRunning.value = false
  } else {
    isRunning.value = true
    interval = setInterval(() => {
      remainingTime.value -= 1000
      if (remainingTime.value <= 0) {
        clearInterval(interval)
        isRunning.value = false
        // 自动切换到另一个模式
        mode.value = mode.value === 'work' ? 'break' : 'work'
        remainingTime.value = mode.value === 'work' ? WORK_TIME : BREAK_TIME
        // 可以添加通知提示
      }
    }, 1000)
  }
}

/**
 * 重置
 */
const reset = () => {
  clearInterval(interval)
  isRunning.value = false
  remainingTime.value = mode.value === 'work' ? WORK_TIME : BREAK_TIME
}

onUnmounted(() => {
  if (interval) {
    clearInterval(interval)
  }
})
</script>
