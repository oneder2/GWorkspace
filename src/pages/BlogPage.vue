<!--
  博客页面组件
  展示个人博客文章列表
  模块化设计，便于添加新文章和分类
  布局：标签和归档放在左侧空白区域，中间内容区域填充剩余空间
-->
<template>
  <div class="animate-fade-in rounded-3xl flex gap-6 xl:gap-8 min-h-full overflow-hidden">
    <!-- 左侧标签和归档 - 放在左侧空白区域，桌面端显示 -->
    <div class="glass-card w-56 hidden xl:block shrink-0 rounded-2xl">
      <div class="sticky top-6 space-y-1.5 p-4">
        <h3 class="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200">{{ $t('blog.tags') }}</h3>
        <div class="flex flex-wrap gap-2">
          <span 
            v-for="tag in tags" 
            :key="tag.name"
            class="px-3 py-1 rounded-full text-xs font-bold"
            :class="tag.color"
          >
            #{{ tag.name }}
          </span>
        </div>
        <div class="mt-6">
          <h3 class="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200">{{ $t('blog.archive') }}</h3>
          <ul class="space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <li 
              v-for="archive in archives" 
              :key="archive.month"
              class="hover:text-green-600 dark:hover:text-green-400 cursor-pointer flex justify-between"
            >
              {{ archive.month }} <span>({{ archive.count }})</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 分割线 - 更精致的样式 -->
    <div class="hidden xl:block w-px bg-gradient-to-b from-transparent via-slate-300 dark:via-slate-600 to-transparent shrink-0"></div>

    <!-- 中间内容区 - 使用flex-1占据全部剩余空间，填充到底部 -->
    <div class="flex-1 min-w-0 flex flex-col min-h-full">
      <!-- 搜索栏 -->
      <div class="mb-6 flex justify-center">
        <div class="w-full max-w-2xl">
          <BlogSearch v-model="searchQuery" />
        </div>
      </div>
      
      <!-- 文章列表 - 使用flex-1填充剩余空间 -->
      <div class="flex-1 space-y-6">
        <article 
          v-for="post in filteredPosts" 
          :key="post.id" 
          @click="$router.push(`/blog/${post.id}`)"
          class="glass-card p-6 rounded-2xl group cursor-pointer border-l-4 border-l-transparent hover:border-l-green-500 dark:hover:border-l-green-400 transition-all"
        >
          <div class="flex items-center gap-3 mb-3">
            <span 
              class="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs rounded-md font-bold uppercase tracking-wide"
            >
              {{ post.category }}
            </span>
            <span class="text-xs text-slate-400 dark:text-slate-500 font-mono">{{ post.date }}</span>
          </div>
          <h3 class="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
            {{ post.title }}
          </h3>
          <p class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4 opacity-80">
            {{ post.excerpt }}
          </p>
          <div class="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-4">
            <div class="flex items-center text-sm font-bold text-green-600 dark:text-green-400 gap-1 group-hover:gap-2 transition-all">
              {{ $t('common.readArticle') }}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </div>
            <div class="flex items-center gap-3 text-slate-400 dark:text-slate-500 text-sm">
              <span class="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                12
              </span>
              <span class="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                4
              </span>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { blogPostsConfig, blogTagsConfig, blogArchivesConfig } from '../config/blog'
import BlogSearch from '../components/BlogSearch.vue'

const router = useRouter()
const searchQuery = ref('')

// 从配置文件加载数据
const blogPosts = ref(blogPostsConfig)
const tags = blogTagsConfig
const archives = blogArchivesConfig

/**
 * 筛选后的文章列表
 * 根据搜索关键词过滤文章
 */
const filteredPosts = computed(() => {
  if (!searchQuery.value) return blogPosts.value
  
  const query = searchQuery.value.toLowerCase()
  return blogPosts.value.filter(post => 
    post.title.toLowerCase().includes(query) ||
    post.excerpt.toLowerCase().includes(query) ||
    post.category.toLowerCase().includes(query) ||
    (post.tags && post.tags.some(tag => tag.toLowerCase().includes(query)))
  )
})
</script>
