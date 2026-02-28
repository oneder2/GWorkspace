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
              <span class="text-xs text-muted font-mono">{{ post.date }}</span>
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

          <footer class="mt-12 pt-8 border-t border-border-base">
            <!-- 保持原有的 footer 内容 -->
            <div class="flex items-center justify-between flex-wrap gap-4">
              <div class="flex flex-wrap gap-2">
                <span v-for="tag in post.tags" :key="tag" class="px-3 py-1 rounded-full text-xs font-bold" :style="getTagStyle(tag, typeof document !== 'undefined' && document.documentElement.classList.contains('dark')).style">#{{ tag }}</span>
              </div>
              <div class="flex items-center gap-4">
                <div class="relative">
                  <button @click="shareArticle" class="flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-slate-800/50 rounded-lg text-secondary transition-colors" style="--hover-bg: color-mix(in srgb, var(--theme-primary-lighter) 50%, transparent); --hover-bg-dark: color-mix(in srgb, var(--theme-primary) 20%, transparent); --hover-text: var(--theme-primary-darker); --hover-text-dark: var(--theme-primary-dark);" @mouseenter="handleShareBtnHoverEnter" @mouseleave="handleShareBtnHoverLeave">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                    <span class="text-sm">{{ shareSuccess ? $t('blog.copied') : $t('blog.share') }}</span>
                  </button>
                  <transition enter-active-class="transition-all duration-300" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100" leave-active-class="transition-all duration-200" leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95"><div v-if="shareSuccess" class="absolute -top-12 left-1/2 -translate-x-1/2 text-white px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shadow-lg z-10" style="background-color: var(--theme-primary);">{{ $t('blog.linkCopied') }}<div class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent" style="border-top-color: var(--theme-primary);"></div></div></transition>
                </div>
                <div class="flex items-center gap-3 text-muted text-sm">
                  <button @click="toggleLike" class="flex items-center gap-1 transition-colors hover:text-red-500 dark:hover:text-red-400" :class="isLiked ? 'text-red-500 dark:text-red-400' : ''" :disabled="isTogglingLike"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>{{ (post.likes_count !== undefined && post.likes_count !== null) ? post.likes_count : (post.likes || 0) }}</button>
                  <span class="flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>{{ post.comments ?? 0 }}</span>
                </div>
              </div>
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

      <!-- 右侧目录 (仅大屏显示) -->
      <aside v-if="toc.length > 0" class="hidden lg:block w-64 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar">
        <div class="glass-card p-6 rounded-2xl">
          <h3 class="text-sm font-bold text-main mb-4 uppercase tracking-wider flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            {{ $t('blog.toc') || '目录' }}
          </h3>
          <ul class="space-y-3">
            <li 
              v-for="item in toc" 
              :key="item.id"
              :style="{ paddingLeft: (item.level - 2) * 1.25 + 'rem' }"
              class="transition-all duration-300"
            >
              <button 
                @click="scrollToAnchor(item.id)"
                class="text-sm text-left transition-all hover:text-[var(--theme-primary)] block w-full truncate py-1"
                :class="activeId === item.id ? 'toc-item-active' : 'text-muted'"
              >
                {{ item.title }}
              </button>
            </li>
          </ul>
        </div>
      </aside>
    </div>
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

const route = useRoute()
const { t } = useI18n()
const shareSuccess = ref(false)

/**
 * 获取真正的滚动容器
 * 使用 function 声明以支持提升 (Hoisting)
 */
function getScrollContainer() {
  return document.getElementById('main-scroll')
}

// 图片缩放实例
const zoomInstance = ref(null)

/**
 * 初始化文章中的图片缩放
 */
const initImageZoom = () => {
  // 确保在内容渲染后的 DOM 中查找图片
  const images = document.querySelectorAll('.blog-content img')
  if (images.length === 0) return

  // 如果已有实例，先清理
  if (zoomInstance.value) {
    zoomInstance.value.detach()
  }

  // 初始化新实例
  zoomInstance.value = mediumZoom(images, {
    margin: 24,
    background: 'transparent', // 使用 CSS 变量控制背景
    scrollOffset: 0,
    container: document.body
  })
}

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
 * 文章目录
 */
const toc = ref([])
const activeId = ref('')

/**
 * 统一的 ID 生成器
 * 确保目录和正文中的 ID 绝对匹配
 */
const generateHeadingId = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]+/g, '')
    .slice(0, 50) // 限制长度
}

/**
 * 提取文章目录
 * 直接从渲染后的 DOM 中提取，确保 ID 100% 匹配
 */
const generateTOC = () => {
  nextTick(() => {
    // 增加一个小延时，确保 v-html 已经完全渲染并插入到浏览器
    setTimeout(() => {
      const contentEl = document.querySelector('.blog-content')
      if (!contentEl) return

      const headingElements = contentEl.querySelectorAll('h2, h3')
      const headings = []

      headingElements.forEach((el) => {
        // 如果标题没有 ID，通过内部文本生成一个（保持和 renderer 一致）
        if (!el.id) {
          el.id = generateHeadingId(el.innerText)
        }
        
        headings.push({
          id: el.id,
          title: el.innerText.replace('#', '').trim(),
          level: parseInt(el.tagName.substring(1))
        })
      })

      toc.value = headings
      // 生成后立即检测一次高亮
      updateActiveTOC()
    }, 300)
  })
}

/**
 * 平滑滚动到指定锚点
 */
const scrollToAnchor = (id) => {
  const el = document.getElementById(id)
  const container = getScrollContainer()
  if (!el || !container) return
  
  // 记录活跃 ID 产生即时反馈
  activeId.value = id

  // 核心公式：[元素相对于视口顶部的距离] - [容器相对于视口顶部的距离] + [容器当前的滚动高度]
  const containerRect = container.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
  const targetY = elRect.top - containerRect.top + container.scrollTop - 24 // 留出一点顶部呼吸感

  container.scrollTo({
    top: targetY,
    behavior: 'smooth'
  })
}

/**
 * 监听滚动更新活跃目录项
 * 使用 getBoundingClientRect.top 替代 offsetTop，解决父容器 position:relative 导致的偏移问题
 */
const updateActiveTOC = () => {
  const container = getScrollContainer()
  if (!container || toc.value.length === 0) return

  const threshold = 120 // 触发高亮的距离顶部的阈值
  let currentActiveId = ''

  for (const heading of toc.value) {
    const el = document.getElementById(heading.id)
    if (!el) continue

    const containerRect = container.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const relativeTop = elRect.top - containerRect.top

    // 寻找已经到达或超过视口顶部的最后一个标题
    if (relativeTop <= threshold) {
      currentActiveId = heading.id
    } else {
      break
    }
  }

  if (currentActiveId) {
    activeId.value = currentActiveId
  }
}

/**
 * 为正文中的标题添加 ID
 */
const addHeadingIds = (content) => {
  const renderer = new marked.Renderer()
  renderer.heading = function({ text, depth, raw }) {
    const id = raw.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u4e00-\u9fa5-]+/g, '')
    return `<h${depth} id="${id}">${text}</h${depth}>`
  }
  return renderer
}

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
  const container = getScrollContainer()
  if (!container || !post.value) {
    readingProgress.value = 0
    return
  }
  
  const scrollTop = container.scrollTop
  const scrollHeight = container.scrollHeight - container.clientHeight
  
  if (scrollHeight <= 0) {
    readingProgress.value = 0
    return
  }
  
  const progress = (scrollTop / scrollHeight) * 100
  readingProgress.value = Math.min(100, Math.max(0, progress))
}

/**
 * 滚动事件处理
 */
const handleScroll = () => {
  calculateReadingProgress()
  updateActiveTOC()
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
  
  // 自定义渲染器
  const renderer = new marked.Renderer()
  
  // 自定义代码块渲染
  renderer.code = function({ text, lang, escaped }) {
    const language = lang || 'text'
    const codeId = `code-${Math.random().toString(36).substr(2, 9)}`
    // 预先获取翻译文本，避免在模板字符串中逻辑失效
    const copyLabel = t('common.copy') || 'Copy'
    
    return `
      <div class="code-block-wrapper group">
        <div class="code-block-header">
          <div class="code-block-dots">
            <span class="dot red"></span>
            <span class="dot yellow"></span>
            <span class="dot green"></span>
          </div>
          <span class="code-block-lang">${language}</span>
          <button class="copy-button" data-code-id="${codeId}">
            <svg class="copy-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <span class="copy-text">${copyLabel}</span>
          </button>
        </div>
        <pre><code class="hljs language-${language}" id="${codeId}">${text}</code></pre>
      </div>
    `
  }

  // 自定义标题渲染，添加 ID
  renderer.heading = function({ text, depth, raw }) {
    const id = generateHeadingId(raw)
    return `<h${depth} id="${id}" class="scroll-mt-24 group flex items-center transition-all duration-300">
      <span class="heading-text">${text}</span>
      <a href="#${id}" class="opacity-0 group-hover:opacity-40 transition-opacity ml-2 text-base no-underline">#</a>
    </h${depth}>`
  }
  
  // 配置marked选项
  marked.setOptions({
    renderer,
    breaks: true,
    gfm: true,
  })
  
  try {
    // 处理图片路径
    const processedContent = processImagePaths(content, post.value.slug)
    return marked.parse(processedContent)
  } catch (error) {
    console.error('Markdown parsing error:', error)
    return content.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
})

/**
 * 处理全局点击事件（事件委托处理复制代码）
 */
const handleContentClick = async (e) => {
  const copyBtn = e.target.closest('.copy-button')
  if (!copyBtn) return

  const codeId = copyBtn.getAttribute('data-code-id')
  const codeEl = document.getElementById(codeId)
  if (!codeEl) return

  try {
    await navigator.clipboard.writeText(codeEl.innerText)
    
    // 反馈动画
    const copyText = copyBtn.querySelector('.copy-text')
    const originalText = copyText.innerText
    copyText.innerText = t('blog.copied')
    copyBtn.classList.add('copied')
    
    setTimeout(() => {
      copyText.innerText = originalText
      copyBtn.classList.remove('copied')
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

// 监听内容渲染完成，初始化图片缩放和目录生成
watch(() => renderedContent.value, () => {
  nextTick(() => {
    initImageZoom()
    generateTOC()
  })
}, { immediate: true })

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

// 生命周期：绑定到 main-scroll 容器而非 window
onMounted(() => {
  const container = getScrollContainer()
  if (container) {
    container.addEventListener('scroll', handleScroll, { passive: true })
  }
  // 初始计算一次
  setTimeout(handleScroll, 500)
})

onUnmounted(() => {
  const container = getScrollContainer()
  if (container) {
    container.removeEventListener('scroll', handleScroll)
  }
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

// Hover 处理函数
const handleBackBtnHoverEnter = (e) => {
  const el = e?.currentTarget
  if (!el) return
  const isDark = document.documentElement.classList.contains('dark')
  el.style.color = isDark ? 'var(--hover-color-dark)' : 'var(--hover-color)'
}
const handleBackBtnHoverLeave = (e) => {
  if (e?.currentTarget) e.currentTarget.style.color = ''
}

const handleShareBtnHoverEnter = (e) => {
  const el = e?.currentTarget
  if (!el) return
  const isDark = document.documentElement.classList.contains('dark')
  el.style.backgroundColor = isDark ? 'var(--hover-bg-dark)' : 'var(--hover-bg)'
  el.style.color = isDark ? 'var(--hover-text-dark)' : 'var(--hover-text)'
}
const handleShareBtnHoverLeave = (e) => {
  const el = e?.currentTarget
  if (el) {
    el.style.backgroundColor = ''
    el.style.color = ''
  }
}

const handleRelatedPostHoverEnter = (e) => {
  const el = e?.currentTarget
  if (!el) return
  const isDark = document.documentElement.classList.contains('dark')
  el.style.backgroundColor = isDark ? 'var(--hover-bg-dark)' : 'var(--hover-bg)'
  el.style.borderLeftColor = 'var(--hover-border)'
}
const handleRelatedPostHoverLeave = (e) => {
  const el = e?.currentTarget
  if (el) {
    el.style.backgroundColor = ''
    el.style.borderLeftColor = 'transparent'
  }
}

const handleRelatedTitleHoverEnter = (e) => {
  const el = e?.currentTarget
  if (!el) return
  const isDark = document.documentElement.classList.contains('dark')
  el.style.color = isDark ? 'var(--hover-color-dark)' : 'var(--hover-color)'
}
const handleRelatedTitleHoverLeave = (e) => {
  if (e?.currentTarget) e.currentTarget.style.color = ''
}

const handleNavBtnHoverEnter = (e) => {
  const el = e?.currentTarget
  if (!el) return
  const isDark = document.documentElement.classList.contains('dark')
  el.style.backgroundColor = isDark ? 'var(--hover-bg-dark)' : 'var(--hover-bg)'
}
const handleNavBtnHoverLeave = (e) => {
  if (e?.currentTarget) e.currentTarget.style.backgroundColor = ''
}

const handleNavTitleHoverEnter = (e) => {
  const el = e?.currentTarget
  if (!el) return
  const isDark = document.documentElement.classList.contains('dark')
  el.style.color = isDark ? 'var(--hover-color-dark)' : 'var(--hover-color)'
}
const handleNavTitleHoverLeave = (e) => {
  if (e?.currentTarget) e.currentTarget.style.color = ''
}
</script>
