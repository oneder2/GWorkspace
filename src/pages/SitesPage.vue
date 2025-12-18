<!--
  常用站点页面组件
  展示分类的网站链接，支持搜索筛选
  模块化设计，便于添加新的分类和链接
-->
<template>
  <div class="animate-fade-in relative max-w-6xl mx-auto">
    <!-- 搜索栏 - 不固定，随页面滚动 -->
    <div class="mb-6">
      <div class="flex items-center justify-between glass-card p-4 rounded-xl">
        <div>
          <h2 class="text-lg font-bold text-slate-800 dark:text-slate-200">{{ $t('sites.title') }}</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">{{ $t('sites.subtitle') }}</p>
        </div>
        <div class="relative w-full max-w-xs">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400">
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
            <div class="p-2 bg-white/60 dark:bg-slate-800/60 rounded-lg text-green-600 dark:text-green-400 shadow-sm">
              <component :is="category.icon" class="w-5 h-5" />
            </div>
            <h3 class="text-xl font-bold text-slate-800 dark:text-slate-200">{{ category.name }}</h3>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <a 
              v-for="link in category.links" 
              :key="link.title" 
              :href="link.url" 
              target="_blank" 
              class="glass-card p-4 rounded-xl flex items-start gap-3 group relative"
            >
              <div class="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-green-600 dark:group-hover:text-green-400 group-hover:bg-green-50 dark:group-hover:bg-green-900/20 transition-colors shrink-0 shadow-sm border border-slate-100 dark:border-slate-700">
                <img 
                  :src="`https://www.google.com/s2/favicons?domain=${link.url}&sz=64`" 
                  @error="$event.target.style.display='none'" 
                  class="w-6 h-6 rounded-sm opacity-90 group-hover:opacity-100 transition-opacity"
                  alt=""
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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute top-3 right-3 w-4 h-4 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                <line x1="7" y1="17" x2="17" y2="7"/>
                <polyline points="7 7 17 7 17 17"/>
              </svg>
            </a>
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

      <!-- 右侧索引 -->
      <aside v-if="filteredSites.length > 0" class="w-48 hidden xl:block shrink-0">
        <div class="sticky top-28 glass-card p-4 rounded-xl">
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
import { sitesConfig } from '../config/sites'
import { getIcon } from '../utils/iconMapper'

const siteFilter = ref('')

// 从配置文件加载站点数据，并映射图标组件
const sitesData = computed(() => {
  return sitesConfig.map(category => ({
    ...category,
    icon: getIcon(category.iconName)
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
</script>
