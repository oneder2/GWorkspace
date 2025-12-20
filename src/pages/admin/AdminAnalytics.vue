<!--
  数据分析页面
  显示访问统计、趋势图表、热门文章
-->
<template>
  <div class="space-y-6">
    <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200">{{ $t('admin.analytics') }}</h2>

    <!-- 总体统计 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="glass-card p-6 rounded-2xl">
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-1">{{ $t('admin.totalVisits') }}</p>
        <p class="text-3xl font-bold text-slate-800 dark:text-slate-200">{{ overview.total_visits || 0 }}</p>
      </div>
      <div class="glass-card p-6 rounded-2xl">
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-1">{{ $t('admin.uniqueVisitors') }}</p>
        <p class="text-3xl font-bold text-slate-800 dark:text-slate-200">{{ overview.unique_visitors || 0 }}</p>
      </div>
      <div class="glass-card p-6 rounded-2xl">
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-1">{{ $t('admin.popularBlogs') }}</p>
        <p class="text-3xl font-bold text-slate-800 dark:text-slate-200">{{ overview.popular_blogs?.length || 0 }}</p>
      </div>
    </div>

    <!-- 热门文章 -->
    <div class="glass-card p-6 rounded-2xl">
      <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">{{ $t('admin.popularBlogs') }}</h3>
      <div v-if="overview.popular_blogs && overview.popular_blogs.length > 0" class="space-y-3">
        <div
          v-for="item in overview.popular_blogs"
          :key="item.blog_id"
          class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
        >
          <div>
            <p class="font-semibold text-slate-800 dark:text-slate-200">Blog ID: {{ item.blog_id }}</p>
            <p class="text-sm text-slate-500 dark:text-slate-400">{{ $t('admin.visits') }}: {{ item.visit_count }}</p>
          </div>
          <router-link
            :to="`/blog/${item.blog_id}`"
            class="px-3 py-1 text-sm text-green-600 dark:text-green-400 hover:underline"
          >
            {{ $t('admin.view') }}
          </router-link>
        </div>
      </div>
      <div v-else class="text-center text-slate-500 dark:text-slate-400 py-8">
        {{ $t('admin.noData') }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { analyticsApi } from '../../utils/api'

const { t } = useI18n()

const overview = ref({
  total_visits: 0,
  unique_visitors: 0,
  popular_blogs: []
})

/**
 * 加载统计数据
 */
const loadAnalytics = async () => {
  try {
    const data = await analyticsApi.getOverview({ days: 30 })
    overview.value = data.overall || overview.value
  } catch (error) {
    console.error('Failed to load analytics:', error)
  }
}

onMounted(() => {
  loadAnalytics()
})
</script>

