<!--
  世界时钟工具组件
  显示中国时间、美国东部时间、美国西部时间
-->
<template>
  <div class="h-full flex items-center justify-center">
    <div class="w-full max-w-4xl">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <!-- 中国时间 -->
        <div class="glass-card p-6 rounded-2xl text-center">
          <div class="mb-4">
            <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">
              {{ $t('tools.worldClock.china') }}
            </h3>
            <p class="text-sm text-slate-500 dark:text-slate-400">
              {{ $t('tools.worldClock.chinaTimezone') }}
            </p>
          </div>
          <div class="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div class="text-3xl md:text-4xl font-mono font-bold text-slate-900 dark:text-slate-100 mb-2">
              {{ formatTime('china') }}
            </div>
            <div class="text-sm text-slate-600 dark:text-slate-400 font-mono">
              {{ formatDate('china') }}
            </div>
          </div>
        </div>

        <!-- 美国东部时间 -->
        <div class="glass-card p-6 rounded-2xl text-center">
          <div class="mb-4">
            <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">
              {{ $t('tools.worldClock.usEast') }}
            </h3>
            <p class="text-sm text-slate-500 dark:text-slate-400">
              {{ $t('tools.worldClock.usEastTimezone') }}
            </p>
          </div>
          <div class="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div class="text-3xl md:text-4xl font-mono font-bold text-slate-900 dark:text-slate-100 mb-2">
              {{ formatTime('usEast') }}
            </div>
            <div class="text-sm text-slate-600 dark:text-slate-400 font-mono">
              {{ formatDate('usEast') }}
            </div>
          </div>
        </div>

        <!-- 美国西部时间 -->
        <div class="glass-card p-6 rounded-2xl text-center">
          <div class="mb-4">
            <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">
              {{ $t('tools.worldClock.usWest') }}
            </h3>
            <p class="text-sm text-slate-500 dark:text-slate-400">
              {{ $t('tools.worldClock.usWestTimezone') }}
            </p>
          </div>
          <div class="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div class="text-3xl md:text-4xl font-mono font-bold text-slate-900 dark:text-slate-100 mb-2">
              {{ formatTime('usWest') }}
            </div>
            <div class="text-sm text-slate-600 dark:text-slate-400 font-mono">
              {{ formatDate('usWest') }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// 当前时间（用于触发更新）
const currentTime = ref(new Date())

let timer = null

// 时区配置
const timezones = {
  china: 'Asia/Shanghai',
  usEast: 'America/New_York',
  usWest: 'America/Los_Angeles'
}

/**
 * 更新当前时间（触发响应式更新）
 */
const updateTimes = () => {
  currentTime.value = new Date()
}

/**
 * 格式化时间（HH:MM:SS）
 * @param {string} timezone - 时区标识（'china', 'usEast', 'usWest'）
 * @returns {string} 格式化后的时间字符串
 */
const formatTime = (timezone) => {
  if (!currentTime.value) return '00:00:00'
  const timeStr = currentTime.value.toLocaleString('en-US', {
    timeZone: timezones[timezone],
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  return timeStr
}

/**
 * 格式化日期（YYYY-MM-DD）
 * @param {string} timezone - 时区标识（'china', 'usEast', 'usWest'）
 * @returns {string} 格式化后的日期字符串
 */
const formatDate = (timezone) => {
  if (!currentTime.value) return ''
  const dateStr = currentTime.value.toLocaleString('en-US', {
    timeZone: timezones[timezone],
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  // 转换为 YYYY-MM-DD 格式
  const [month, day, year] = dateStr.split('/')
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

// 初始化时更新一次
onMounted(() => {
  updateTimes()
  // 每秒更新一次
  timer = setInterval(updateTimes, 1000)
})

// 清理定时器
onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

