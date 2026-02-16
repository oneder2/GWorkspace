<!--
  博客文章详情页组件
  展示单篇博客文章的完整内容
  支持文章导航和分享功能
-->
<template>
  <div class="animate-fade-in max-w-4xl mx-auto relative">
    <!-- 阅读进度条 -->
    <div 
      v-if="post"
      class="fixed top-0 left-0 right-0 h-1 z-50 transition-all duration-300"
      style="background-color: color-mix(in srgb, var(--theme-primary) 20%, transparent);"
      :style="{ width: readingProgress + '%' }"
    ></div>
    
    <!-- 返回按钮 -->
    <button 
      @click="$router.push('/blog')"
      class="mb-6 flex items-center gap-2 text-slate-600 dark:text-slate-400 transition-colors"
      style="--hover-color: var(--theme-primary-darker); --hover-color-dark: var(--theme-primary-dark);"
      @mouseenter="const el = $event?.currentTarget; if (el) { const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark'); el.style.color = isDark ? 'var(--hover-color-dark)' : 'var(--hover-color)'; }"
      @mouseleave="const el = $event?.currentTarget; if (el) { el.style.color = ''; }"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
      <span>{{ $t('blog.backToList') }}</span>
    </button>

    <!-- 文章内容 - 响应式内边距 -->
    <article v-if="post" class="glass-card p-4 sm:p-6 md:p-8 lg:p-12 rounded-2xl">
      <!-- 文章头部 -->
      <header class="mb-8">
        <div class="flex items-center gap-3 mb-4 flex-wrap">
          <!-- Genre分类 - 显示在日期前 -->
          <span 
            class="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs rounded-md font-bold uppercase tracking-wide"
          >
            {{ post.genre || post.category }}
          </span>
          <span class="text-xs text-slate-400 dark:text-slate-500 font-mono">{{ post.date }}</span>
          <!-- 标签列表 - 显示在日期后 -->
          <div v-if="post.tags && post.tags.length > 0" class="flex items-center gap-2 flex-wrap">
            <span 
              v-for="tag in post.tags" 
              :key="tag"
              class="px-2 py-0.5 text-xs rounded-full font-semibold"
              :style="getTagStyle(tag, typeof document !== 'undefined' && document.documentElement.classList.contains('dark')).style"
            >
              #{{ tag }}
            </span>
          </div>
        </div>
        <h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-800 dark:text-slate-200 mb-4 sm:mb-6">
          {{ post.title }}
        </h1>
        <p class="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
          {{ post.excerpt }}
        </p>
      </header>

      <!-- 文章正文 -->
      <div class="prose prose-slate dark:prose-invert max-w-none">
        <div 
          class="text-slate-700 dark:text-slate-300 leading-relaxed blog-content"
          v-html="renderedContent"
        ></div>
      </div>

      <!-- 文章底部 -->
      <footer class="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <!-- 标签 -->
          <div class="flex flex-wrap gap-2">
            <span 
              v-for="tag in post.tags" 
              :key="tag"
              class="px-3 py-1 rounded-full text-xs font-bold"
              :style="getTagStyle(tag, typeof document !== 'undefined' && document.documentElement.classList.contains('dark')).style"
            >
              #{{ tag }}
            </span>
          </div>

          <!-- 分享和互动 -->
          <div class="flex items-center gap-4">
            <div class="relative">
              <button 
                @click="shareArticle"
                class="flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-slate-800/50 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"
                style="--hover-bg: color-mix(in srgb, var(--theme-primary-lighter) 50%, transparent); --hover-bg-dark: color-mix(in srgb, var(--theme-primary) 20%, transparent); --hover-text: var(--theme-primary-darker); --hover-text-dark: var(--theme-primary-dark);"
                @mouseenter="const el = $event?.currentTarget; if (el) { const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark'); el.style.backgroundColor = isDark ? 'var(--hover-bg-dark)' : 'var(--hover-bg)'; el.style.color = isDark ? 'var(--hover-text-dark)' : 'var(--hover-text)'; }"
                @mouseleave="const el = $event?.currentTarget; if (el) { el.style.backgroundColor = ''; el.style.color = ''; }"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
                <span class="text-sm">{{ shareSuccess ? $t('blog.copied') : $t('blog.share') }}</span>
              </button>
              <!-- 成功提示 -->
              <transition
                enter-active-class="transition-all duration-300"
                enter-from-class="opacity-0 scale-95"
                enter-to-class="opacity-100 scale-100"
                leave-active-class="transition-all duration-200"
                leave-from-class="opacity-100 scale-100"
                leave-to-class="opacity-0 scale-95"
              >
                <div 
                  v-if="shareSuccess"
                  class="absolute -top-12 left-1/2 -translate-x-1/2 text-white px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shadow-lg z-10"
                  style="background-color: var(--theme-primary);"
                >
                  {{ $t('blog.linkCopied') }}
                  <div class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent"
                       style="border-top-color: var(--theme-primary);"></div>
                </div>
              </transition>
            </div>
            <div class="flex items-center gap-3 text-slate-400 dark:text-slate-500 text-sm">
              <button 
                @click="toggleLike"
                class="flex items-center gap-1 transition-colors hover:text-red-500 dark:hover:text-red-400"
                :class="isLiked ? 'text-red-500 dark:text-red-400' : ''"
                :disabled="isTogglingLike"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {{ (post.likes_count !== undefined && post.likes_count !== null) ? post.likes_count : (post.likes || 0) }}
              </button>
              <span class="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                {{ post.comments ?? 0 }}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </article>

    <!-- 相关文章推荐 -->
    <div v-if="post && relatedPosts.length > 0" class="mt-8">
      <!-- 相关文章标题：使用深色确保在玻璃卡片上有足够对比度 -->
      <h3 class="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">{{ $t('blog.relatedArticles') }}</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <article
          v-for="relatedPost in relatedPosts"
          :key="relatedPost.id"
          @click="$router.push(`/blog/${relatedPost.id}`)"
          class="glass-card p-5 rounded-xl cursor-pointer transition-all group border-l-4 border-l-transparent"
          style="--hover-bg: color-mix(in srgb, var(--theme-primary-lighter) 50%, transparent); --hover-bg-dark: color-mix(in srgb, var(--theme-primary) 20%, transparent); --hover-border: var(--theme-primary);"
          @mouseenter="const el = $event?.currentTarget; if (el) { const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark'); el.style.backgroundColor = isDark ? 'var(--hover-bg-dark)' : 'var(--hover-bg)'; el.style.borderLeftColor = 'var(--hover-border)'; }"
          @mouseleave="const el = $event?.currentTarget; if (el) { el.style.backgroundColor = ''; el.style.borderLeftColor = 'transparent'; }"
        >
          <div class="flex items-center gap-2 mb-2">
            <span class="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs rounded-md font-bold uppercase">
              {{ relatedPost.category }}
            </span>
            <span class="text-xs text-slate-400 dark:text-slate-500 font-mono">{{ relatedPost.date }}</span>
          </div>
          <h4 class="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2 transition-colors"
              style="--hover-color: var(--theme-primary-darker); --hover-color-dark: var(--theme-primary-dark);"
              @mouseenter="const el = $event?.currentTarget; if (el) { const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark'); el.style.color = isDark ? 'var(--hover-color-dark)' : 'var(--hover-color)'; }"
              @mouseleave="const el = $event?.currentTarget; if (el) { el.style.color = ''; }"
          >
            {{ relatedPost.title }}
          </h4>
          <p class="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
            {{ relatedPost.excerpt }}
          </p>
        </article>
      </div>
    </div>

    <!-- 文章导航 -->
    <div v-if="post" class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
      <button 
        v-if="prevPost"
        @click="$router.push(`/blog/${prevPost.id}`)"
        class="glass-card p-4 rounded-xl text-left transition-colors group"
        style="--hover-bg: color-mix(in srgb, var(--theme-primary-lighter) 50%, transparent); --hover-bg-dark: color-mix(in srgb, var(--theme-primary) 20%, transparent);"
        @mouseenter="const el = $event?.currentTarget; if (el) { const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark'); el.style.backgroundColor = isDark ? 'var(--hover-bg-dark)' : 'var(--hover-bg)'; }"
        @mouseleave="const el = $event?.currentTarget; if (el) { el.style.backgroundColor = ''; }"
      >
        <div class="text-xs text-slate-400 dark:text-slate-500 mb-2">{{ $t('blog.prevArticle') }}</div>
        <div class="font-bold text-slate-700 dark:text-slate-300 transition-colors"
             style="--hover-color: var(--theme-primary-darker); --hover-color-dark: var(--theme-primary-dark);"
             @mouseenter="const el = $event?.currentTarget; if (el) { const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark'); el.style.color = isDark ? 'var(--hover-color-dark)' : 'var(--hover-color)'; }"
             @mouseleave="const el = $event?.currentTarget; if (el) { el.style.color = ''; }"
        >
          {{ prevPost.title }}
        </div>
      </button>
      <div v-else></div>
      <button 
        v-if="nextPost"
        @click="$router.push(`/blog/${nextPost.id}`)"
        class="glass-card p-4 rounded-xl text-left transition-colors group md:text-right"
        style="--hover-bg: color-mix(in srgb, var(--theme-primary-lighter) 50%, transparent); --hover-bg-dark: color-mix(in srgb, var(--theme-primary) 20%, transparent);"
        @mouseenter="const el = $event?.currentTarget; if (el) { const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark'); el.style.backgroundColor = isDark ? 'var(--hover-bg-dark)' : 'var(--hover-bg)'; }"
        @mouseleave="const el = $event?.currentTarget; if (el) { el.style.backgroundColor = ''; }"
      >
        <div class="text-xs text-slate-400 dark:text-slate-500 mb-2">{{ $t('blog.nextArticle') }}</div>
        <div class="font-bold text-slate-700 dark:text-slate-300 transition-colors"
             style="--hover-color: var(--theme-primary-darker); --hover-color-dark: var(--theme-primary-dark);"
             @mouseenter="const el = $event?.currentTarget; if (el) { const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark'); el.style.color = isDark ? 'var(--hover-color-dark)' : 'var(--hover-color)'; }"
             @mouseleave="const el = $event?.currentTarget; if (el) { el.style.color = ''; }"
        >
          {{ nextPost.title }}
        </div>
      </button>
    </div>

    <!-- 评论区 -->
    <CommentList v-if="post && postId" :blog-id="postId" />

    <!-- 加载中状态 -->
    <div v-else-if="isLoading" class="text-center py-20">
      <div class="flex flex-col items-center gap-4">
        <div class="w-12 h-12 border-4 border-slate-200 dark:border-slate-700 border-t-[var(--theme-primary)] rounded-full animate-spin"></div>
        <p class="text-slate-600 dark:text-slate-400">{{ t('common.loading') }}</p>
      </div>
    </div>

    <!-- 404 状态 -->
    <div v-else class="text-center py-20">
      <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">{{ $t('blog.notFound') }}</h2>
      <button 
        @click="$router.push('/blog')"
        class="px-6 py-3 text-white rounded-lg transition-colors"
        style="background-color: var(--theme-primary);"
        @mouseenter="const el = $event?.currentTarget; if (el) { el.style.backgroundColor = 'var(--theme-primary-darker)'; }"
        @mouseleave="const el = $event?.currentTarget; if (el) { el.style.backgroundColor = 'var(--theme-primary)'; }"
      >
        {{ $t('blog.backToList') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { marked } from 'marked'
import { useLocalStorage } from '../composables/useStorage'
import { useSEO, generateBlogStructuredData } from '../composables/useSEO'
import { blogApi, likesApi, analyticsApi } from '../utils/api'
import { getTagStyle } from '../utils/tagColor'
import CommentList from '../components/comments/CommentList.vue'

const route = useRoute()
const { t } = useI18n()
const shareSuccess = ref(false)

// 阅读历史管理
const { value: readingHistory } = useLocalStorage('blog-reading-history', [])

// 收藏管理
const { value: favorites } = useLocalStorage('blog-favorites', [])

/**
 * 解析文章ID，支持数字和字符串格式
 * @returns {number|null} 文章ID或null
 */
const parsePostId = () => {
  const idParam = route.params.id
  if (!idParam) return null
  
  // 尝试解析为数字
  const parsedId = parseInt(idParam, 10)
  // 检查是否为有效数字
  if (!isNaN(parsedId) && isFinite(parsedId)) {
    return parsedId
  }
  
  return null
}

/**
 * 当前文章ID（响应式）
 */
const postId = ref(parsePostId())

/**
 * 当前文章
 */
const post = ref(null)
const isLoading = ref(false)
const allPosts = ref([]) // 用于相关文章推荐

// 点赞状态
const isLiked = ref(false)
const isTogglingLike = ref(false)

/**
 * SEO 管理
 */
const { applySEO } = useSEO()

/**
 * 加载文章数据
 */
const loadPost = async () => {
  if (postId.value === null) return
  
  isLoading.value = true
  try {
    const article = await blogApi.getById(postId.value)
    post.value = article
    
    // 更新 SEO 信息
    if (article) {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const articleUrl = `${baseUrl}/blog/${article.id}`
      const articleImage = article.image || `${baseUrl}/og-image.jpg`
      
      applySEO({
        title: `${article.title} - GWorkspace`,
        description: article.excerpt || article.title,
        keywords: article.tags ? article.tags.join(', ') : 'blog, article',
        image: articleImage,
        url: articleUrl,
        type: 'article',
        structuredData: generateBlogStructuredData(article)
      })
    }
    
    // 记录访问统计
    if (article) {
      try {
        await analyticsApi.recordVisit({
          blog_id: article.id,
          path: route.path
        })
      } catch (error) {
        console.error('Failed to record visit:', error)
      }
      
      // 增加浏览量
      try {
        await blogApi.incrementViews(article.id)
        if (post.value) {
          post.value.views = (post.value.views || 0) + 1
        }
      } catch (error) {
        console.error('Failed to increment views:', error)
      }
    }
    
    // 加载所有文章用于相关推荐
    const posts = await blogApi.getList({ status: 'published' })
    allPosts.value = posts || []
    
    // 检查点赞状态
    await checkLikeStatus()
  } catch (error) {
    console.error('Failed to load post:', error)
    post.value = null
  } finally {
    isLoading.value = false
  }
}

/**
 * 检查点赞状态
 */
const checkLikeStatus = async () => {
  if (!postId.value) return
  try {
    const result = await likesApi.checkLiked(postId.value)
    isLiked.value = result.liked || false
  } catch (error) {
    console.error('Failed to check like status:', error)
  }
}

/**
 * 切换点赞状态
 */
const toggleLike = async () => {
  if (!postId.value || isTogglingLike.value) return
  
  isTogglingLike.value = true
  try {
    console.log('Toggling like for blog:', postId.value)
    const result = await likesApi.toggle(postId.value)
    console.log('Like toggle result:', result)
    
    // 更新点赞状态
    isLiked.value = result.liked || false
    
    // 更新文章的点赞数（使用返回的count，避免额外请求）
    if (post.value) {
      // 更新点赞数量，优先使用likes_count字段
      if (post.value) {
        post.value.likes_count = result.count || 0
      post.value.likes = result.count || 0
      }
    }
  } catch (error) {
    console.error('Failed to toggle like:', error)
    console.error('Error details:', error.message, error.stack)
    // 发生错误时不改变状态，保持原样
    // 重新检查点赞状态
    await checkLikeStatus()
    alert(error.message || 'Failed to toggle like')
  } finally {
    isTogglingLike.value = false
  }
}

/**
 * 监听路由变化，更新文章ID并重新加载
 * 解决路由切换时内容不更新的问题
 */
watch(() => route.params.id, (newId) => {
  const parsedId = parseInt(newId, 10)
  if (!isNaN(parsedId) && isFinite(parsedId)) {
    postId.value = parsedId
    loadPost()
  } else {
    postId.value = null
    post.value = null
  }
}, { immediate: true })

/**
 * 上一篇文章
 */
const prevPost = computed(() => {
  if (postId.value === null || allPosts.value.length === 0) return null
  const currentIndex = allPosts.value.findIndex(p => p.id === postId.value)
  return currentIndex > 0 ? allPosts.value[currentIndex - 1] : null
})

/**
 * 下一篇文章
 */
const nextPost = computed(() => {
  if (postId.value === null || allPosts.value.length === 0) return null
  const currentIndex = allPosts.value.findIndex(p => p.id === postId.value)
  return currentIndex < allPosts.value.length - 1 ? allPosts.value[currentIndex + 1] : null
})

/**
 * 计算文章相似度分数
 * @param {Object} post1 - 文章1
 * @param {Object} post2 - 文章2
 * @returns {number} 相似度分数（0-1）
 */
const calculateSimilarity = (post1, post2) => {
  if (!post1 || !post2) return 0
  
  let score = 0
  let maxScore = 0
  
  // Genre分类匹配（权重：0.4）
  maxScore += 0.4
  const genre1 = post1.genre || post1.category
  const genre2 = post2.genre || post2.category
  if (genre1 === genre2) {
    score += 0.4
  }
  
  // 标签匹配（权重：0.6）
  maxScore += 0.6
  if (post1.tags && post2.tags && Array.isArray(post1.tags) && Array.isArray(post2.tags)) {
    const commonTags = post1.tags.filter(tag => post2.tags.includes(tag))
    const totalTags = new Set([...post1.tags, ...post2.tags]).size
    if (totalTags > 0) {
      score += (commonTags.length / totalTags) * 0.6
    }
  }
  
  return maxScore > 0 ? score / maxScore : 0
}

/**
 * 相关文章推荐
 * 基于标签和分类计算相似度，推荐最相似的文章
 */
const relatedPosts = computed(() => {
  if (!post.value || allPosts.value.length === 0) return []
  
  // 排除当前文章
  const otherPosts = allPosts.value.filter(p => p.id !== postId.value)
  
  // 计算每篇文章的相似度
  const postsWithScore = otherPosts.map(p => ({
    ...p,
    similarity: calculateSimilarity(post.value, p)
  }))
  
  // 按相似度排序，取前2篇
  return postsWithScore
    .filter(p => p.similarity > 0) // 只显示有相似度的文章
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 2)
    .map(p => {
      // 移除相似度分数，只返回文章数据
      const { similarity, ...postData } = p
      return postData
    })
})

/**
 * 阅读进度（0-100）
 */
const readingProgress = ref(0)

/**
 * 计算阅读进度
 */
const calculateReadingProgress = () => {
  if (!post.value) {
    readingProgress.value = 0
    return
  }
  
  const article = document.querySelector('article')
  if (!article) {
    readingProgress.value = 0
    return
  }
  
  const articleTop = article.offsetTop
  const articleHeight = article.offsetHeight
  const windowHeight = window.innerHeight
  const scrollTop = window.scrollY || document.documentElement.scrollTop
  
  // 计算文章在视口中的可见部分
  const articleBottom = articleTop + articleHeight
  const viewportTop = scrollTop
  const viewportBottom = scrollTop + windowHeight
  
  // 计算已阅读的部分
  const readTop = Math.max(viewportTop, articleTop)
  const readBottom = Math.min(viewportBottom, articleBottom)
  const readHeight = Math.max(0, readBottom - readTop)
  
  // 计算进度百分比
  const progress = articleHeight > 0 ? (readHeight / articleHeight) * 100 : 0
  readingProgress.value = Math.min(100, Math.max(0, progress))
}

/**
 * 滚动事件处理
 */
const handleScroll = () => {
  calculateReadingProgress()
}

/**
 * 处理Markdown中的图片路径
 * 将相对路径转换为正确的URL
 * @param {string} content - Markdown内容
 * @param {string} slug - 文章slug
 * @returns {string} 处理后的内容
 */
function processImagePaths(content, slug) {
  if (!slug) return content
  
  // 将相对路径 ./images/xxx 转换为 /src/posts/slug/images/xxx
  return content.replace(
    /!\[([^\]]*)\]\(\.\/images\/([^)]+)\)/g,
    (match, alt, imageName) => {
      const imageUrl = `/src/posts/${slug}/images/${imageName}`
      return `![${alt}](${imageUrl})`
    }
  )
}

/**
 * 渲染后的Markdown内容
 */
const renderedContent = computed(() => {
  if (!post.value) return ''
  const content = post.value.content || post.value.excerpt || ''
  
  // 配置marked选项
  marked.setOptions({
    breaks: true, // 支持换行
    gfm: true, // GitHub风格Markdown
  })
  
  try {
    // 处理图片路径
    const processedContent = processImagePaths(content, post.value.slug)
    return marked.parse(processedContent)
  } catch (error) {
    console.error('Markdown parsing error:', error)
    // 如果解析失败，返回原始内容（转义HTML）
    return content.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
})

/**
 * 检查文章是否已收藏
 */
const isFavorite = computed(() => {
  if (!post.value || postId === null) return false
  return (favorites.value || []).includes(postId)
})

/**
 * 切换收藏状态
 */
const toggleFavorite = () => {
  if (!post.value || postId === null) return
  
  const favs = favorites.value || []
  const index = favs.indexOf(postId)
  
  if (index > -1) {
    // 取消收藏
    favs.splice(index, 1)
  } else {
    // 添加收藏
    favs.push(postId)
  }
  
  favorites.value = favs
}

/**
 * 记录阅读历史
 * 当文章加载时，将文章ID添加到阅读历史
 */
const recordReadingHistory = () => {
  if (!post.value || postId.value === null) return
  
  // 检查是否已在历史记录中
  const history = readingHistory.value || []
  const index = history.indexOf(postId.value)
  
  if (index > -1) {
    // 如果已存在，移除旧记录
    history.splice(index, 1)
  }
  
  // 添加到末尾（最新的在前）
  history.push(postId.value)
  
  // 限制历史记录数量（最多保留20条）
  if (history.length > 20) {
    history.shift()
  }
  
  readingHistory.value = history
}

// 监听文章变化，记录阅读历史
watch(() => post.value, () => {
  if (post.value) {
    recordReadingHistory()
  }
}, { immediate: true })

// 监听滚动事件
onMounted(() => {
  // loadPost() 已在 watch 中通过 immediate: true 调用，不需要重复调用
  window.addEventListener('scroll', handleScroll, { passive: true })
  // 初始计算一次
  setTimeout(calculateReadingProgress, 100)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
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
      // 用户取消分享或分享失败，降级到复制链接
      if (error.name !== 'AbortError') {
        await copyLink()
      }
    }
  } else {
    // 降级方案：复制链接
    await copyLink()
  }
}

/**
 * 复制文章链接
 */
const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href)
    shareSuccess.value = true
    // 3秒后隐藏提示
    setTimeout(() => {
      shareSuccess.value = false
    }, 3000)
  } catch (error) {
    console.error('Failed to copy link:', error)
    // 如果复制失败，可以显示错误提示
  }
}
</script>
