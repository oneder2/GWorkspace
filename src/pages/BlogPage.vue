<!--
  博客页面组件
  展示个人博客文章列表
  模块化设计，便于添加新文章和分类
  布局：标签和归档放在左侧空白区域，中间内容区域填充剩余空间
-->
<template>
  <div class="animate-fade-in rounded-2xl sm:rounded-3xl flex flex-col xl:flex-row gap-4 sm:gap-6 xl:gap-8 min-h-full overflow-hidden">
    <!-- 移动端筛选按钮 - 显示在顶部 -->
    <div class="xl:hidden mb-4">
      <button
        @click="showMobileFilters = !showMobileFilters"
        class="blog-mobile-filter-btn w-full glass-card p-3 rounded-xl flex items-center justify-between transition-colors"
      >
        <span class="font-semibold text-slate-800 dark:text-slate-200">{{ $t('blog.filters') }}</span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-slate-600 dark:text-slate-400" :class="{ 'rotate-180': showMobileFilters }">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
    </div>

    <!-- 移动端筛选面板 -->
    <transition
      enter-active-class="transition-all duration-300"
      enter-from-class="opacity-0 max-h-0"
      enter-to-class="opacity-100 max-h-screen"
      leave-active-class="transition-all duration-300"
      leave-from-class="opacity-100 max-h-screen"
      leave-to-class="opacity-0 max-h-0"
    >
      <div v-if="showMobileFilters" class="xl:hidden glass-card p-4 rounded-xl mb-4 space-y-4">
        <!-- Genre分类筛选 -->
        <div>
          <h3 class="text-sm font-bold mb-3 text-slate-800 dark:text-slate-200">{{ $t('blog.genre') }}</h3>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="genre in genres" 
              :key="genre"
              @click="toggleGenreFilter(genre)"
              class="px-3 py-1 rounded-md text-xs font-bold transition-all duration-200 uppercase tracking-wide"
              :class="selectedGenre === genre 
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 ring-2 ring-[var(--theme-primary)]' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer'"
            >
              {{ genre }}
            </button>
          </div>
        </div>
        
        <!-- 标签筛选 -->
        <div>
          <h3 class="text-sm font-bold mb-3 text-slate-800 dark:text-slate-200">{{ $t('blog.tags') }}</h3>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="tag in tags" 
              :key="tag"
              @click="toggleTagFilter(tag)"
              class="px-3 py-1 rounded-full text-xs font-bold transition-all duration-200"
              :class="selectedTag === tag 
                ? 'ring-2 ring-[var(--theme-primary)] scale-105' 
                : 'hover:scale-105 cursor-pointer'"
              :style="getTagColor(tag).style"
              :title="selectedTag === tag ? '点击取消筛选' : '点击筛选此标签'"
            >
              #{{ tag }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 左侧标签和归档 - 放在左侧空白区域，桌面端显示 -->
    <div class="glass-card w-56 hidden xl:block shrink-0 rounded-2xl">
      <div class="sticky top-6 space-y-1.5 p-4">
        <!-- 统计信息卡片 -->
        <div class="mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
          <h3 class="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200">{{ $t('blog.statistics') }}</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-slate-600 dark:text-slate-400">{{ $t('blog.totalArticles') }}</span>
              <span class="text-lg font-bold text-slate-800 dark:text-slate-200">{{ blogStats.totalArticles || 0 }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-slate-600 dark:text-slate-400">{{ $t('blog.totalComments') }}</span>
              <span class="text-lg font-bold text-slate-800 dark:text-slate-200">{{ blogStats.totalComments || 0 }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-slate-600 dark:text-slate-400">{{ $t('blog.totalViews') }}</span>
              <span class="text-lg font-bold text-slate-800 dark:text-slate-200">{{ formatNumber(blogStats.totalViews || 0) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-slate-600 dark:text-slate-400">{{ $t('blog.totalLikes') }}</span>
              <span class="text-lg font-bold text-slate-800 dark:text-slate-200">{{ blogStats.totalLikes || 0 }}</span>
            </div>
          </div>
        </div>
        
        <!-- Genre分类筛选 -->
        <div>
          <h3 class="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200">{{ $t('blog.genre') }}</h3>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="genre in genres" 
              :key="genre"
              @click="toggleGenreFilter(genre)"
              class="px-3 py-1 rounded-md text-xs font-bold transition-all duration-200 uppercase tracking-wide"
              :class="[
                selectedGenre === genre 
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 scale-105 blog-genre-btn-selected'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer'
              ]"
              :title="selectedGenre === genre ? '点击取消筛选' : '点击筛选此分类'"
            >
              {{ genre }}
            </button>
      </div>
    </div>
    
        <!-- 标签筛选 -->
        <div class="mt-6">
          <h3 class="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200">{{ $t('blog.tags') }}</h3>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="tag in tags" 
              :key="tag"
              @click="toggleTagFilter(tag)"
              class="px-3 py-1 rounded-full text-xs font-bold transition-all duration-200"
              :class="[
                selectedTag === tag 
                  ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 scale-105 blog-tag-btn-selected' 
                  : 'hover:scale-105 cursor-pointer'
              ]"
              :style="getTagColor(tag).style"
              :title="selectedTag === tag ? '点击取消筛选' : '点击筛选此标签'"
            >
              #{{ tag }}
            </button>
          </div>
        </div>
        
        <!-- 归档筛选 -->
        <div class="mt-6">
          <h3 class="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200">{{ $t('blog.archive') }}</h3>
          <ul class="space-y-2 text-sm">
              <li 
                v-for="archive in archives" 
                :key="archive.month"
              @click="toggleArchiveFilter(archive.month)"
              class="blog-archive-item cursor-pointer flex justify-between px-2 py-1.5 rounded-lg"
              :class="[
                selectedArchive === archive.month 
                  ? 'font-semibold blog-archive-item-selected' 
                  : 'text-slate-500 dark:text-slate-400'
              ]"
              :title="selectedArchive === archive.month ? '点击取消筛选' : '点击筛选此月份'"
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
      <!-- 搜索栏和创建按钮 - 固定在顶部，水平排列 -->
      <div class="mb-6 shrink-0">
        <div class="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <!-- 搜索框 - 占据剩余空间 -->
          <div class="flex-1 min-w-0">
            <div class="relative">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <label for="blog-search-input" class="sr-only">{{ $t('blog.searchPlaceholder') }}</label>
              <input 
                id="blog-search-input"
                name="blog-search-input"
                v-model="searchQuery"
                type="text"
                :placeholder="$t('blog.searchPlaceholder')"
                class="blog-search-input glass-input w-full pl-10 pr-10 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
              >
              <button 
                v-if="searchQuery"
                @click="searchQuery = ''"
                class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                :title="$t('common.clear')"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
          
        </div>
      </div>
      
      <!-- 文章列表 - 可滚动区域 -->
      <div class="flex-1 space-y-6">
        <!-- 骨架屏 - 加载初始数据时显示 -->
        <BlogSkeleton v-if="isLoading && blogPosts.length === 0" :count="3" />

        <!-- 文章列表 -->
        <template v-else>
          <article 
            v-for="post in filteredPosts" 
            :key="post.id" 
            @click="$router.push(`/blog/${post.id}`)"
            class="blog-article-card glass-card p-6 rounded-2xl group cursor-pointer border-l-4 transition-all animate-fade-in"
          >
            <!-- 文章内容保持不变 -->
            <div class="flex items-center gap-3 mb-2 flex-wrap text-xs text-slate-500 dark:text-slate-400">
              <span class="font-mono">{{ formatDateChinese(post.published_at || post.date) }}</span>
              <span class="text-slate-300 dark:text-slate-600">·</span>
              <span class="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                {{ post.views || 0 }}
              </span>
              <span class="text-slate-300 dark:text-slate-600">·</span>
              <span class="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-3.5 h-3.5 text-red-400 dark:text-red-500">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {{ (post.likes_count !== undefined && post.likes_count !== null) ? post.likes_count : (post.likes || 0) }}
              </span>
              <span class="text-slate-300 dark:text-slate-600">·</span>
              <span class="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                {{ post.comments_count !== undefined ? post.comments_count : (post.comments || 0) }}
              </span>
              <span class="text-slate-300 dark:text-slate-600">·</span>
              <span class="flex items-center gap-1 text-orange-500 dark:text-orange-400 font-semibold">
                {{ calculateHeat(post) }}℃
              </span>
            </div>
            <div class="flex items-center gap-2 mb-2 flex-wrap">
              <span class="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs rounded-md font-bold uppercase tracking-wide">{{ post.genre || post.category }}</span>
              <div v-if="post.tags && post.tags.length > 0" class="flex items-center gap-2 flex-wrap">
                <span v-for="tag in post.tags" :key="tag" class="px-2 py-0.5 text-xs rounded-full font-semibold" :style="getTagColor(tag).style">#{{ tag }}</span>
              </div>
            </div>
            <h3 class="blog-article-title text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2" v-html="highlightText(post.title, searchQuery)"></h3>
            <div class="flex items-center justify-between gap-4">
              <p class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed opacity-80 flex-1 min-w-0" v-html="highlightText(post.excerpt, searchQuery)"></p>
              <div class="blog-read-article-btn flex items-center text-sm font-bold gap-1 group-hover:gap-2 transition-all shrink-0">
                {{ $t('common.readArticle') }}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </div>
            </div>
          </article>

          <!-- 加载更多 -->
          <div v-if="hasMore" class="pt-4 pb-8 flex justify-center">
            <button 
              @click="loadMore" 
              :disabled="isLoading"
              class="px-8 py-3 bg-white/50 dark:bg-slate-800/50 hover:bg-[var(--theme-primary)] hover:text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <span v-if="isLoading" class="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></span>
              {{ isLoading ? $t('common.loading') : $t('blog.loadMore') || '加载更多' }}
            </button>
          </div>

          <!-- 无更多内容 -->
          <div v-else-if="blogPosts.length > 0 && !searchQuery" class="py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
            {{ $t('blog.noMore') || '没有更多文章了' }}
          </div>
        </template>
      </div>
      </div>
      
    <!-- 右侧留言板 -->
    <div class="hidden 2xl:block w-80 shrink-0">
      <div class="sticky top-6">
        <Guestbook @show-login="showAuthModal = true" />
      </div>
    </div>
  </div>

  <!-- 认证弹窗 -->
  <AuthModal v-if="showAuthModal" @close="showAuthModal = false" />
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import Fuse from 'fuse.js'
import { useLocalStorage } from '../composables/useStorage'
import { blogApi } from '../utils/api'
import Guestbook from '../components/Guestbook.vue'
import AuthModal from '../components/AuthModal.vue'
import BlogSkeleton from '../components/BlogSkeleton.vue'
import { getTagStyle } from '../utils/tagColor'

const router = useRouter()
const searchQuery = ref('')
const selectedGenre = ref(null)
const selectedTag = ref(null)
const selectedArchive = ref(null)
const showFavorites = ref(false)
const showMobileFilters = ref(false)
const sortBy = ref('date-desc')
const showAuthModal = ref(false)

// 分页与加载状态
const blogPosts = ref([])
const isLoading = ref(false)
const page = ref(0)
const pageSize = ref(6)
const hasMore = ref(true)

// 独立存储所有分类和标签，确保侧边栏完整性
const allGenres = ref([])
const allTags = ref([])

// 博客统计信息
const blogStats = ref({
  totalArticles: 0,
  totalComments: 0,
  totalViews: 0,
  totalLikes: 0
})

/**
 * 加载文章列表（支持分页）
 */
const loadPosts = async (isLoadMore = false) => {
  if (isLoading.value) return
  isLoading.value = true
  
  if (!isLoadMore) {
    page.value = 0
    blogPosts.value = []
  }

  try {
    const params = {
      status: 'published',
      sortBy: 'published_at',
      sortOrder: 'desc',
      limit: pageSize.value,
      offset: page.value * pageSize.value
    }

    // 如果有筛选条件，分页可能受影响，但后端目前 getAll 支持基础筛选
    if (selectedGenre.value) params.genre = selectedGenre.value

    const posts = await blogApi.getList(params)
    
    if (posts && posts.length > 0) {
      blogPosts.value = isLoadMore ? [...blogPosts.value, ...posts] : posts
      hasMore.value = posts.length === pageSize.value
      page.value++
    } else {
      hasMore.value = false
    }

    initFuse()
  } catch (error) {
    console.error('Failed to load posts:', error)
  } finally {
    isLoading.value = false
  }
}

/**
 * 加载更多
 */
const loadMore = () => {
  if (hasMore.value) {
    loadPosts(true)
  }
}

/**
 * 监听筛选条件变化，重置列表
 */
watch([selectedGenre, selectedTag, selectedArchive], () => {
  loadPosts()
})

/**
 * 加载元数据（分类和标签）
 */
const loadMetadata = async () => {
  try {
    const [genresData, tagsData] = await Promise.all([
      blogApi.getAllGenres({ status: 'published' }),
      blogApi.getAllTags({ status: 'published' })
    ])
    allGenres.value = genresData || []
    allTags.value = tagsData || []
  } catch (error) {
    console.error('Failed to load metadata:', error)
  }
}

const genres = computed(() => allGenres.value)
const tags = computed(() => allTags.value)

/**
 * 加载博客统计信息
 */
const loadBlogStats = async () => {
  try {
    const stats = await blogApi.getStats()
    blogStats.value = stats || { totalArticles: 0, totalComments: 0, totalViews: 0, totalLikes: 0 }
  } catch (error) {
    console.error('Failed to load blog stats:', error)
  }
}

/**
 * 格式化数字
 */
const formatNumber = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')

/**
 * 格式化日期为中文格式
 */
const formatDateChinese = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours()
  const minutes = date.getMinutes()
  if (hours !== 0 || minutes !== 0) {
    return `${year}年${month}月${day}日 ${hours}时${minutes.toString().padStart(2, '0')}分`
  }
  return `${year}年${month}月${day}日`
}

/**
 * 计算文章热度
 */
const calculateHeat = (post) => {
  const views = post.views || 0
  const likes = post.likes_count ?? post.likes ?? 0
  const comments = post.comments_count ?? post.comments ?? 0
  const baseTemp = 30
  const heat = baseTemp + views * 0.01 + likes * 0.5 + comments * 1
  return Math.min(Math.round(heat * 10) / 10, 200)
}

// 收藏管理
const { value: favorites } = useLocalStorage('blog-favorites', [])

/**
 * 获取标签颜色样式
 */
const getTagColor = (tagName) => {
  const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  return getTagStyle(tagName, isDarkMode)
}

/**
 * 解析日期字符串为月份格式
 */
const parseDateToMonth = (dateStr) => {
  const date = new Date(dateStr)
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December']
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`
}

/**
 * 归档筛选逻辑（保持前端计算，或后续优化为后端）
 */
const archives = computed(() => {
  const archiveMap = new Map()
  blogPosts.value.forEach(post => {
    if (post.date) {
      const month = parseDateToMonth(post.date)
      archiveMap.set(month, (archiveMap.get(month) || 0) + 1)
    }
  })
  return Array.from(archiveMap.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => new Date(b.month) - new Date(a.month))
})

const toggleGenreFilter = (genre) => {
  selectedGenre.value = selectedGenre.value === genre ? null : genre
  selectedTag.value = null
  selectedArchive.value = null
}

const toggleTagFilter = (tagName) => {
  selectedTag.value = selectedTag.value === tagName ? null : tagName
  selectedGenre.value = null
  selectedArchive.value = null
}

const toggleArchiveFilter = (month) => {
  selectedArchive.value = selectedArchive.value === month ? null : month
  selectedGenre.value = null
  selectedTag.value = null
}

/**
 * Fuse.js 搜索实例
 */
let fuseInstance = null
const initFuse = () => {
  const options = {
    keys: [{ name: 'title', weight: 0.7 }, { name: 'excerpt', weight: 0.5 }, { name: 'content', weight: 0.3 }, { name: 'genre', weight: 0.4 }, { name: 'tags', weight: 0.6 }],
    threshold: 0.3,
    includeScore: true,
  }
  fuseInstance = new Fuse(blogPosts.value, options)
}

const filteredPosts = computed(() => {
  let result = blogPosts.value
  
  if (selectedTag.value) {
    result = result.filter(post => post.tags?.includes(selectedTag.value))
  }
  
  if (selectedArchive.value) {
    result = result.filter(post => parseDateToMonth(post.date) === selectedArchive.value)
  }
  
  if (searchQuery.value?.trim()) {
    if (!fuseInstance) initFuse()
    fuseInstance.setCollection(result)
    result = fuseInstance.search(searchQuery.value.trim()).map(r => r.item)
  }
  
  return result
})

const highlightText = (text, query) => {
  if (!text || !query?.trim()) return text || ''
  const regex = new RegExp(`(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-900/50 text-yellow-900 dark:text-yellow-200 px-1 rounded">$1</mark>')
}

onMounted(() => {
  loadPosts()
  loadMetadata()
  loadBlogStats()
})
</script>

<style scoped>
/* 导入页面样式 */
@import '../styles/pages/BlogPage.css';
</style>

