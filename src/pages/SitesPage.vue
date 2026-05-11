<!--
  常用站点页面组件
  展示分类的网站链接，支持搜索筛选
  模块化设计，便于添加新的分类和链接
-->
<template>
  <div class="animate-fade-in relative max-w-6xl mx-auto">
    <!-- 搜索栏 - 不固定，随页面滚动 -->
    <div class="mb-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 surface-panel p-5 rounded-[28px]">
        <div>
          <h2 class="text-lg font-bold text-main">{{ $t('sites.title') }}</h2>
          <p class="text-xs text-muted">{{ $t('sites.subtitle') }}</p>
        </div>
        <div class="relative w-full max-w-xs">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input 
            v-model="siteFilter" 
            type="text" 
            :placeholder="$t('sites.filterPlaceholder')" 
            class="glass-input w-full pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none"
          >
        </div>
      </div>
    </div>

    <div class="flex gap-8">
      <!-- 站点列表 -->
      <div class="flex-1 space-y-8 pb-10">
        <div 
          v-for="category in filteredSites" 
          :key="category.id" 
          :id="category.id" 
          class="scroll-mt-28"
        >
          <div class="flex items-center gap-3 mb-4">
            <!-- 分类图标容器：使用明确的颜色，避免透明色问题 -->
            <div class="p-2 bg-white/60 dark:bg-slate-800/60 rounded-lg shadow-sm">
              <component :is="category.icon" class="w-5 h-5 text-slate-700 dark:text-slate-200" />
            </div>
            <!-- 分类标题：使用深色确保在背景遮罩上有足够对比度 -->
            <h3 class="text-xl font-bold text-slate-800 dark:text-slate-100 drop-shadow-sm">{{ category.name }}</h3>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div 
              v-for="link in category.links" 
              :key="link.title" 
              class="surface-card p-4 rounded-[24px] flex items-start gap-3 group relative"
            >
              <a 
                :href="link.url" 
                target="_blank" 
                rel="noopener noreferrer"
                class="flex items-start gap-3 flex-1 min-w-0"
              >
                <div class="sites-link-icon w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0 shadow-sm border border-slate-100 dark:border-slate-700"
                >
                  <img 
                    v-if="getCachedFaviconInfo(link.url).url"
                    :src="getCachedFaviconInfo(link.url).url" 
                    @load="handleIconLoad(link.url)"
                    @error="handleIconError($event, link.url)"
                    class="w-6 h-6 rounded-sm opacity-90 group-hover:opacity-100 transition-opacity"
                    :alt="link.title"
                  >
                </div>
                <div class="overflow-hidden min-w-0">
                  <div class="font-bold text-slate-700 dark:text-slate-300 truncate group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors text-sm">
                    {{ link.title }}
                  </div>
                  <div class="text-xs text-slate-500 dark:text-slate-400 truncate mt-1 opacity-80 group-hover:opacity-100">
                    {{ link.desc }}
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute top-3 right-10 w-4 h-4 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                  <line x1="7" y1="17" x2="17" y2="7"/>
                  <polyline points="7 7 17 7 17 17"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-if="filteredSites.length === 0" class="text-center py-20">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-24 h-24 mx-auto mb-4 text-slate-400">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
          <p class="text-slate-500 dark:text-slate-400">{{ $t('sites.noResults') }}</p>
        </div>
      </div>

      <!-- 右侧目录 -->
      <aside v-if="filteredSites.length > 0" class="w-48 hidden xl:block shrink-0 space-y-4">
        <!-- 分类索引 -->
        <div class="sticky top-28 surface-card p-4 rounded-[24px]">
          <h4 class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-3 tracking-wider flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            {{ $t('sites.index') }}
          </h4>
          <ul class="space-y-1">
            <li v-for="cat in filteredSites" :key="cat.id">
              <a 
                :href="'#' + cat.id" 
                class="block px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 transition-all"
              >
                {{ cat.name }}
              </a>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { sitesConfig } from '../config/sites'
import { getIcon } from '../utils/iconMapper'
import { getCachedFaviconUrl, markFaviconSuccess, markFaviconError } from '../utils/faviconCache'

const siteFilter = ref('')
const { t } = useI18n()

// 从配置文件加载站点数据，并映射图标组件
const sitesData = computed(() => {
  return sitesConfig.map(category => ({
    ...category,
    name: t(category.nameKey),
    icon: getIcon(category.iconName),
    links: category.links.map(link => ({
      ...link,
      desc: t(link.descKey)
    }))
  }))
})

/**
 * 筛选后的站点数据
 * 根据搜索关键词过滤分类和链接
 */
const filteredSites = computed(() => {
  if (!siteFilter.value) return sitesData.value
  const query = siteFilter.value.toLowerCase()
  return sitesData.value.map(cat => ({
    ...cat,
    links: cat.links.filter(link => 
      link.title.toLowerCase().includes(query) || 
      link.desc.toLowerCase().includes(query)
    )
  })).filter(cat => cat.links.length > 0)
})

/**
 * 获取缓存的Favicon信息
 * @param {string} url - 网站URL
 * @returns {Object} Favicon信息
 */
const getCachedFaviconInfo = (url) => {
  return getCachedFaviconUrl(url, 64)
}

/**
 * 处理图标加载成功
 * 标记favicon加载成功，更新缓存
 * @param {string} url - 网站URL
 */
const handleIconLoad = (url) => {
  markFaviconSuccess(url, 64)
}

/**
 * 处理图标加载错误
 * 当favicon加载失败时，隐藏图片元素并标记失败
 * @param {Event} event - 错误事件
 * @param {string} url - 网站URL
 */
const handleIconError = (event, url) => {
  // 标记加载失败
  if (url) {
    markFaviconError(url)
  }
  // 隐藏图片
  if (event.target) {
    event.target.style.display = 'none'
  }
}
</script>

<style scoped>
/* 导入页面样式 */
@import '../styles/pages/SitesPage.css';
</style>
