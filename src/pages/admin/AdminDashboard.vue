<!--
  管理后台仪表盘
  提供统计概览、系统状态和最近动态
-->
<template>
  <div class="space-y-6 animate-fade-in pb-10">
    <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
      <div class="space-y-2">
        <span class="section-kicker">{{ $t('admin.overview') }}</span>
        <h2 class="text-3xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-7 h-7 text-[var(--theme-primary)]">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          {{ $t('admin.dashboard') }}
        </h2>
        <p class="section-copy text-sm">{{ $t('admin.dashboardCopy') }}</p>
      </div>
      <div class="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full w-fit">
        {{ $t('admin.lastUpdated', { time: lastUpdate }) }}
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="item in statCards" :key="item.label" class="admin-stat p-6 rounded-[24px] relative overflow-hidden group">
        <div class="absolute -right-2 -top-2 opacity-10 group-hover:scale-110 transition-transform duration-500">
          <span v-html="item.icon" class="w-20 h-20 block"></span>
        </div>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">{{ $t(item.label) }}</p>
        <div class="flex items-end gap-2">
          <p class="text-3xl font-bold text-slate-800 dark:text-slate-200">{{ item.value }}</p>
          <span v-if="item.trend !== null" class="text-xs font-bold mb-1 text-green-500 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3 mr-1"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            {{ item.trend }}
          </span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-1 space-y-6">
        <div class="admin-panel p-5 rounded-[24px]">
          <h3 class="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">
            {{ $t('admin.quickActions') }}
          </h3>
          <div class="grid grid-cols-2 gap-3">
            <button
              @click="$router.push('/admin/blogs/new')"
              class="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-[var(--theme-primary)] hover:text-white rounded-xl transition-all group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-6 h-6 mb-2 group-hover:scale-110 transition-transform"><path d="M12 5v14M5 12h14"/></svg>
              <span class="text-xs font-bold">{{ $t('admin.createBlog') }}</span>
            </button>
            <button
              @click="$router.push('/admin/comments')"
              class="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-[var(--theme-primary)] hover:text-white rounded-xl transition-all group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-6 h-6 mb-2 group-hover:scale-110 transition-transform"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              <span class="text-xs font-bold">{{ $t('admin.comments') }}</span>
            </button>
            <button
              @click="$router.push('/admin/system')"
              class="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-[var(--theme-primary)] hover:text-white rounded-xl transition-all group col-span-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-6 h-6 mb-2 group-hover:scale-110 transition-transform"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M7 20h10"/><path d="M9 16v4"/><path d="M15 16v4"/></svg>
              <span class="text-xs font-bold">{{ $t('admin.system') }}</span>
            </button>
          </div>
        </div>

        <div class="admin-panel p-5 rounded-[24px] bg-gradient-to-br from-[var(--theme-primary)]/10 to-transparent">
          <h3 class="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">{{ $t('admin.systemStatus') }}</h3>
          <div class="space-y-3">
            <div
              v-for="item in systemStatus"
              :key="item.label"
              class="p-4 rounded-2xl bg-white/50 dark:bg-slate-900/40 border border-border-base"
            >
              <div class="flex items-center justify-between gap-3">
                <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ $t(item.label) }}</span>
                <span class="status-pill" :class="statusClass(item.tone)">{{ item.value }}</span>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-5">{{ item.detail }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="lg:col-span-2 space-y-6">
        <div class="admin-panel p-6 rounded-[24px] h-[300px]">
          <h3 class="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">{{ $t('admin.visitTrends') }}</h3>
          <canvas ref="chartCanvas"></canvas>
        </div>

        <div class="admin-panel p-6 rounded-[24px]">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              {{ $t('admin.comments') }}
              <span v-if="pendingComments.length" class="px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] rounded-full uppercase">{{ $t('admin.pending') }}</span>
            </h3>
            <button @click="$router.push('/admin/comments')" class="text-xs text-[var(--theme-primary)] font-bold hover:underline">{{ $t('admin.viewAll') }}</button>
          </div>

          <div v-if="pendingComments.length" class="space-y-4">
            <div v-for="comment in pendingComments" :key="comment.id" class="p-4 bg-white/50 dark:bg-slate-900/40 rounded-2xl border border-border-base">
              <div class="flex justify-between items-start gap-3 mb-2">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                    {{ (comment.author_name || '?').charAt(0) }}
                  </div>
                  <span class="text-xs font-bold">{{ comment.author_name || '?' }}</span>
                </div>
                <span class="text-[10px] text-slate-400 font-mono">{{ formatDate(comment.created_at) }}</span>
              </div>
              <p class="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 italic">"{{ comment.content }}"</p>
            </div>
          </div>
          <div v-else class="py-10 text-center text-slate-400 text-sm">
            {{ $t('admin.noPendingComments') }}
          </div>
        </div>

        <div class="admin-panel p-6 rounded-[24px]">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200">{{ $t('admin.recentPosts') }}</h3>
            <button @click="$router.push('/admin/blogs')" class="text-xs text-[var(--theme-primary)] font-bold hover:underline">{{ $t('admin.manage') }}</button>
          </div>
          <div class="space-y-3">
            <div
              v-for="blog in recentBlogs"
              :key="blog.id"
              class="flex items-center justify-between p-3 hover:bg-white/40 dark:hover:bg-slate-800/40 rounded-xl transition-colors cursor-pointer group"
              @click="$router.push(`/admin/blogs/${blog.id}`)"
            >
              <div class="flex items-center gap-4 min-w-0">
                <div class="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5 text-slate-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-bold truncate group-hover:text-[var(--theme-primary)] transition-colors">{{ blog.title }}</p>
                  <div class="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                    <span class="uppercase font-bold">{{ blog.genre }}</span>
                    <span>•</span>
                    <span>{{ blog.views }} {{ $t('admin.views') }}</span>
                  </div>
                </div>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>
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
const lastUpdate = ref(new Date().toLocaleTimeString())
const recentBlogs = ref([])
const pendingComments = ref([])
const health = ref({
  database: {},
  backups: {},
  object_storage: {}
})

const stats = ref({
  totalBlogs: 0,
  totalViews: 0,
  totalLikes: 0,
  totalComments: 0,
  dailyTrend: 0
})

const statIcons = {
  blog: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  views: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>`,
  likes: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  comments: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`
}

const statCards = computed(() => [
  { label: 'admin.totalBlogs', value: stats.value.totalBlogs, icon: statIcons.blog, trend: null },
  {
    label: 'admin.totalViews',
    value: stats.value.totalViews,
    icon: statIcons.views,
    trend: `${stats.value.dailyTrend > 0 ? '+' : ''}${stats.value.dailyTrend}%`
  },
  { label: 'admin.totalLikes', value: stats.value.totalLikes, icon: statIcons.likes, trend: null },
  { label: 'admin.totalComments', value: stats.value.totalComments, icon: statIcons.comments, trend: null }
])

const formatBytes = (value) => {
  const size = Number(value || 0)
  if (!size) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1)
  const result = size / (1024 ** exponent)

  return `${result >= 100 ? Math.round(result) : result.toFixed(result >= 10 ? 1 : 2)} ${units[exponent]}`
}

const formatDateTime = (value) => {
  if (!value) return t('admin.noBackupYet')
  return new Date(value).toLocaleString()
}

const systemStatus = computed(() => [
  {
    label: 'admin.databaseStatus',
    value: health.value.database.ok ? t('admin.healthy') : t('admin.degraded'),
    detail: `${formatBytes(health.value.database.size_bytes)} · WAL ${formatBytes(health.value.database.wal_size_bytes)}`,
    tone: health.value.database.ok ? 'success' : 'danger'
  },
  {
    label: 'admin.databaseBackups',
    value: `${health.value.backups.count || 0}`,
    detail: health.value.backups.latest ? formatDateTime(health.value.backups.latest.updated_at) : t('admin.noBackupYet'),
    tone: health.value.backups.count ? 'neutral' : 'warm'
  },
  {
    label: 'admin.objectStorage',
    value: health.value.object_storage.configured ? t('admin.connected') : t('admin.notConfigured'),
    detail: health.value.object_storage.configured ? (health.value.object_storage.cache_control || '—') : t('admin.r2NotConfigured'),
    tone: health.value.object_storage.configured ? 'success' : 'danger'
  }
])

const statusClass = (tone) => {
  if (tone === 'success') return 'status-pill-success'
  if (tone === 'danger') return 'status-pill-danger'
  if (tone === 'warm') return 'status-pill-warm'
  return 'status-pill-neutral'
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
}

const formatTrendLabel = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return ''
  return dateStr.slice(5).replace('-', '/')
}

let visitChart = null

const initChart = (trend) => {
  if (!chartCanvas.value) return
  if (visitChart) visitChart.destroy()

  const ctx = chartCanvas.value.getContext('2d')
  const isDark = document.documentElement.classList.contains('dark')
  const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--theme-primary').trim() || '#22c55e'

  visitChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: trend.map(item => {
        return formatTrendLabel(item.date)
      }),
      datasets: [{
        label: t('admin.visits'),
        data: trend.map(item => item.visits),
        borderColor: primaryColor,
        backgroundColor: `${primaryColor}20`,
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
        pointBackgroundColor: primaryColor
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
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

const loadDashboardData = async () => {
  try {
    const [statsData, overview, blogList, adminComments, healthData] = await Promise.all([
      adminApi.getStats(),
      adminApi.getAnalyticsOverview({ days: 7 }),
      adminApi.getBlogs({ limit: 5, sortBy: 'created_at', sortOrder: 'desc' }),
      adminApi.getComments({ status: 'pending', limit: 5 }),
      adminApi.getSystemHealth()
    ])

    stats.value.totalBlogs = statsData.blogs?.total || 0
    stats.value.totalViews = statsData.blogs?.total_views || 0
    stats.value.totalLikes = statsData.blogs?.total_likes || 0
    stats.value.totalComments = statsData.blogs?.total_comments || 0

    const trend = overview?.trend || []
    if (trend.length) {
      initChart(trend)
      if (trend.length >= 2) {
        const today = trend[trend.length - 1].visits || 0
        const yesterday = trend[trend.length - 2].visits || 0
        stats.value.dailyTrend = yesterday > 0
          ? Math.round(((today - yesterday) / yesterday) * 100)
          : (today > 0 ? 100 : 0)
      } else {
        stats.value.dailyTrend = 0
      }
    }

    recentBlogs.value = blogList || []
    pendingComments.value = adminComments || []
    health.value = healthData || health.value
    lastUpdate.value = new Date().toLocaleTimeString()
  } catch (error) {
    console.error('Failed to load dashboard:', error)
  }
}

onMounted(() => {
  loadDashboardData()
})

onUnmounted(() => {
  if (visitChart) {
    visitChart.destroy()
  }
})
</script>
