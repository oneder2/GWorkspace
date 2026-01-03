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
        class="w-full glass-card p-3 rounded-xl flex items-center justify-between transition-colors"
        style="--hover-bg: color-mix(in srgb, var(--theme-primary-lighter) 50%, transparent); --hover-bg-dark: color-mix(in srgb, var(--theme-primary) 20%, transparent);"
        @mouseenter="const el = $event?.currentTarget; if (el) { const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark'); el.style.backgroundColor = isDark ? 'var(--hover-bg-dark)' : 'var(--hover-bg)'; }"
        @mouseleave="const el = $event?.currentTarget; if (el) { el.style.backgroundColor = ''; }"
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
              :key="tag.name"
              @click="toggleTagFilter(tag.name)"
              class="px-3 py-1 rounded-full text-xs font-bold transition-all duration-200"
              :class="[
                tag.color,
                selectedTag === tag.name 
                  ? 'ring-2 ring-[var(--theme-primary)]' 
                  : 'hover:scale-105 cursor-pointer'
              ]"
            >
              #{{ tag.name }}
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
              :class="selectedGenre === genre 
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 scale-105'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer'"
              :style="selectedGenre === genre ? { '--tw-ring-color': 'var(--theme-primary)' } : {}"
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
              :key="tag.name"
              @click="toggleTagFilter(tag.name)"
              class="px-3 py-1 rounded-full text-xs font-bold transition-all duration-200"
              :class="[
                tag.color,
                selectedTag === tag.name 
                  ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 scale-105' 
                  : 'hover:scale-105 cursor-pointer'
              ]"
              :style="selectedTag === tag.name ? { '--tw-ring-color': 'var(--theme-primary)' } : {}"
              :title="selectedTag === tag.name ? '点击取消筛选' : '点击筛选此标签'"
            >
              #{{ tag.name }}
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
              class="cursor-pointer flex justify-between px-2 py-1.5 rounded-lg transition-all duration-200"
              :class="selectedArchive === archive.month 
                ? 'font-semibold' 
                : 'text-slate-500 dark:text-slate-400'"
              :style="selectedArchive === archive.month 
                ? { 
                    backgroundColor: 'color-mix(in srgb, var(--theme-primary-lighter) 50%, transparent)',
                    color: 'var(--theme-primary-darker)',
                    '--dark-bg': 'color-mix(in srgb, var(--theme-primary) 20%, transparent)',
                    '--dark-color': 'var(--theme-primary-dark)'
                  }
                : {
                    '--hover-bg': 'color-mix(in srgb, var(--theme-primary-lighter) 50%, transparent)',
                    '--hover-bg-dark': 'color-mix(in srgb, var(--theme-primary) 10%, transparent)',
                    '--hover-text': 'var(--theme-primary-darker)',
                    '--hover-text-dark': 'var(--theme-primary-dark)'
                  }"
              @mouseenter="if (selectedArchive !== archive.month) { 
                const el = $event.currentTarget;
                el.style.backgroundColor = document.documentElement.classList.contains('dark') ? 'var(--hover-bg-dark)' : 'var(--hover-bg)';
                el.style.color = document.documentElement.classList.contains('dark') ? 'var(--hover-text-dark)' : 'var(--hover-text)';
              }"
              @mouseleave="if (selectedArchive !== archive.month) { 
                $event.currentTarget.style.backgroundColor = '';
                $event.currentTarget.style.color = '';
              }"
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
                class="glass-input w-full pl-10 pr-10 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
                style="--focus-ring: color-mix(in srgb, var(--theme-primary) 50%, transparent);"
                @focus="$event.currentTarget.style.setProperty('--tw-ring-color', 'var(--focus-ring)')"
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
      <div class="flex-1 space-y-6 overflow-y-auto">
        <article 
          v-for="post in filteredPosts" 
          :key="post.id" 
          @click="$router.push(`/blog/${post.id}`)"
          class="glass-card p-6 rounded-2xl group cursor-pointer border-l-4 border-l-transparent transition-all"
          style="--hover-border: var(--theme-primary);"
          @mouseenter="const el = $event?.currentTarget; if (el) { el.style.borderLeftColor = 'var(--hover-border)'; }"
          @mouseleave="const el = $event?.currentTarget; if (el) { el.style.borderLeftColor = 'transparent'; }"
        >
          <div class="flex items-center gap-3 mb-3 flex-wrap">
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
                :style="getTagColor(tag).style"
              >
                #{{ tag }}
              </span>
            </div>
          </div>
          <h3 
            class="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3 transition-colors"
            style="--hover-color: var(--theme-primary-darker); --hover-color-dark: var(--theme-primary-dark);"
            @mouseenter="const el = $event?.currentTarget; if (el) { const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark'); el.style.color = isDark ? 'var(--hover-color-dark)' : 'var(--hover-color)'; }"
            @mouseleave="const el = $event?.currentTarget; if (el) { el.style.color = ''; }"
            v-html="highlightText(post.title, searchQuery)"
          ></h3>
          <p 
            class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4 opacity-80"
            v-html="highlightText(post.excerpt, searchQuery)"
          ></p>
          <div class="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-4">
            <div class="flex items-center text-sm font-bold gap-1 group-hover:gap-2 transition-all"
                 style="color: var(--theme-primary-darker);"
                 :style="{ '--dark-color': 'var(--theme-primary-dark)' }">
              {{ $t('common.readArticle') }}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </div>
            <div class="flex items-center gap-3 text-slate-400 dark:text-slate-500 text-sm">
              <span class="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="currentColor" 
                  class="w-4 h-4"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {{ (post.likes_count !== undefined && post.likes_count !== null) ? post.likes_count : (post.likes || 0) }}
              </span>
              <span class="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                {{ post.comments ?? 0 }}
              </span>
            </div>
          </div>
        </article>
      </div>
      </div>
      
    <!-- 右侧留言板 - 桌面端显示（2xl及以上屏幕） -->
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

const router = useRouter()
const searchQuery = ref('')
const selectedGenre = ref(null)
const selectedTag = ref(null)
const selectedArchive = ref(null)
const showFavorites = ref(false)
const showMobileFilters = ref(false) // 移动端筛选面板显示状态
const sortBy = ref('date-desc')
const latestArticle = ref(null) // 用于推广最新文章
const showAuthModal = ref(false) // 认证弹窗显示状态

// 从后端API加载数据
const blogPosts = ref([])
const isLoading = ref(false)

// 博客统计信息
const blogStats = ref({
  totalArticles: 0,
  totalComments: 0,
  totalViews: 0,
  totalLikes: 0
})

/**
 * 加载文章列表
 * 从后端API获取文章数据
 */
const loadPosts = async () => {
  isLoading.value = true
  try {
    const posts = await blogApi.getList({
      status: 'published',
      sortBy: 'published_at',
      sortOrder: 'desc'
    })
    blogPosts.value = posts || []
    // 重新初始化Fuse搜索
    initFuse()
  } catch (error) {
    console.error('Failed to load posts:', error)
    blogPosts.value = []
  } finally {
    isLoading.value = false
  }
}

/**
 * 加载博客统计信息
 * 从后端API获取统计数据
 */
const loadBlogStats = async () => {
  try {
    const stats = await blogApi.getStats()
    blogStats.value = stats || {
      totalArticles: 0,
      totalComments: 0,
      totalViews: 0,
      totalLikes: 0
    }
  } catch (error) {
    console.error('Failed to load blog stats:', error)
  }
}

/**
 * 格式化数字（添加千位分隔符）
 * @param {number} num - 要格式化的数字
 * @returns {string} 格式化后的字符串
 */
const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * 刷新文章列表
 * 重新从后端API加载文章
 */
const refreshPosts = () => {
  loadPosts()
}

/**
 * 处理文章创建/更新成功
 * @param {Object} result - API返回结果
 */
/**
 * 处理文章创建/更新成功
 * @param {Object} result - API返回结果
 */
const handleArticleSuccess = (result) => {
  console.log('Article saved successfully:', result)
  
  // 刷新文章列表
  refreshPosts()
  
  // 设置最新文章用于推广
  if (result.article) {
    latestArticle.value = result.article
    // 自动关闭推广信息
    setTimeout(() => {
      latestArticle.value = null
    }, 10000) // 10秒后自动关闭
  }
}

// 阅读历史管理
const { value: readingHistory } = useLocalStorage('blog-reading-history', [])

// 收藏管理
const { value: favorites } = useLocalStorage('blog-favorites', [])

/**
 * 获取标签颜色样式
 * 使用哈希函数生成确定性颜色
 * @param {string} tagName - 标签名称
 * @returns {Object} 包含style对象
 */
const getTagColor = (tagName) => {
  const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  return getTagStyle(tagName, isDarkMode)
}

/**
 * 从文章配置中动态提取所有Genre分类
 */
const genres = computed(() => {
  const genreSet = new Set()
  blogPosts.value.forEach(post => {
    const genre = post.genre || post.category
    if (genre) {
      genreSet.add(genre)
    }
  })
  
  return Array.from(genreSet).sort()
})

/**
 * 从文章配置中动态提取所有标签
 */
const tags = computed(() => {
  const tagSet = new Set()
  blogPosts.value.forEach(post => {
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach(tag => tagSet.add(tag))
    }
  })
  
  return Array.from(tagSet).map(tagName => ({
    name: tagName,
    color: getTagColor(tagName)
  })).sort((a, b) => a.name.localeCompare(b.name))
})

/**
 * 解析日期字符串为月份格式
 * @param {string} dateStr - 日期字符串，格式如 "2025-05-20"
 * @returns {string} 月份字符串，格式如 "May 2025"
 */
const parseDateToMonth = (dateStr) => {
  const date = new Date(dateStr)
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December']
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`
}

/**
 * 从文章配置中动态生成归档数据
 */
const archives = computed(() => {
  const archiveMap = new Map()
  
  blogPosts.value.forEach(post => {
    if (post.date) {
      const month = parseDateToMonth(post.date)
      archiveMap.set(month, (archiveMap.get(month) || 0) + 1)
    }
  })
  
  // 转换为数组并按月份倒序排列（最新的在前）
  return Array.from(archiveMap.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => {
      // 解析月份字符串进行比较
      const dateA = new Date(a.month)
      const dateB = new Date(b.month)
      return dateB - dateA // 倒序
    })
})

/**
 * 切换Genre分类筛选
 * @param {string} genre - Genre分类名称
 */
const toggleGenreFilter = (genre) => {
  if (selectedGenre.value === genre) {
    // 如果点击的是已选中的分类，则取消筛选
    selectedGenre.value = null
  } else {
    selectedGenre.value = genre
    // 选择Genre时清除其他筛选
    selectedTag.value = null
    selectedArchive.value = null
  }
}

/**
 * 切换标签筛选
 * @param {string} tagName - 标签名称
 */
const toggleTagFilter = (tagName) => {
  if (selectedTag.value === tagName) {
    // 如果点击的是已选中的标签，则取消筛选
    selectedTag.value = null
  } else {
    selectedTag.value = tagName
    // 选择标签时清除其他筛选
    selectedGenre.value = null
    selectedArchive.value = null
  }
}

/**
 * 切换归档筛选
 * @param {string} month - 月份字符串，格式如 "May 2025"
 */
const toggleArchiveFilter = (month) => {
  if (selectedArchive.value === month) {
    // 如果点击的是已选中的归档，则取消筛选
    selectedArchive.value = null
  } else {
    selectedArchive.value = month
    // 选择归档时清除其他筛选
    selectedGenre.value = null
    selectedTag.value = null
  }
}

/**
 * Fuse.js 搜索实例
 * 配置搜索选项，支持模糊搜索和多字段搜索
 */
let fuseInstance = null

/**
 * 初始化Fuse搜索实例
 */
const initFuse = () => {
  const options = {
    keys: [
      { name: 'title', weight: 0.7 },      // 标题权重最高
      { name: 'excerpt', weight: 0.5 },   // 摘要权重中等
      { name: 'content', weight: 0.3 },  // 内容权重较低
      { name: 'category', weight: 0.4 },  // 分类权重中等
      { name: 'tags', weight: 0.6 }       // 标签权重较高
    ],
    threshold: 0.3,  // 模糊匹配阈值（0-1，越小越严格）
    includeScore: true,  // 包含匹配分数
    minMatchCharLength: 1,  // 最小匹配字符长度
    ignoreLocation: true,  // 忽略位置，提高搜索准确性
  }
  
  fuseInstance = new Fuse(blogPosts.value, options)
}

/**
 * 筛选后的文章列表
 * 根据搜索关键词、选中的标签和归档过滤文章
 */
const filteredPosts = computed(() => {
  let result = blogPosts.value
  
  // 收藏筛选
  if (showFavorites.value) {
    const favIds = favorites.value || []
    result = result.filter(post => favIds.includes(post.id))
  }
  
  // Genre分类筛选
  if (selectedGenre.value) {
    result = result.filter(post => {
      const genre = post.genre || post.category
      return genre === selectedGenre.value
    })
  }
  
  // 标签筛选
  if (selectedTag.value) {
    result = result.filter(post => 
      post.tags && post.tags.some(tag => tag === selectedTag.value)
    )
  }
  
  // 归档筛选
  if (selectedArchive.value) {
    result = result.filter(post => {
      const postMonth = parseDateToMonth(post.date)
      return postMonth === selectedArchive.value
    })
  }
  
  // 高级搜索（使用Fuse.js）
  if (searchQuery.value && searchQuery.value.trim()) {
    if (!fuseInstance) {
      initFuse()
    }
    
    // 更新Fuse实例的数据源（考虑已筛选的结果）
    fuseInstance.setCollection(result)
    
    // 执行搜索
    const searchResults = fuseInstance.search(searchQuery.value.trim())
    // Fuse.js返回的是包含item和score的对象数组，提取item
    result = searchResults.map(result => result.item)
  }
  
  // 排序
  result = sortPosts(result, sortBy.value)
  
  return result
})

/**
 * 对文章列表进行排序
 * @param {Array} posts - 文章列表
 * @param {string} sortType - 排序类型
 * @returns {Array} 排序后的文章列表
 */
const sortPosts = (posts, sortType) => {
  const sorted = [...posts]
  
  switch (sortType) {
    case 'date-desc':
      return sorted.sort((a, b) => new Date(b.date) - new Date(a.date))
    case 'date-asc':
      return sorted.sort((a, b) => new Date(a.date) - new Date(b.date))
    case 'title-asc':
      return sorted.sort((a, b) => a.title.localeCompare(b.title))
    case 'title-desc':
      return sorted.sort((a, b) => b.title.localeCompare(a.title))
    case 'views-desc':
      return sorted.sort((a, b) => (b.views || 0) - (a.views || 0))
    case 'views-asc':
      return sorted.sort((a, b) => (a.views || 0) - (b.views || 0))
    default:
      return sorted
  }
}

/**
 * 高亮搜索关键词
 * @param {string} text - 要高亮的文本
 * @param {string} query - 搜索关键词
 * @returns {string} 高亮后的HTML字符串
 */
const highlightText = (text, query) => {
  if (!text || !query || !query.trim()) {
    return text || ''
  }
  
  const searchTerm = query.trim()
  // 转义HTML特殊字符
  const escapedText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const escapedQuery = searchTerm.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  
  // 使用正则表达式进行不区分大小写的匹配
  const regex = new RegExp(`(${escapedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  
  // 替换匹配的文本为高亮标记
  return escapedText.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-900/50 text-yellow-900 dark:text-yellow-200 px-1 rounded">$1</mark>')
}

/**
 * 切换收藏状态
 * @param {number} postId - 文章ID
 */
const toggleFavorite = (postId) => {
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
 * 检查文章是否已收藏
 * @param {number} postId - 文章ID
 * @returns {boolean} 是否已收藏
 */
const isFavorite = (postId) => {
  return (favorites.value || []).includes(postId)
}

/**
 * 最近阅读的文章
 * 从阅读历史中获取最近阅读的文章
 */
const recentReadPosts = computed(() => {
  if (!readingHistory.value || readingHistory.value.length === 0) return []
  
  // 获取最近阅读的3篇文章ID
  const recentIds = readingHistory.value.slice(-3).reverse()
  
  // 根据ID查找文章
  return recentIds
    .map(id => blogPosts.value.find(p => p.id === id))
    .filter(Boolean) // 过滤掉未找到的文章
    .slice(0, 3) // 最多显示3篇
})

// 初始化文章列表和统计信息
onMounted(() => {
  loadPosts()
  loadBlogStats()
})
</script>

