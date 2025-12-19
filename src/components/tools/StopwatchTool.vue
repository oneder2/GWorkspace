<!--
  秒表和停表工具组件
  提供计时功能
-->
<template>
  <div class="h-full flex items-center justify-center">
    <div class="bg-white dark:bg-slate-800/90 p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-lg md:max-w-xl border border-slate-200 dark:border-slate-600/50">
      <!-- 时间显示 -->
      <div class="bg-slate-100 dark:bg-black/60 rounded-2xl p-6 mb-6 text-center border border-slate-300 dark:border-slate-600/30">
        <div class="text-slate-900 dark:text-slate-100 font-mono text-5xl mb-2 tracking-wider">
          {{ formatTime(time) }}
        </div>
        <div class="text-slate-500 dark:text-slate-400 text-sm font-mono">
          {{ formatTime(lapTime) }}
        </div>
      </div>
      
      <!-- 控制按钮 -->
      <div class="grid grid-cols-3 gap-3 mb-4">
        <button 
          @click="startStop" 
          class="h-14 rounded-xl font-bold text-white transition-colors border"
          :class="isRunning 
            ? 'bg-red-500 hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600 border-red-400/30 dark:border-red-400/30' 
            : 'bg-green-500 hover:bg-green-600 dark:bg-green-500 dark:hover:bg-green-600 border-green-400/30 dark:border-green-400/30'"
        >
          {{ isRunning ? '停止' : '开始' }}
        </button>
        <button 
          @click="lap" 
          :disabled="!isRunning && time === 0"
          class="h-14 rounded-xl bg-slate-100 dark:bg-slate-700/80 text-slate-900 dark:text-slate-100 font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-slate-300 dark:border-slate-600/50"
        >
          计次
        </button>
        <button 
          @click="reset" 
          :disabled="isRunning"
          class="h-14 rounded-xl bg-slate-100 dark:bg-slate-700/80 text-slate-900 dark:text-slate-100 font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-slate-300 dark:border-slate-600/50"
        >
          重置
        </button>
      </div>
      
      <!-- 计次列表 -->
      <div v-if="laps.length > 0" class="max-h-48 overflow-y-auto custom-scrollbar">
        <div class="space-y-2">
          <div 
            v-for="(lap, index) in laps" 
            :key="index"
            class="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-slate-900 dark:text-slate-200 text-sm font-mono border border-slate-200 dark:border-slate-600/30"
          >
            <span>计次 {{ laps.length - index }}</span>
            <span>{{ formatTime(lap) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'

const time = ref(0) // 总时间（毫秒）
const lapTime = ref(0) // 单圈时间（毫秒）
const isRunning = ref(false)
const laps = ref([])
let interval = null
let startTime = 0
let lapStartTime = 0

/**
 * 格式化时间显示
 * @param {number} ms - 毫秒数
 * @returns {string} 格式化的时间字符串 (MM:SS.MS)
 */
const formatTime = (ms) => {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const milliseconds = Math.floor((ms % 1000) / 10)
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`
}

/**
 * 开始/停止计时
 */
const startStop = () => {
  if (isRunning.value) {
    // 停止
    clearInterval(interval)
    isRunning.value = false
  } else {
    // 开始
    const now = Date.now()
    startTime = now - time.value
    lapStartTime = now - lapTime.value
    isRunning.value = true
    interval = setInterval(() => {
      const current = Date.now()
      time.value = current - startTime
      lapTime.value = current - lapStartTime
    }, 10)
  }
}

/**
 * 计次
 */
const lap = () => {
  if (isRunning.value && lapTime.value > 0) {
    laps.value.unshift(lapTime.value)
    lapTime.value = 0
    lapStartTime = Date.now()
  }
}

/**
 * 重置
 */
const reset = () => {
  clearInterval(interval)
  time.value = 0
  lapTime.value = 0
  isRunning.value = false
  laps.value = []
  startTime = 0
  lapStartTime = 0
}

onUnmounted(() => {
  if (interval) {
    clearInterval(interval)
  }
})
</script>
