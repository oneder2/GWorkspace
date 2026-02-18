<!--
  管理后台仪表盘
  提供系统状态概览、快速操作入口及最新动态
-->
<template>
  <div class="space-y-6 animate-fade-in pb-10">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-7 h-7 text-[var(--theme-primary)]">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
        {{ $t('admin.dashboard') }}
      </h2>
      <div class="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
        Last updated: {{ lastUpdate }}
      </div>
    </div>

    <!-- 统计核心看板 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="item in statCards" :key="item.label" class="glass-card p-6 rounded-2xl relative overflow-hidden group">
        <div class="absolute -right-2 -top-2 opacity-10 group-hover:scale-110 transition-transform duration-500">
          <component :is="item.icon" class="w-20 h-20" />
        </div>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">{{ $t(item.label) }}</p>
        <div class="flex items-end gap-2">
          <p class="text-3xl font-bold text-slate-800 dark:text-slate-200">{{ item.value }}</p>
          <span v-if="item.trend" class="text-xs font-bold mb-1 text-green-500 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3 mr-1"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            {{ item.trend }}
          </span>
        </div>
      </div>
    </div>

    <!-- 快捷操作与最近动态 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- 快速入口 (左侧) -->
      <div class="lg:col-span-1 space-y-6">
        <div class="glass-card p-5 rounded-2xl">
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
          </div>
        </div>

        <!-- 系统概览图 (示意) -->
        <div class="glass-card p-5 rounded-2xl bg-gradient-to-br from-[var(--theme-primary)]/10 to-transparent">
          <h3 class="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">System Status</h3>
          <div class="space-y-4">
            <div v-for="sys in systemStatus" :key="sys.name">
              <div class="flex justify-between text-xs mb-1.5">
                <span class="text-slate-600 dark:text-slate-300">{{ sys.name }}</span>
                <span class="font-mono">{{ sys.value }}%</span>
              </div>
              <div class="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-[var(--theme-primary)] transition-all duration-1000" 
                  :style="{ width: sys.value + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 最近动态 (右侧) -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 访问趋势图 -->
        <div class="glass-card p-6 rounded-2xl h-[300px]">
          <h3 class="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Visit Trends (Last 7 Days)</h3>
          <canvas ref="chartCanvas"></canvas>
        </div>

        <!-- 待审核评论 -->
        <div class="glass-card p-6 rounded-2xl">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              {{ $t('admin.comments') }}
              <span v-if="pendingComments.length" class="px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] rounded-full uppercase">Pending</span>
            </h3>
            <button @click="$router.push('/admin/comments')" class="text-xs text-[var(--theme-primary)] font-bold hover:underline">View All</button>
          </div>
          
          <div v-if="pendingComments.length" class="space-y-4">
            <div v-for="comment in pendingComments" :key="comment.id" class="p-4 bg-white/30 dark:bg-slate-800/30 rounded-xl border border-white/20">
              <div class="flex justify-between items-start gap-3 mb-2">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                    {{ comment.author_name.charAt(0) }}
                  </div>
                  <span class="text-xs font-bold">{{ comment.author_name }}</span>
                </div>
                <span class="text-[10px] text-slate-400 font-mono">{{ formatDate(comment.created_at) }}</span>
              </div>
              <p class="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 italic">"{{ comment.content }}"</p>
            </div>
          </div>
          <div v-else class="py-10 text-center text-slate-400 text-sm">
            🎉 All comments approved!
          </div>
        </div>

        <!-- 最近文章 -->
        <div class="glass-card p-6 rounded-2xl">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200">Recent Posts</h3>
            <button @click="$router.push('/admin/blogs')" class="text-xs text-[var(--theme-primary)] font-bold hover:underline">Manage</button>
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
                    <span>{{ blog.views }} views</span>
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
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { blogApi, commentsApi, analyticsApi } from '../../utils/api'
import Chart from 'chart.js/auto'

const { t } = useI18n()
const lastUpdate = ref(new Date().toLocaleTimeString())
const chartCanvas = ref(null)
let visitChart = null

const stats = ref({
  totalBlogs: 0,
  totalViews: 0,
  totalLikes: 0,
  totalComments: 0
})

const recentBlogs = ref([])
const pendingComments = ref([])
const systemStatus = ref([
  { name: 'Database Capacity', value: 12 },
  { name: 'Image Cache', value: 45 },
  { name: 'API Response', value: 98 }
])

const statCards = computed(() => [
  { label: 'admin.totalBlogs', value: stats.value.totalBlogs, icon: 'FileTextIcon' },
  { label: 'admin.totalViews', value: stats.value.totalViews, icon: 'EyeIcon', trend: '+12%' },
  { label: 'admin.totalLikes', value: stats.value.totalLikes, icon: 'HeartIcon', trend: '+5%' },
  { label: 'admin.totalComments', value: stats.value.totalComments, icon: 'MessageIcon' }
])

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
}

const initChart = (data) => {
  if (!chartCanvas.value) return
  
  if (visitChart) visitChart.destroy()
  
  const ctx = chartCanvas.value.getContext('2d')
  const isDark = document.documentElement.classList.contains('dark')
  const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--theme-primary').trim() || '#22c55e'

  visitChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Visits',
        data: data.values,
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
    // 1. 获取核心统计
    const blogs = await blogApi.getList({ status: 'all' })
    stats.value.totalBlogs = blogs.length
    
    let totalViews = 0
    let totalLikes = 0
    let totalComments = 0
    blogs.forEach(b => {
      totalViews += b.views || 0
      totalLikes += b.likes_count || 0
      totalComments += b.comments_count || 0
    })
    
    stats.value.totalViews = totalViews
    stats.value.totalLikes = totalLikes
    stats.value.totalComments = totalComments

    // 2. 获取最近文章
    recentBlogs.value = blogs.slice(0, 5)

    // 3. 模拟图表数据（实际应从 analyticsApi 获取）
    const mockChartData = {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      values: [65, 59, 80, 81, 56, 55, 40]
    }
    initChart(mockChartData)

  } catch (error) {
    console.error('Failed to load dashboard:', error)
  }
}

onMounted(() => {
  loadDashboardData()
})

onUnmounted(() => {
  if (visitChart) visitChart.destroy()
})
</script>

