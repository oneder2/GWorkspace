<!--
  博客编辑器组件
  提供完整的博客文章编辑功能，包括元数据编辑和Markdown内容编辑
  支持创建新文章和编辑现有文章
-->
<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4" @click.self="handleClose">
    <div class="glass-card-panel rounded-3xl p-6 md:p-8 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in">
      <!-- 头部 -->
      <div class="flex items-center justify-between mb-6 shrink-0">
        <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200">
          {{ isEditMode ? $t('blog.editArticle') : $t('blog.createArticle') }}
        </h2>
        <button 
          @click="handleClose"
          class="p-2 rounded-lg hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors"
          :title="$t('common.close')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 text-slate-600 dark:text-slate-300">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- 内容区域 - 可滚动 -->
      <div class="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
        <!-- 元数据表单 -->
        <div class="glass-card p-6 rounded-2xl space-y-4">
          <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">{{ $t('blog.articleMeta') }}</h3>
          
          <!-- 标题 -->
          <div>
            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {{ $t('blog.title') }} <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="formData.title"
              type="text"
              class="w-full px-4 py-2 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
              :placeholder="$t('blog.titlePlaceholder')"
            />
          </div>

          <!-- 分类和日期 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- 分类 -->
            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {{ $t('blog.genre') }} <span class="text-red-500">*</span>
              </label>
              <input 
                v-model="formData.genre"
                type="text"
                class="w-full px-4 py-2 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
                :placeholder="$t('blog.genrePlaceholder')"
                list="genre-list"
              />
              <datalist id="genre-list">
                <option v-for="genre in existingGenres" :key="genre" :value="genre" />
              </datalist>
            </div>

            <!-- 日期 -->
            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {{ $t('blog.date') }} <span class="text-red-500">*</span>
              </label>
              <input 
                v-model="formData.date"
                type="date"
                class="w-full px-4 py-2 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
              />
            </div>
          </div>

          <!-- 摘要 -->
          <div>
            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {{ $t('blog.excerpt') }} <span class="text-red-500">*</span>
            </label>
            <textarea 
              v-model="formData.excerpt"
              rows="3"
              class="w-full px-4 py-2 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 resize-none"
              :placeholder="$t('blog.excerptPlaceholder')"
            ></textarea>
          </div>

          <!-- 标签 -->
          <div>
            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {{ $t('blog.tags') }} <span class="text-red-500">*</span>
            </label>
            <div class="flex flex-wrap gap-2 mb-2">
              <span 
                v-for="(tag, index) in formData.tags" 
                :key="index"
                class="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-sm font-semibold flex items-center gap-2"
              >
                #{{ tag }}
                <button 
                  @click="removeTag(index)"
                  class="hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </span>
            </div>
            <div class="flex gap-2">
              <input 
                v-model="newTag"
                type="text"
                @keyup.enter="addTag"
                class="flex-1 px-4 py-2 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
                :placeholder="$t('blog.addTagPlaceholder')"
              />
              <button 
                @click="addTag"
                class="px-4 py-2 bg-green-500 dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-700 transition-colors"
              >
                {{ $t('blog.addTag') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Markdown编辑器 -->
        <div class="glass-card p-6 rounded-2xl flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200">{{ $t('blog.content') }}</h3>
            <div class="flex gap-2">
              <button 
                @click="clearContent"
                class="px-3 py-1 text-sm text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                {{ $t('tools.clear') }}
              </button>
            </div>
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-[400px]">
            <!-- 编辑区域 -->
            <div class="flex flex-col">
              <label class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{{ $t('tools.editor') }}</label>
              <textarea 
                v-model="formData.content"
                class="flex-1 w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-sm resize-none custom-scrollbar"
                :placeholder="$t('blog.contentPlaceholder')"
              ></textarea>
            </div>
            <!-- 预览区域 -->
            <div class="flex flex-col">
              <label class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{{ $t('tools.preview') }}</label>
              <div 
                class="flex-1 w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 overflow-y-auto custom-scrollbar prose prose-slate dark:prose-invert max-w-none"
                v-html="previewContent"
              ></div>
            </div>
          </div>
        </div>

        <!-- 错误提示 -->
        <div v-if="errors.length > 0" class="glass-card p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div class="flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-red-500 shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div class="flex-1">
              <h4 class="font-semibold text-red-700 dark:text-red-400 mb-1">{{ $t('blog.validationErrors') }}</h4>
              <ul class="text-sm text-red-600 dark:text-red-300 space-y-1">
                <li v-for="(error, index) in errors" :key="index">• {{ error }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="flex items-center justify-between gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 shrink-0">
        <div class="text-sm text-slate-500 dark:text-slate-400">
          {{ $t('blog.saveHint') }}
        </div>
        <div class="flex gap-3">
          <button 
            @click="handleClose"
            class="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            {{ $t('common.cancel') }}
          </button>
          <button 
            @click="handleSubmit"
            :disabled="isSubmitting"
            class="px-6 py-2 bg-green-500 dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg 
              v-if="isSubmitting"
              class="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isSubmitting ? $t('blog.submitting') : $t('common.save') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { marked } from 'marked'
import { blogApi, generateSlug } from '../utils/api'

const props = defineProps({
  /**
   * 是否为编辑模式
   */
  isEditMode: {
    type: Boolean,
    default: false
  },
  /**
   * 要编辑的文章数据（编辑模式时使用）
   */
  article: {
    type: Object,
    default: null
  },
  /**
   * 现有文章列表（用于生成ID和获取分类）
   */
  existingPosts: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'success'])

const { t } = useI18n()

// 配置 marked
marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: true,
  mangle: false
})

/**
 * 表单数据
 */
const formData = ref({
  id: null,
  title: '',
  genre: '',
  date: new Date().toISOString().split('T')[0], // 默认今天
  excerpt: '',
  tags: [],
  content: '',
  slug: ''
})

/**
 * 新标签输入
 */
const newTag = ref('')

/**
 * 提交状态
 */
const isSubmitting = ref(false)

/**
 * 验证错误
 */
const errors = ref([])

/**
 * 现有分类列表（从现有文章中提取）
 */
const existingGenres = computed(() => {
  const genreSet = new Set()
  props.existingPosts.forEach(post => {
    if (post.genre) {
      genreSet.add(post.genre)
    }
  })
  return Array.from(genreSet).sort()
})

/**
 * Markdown预览内容
 */
const previewContent = computed(() => {
  if (!formData.value.content.trim()) {
    return '<p class="text-slate-400 dark:text-slate-500">Start typing to see preview...</p>'
  }
  try {
    return marked.parse(formData.value.content)
  } catch (error) {
    console.error('Markdown parsing error:', error)
    return '<p class="text-red-500">Error parsing Markdown</p>'
  }
})

/**
 * 初始化表单数据
 */
const initFormData = () => {
  if (props.isEditMode && props.article) {
    // 编辑模式：填充现有数据
    formData.value = {
      id: props.article.id,
      title: props.article.title || '',
      genre: props.article.genre || props.article.category || '',
      date: props.article.date || new Date().toISOString().split('T')[0],
      excerpt: props.article.excerpt || '',
      tags: [...(props.article.tags || [])],
      content: props.article.content || '',
      slug: props.article.slug || generateSlug(props.article.title)
    }
  } else {
    // 新建模式：设置默认值
    formData.value = {
      id: null,
      title: '',
      genre: '',
      date: new Date().toISOString().split('T')[0],
      excerpt: '',
      tags: [],
      content: '',
      slug: ''
    }
  }
}

/**
 * 监听标题变化，自动生成slug
 */
watch(() => formData.value.title, (newTitle) => {
  if (newTitle && !props.isEditMode) {
    formData.value.slug = generateSlug(newTitle)
  }
})

/**
 * 添加标签
 */
const addTag = () => {
  const tag = newTag.value.trim()
  if (tag && !formData.value.tags.includes(tag)) {
    formData.value.tags.push(tag)
    newTag.value = ''
  }
}

/**
 * 移除标签
 */
const removeTag = (index) => {
  formData.value.tags.splice(index, 1)
}

/**
 * 清空内容
 */
const clearContent = () => {
  if (confirm(t('blog.confirmClearContent'))) {
    formData.value.content = ''
  }
}

/**
 * 验证表单
 */
const validateForm = () => {
  errors.value = []
  
  if (!formData.value.title || formData.value.title.trim().length === 0) {
    errors.value.push(t('blog.titleRequired') || 'Title is required')
  }

  if (!formData.value.genre || formData.value.genre.trim().length === 0) {
    errors.value.push(t('blog.genreRequired') || 'Genre is required')
  }

  if (!formData.value.date || !/^\d{4}-\d{2}-\d{2}/.test(formData.value.date)) {
    errors.value.push(t('blog.dateRequired') || 'Date is required and must be in YYYY-MM-DD format')
  }

  if (!formData.value.excerpt || formData.value.excerpt.trim().length === 0) {
    errors.value.push(t('blog.excerptRequired') || 'Excerpt is required')
  }

  if (!Array.isArray(formData.value.tags) || formData.value.tags.length === 0) {
    errors.value.push(t('blog.tagsRequired') || 'At least one tag is required')
  }

  if (!formData.value.content.trim()) {
    errors.value.push(t('blog.contentRequired') || 'Content is required')
  }

  return errors.value.length === 0
}

/**
 * 提交表单
 */
const handleSubmit = async () => {
  // 验证表单
  if (!validateForm()) {
    return
  }

  isSubmitting.value = true
  errors.value = []

  try {
    // 准备数据
    const slug = formData.value.slug || generateSlug(formData.value.title)
    const publishedAt = formData.value.date ? `${formData.value.date}T00:00:00.000Z` : null

    const articleData = {
      title: formData.value.title,
      slug: slug,
      genre: formData.value.genre,
      content: formData.value.content,
      excerpt: formData.value.excerpt,
      tags: formData.value.tags,
      status: 'published',
      published_at: publishedAt
    }

    // 调用API创建或更新文章
    let result
    if (props.isEditMode && formData.value.id) {
      result = await blogApi.update(formData.value.id, articleData)
    } else {
      result = await blogApi.create(articleData)
    }

    // 触发成功事件
    emit('success', {
      article: result
    })

    // 关闭编辑器
    handleClose()
  } catch (error) {
    console.error('Failed to submit article:', error)
    errors.value = [error.message || t('blog.submitError') || 'Failed to submit article']
  } finally {
    isSubmitting.value = false
  }
}

/**
 * 关闭编辑器
 */
const handleClose = () => {
  emit('close')
}

// 初始化
onMounted(() => {
  initFormData()
})
</script>

