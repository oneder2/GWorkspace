<!--
  最新文章推荐栏组件
  显示在Header下方，展示最新发布的文章
-->
<template>
  <transition
    enter-active-class="transition ease-out duration-300"
    enter-from-class="opacity-0 -translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-2"
  >
    <div 
      v-if="latestArticles.length > 0 && showBar"
      class="px-4 sm:px-6 md:px-8 py-3 border-b border-white/30 dark:border-slate-700/30 bg-white/20 dark:bg-slate-900/20 backdrop-blur-sm"
    >
      <div class="flex items-center gap-4 overflow-x-auto scrollbar-hide">
        <div class="flex items-center gap-2 shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-slate-600 dark:text-slate-400">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          <span class="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
            {{ $t('blog.latestArticles') }}:
          </span>
        </div>
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <a
            v-for="article in latestArticles"
            :key="article.id"
            :href="`/blog/${article.id}`"
            @click.prevent="$router.push(`/blog/${article.id}`)"
            class="shrink-0 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 whitespace-nowrap"
            style="--hover-bg: color-mix(in srgb, var(--theme-primary-lighter) 50%, transparent); --hover-bg-dark: color-mix(in srgb, var(--theme-primary) 20%, transparent);"
            @mouseenter="$event.currentTarget.style.backgroundColor = document.documentElement.classList.contains('dark') ? 'var(--hover-bg-dark)' : 'var(--hover-bg)'"
            @mouseleave="$event.currentTarget.style.backgroundColor = ''"
            :class="{
              'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200': true
            }"
          >
            {{ article.title }}
          </a>
        </div>
        <button
          @click="showBar = false"
          class="shrink-0 p-1 rounded-lg hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors"
          :title="$t('common.close')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-slate-500 dark:text-slate-400">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { blogApi } from '../utils/api'

const router = useRouter()
const latestArticles = ref([])
const showBar = ref(true)

/**
 * 加载最新文章
 */
const loadLatestArticles = async () => {
  try {
    const articles = await blogApi.getList({
      status: 'published',
      limit: 5,
      sortBy: 'published_at',
      sortOrder: 'desc'
    })
    latestArticles.value = articles || []
  } catch (error) {
    console.error('Failed to load latest articles:', error)
  }
}

// 初始化时加载最新文章
onMounted(() => {
  loadLatestArticles()
})
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>

