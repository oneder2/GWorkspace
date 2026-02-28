<!--
  博客文章详情页组件
  展示单篇博客文章的完整内容
  支持文章导航和分享功能
-->
<template>
  <div class="animate-fade-in max-w-6xl mx-auto relative pb-24 px-4 lg:px-0">
    <!-- 阅读进度条 -->
    <div 
      v-if="post"
      class="fixed top-0 left-0 right-0 h-1 z-50 transition-all duration-300"
      style="background-color: color-mix(in srgb, var(--theme-primary) 20%, transparent);"
      :style="{ width: readingProgress + '%' }"
    ></div>
    
    <div class="flex flex-col lg:flex-row gap-8 items-start justify-center">
      <!-- 主体内容 -->
      <div class="w-full max-w-4xl min-w-0">
        <!-- 返回按钮 -->
        <button 
          @click="$router.push('/blog')"
          class="mb-6 flex items-center gap-2 text-secondary transition-colors"
          style="--hover-color: var(--theme-primary-darker); --hover-color-dark: var(--theme-primary-dark);"
          @mouseenter="handleBackBtnHoverEnter"
          @mouseleave="handleBackBtnHoverLeave"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          <span>{{ $t('blog.backToList') }}</span>
        </button>

        <!-- 文章内容 -->
        <article v-if="post" class="glass-card p-4 sm:p-6 md:p-8 lg:p-12 rounded-2xl overflow-hidden">
          <!-- 文章头部 -->
          <header class="mb-8">
            <div class="flex items-center gap-3 mb-4 flex-wrap">
              <span class="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-secondary text-xs rounded-md font-bold uppercase tracking-wide">
                {{ post.genre || post.category }}
              </span>
              <span class="text-xs text-muted font-mono" :title="$t('blog.publishedAt') || '发布于'">
                {{ formatDateTime(post.published_at || post.date, true) }}
              </span>
              <div v-if="post.tags && post.tags.length > 0" class="flex items-center gap-2 flex-wrap">
                <span 
                  v-for="tag in post.tags" 
                  :key="tag"
                  class="px-2 py-0.5 text-xs rounded-full font-semibold"
                  :style="getTagStyle(tag, isDarkGlobal).style"
                >
                  #{{ tag }}
                </span>
              </div>
            </div>
            <h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-main mb-4 sm:mb-6 leading-tight">
              {{ post.title }}
            </h1>
            <p class="text-lg text-secondary leading-relaxed opacity-80">
              {{ post.excerpt }}
            </p>
          </header>

          <div class="prose prose-slate dark:prose-invert max-w-none">
            <div 
              class="text-secondary leading-relaxed blog-content"
              v-html="renderedContent"
              @click="handleContentClick"
            ></div>
          </div>

          <footer class="mt-12 pt-8 border-t border-border-base flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="text-xs text-muted space-y-1">
              <p>{{ $t('blog.publishedAt') || '发布于' }}: {{ formatDateTime(post.published_at || post.date, true) }}</p>
              <p v-if="post.updated_at && post.updated_at !== (post.published_at || post.date)">
                {{ $t('blog.updatedAt') || '最后更新' }}: {{ formatDateTime(post.updated_at, true) }}
              </p>
            </div>
            <div class="lg:hidden flex items-center gap-2">
              <button @click="toggleLike" class="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 text-red-500 rounded-lg text-sm font-bold">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" :fill="isLiked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                {{ post.likes_count || 0 }}
              </button>
              <button @click="generatePoster" class="flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-white/5 text-secondary rounded-lg text-sm font-bold">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                {{ $t('blog.share') }}
              </button>
            </div>
          </footer>
        </article>

        <!-- 404 状态 -->
        <div v-else-if="!isLoading" class="text-center py-20">
          <h2 class="text-2xl font-bold text-main mb-4">{{ $t('blog.notFound') }}</h2>
          <button @click="$router.push('/blog')" class="px-6 py-3 text-white rounded-lg" style="background-color: var(--theme-primary);">{{ $t('blog.backToList') }}</button>
        </div>

        <!-- 加载中状态 -->
        <div v-else class="text-center py-20">
          <div class="flex flex-col items-center gap-4">
            <div class="w-12 h-12 border-4 border-slate-200 dark:border-slate-700 border-t-[var(--theme-primary)] rounded-full animate-spin"></div>
            <p class="text-secondary">{{ t('common.loading') }}</p>
          </div>
        </div>

        <!-- 底部导航和推荐 -->
        <div v-if="post" class="mt-8 space-y-8">
          <!-- 相关文章推荐 -->
          <div v-if="relatedPosts.length > 0">
            <h3 class="text-xl font-bold text-main mb-4">{{ $t('blog.relatedArticles') }}</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <article v-for="relatedPost in relatedPosts" :key="relatedPost.id" @click="$router.push(`/blog/${relatedPost.id}`)" class="glass-card p-5 rounded-xl cursor-pointer transition-all group border-l-4 border-l-transparent" style="--hover-bg: color-mix(in srgb, var(--theme-primary-lighter) 50%, transparent); --hover-bg-dark: color-mix(in srgb, var(--theme-primary) 20%, transparent); --hover-border: var(--theme-primary);" @mouseenter="handleRelatedPostHoverEnter" @mouseleave="handleRelatedPostHoverLeave"><div class="flex items-center gap-2 mb-2"><span class="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-secondary text-xs rounded-md font-bold uppercase">{{ relatedPost.category }}</span><span class="text-xs text-muted font-mono">{{ relatedPost.date }}</span></div><h4 class="text-lg font-bold text-main mb-2 transition-colors" style="--hover-color: var(--theme-primary-darker); --hover-color-dark: var(--theme-primary-dark);" @mouseenter="handleRelatedTitleHoverEnter" @mouseleave="handleRelatedTitleHoverLeave">{{ relatedPost.title }}</h4><p class="text-sm text-secondary line-clamp-2">{{ relatedPost.excerpt }}</p></article>
            </div>
          </div>

          <!-- 文章导航 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button v-if="prevPost" @click="$router.push(`/blog/${prevPost.id}`)" class="glass-card p-4 rounded-xl text-left transition-colors group" style="--hover-bg: color-mix(in srgb, var(--theme-primary-lighter) 50%, transparent); --hover-bg-dark: color-mix(in srgb, var(--theme-primary) 20%, transparent);" @mouseenter="handleNavBtnHoverEnter" @mouseleave="handleNavBtnHoverLeave"><div class="text-xs text-muted mb-2">{{ $t('blog.prevArticle') }}</div><div class="font-bold text-secondary transition-colors" style="--hover-color: var(--theme-primary-darker); --hover-color-dark: var(--theme-primary-dark);" @mouseenter="handleNavTitleHoverEnter" @mouseleave="handleNavTitleHoverLeave">{{ prevPost.title }}</div></button>
            <div v-else></div>
            <button v-if="nextPost" @click="$router.push(`/blog/${nextPost.id}`)" class="glass-card p-4 rounded-xl text-left transition-colors group md:text-right" style="--hover-bg: color-mix(in srgb, var(--theme-primary-lighter) 50%, transparent); --hover-bg-dark: color-mix(in srgb, var(--theme-primary) 20%, transparent);" @mouseenter="handleNavBtnHoverEnter" @mouseleave="handleNavBtnHoverLeave"><div class="text-xs text-muted mb-2">{{ $t('blog.nextArticle') }}</div><div class="font-bold text-secondary transition-colors" style="--hover-color: var(--theme-primary-darker); --hover-color-dark: var(--theme-primary-dark);" @mouseenter="handleNavTitleHoverEnter" @mouseleave="handleNavTitleHoverLeave">{{ nextPost.title }}</div></button>
          </div>

          <!-- 评论区 -->
          <CommentList v-if="postId" :blog-id="postId" />
        </div>
      </div>

      <!-- 右侧信息栏 (仅大屏显示) -->
      <aside class="hidden lg:block w-72 sticky top-24 space-y-6 max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar">
        <!-- 文章概览卡片 -->
        <div v-if="post" class="glass-card p-6 rounded-2xl animate-fade-in">
          <h3 class="text-xs font-bold text-muted mb-4 uppercase tracking-widest">{{ $t('blog.articleOverview') || '文章概览' }}</h3>
          
          <div class="space-y-4">
            <!-- 统计数据 -->
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col">
                <span class="text-2xl font-bold text-main">{{ post.views || 0 }}</span>
                <span class="text-xs text-muted">{{ $t('blog.views') || '阅读量' }}</span>
              </div>
              <div class="flex flex-col">
                <span class="text-2xl font-bold text-main">{{ readingTime }}</span>
                <span class="text-xs text-muted">{{ $t('blog.readingTime') || '分钟阅读' }}</span>
              </div>
            </div>

            <!-- 互动按钮 -->
            <div class="flex items-center gap-2 pt-2">
              <button 
                @click="toggleLike" 
                class="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all"
                :class="isLiked ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-white/5 text-secondary hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500'"
                :disabled="isTogglingLike"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" :fill="isLiked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" class="w-4 h-4">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <span class="text-sm font-bold">{{ post.likes_count || 0 }}</span>
              </button>
              
              <button 
                @click="generatePoster"
                class="px-4 py-2 bg-slate-100 dark:bg-white/5 text-secondary rounded-xl hover:bg-[var(--theme-primary)] hover:text-white transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              </button>
            </div>

            <!-- 标签 -->
            <div v-if="post.tags && post.tags.length > 0" class="pt-2">
              <div class="flex flex-wrap gap-2">
                <span 
                  v-for="tag in post.tags" 
                  :key="tag"
                  class="px-2 py-1 text-[10px] rounded-md font-bold transition-transform hover:scale-105 cursor-default"
                  :style="getTagStyle(tag, isDarkGlobal).style"
                >
                  #{{ tag }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 目录卡片 -->
        <div v-if="toc.length > 0" class="glass-card p-6 rounded-2xl">
          <h3 class="text-xs font-bold text-muted mb-4 uppercase tracking-widest flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            {{ $t('blog.toc') }}
          </h3>
          <ul class="space-y-3">
            <li 
              v-for="item in toc" 
              :key="item.id"
              :style="{ paddingLeft: (item.level - 2) * 1 + 'rem' }"
              class="transition-all duration-300"
            >
              <button 
                @click="scrollToAnchor(item.id)"
                class="text-sm text-left transition-all hover:text-[var(--theme-primary)] block w-full truncate py-0.5"
                :class="activeId === item.id ? 'toc-item-active' : 'text-muted'"
              >
                {{ item.title }}
              </button>
            </li>
          </ul>
        </div>
      </aside>
    </div>

    <!-- 海报预览弹窗 -->
    <teleport to="body">
      <transition
        enter-active-class="transition-opacity duration-300"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showPosterModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" @click="showPosterModal = false">
          <div 
            class="glass-card max-w-3xl w-full rounded-3xl overflow-hidden relative animate-fade-in shadow-2xl border border-white/20"
            @click.stop
          >
            <!-- 关闭按钮 -->
            <button 
              @click="showPosterModal = false"
              class="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <!-- 海报内容 -->
            <div class="p-6 sm:p-8">
              <h3 class="text-xl font-bold text-main mb-6 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[var(--theme-primary)]"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                {{ $t('blog.sharingCard') }}
              </h3>
              
              <!-- 图片预览 -->
              <div class="relative group rounded-xl overflow-hidden shadow-inner bg-slate-100 dark:bg-slate-800 aspect-[1.91/1]">
                <img 
                  :src="posterUrl" 
                  class="w-full h-full object-contain"
                  alt="Sharing Poster"
                />
              </div>

              <!-- 链接展示区 -->
              <div class="mt-6 p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10 flex items-center justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <p class="text-xs text-muted mb-1">{{ $t('blog.articleLink') || '文章链接' }}</p>
                  <p class="text-sm font-mono truncate text-secondary">{{ articleUrl }}</p>
                </div>
                <button 
                  @click="shareArticle"
                  class="shrink-0 p-2 hover:bg-[var(--theme-primary)] hover:text-white rounded-lg transition-all text-secondary"
                  :title="$t('common.copy')"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
              </div>

              <!-- 操作栏 -->
              <div class="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p class="text-sm text-secondary opacity-70">
                  <span class="hidden sm:inline">长按图片或点击右侧按钮保存到相册</span>
                  <span class="sm:hidden">长按图片保存到相册</span>
                </p>
                <button 
                  @click="downloadPoster"
                  class="w-full sm:w-auto px-8 py-3 bg-[var(--theme-primary)] text-white rounded-xl font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  {{ $t('blog.savePoster') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { marked } from 'marked'
import mediumZoom from 'medium-zoom'
import { useLocalStorage } from '../composables/useStorage'
import { useSEO, generateBlogStructuredData } from '../composables/useSEO'
import { blogApi, likesApi, analyticsApi } from '../utils/api'
import { getTagStyle } from '../utils/tagColor'
import CommentList from '../components/comments/CommentList.vue'

// --- 1. 响应式状态定义 ---
const route = useRoute()
const { t } = useI18n()
const shareSuccess = ref(false)
const showPosterModal = ref(false)
const post = ref(null)
const postId = ref(null)
const isLoading = ref(false)
const allPosts = ref([])
const isLiked = ref(false)
const isTogglingLike = ref(false)
const toc = ref([])
const activeId = ref('')
const readingProgress = ref(0)
const zoomInstance = ref(null)

/**
 * 格式化日期时间
 * 修复时区偏差，并支持分钟精度
 */
const formatDateTime = (dateStr, showTime = false) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  
  if (showTime) {
    const hh = String(date.getHours()).padStart(2, '0')
    const mm = String(date.getMinutes()).padStart(2, '0')
    return `${y}-${m}-${d} ${hh}:${mm}`
  }
  return `${y}-${m}-${d}`
}

/**
 * 计算预计阅读时间 (300字/分钟)
 */
const readingTime = computed(() => {
  if (!post.value?.content) return 0
  const text = post.value.content.replace(/[#*`>!\[\]\(\)-]/g, '')
  return Math.ceil(text.length / 300) || 1
})

// --- 2. 核心辅助计算 ---
// 安全获取暗色模式状态（用于模板）
const isDarkGlobal = computed(() => {
  if (typeof document === 'undefined') return false
  return document.documentElement.classList.contains('dark')
})

// 核心滚动容器获取
function getScrollContainer() {
  if (typeof document === 'undefined') return null
  return document.getElementById('main-scroll')
}

const generateHeadingId = (text) => {
  if (!text) return ''
  return text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]+/g, '').slice(0, 50)
}

// --- 3. 推荐系统算法 ---
const calculateSimilarity = (post1, post2) => {
  if (!post1 || !post2) return 0
  let score = 0
  let maxScore = 1.0
  // 分类匹配 (0.4)
  if ((post1.genre || post1.category) === (post2.genre || post2.category)) score += 0.4
  // 标签匹配 (0.6)
  if (post1.tags && post2.tags) {
    const common = post1.tags.filter(t => post2.tags.includes(t))
    const total = new Set([...post1.tags, ...post2.tags]).size
    if (total > 0) score += (common.length / total) * 0.6
  }
  return score / maxScore
}

const relatedPosts = computed(() => {
  if (!post.value || !allPosts.value || allPosts.value.length === 0) return []
  return allPosts.value
    .filter(p => p && p.id !== post.value.id)
    .map(p => ({ ...p, score: calculateSimilarity(post.value, p) }))
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
})

// --- 4. 业务逻辑函数 ---
const initImageZoom = () => {
  const images = document.querySelectorAll('.blog-content img')
  if (images.length === 0) return
  if (zoomInstance.value) zoomInstance.value.detach()
  zoomInstance.value = mediumZoom(images, {
    margin: 24,
    background: 'transparent',
    scrollOffset: 0,
    container: document.body
  })
}

const generateTOC = () => {
  nextTick(() => {
    setTimeout(() => {
      const contentEl = document.querySelector('.blog-content')
      if (!contentEl) return
      const headings = []
      const headingElements = contentEl.querySelectorAll('h2[id], h3[id]')
      headingElements.forEach((el) => {
        headings.push({
          id: el.id,
          title: el.innerText.replace('#', '').trim(),
          level: parseInt(el.tagName.substring(1))
        })
      })
      toc.value = headings
      updateActiveTOC()
    }, 500)
  })
}

const scrollToAnchor = (id) => {
  const el = document.getElementById(id)
  const container = getScrollContainer()
  if (!el || !container) return
  activeId.value = id
  const containerRect = container.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
  const targetY = elRect.top - containerRect.top + container.scrollTop - 24
  container.scrollTo({ top: targetY, behavior: 'smooth' })
}

const updateActiveTOC = () => {
  const container = getScrollContainer()
  if (!container || toc.value.length === 0) return
  const threshold = 120
  let currentActiveId = ''
  for (const heading of toc.value) {
    const el = document.getElementById(heading.id)
    if (!el) continue
    const rect = el.getBoundingClientRect()
    if (rect.top - container.getBoundingClientRect().top <= threshold) {
      currentActiveId = heading.id
    } else {
      break
    }
  }
  if (currentActiveId) activeId.value = currentActiveId
}

const calculateReadingProgress = () => {
  const container = getScrollContainer()
  if (!container || !post.value) return
  const scrollHeight = container.scrollHeight - container.clientHeight
  if (scrollHeight <= 0) return
  const progress = (container.scrollTop / scrollHeight) * 100
  readingProgress.value = Math.min(100, Math.max(0, progress))
}

const handleScroll = () => {
  calculateReadingProgress()
  updateActiveTOC()
}

// --- 5. 接口与 SEO ---
const { applySEO } = useSEO()

const loadPost = async () => {
  const postIdVal = parseInt(route.params.id)
  if (isNaN(postIdVal)) return
  postId.value = postIdVal
  isLoading.value = true
  try {
    const article = await blogApi.getById(postIdVal)
    post.value = article
    if (article) {
      const apiBaseUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://workspace.gellaronline.cc/api' : 'http://localhost:3001/api')
      applySEO({
        title: `${article.title} - GWorkspace`,
        description: article.excerpt || article.title,
        keywords: article.tags?.join(', '),
        image: article.image || `${apiBaseUrl}/blogs/${article.id}/og-image`,
        url: `${window.location.origin}/blog/${article.id}`,
        type: 'article',
        structuredData: generateBlogStructuredData(article)
      })
      await analyticsApi.recordVisit({ blog_id: article.id, path: route.path })
      await blogApi.incrementViews(article.id)
    }
    allPosts.value = await blogApi.getList({ status: 'published' }) || []
    await checkLikeStatus()
  } catch (error) { 
    console.error('Load post failed:', error) 
  } finally { 
    isLoading.value = false 
  }
}

const checkLikeStatus = async () => {
  if (post.value) {
    try {
      const res = await likesApi.checkLiked(post.value.id)
      isLiked.value = res.liked || false
    } catch (e) {}
  }
}

const toggleLike = async () => {
  if (!post.value || isTogglingLike.value) return
  isTogglingLike.value = true
  try {
    const res = await likesApi.toggle(post.value.id)
    isLiked.value = res.liked
    if (post.value) post.value.likes_count = res.count
  } finally { 
    isTogglingLike.value = false 
  }
}

// --- 6. 导航与历史 ---
const prevPost = computed(() => {
  if (!post.value || allPosts.value.length === 0) return null
  const idx = allPosts.value.findIndex(p => p.id === post.value.id)
  return idx > 0 ? allPosts.value[idx - 1] : null
})

const nextPost = computed(() => {
  if (!post.value || allPosts.value.length === 0) return null
  const idx = allPosts.value.findIndex(p => p.id === post.value.id)
  return idx < allPosts.value.length - 1 ? allPosts.value[idx + 1] : null
})

const { value: readingHistory } = useLocalStorage('blog-reading-history', [])
const recordReadingHistory = () => {
  if (!post.value) return
  const history = [...(readingHistory.value || [])]
  const idx = history.indexOf(post.value.id)
  if (idx > -1) history.splice(idx, 1)
  history.push(post.value.id)
  if (history.length > 20) history.shift()
  readingHistory.value = history
}

// --- 7. 海报功能 ---
const generatePoster = () => { showPosterModal.value = true }

const articleUrl = computed(() => {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/blog/${post.value?.id}`
})

const posterUrl = computed(() => {
  if (!post.value) return ''
  const apiBaseUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://workspace.gellaronline.cc/api' : 'http://localhost:3001/api')
  return `${apiBaseUrl}/blogs/${post.value.id}/og-image?type=poster`
})
const downloadPoster = async () => {
  try {
    const res = await fetch(posterUrl.value)
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `poster-${post.value?.slug || 'blog'}.png`
    a.click(); window.URL.revokeObjectURL(url)
  } catch (e) { console.error(e) }
}

// --- 8. 渲染与交互 ---
const renderedContent = computed(() => {
  if (!post.value) return ''
  const renderer = new marked.Renderer()
  renderer.code = ({ text, lang }) => {
    const id = `code-${Math.random().toString(36).substr(2, 9)}`
    return `<div class="code-block-wrapper group"><div class="code-block-header"><div class="code-block-dots"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span></div><span class="code-block-lang">${lang || 'text'}</span><button class="copy-button" data-code-id="${id}"><span class="copy-text">${t('common.copy')}</span></button></div><pre><code class="hljs language-${lang || 'text'}" id="${id}">${text}</code></pre></div>`
  }
  renderer.heading = ({ text, depth, raw }) => {
    const id = generateHeadingId(raw)
    return `<h${depth} id="${id}" class="scroll-mt-24 group flex items-center transition-all duration-300">${text}<a href="#${id}" class="opacity-0 group-hover:opacity-40 ml-2 no-underline">#</a></h${depth}>`
  }
  marked.setOptions({ renderer, breaks: true, gfm: true })
  return marked.parse(post.value.content.replace(/!\[([^\]]*)\]\(\.\/images\/([^)]+)\)/g, (m, alt, img) => `![${alt}](/src/posts/${post.value?.slug}/images/${img})`))
})

const handleContentClick = async (e) => {
  const btn = e.target.closest('.copy-button')
  if (!btn) return
  const codeEl = document.getElementById(btn.dataset.codeId)
  if (!codeEl) return
  await navigator.clipboard.writeText(codeEl.innerText)
  const txt = btn.querySelector('.copy-text')
  if (txt) {
    const old = txt.innerText; txt.innerText = t('blog.copied')
    setTimeout(() => { txt.innerText = old }, 2000)
  }
}

// --- 9. Watchers & Lifecycle ---
watch(() => renderedContent.value, () => { nextTick(() => { initImageZoom(); generateTOC() }) }, { immediate: true })
watch(() => route.params.id, loadPost, { immediate: true })
watch(() => post.value, (newVal) => { if (newVal) recordReadingHistory() })

onMounted(() => {
  const c = getScrollContainer()
  if (c) c.addEventListener('scroll', handleScroll, { passive: true })
  setTimeout(handleScroll, 500)
})
onUnmounted(() => {
  const c = getScrollContainer()
  if (c) c.removeEventListener('scroll', handleScroll)
})

// --- 10. 交互逻辑 ---
const shareArticle = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href)
    shareSuccess.value = true
    setTimeout(() => { shareSuccess.value = false }, 3000)
  } catch (e) {}
}

const handleBackBtnHoverEnter = (e) => { e.currentTarget.style.color = isDarkGlobal.value ? 'var(--theme-primary-light)' : 'var(--theme-primary-darker)' }
const handleBackBtnHoverLeave = (e) => { e.currentTarget.style.color = '' }
const handleShareBtnHoverEnter = (e) => { 
  e.currentTarget.style.backgroundColor = isDarkGlobal.value ? 'var(--hover-bg-dark)' : 'var(--hover-bg)' 
  e.currentTarget.style.color = isDarkGlobal.value ? 'var(--hover-text-dark)' : 'var(--hover-text)'
}
const handleShareBtnHoverLeave = (e) => { 
  e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = '' 
}
const handleRelatedPostHoverEnter = (e) => {
  e.currentTarget.style.backgroundColor = isDarkGlobal.value ? 'var(--hover-bg-dark)' : 'var(--hover-bg)'
  e.currentTarget.style.borderLeftColor = 'var(--hover-border)'
}
const handleRelatedPostHoverLeave = (e) => {
  e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.borderLeftColor = 'transparent'
}
const handleRelatedTitleHoverEnter = (e) => { e.currentTarget.style.color = isDarkGlobal.value ? 'var(--hover-color-dark)' : 'var(--hover-color)' }
const handleRelatedTitleHoverLeave = (e) => { e.currentTarget.style.color = '' }
const handleNavBtnHoverEnter = (e) => { e.currentTarget.style.backgroundColor = isDarkGlobal.value ? 'var(--hover-bg-dark)' : 'var(--hover-bg)' }
const handleNavBtnHoverLeave = (e) => { e.currentTarget.style.backgroundColor = '' }
const handleNavTitleHoverEnter = (e) => { e.currentTarget.style.color = isDarkGlobal.value ? 'var(--hover-color-dark)' : 'var(--hover-color)' }
const handleNavTitleHoverLeave = (e) => { e.currentTarget.style.color = '' }
</script>
