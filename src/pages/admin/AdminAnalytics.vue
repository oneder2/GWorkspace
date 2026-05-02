<!--
  数据分析页面
  显示流量趋势、访问统计和文章热度
-->
<template>
  <div class="space-y-6">
    <div class="admin-panel rounded-[24px] overflow-hidden">
      <div class="admin-toolbar flex-col lg:flex-row lg:items-end">
        <div class="space-y-2">
          <span class="section-kicker">{{ $t('admin.metrics') }}</span>
          <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200">{{ $t('admin.analytics') }}</h2>
          <p class="text-sm text-secondary">{{ $t('admin.analyticsCopy') }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="day in dayOptions"
            :key="day"
            @click="changeRange(day)"
            class="px-3 py-1.5 rounded-full text-sm font-semibold transition-colors"
            :class="selectedDays === day
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'"
          >
            {{ day }}D
          </button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <div v-for="card in summaryCards" :key="card.label" class="admin-stat p-6 rounded-[24px]">
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-1">{{ $t(card.label) }}</p>
        <p class="text-3xl font-bold text-slate-800 dark:text-slate-200">{{ card.value }}</p>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-2">{{ card.detail }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div class="xl:col-span-2 admin-panel p-6 rounded-[24px] h-[360px]">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200">{{ $t('admin.visitTrends') }}</h3>
          <span class="text-xs font-mono text-slate-400">{{ selectedDays }}D</span>
        </div>
        <canvas ref="chartCanvas"></canvas>
      </div>

      <div class="admin-panel p-6 rounded-[24px] space-y-4">
        <div>
          <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200">{{ $t('admin.metricGuide') }}</h3>
          <p class="text-sm text-secondary">{{ $t('admin.analyticsCopy') }}</p>
        </div>
        <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
          <p class="text-sm font-semibold text-slate-800 dark:text-slate-200">{{ $t('admin.totalVisits') }}</p>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-6">{{ $t('admin.trafficMetricHint') }}</p>
        </div>
        <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
          <p class="text-sm font-semibold text-slate-800 dark:text-slate-200">{{ $t('admin.articleReads') }}</p>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-6">{{ $t('admin.readMetricHint') }}</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div class="admin-panel p-6 rounded-[24px]">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200">{{ $t('admin.popularBlogs') }}</h3>
          <span class="text-xs text-slate-400">{{ selectedDays }}D</span>
        </div>
        <div v-if="popularBlogs.length" class="space-y-3">
          <div
            v-for="item in popularBlogs"
            :key="item.blog_id"
            class="flex items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl"
          >
            <div class="min-w-0">
              <p class="font-semibold text-slate-800 dark:text-slate-200 truncate">
                {{ item.title || `${t('admin.blogId')}: ${item.blog_id}` }}
              </p>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">{{ item.slug || '—' }}</p>
            </div>
            <div class="shrink-0 text-right">
              <p class="text-sm font-bold text-slate-800 dark:text-slate-200">{{ item.visit_count }}</p>
              <p class="text-xs text-slate-500 dark:text-slate-400">{{ $t('admin.visits') }}</p>
            </div>
          </div>
        </div>
        <div v-else class="text-center text-slate-500 dark:text-slate-400 py-8">
          {{ $t('admin.noData') }}
        </div>
      </div>

      <div class="admin-panel p-6 rounded-[24px]">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200">{{ $t('admin.articleReads') }}</h3>
          <span class="text-xs text-slate-400">{{ $t('admin.allTime') }}</span>
        </div>
        <div v-if="topViewedBlogs.length" class="space-y-3">
          <div
            v-for="blog in topViewedBlogs"
            :key="blog.id"
            class="flex items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl"
          >
            <div class="min-w-0">
              <p class="font-semibold text-slate-800 dark:text-slate-200 truncate">{{ blog.title }}</p>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">{{ blog.genre }}</p>
            </div>
            <div class="shrink-0 text-right">
              <p class="text-sm font-bold text-slate-800 dark:text-slate-200">{{ blog.views || 0 }}</p>
              <p class="text-xs text-slate-500 dark:text-slate-400">{{ $t('admin.views') }}</p>
            </div>
          </div>
        </div>
        <div v-else class="text-center text-slate-500 dark:text-slate-400 py-8">
          {{ $t('admin.noData') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Chart from 'chart.js/auto'
import { adminApi } from '../../utils/api'

const { t } = useI18n()
const chartCanvas = ref(null)
const selectedDays = ref(30)
const isLoading = ref(false)

const dayOptions = [7, 30, 90]

const stats = ref({
  blogs: {
    total_views: 0
  }
})

const overview = ref({
  days: 30,
  trend: [],
  overall: {
    total_visits: 0,
    unique_visitors: 0,
    popular_blogs: []
  },
  range: {
    total_visits: 0,
    unique_visitors: 0,
    popular_blogs: []
  }
})

const topViewedBlogs = ref([])

const popularBlogs = computed(() => (
  overview.value.range?.popular_blogs?.length
    ? overview.value.range.popular_blogs
    : (overview.value.overall?.popular_blogs || [])
))

const summaryCards = computed(() => [
  {
    label: 'admin.periodVisits',
    value: overview.value.range?.total_visits || 0,
    detail: `${selectedDays.value}D`
  },
  {
    label: 'admin.uniqueVisitors',
    value: overview.value.range?.unique_visitors || 0,
    detail: `${selectedDays.value}D`
  },
  {
    label: 'admin.totalVisits',
    value: overview.value.overall?.total_visits || 0,
    detail: t('admin.allTime')
  },
  {
    label: 'admin.articleReads',
    value: stats.value.blogs?.total_views || 0,
    detail: t('admin.allTime')
  }
])

let analyticsChart = null

const formatTrendLabel = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return ''
  return dateStr.slice(5).replace('-', '/')
}

const initChart = (trend) => {
  if (!chartCanvas.value) return
  if (analyticsChart) analyticsChart.destroy()

  const ctx = chartCanvas.value.getContext('2d')
  const isDark = document.documentElement.classList.contains('dark')
  const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--theme-primary').trim() || '#22c55e'

  analyticsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: trend.map(item => {
        return formatTrendLabel(item.date)
      }),
      datasets: [
        {
          label: t('admin.visits'),
          data: trend.map(item => item.visits),
          borderColor: primaryColor,
          backgroundColor: `${primaryColor}20`,
          fill: true,
          tension: 0.35,
          borderWidth: 3,
          pointRadius: 3
        },
        {
          label: t('admin.uniqueVisitors'),
          data: trend.map(item => item.unique_visitors),
          borderColor: isDark ? '#94a3b8' : '#475569',
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: isDark ? '#cbd5e1' : '#475569'
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: isDark ? '#334155' : '#e2e8f0' },
          ticks: { color: isDark ? '#94a3b8' : '#64748b' }
        },
        x: {
          grid: { display: false },
          ticks: { color: isDark ? '#94a3b8' : '#64748b' }
        }
      }
    }
  })
}

const loadAnalytics = async () => {
  isLoading.value = true
  try {
    const [overviewData, statsData, viewedBlogs] = await Promise.all([
      adminApi.getAnalyticsOverview({ days: selectedDays.value }),
      adminApi.getStats(),
      adminApi.getBlogs({ status: 'published', sortBy: 'views', sortOrder: 'desc', limit: 5 })
    ])

    overview.value = overviewData || overview.value
    stats.value = statsData || stats.value
    topViewedBlogs.value = viewedBlogs || []
    initChart(overview.value.trend || [])
  } catch (error) {
    console.error('Failed to load analytics:', error)
  } finally {
    isLoading.value = false
  }
}

const changeRange = async (days) => {
  if (selectedDays.value === days && !isLoading.value) {
    return
  }

  selectedDays.value = days
  await loadAnalytics()
}

onMounted(() => {
  loadAnalytics()
})

onUnmounted(() => {
  if (analyticsChart) {
    analyticsChart.destroy()
  }
})
</script>
