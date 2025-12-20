<!--
  管理后台仪表盘
  显示概览统计信息
-->
<template>
  <div class="space-y-6">
    <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200">{{ $t('admin.dashboard') }}</h2>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="glass-card p-6 rounded-2xl">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-1">{{ $t('admin.totalBlogs') }}</p>
            <p class="text-3xl font-bold text-slate-800 dark:text-slate-200">{{ stats.totalBlogs }}</p>
          </div>
          <div class="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 text-green-600 dark:text-green-400">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="glass-card p-6 rounded-2xl">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-1">{{ $t('admin.totalViews') }}</p>
            <p class="text-3xl font-bold text-slate-800 dark:text-slate-200">{{ stats.totalViews }}</p>
          </div>
          <div class="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 text-blue-600 dark:text-blue-400">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="glass-card p-6 rounded-2xl">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-1">{{ $t('admin.totalLikes') }}</p>
            <p class="text-3xl font-bold text-slate-800 dark:text-slate-200">{{ stats.totalLikes }}</p>
          </div>
          <div class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 text-red-600 dark:text-red-400">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="glass-card p-6 rounded-2xl">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-1">{{ $t('admin.totalComments') }}</p>
            <p class="text-3xl font-bold text-slate-800 dark:text-slate-200">{{ stats.totalComments }}</p>
          </div>
          <div class="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 text-purple-600 dark:text-purple-400">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- 快速操作 -->
    <div class="glass-card p-6 rounded-2xl">
      <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">{{ $t('admin.quickActions') }}</h3>
      <div class="flex flex-wrap gap-3">
        <router-link
          to="/admin/blogs/new"
          class="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all font-semibold"
        >
          {{ $t('admin.createBlog') }}
        </router-link>
        <router-link
          to="/admin/blogs"
          class="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-semibold"
        >
          {{ $t('admin.manageBlogs') }}
        </router-link>
        <router-link
          to="/admin/analytics"
          class="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-semibold"
        >
          {{ $t('admin.viewAnalytics') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { blogApi, analyticsApi } from '../../utils/api'

const { t } = useI18n()

const stats = ref({
  totalBlogs: 0,
  totalViews: 0,
  totalLikes: 0,
  totalComments: 0
})

/**
 * 加载统计数据
 */
const loadStats = async () => {
  try {
    // 获取所有博客
    const blogs = await blogApi.getList({ status: 'all' })
    stats.value.totalBlogs = blogs.length || 0

    // 计算总浏览量、点赞数、评论数
    let totalViews = 0
    let totalLikes = 0
    let totalComments = 0

    blogs.forEach(blog => {
      totalViews += blog.views || 0
      totalLikes += blog.likes_count || 0
      totalComments += blog.comments_count || 0
    })

    stats.value.totalViews = totalViews
    stats.value.totalLikes = totalLikes
    stats.value.totalComments = totalComments
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}

onMounted(() => {
  loadStats()
})
</script>

