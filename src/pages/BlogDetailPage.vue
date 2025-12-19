<!--
  博客文章详情页组件
  展示单篇博客文章的完整内容
  支持文章导航和分享功能
-->
<template>
  <div class="animate-fade-in max-w-4xl mx-auto">
    <!-- 返回按钮 -->
    <button 
      @click="$router.push('/blog')"
      class="mb-6 flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
      <span>{{ $t('blog.backToList') }}</span>
    </button>

    <!-- 文章内容 -->
    <article v-if="post" class="glass-card p-8 md:p-12 rounded-2xl">
      <!-- 文章头部 -->
      <header class="mb-8">
        <div class="flex items-center gap-3 mb-4">
          <span 
            class="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs rounded-md font-bold uppercase tracking-wide"
          >
            {{ post.category }}
          </span>
          <span class="text-xs text-slate-400 dark:text-slate-500 font-mono">{{ post.date }}</span>
        </div>
        <h1 class="text-4xl md:text-5xl font-bold text-slate-800 dark:text-slate-200 mb-6">
          {{ post.title }}
        </h1>
        <p class="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
          {{ post.excerpt }}
        </p>
      </header>

      <!-- 文章正文 -->
      <div class="prose prose-slate dark:prose-invert max-w-none">
        <div class="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
          {{ post.content || post.excerpt }}
        </div>
      </div>

      <!-- 文章底部 -->
      <footer class="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <!-- 标签 -->
          <div class="flex flex-wrap gap-2">
            <span 
              v-for="tag in post.tags" 
              :key="tag"
              class="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-xs font-bold"
            >
              #{{ tag }}
            </span>
          </div>

          <!-- 分享和互动 -->
          <div class="flex items-center gap-4">
            <button 
              @click="shareArticle"
              class="flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-slate-800/50 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
              <span class="text-sm">{{ $t('blog.share') }}</span>
            </button>
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
        </div>
      </footer>
    </article>

    <!-- 文章导航 -->
    <div v-if="post" class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
      <button 
        v-if="prevPost"
        @click="$router.push(`/blog/${prevPost.id}`)"
        class="glass-card p-4 rounded-xl text-left hover:bg-green-50/50 dark:hover:bg-green-900/20 transition-colors group"
      >
        <div class="text-xs text-slate-400 dark:text-slate-500 mb-2">{{ $t('blog.prevArticle') }}</div>
        <div class="font-bold text-slate-700 dark:text-slate-300 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
          {{ prevPost.title }}
        </div>
      </button>
      <div v-else></div>
      <button 
        v-if="nextPost"
        @click="$router.push(`/blog/${nextPost.id}`)"
        class="glass-card p-4 rounded-xl text-left hover:bg-green-50/50 dark:hover:bg-green-900/20 transition-colors group md:text-right"
      >
        <div class="text-xs text-slate-400 dark:text-slate-500 mb-2">{{ $t('blog.nextArticle') }}</div>
        <div class="font-bold text-slate-700 dark:text-slate-300 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
          {{ nextPost.title }}
        </div>
      </button>
    </div>

    <!-- 404 状态 -->
    <div v-else class="text-center py-20">
      <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">{{ $t('blog.notFound') }}</h2>
      <button 
        @click="$router.push('/blog')"
        class="px-6 py-3 bg-green-500 dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-700 transition-colors"
      >
        {{ $t('blog.backToList') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { blogPostsConfig } from '../config/blog'

const route = useRoute()
const postId = parseInt(route.params.id)

/**
 * 当前文章
 */
const post = computed(() => {
  return blogPostsConfig.find(p => p.id === postId)
})

/**
 * 上一篇文章
 */
const prevPost = computed(() => {
  const currentIndex = blogPostsConfig.findIndex(p => p.id === postId)
  return currentIndex > 0 ? blogPostsConfig[currentIndex - 1] : null
})

/**
 * 下一篇文章
 */
const nextPost = computed(() => {
  const currentIndex = blogPostsConfig.findIndex(p => p.id === postId)
  return currentIndex < blogPostsConfig.length - 1 ? blogPostsConfig[currentIndex + 1] : null
})

/**
 * 分享文章
 */
const shareArticle = async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: post.value.title,
        text: post.value.excerpt,
        url: window.location.href
      })
    } catch (error) {
      // 用户取消分享
    }
  } else {
    // 降级方案：复制链接
    await navigator.clipboard.writeText(window.location.href)
    // TODO: 显示成功提示
  }
}
</script>
