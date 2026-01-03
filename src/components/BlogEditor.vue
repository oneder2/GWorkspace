<!--
  博客编辑器组件
  提供完整的博客文章编辑功能，包括元数据编辑和Markdown内容编辑
  支持创建新文章和编辑现有文章
  支持弹窗模式和页面模式
-->
<template>
  <div :class="isPageMode ? 'w-full' : 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4'" @click.self="!isPageMode && handleClose">
    <div :class="isPageMode ? 'w-full space-y-6' : 'glass-card-panel rounded-3xl p-6 md:p-8 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in'">
      <!-- 头部（仅弹窗模式显示） -->
      <div v-if="!isPageMode" class="flex items-center justify-between mb-6 shrink-0">
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
      <div :class="isPageMode ? 'space-y-6' : 'flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2'">
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
              class="w-full px-4 py-2 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 transition-all"
              style="--focus-ring: color-mix(in srgb, var(--theme-primary) 50%, transparent);"
              @focus="$event.currentTarget.style.setProperty('--tw-ring-color', 'var(--focus-ring)')"
              @blur="$event.currentTarget.style.setProperty('--tw-ring-color', '')"
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
              <div class="relative">
                <input 
                  v-model="formData.genre"
                  type="text"
                  @input="handleGenreInput"
                  class="w-full px-4 py-2 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 transition-all"
                  style="--focus-ring: color-mix(in srgb, var(--theme-primary) 50%, transparent);"
                  @focus="(e) => { showGenreSuggestions = true; e.currentTarget.style.setProperty('--tw-ring-color', 'var(--focus-ring)') }"
                  @blur="(e) => { setTimeout(() => showGenreSuggestions = false, 200); e.currentTarget.style.setProperty('--tw-ring-color', '') }"
                  :placeholder="$t('blog.genrePlaceholder')"
                />
                <!-- 分类建议下拉列表 -->
                <div 
                  v-if="showGenreSuggestions && filteredGenreSuggestions.length > 0"
                  class="absolute z-50 w-full mt-1 glass-card rounded-lg shadow-lg max-h-48 overflow-y-auto custom-scrollbar"
                >
                  <button
                    v-for="genre in filteredGenreSuggestions"
                    :key="genre"
                    @mousedown.prevent="selectGenre(genre)"
                    class="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    {{ genre }}
                  </button>
                </div>
              </div>
            </div>

            <!-- 日期 -->
            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {{ $t('blog.date') }} <span class="text-red-500">*</span>
              </label>
              <input 
                v-model="formData.date"
                type="date"
                class="w-full px-4 py-2 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 transition-all"
              style="--focus-ring: color-mix(in srgb, var(--theme-primary) 50%, transparent);"
              @focus="$event.currentTarget.style.setProperty('--tw-ring-color', 'var(--focus-ring)')"
              @blur="$event.currentTarget.style.setProperty('--tw-ring-color', '')"
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
              class="w-full px-4 py-2 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 transition-all resize-none"
              style="--focus-ring: color-mix(in srgb, var(--theme-primary) 50%, transparent);"
              @focus="$event.currentTarget.style.setProperty('--tw-ring-color', 'var(--focus-ring)')"
              @blur="$event.currentTarget.style.setProperty('--tw-ring-color', '')"
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
                class="px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2"
                :style="getTagStyle(tag, isDarkMode).style"
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
            <div class="flex gap-2 relative">
              <div class="flex-1 relative">
                <input 
                  v-model="newTag"
                  type="text"
                  @keyup.enter="addTag"
                  @input="handleTagInput"
                  class="w-full px-4 py-2 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 transition-all"
                  style="--focus-ring: color-mix(in srgb, var(--theme-primary) 50%, transparent);"
                  @focus="(e) => { showTagSuggestions = true; e.currentTarget.style.setProperty('--tw-ring-color', 'var(--focus-ring)') }"
                  @blur="(e) => { setTimeout(() => showTagSuggestions = false, 200); e.currentTarget.style.setProperty('--tw-ring-color', '') }"
                  :placeholder="$t('blog.addTagPlaceholder')"
                />
                <!-- 标签建议下拉列表 -->
                <div 
                  v-if="showTagSuggestions && filteredTagSuggestions.length > 0"
                  class="absolute z-50 w-full mt-1 glass-card rounded-lg shadow-lg max-h-48 overflow-y-auto custom-scrollbar"
                >
                  <button
                    v-for="tag in filteredTagSuggestions"
                    :key="tag"
                    @mousedown.prevent="selectTag(tag)"
                    class="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    #{{ tag }}
                  </button>
                </div>
              </div>
              <button 
                @click="addTag"
                class="px-4 py-2 rounded-lg transition-colors font-semibold"
                :style="isThemeTransparent
                  ? (isDarkMode
                      ? {
                          backgroundColor: '#64748b',
                          color: '#ffffff'
                        }
                      : {
                          backgroundColor: '#475569',
                          color: '#ffffff'
                        })
                  : {
                      backgroundColor: 'var(--theme-primary)',
                      color: '#ffffff'
                    }"
                @mouseenter="handleTagButtonHoverEnter"
                @mouseleave="handleTagButtonHoverLeave"
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
            <div class="flex items-center gap-3">
              <!-- 视图切换开关 -->
              <div class="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                <button
                  @click="viewMode = 'split'"
                  :class="viewMode === 'split' 
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-200'
                    : 'text-slate-600 dark:text-slate-400'"
                  class="px-3 py-1.5 text-sm font-semibold rounded transition-all"
                  :title="$t('blog.viewSplit')"
                >
                  {{ $t('blog.viewSplit') }}
                </button>
                <button
                  @click="viewMode = 'editor'"
                  :class="viewMode === 'editor' 
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-200'
                    : 'text-slate-600 dark:text-slate-400'"
                  class="px-3 py-1.5 text-sm font-semibold rounded transition-all"
                  :title="$t('blog.viewEditor')"
                >
                  {{ $t('blog.viewEditor') }}
                </button>
                <button
                  @click="viewMode = 'preview'"
                  :class="viewMode === 'preview' 
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-200'
                    : 'text-slate-600 dark:text-slate-400'"
                  class="px-3 py-1.5 text-sm font-semibold rounded transition-all"
                  :title="$t('blog.viewPreview')"
                >
                  {{ $t('blog.viewPreview') }}
                </button>
              </div>
              <button 
                @click="clearContent"
                class="px-3 py-1 text-sm text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                {{ $t('tools.clear') }}
              </button>
            </div>
          </div>
          
          <!-- 分屏视图 -->
          <div v-if="viewMode === 'split'" class="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-[400px]">
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
                class="flex-1 w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 overflow-y-auto custom-scrollbar prose prose-slate dark:prose-invert max-w-none prose-pre:bg-slate-100 prose-pre:dark:bg-slate-800 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-table:w-full prose-table:border-collapse prose-th:border prose-th:border-slate-300 prose-th:dark:border-slate-600 prose-th:px-4 prose-th:py-2 prose-th:bg-slate-100 prose-th:dark:bg-slate-800 prose-td:border prose-td:border-slate-300 prose-td:dark:border-slate-600 prose-td:px-4 prose-td:py-2 prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6 prose-li:my-1 prose-li:pl-2"
                v-html="previewContent"
              ></div>
            </div>
          </div>
          
          <!-- 纯编辑器视图 -->
          <div v-else-if="viewMode === 'editor'" class="flex-1" style="min-height: 600px;">
            <textarea 
              v-model="formData.content"
              class="w-full h-full min-h-[600px] px-4 py-3 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-sm resize-none custom-scrollbar"
              :placeholder="$t('blog.contentPlaceholder')"
            ></textarea>
          </div>
          
          <!-- 纯预览视图 -->
          <div v-else-if="viewMode === 'preview'" class="flex-1" style="min-height: 600px;">
            <div 
              class="w-full h-full min-h-[600px] px-4 py-3 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 overflow-y-auto custom-scrollbar prose prose-slate dark:prose-invert max-w-none prose-pre:bg-slate-100 prose-pre:dark:bg-slate-800 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-table:w-full prose-table:border-collapse prose-th:border prose-th:border-slate-300 prose-th:dark:border-slate-600 prose-th:px-4 prose-th:py-2 prose-th:bg-slate-100 prose-th:dark:bg-slate-800 prose-td:border prose-td:border-slate-300 prose-td:dark:border-slate-600 prose-td:px-4 prose-td:py-2 prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6 prose-li:my-1 prose-li:pl-2"
              v-html="previewContent"
            ></div>
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
      <div :class="isPageMode ? 'flex items-center justify-between gap-4 pt-6 border-t border-slate-200 dark:border-slate-700' : 'flex items-center justify-between gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 shrink-0'">
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
            class="px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
            :style="isThemeTransparent
              ? (isDarkMode
                  ? {
                      backgroundColor: '#64748b',
                      color: '#ffffff'
                    }
                  : {
                      backgroundColor: '#475569',
                      color: '#ffffff'
                    })
              : {
                  backgroundColor: 'var(--theme-primary)',
                  color: '#ffffff'
                }"
            @mouseenter="handleButtonHoverEnter"
            @mouseleave="handleButtonHoverLeave"
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
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css' // 亮色主题作为基础
import { blogApi, generateSlug } from '../utils/api'
import { getTagStyle } from '../utils/tagColor'

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
  },
  /**
   * 是否为页面模式（非弹窗）
   */
  isPageMode: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'success'])

const { t } = useI18n()

/**
 * 检查主题色是否为透明
 */
const isThemeTransparent = ref(false)

/**
 * 检查是否为暗色模式（用于模板中）
 */
const isDarkMode = ref(false)

/**
 * 检查主题色状态
 */
const checkThemeTransparent = () => {
  if (typeof document !== 'undefined') {
    const themePrimary = getComputedStyle(document.documentElement).getPropertyValue('--theme-primary').trim()
    isThemeTransparent.value = themePrimary === 'transparent'
    // 同时更新暗色模式状态
    isDarkMode.value = document.documentElement.classList.contains('dark')
  }
}

// 配置 marked - 启用 GFM 支持（包括表格、任务列表等）
marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: true,
  mangle: false,
  pedantic: false,
  sanitize: false,
  smartLists: true,
  smartypants: false
})

// 配置代码块渲染器（使用 highlight.js 进行语法高亮）
const renderer = new marked.Renderer()

/**
 * 代码块渲染器 - 使用 highlight.js 进行语法高亮
 * marked.js v17 使用 token 对象而不是直接参数
 * @param {Object} token - token 对象，包含 text 和 lang 属性
 * @returns {string} - 渲染后的 HTML
 */
renderer.code = function(token) {
  // 从 token 对象中提取代码文本和语言
  // token.text 是代码内容，token.lang 是语言（可能为 null 或 undefined）
  const code = token.text || ''
  const language = token.lang || null
  const lang = language || 'text'
  
  // 确保 code 是字符串类型
  const codeStr = typeof code === 'string' ? code : String(code || '')
  
  // 如果语言被 highlight.js 支持，进行语法高亮
  if (language && hljs.getLanguage(language)) {
    try {
      const highlighted = hljs.highlight(codeStr, { language: lang })
      return `<pre class="hljs bg-slate-100 dark:bg-slate-800 rounded-lg p-4 overflow-x-auto"><code class="hljs language-${lang}">${highlighted.value}</code></pre>`
    } catch (err) {
      // 如果高亮失败，继续执行自动检测或转义逻辑
      console.warn('Failed to highlight code:', err)
    }
  }
  
  // 对于不支持的语言或未指定语言，尝试自动检测语言
  if (codeStr.trim()) {
    try {
      const highlighted = hljs.highlightAuto(codeStr)
      if (highlighted.relevance > 0 && highlighted.language) {
        return `<pre class="hljs bg-slate-100 dark:bg-slate-800 rounded-lg p-4 overflow-x-auto"><code class="hljs language-${highlighted.language}">${highlighted.value}</code></pre>`
}
    } catch (err) {
      // 自动检测也失败，继续执行转义逻辑
      console.warn('Failed to auto-highlight code:', err)
    }
  }
  
  // 最后的手段：转义 HTML 特殊字符
  const escaped = codeStr
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
  
  return `<pre class="hljs bg-slate-100 dark:bg-slate-800 rounded-lg p-4 overflow-x-auto"><code class="hljs language-${lang}">${escaped}</code></pre>`
}

// marked v17的table函数接收一个token对象，包含header和rows数组
renderer.table = function(token) {
  // 先使用默认的table渲染逻辑，然后包装样式
  let header = ''
  for (let i = 0; i < token.header.length; i++) {
    header += renderer.tablecell(token.header[i])
  }
  
  let body = ''
  for (let i = 0; i < token.rows.length; i++) {
    let row = ''
    for (let j = 0; j < token.rows[i].length; j++) {
      row += renderer.tablecell(token.rows[i][j])
    }
    body += `<tr>${row}</tr>`
  }
  
  return `<div class="overflow-x-auto my-4">
    <table class="min-w-full border-collapse border border-slate-300 dark:border-slate-600">
      <thead class="bg-slate-100 dark:bg-slate-800"><tr>${header}</tr></thead>
      <tbody>${body}</tbody>
    </table>
  </div>`
}

// marked v17的tablecell函数接收一个token对象
renderer.tablecell = function(token) {
  // 使用parser来解析inline tokens（如粗体、斜体等）
  const content = renderer.parser.parseInline(token.tokens)
  const tag = token.header ? 'th' : 'td'
  const align = token.align ? ` style="text-align: ${token.align}"` : ''
  return `<${tag}${align} class="border border-slate-300 dark:border-slate-600 px-4 py-2">${content}</${tag}>`
}

marked.setOptions({ renderer })

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
 * 视图模式：split（分屏）、editor（纯编辑）、preview（纯预览）
 */
const viewMode = ref('split')

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
 * 现有标签列表（从现有文章中提取）
 */
const existingTags = computed(() => {
  const tagSet = new Set()
  props.existingPosts.forEach(post => {
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach(tag => tagSet.add(tag))
    }
  })
  return Array.from(tagSet).sort()
})

/**
 * 显示分类建议
 */
const showGenreSuggestions = ref(false)

/**
 * 显示标签建议
 */
const showTagSuggestions = ref(false)

/**
 * 过滤后的分类建议
 */
const filteredGenreSuggestions = computed(() => {
  if (!formData.value.genre) return existingGenres.value.slice(0, 10)
  const input = formData.value.genre.toLowerCase()
  return existingGenres.value
    .filter(genre => genre.toLowerCase().includes(input))
    .slice(0, 10)
})

/**
 * 过滤后的标签建议
 */
const filteredTagSuggestions = computed(() => {
  if (!newTag.value) return existingTags.value.slice(0, 10)
  const input = newTag.value.toLowerCase()
  return existingTags.value
    .filter(tag => tag.toLowerCase().includes(input) && !formData.value.tags.includes(tag))
    .slice(0, 10)
})

/**
 * 处理分类输入
 */
const handleGenreInput = () => {
  showGenreSuggestions.value = true
}

/**
 * 处理标签输入
 */
const handleTagInput = () => {
  showTagSuggestions.value = true
}

/**
 * 选择分类
 */
const selectGenre = (genre) => {
  formData.value.genre = genre
  showGenreSuggestions.value = false
}

/**
 * 选择标签
 */
const selectTag = (tag) => {
  if (!formData.value.tags.includes(tag)) {
    formData.value.tags.push(tag)
  }
  newTag.value = ''
  showTagSuggestions.value = false
}

/**
 * Markdown预览内容
 */
const previewContent = computed(() => {
  if (!formData.value.content.trim()) {
    return `<p class="text-slate-400 dark:text-slate-500">${t('blog.previewPlaceholder')}</p>`
  }
  try {
    return marked.parse(formData.value.content)
  } catch (error) {
    console.error('Markdown parsing error:', error)
    return `<p class="text-red-500">${t('blog.previewError')}</p>`
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
 * 监听article变化，更新表单数据（编辑模式）
 */
watch(() => props.article, (newArticle) => {
  if (newArticle && props.isEditMode) {
    initFormData()
  }
}, { deep: true, immediate: true })

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
 * 处理按钮hover进入
 * @param {Event} event - 鼠标事件
 */
const handleButtonHoverEnter = (event) => {
  try {
    const el = event?.currentTarget
    if (el && el.style && !isSubmitting.value) {
      el.style.backgroundColor = isThemeTransparent.value 
        ? (isDarkMode.value ? '#475569' : '#334155')
        : 'var(--theme-primary-darker)'
    }
  } catch (error) {
    // 忽略样式设置错误，避免中断用户操作
    console.debug('Failed to set button hover style:', error)
  }
}

/**
 * 处理按钮hover离开
 * @param {Event} event - 鼠标事件
 */
const handleButtonHoverLeave = (event) => {
  try {
    const el = event?.currentTarget
    if (el && el.style && !isSubmitting.value) {
      el.style.backgroundColor = isThemeTransparent.value 
        ? (isDarkMode.value ? '#64748b' : '#475569')
        : 'var(--theme-primary)'
    }
  } catch (error) {
    // 忽略样式设置错误，避免中断用户操作
    console.debug('Failed to reset button hover style:', error)
  }
}

/**
 * 处理标签按钮hover进入
 * @param {Event} event - 鼠标事件
 */
const handleTagButtonHoverEnter = (event) => {
  try {
    const el = event?.currentTarget
    if (el && el.style) {
      el.style.backgroundColor = isThemeTransparent.value 
        ? (isDarkMode.value ? '#475569' : '#334155')
        : 'var(--theme-primary-darker)'
    }
  } catch (error) {
    // 忽略样式设置错误，避免中断用户操作
    console.debug('Failed to set tag button hover style:', error)
  }
}

/**
 * 处理标签按钮hover离开
 * @param {Event} event - 鼠标事件
 */
const handleTagButtonHoverLeave = (event) => {
  try {
    const el = event?.currentTarget
    if (el && el.style) {
      el.style.backgroundColor = isThemeTransparent.value 
        ? (isDarkMode.value ? '#64748b' : '#475569')
        : 'var(--theme-primary)'
    }
  } catch (error) {
    // 忽略样式设置错误，避免中断用户操作
    console.debug('Failed to reset tag button hover style:', error)
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
    // 准备数据 - 确保所有必需字段都有值并去除空白
    // 如果 slug 为空或只包含空格，自动从标题生成
    // 注意：generateSlug 已经支持中文字符，如果结果为空会返回 'untitled'
    const rawSlug = (formData.value.slug || '').trim()
    let slug = rawSlug
    if (!slug) {
      // 如果 slug 为空，从标题生成
      slug = generateSlug(formData.value.title)
      // 如果生成的 slug 仍然为空（理论上不应该发生），使用默认值
      if (!slug) {
        slug = 'untitled-' + Date.now()
      }
    }
    const publishedAt = formData.value.date ? `${formData.value.date}T00:00:00.000Z` : null

    // 再次验证所有必需字段（双重检查）
    if (!formData.value.title?.trim()) {
      errors.value.push(t('blog.titleRequired') || 'Title is required')
      isSubmitting.value = false
      return
    }
    if (!formData.value.genre?.trim()) {
      errors.value.push(t('blog.genreRequired') || 'Genre is required')
      isSubmitting.value = false
      return
    }
    if (!formData.value.content?.trim()) {
      errors.value.push(t('blog.contentRequired') || 'Content is required')
      isSubmitting.value = false
      return
    }
    if (!formData.value.excerpt?.trim()) {
      errors.value.push(t('blog.excerptRequired') || 'Excerpt is required')
      isSubmitting.value = false
      return
    }
    if (!Array.isArray(formData.value.tags) || formData.value.tags.length === 0) {
      errors.value.push(t('blog.tagsRequired') || 'At least one tag is required')
      isSubmitting.value = false
      return
    }

    const articleData = {
      title: formData.value.title.trim(),
      slug: slug,
      genre: formData.value.genre.trim(),
      content: formData.value.content.trim(),
      excerpt: formData.value.excerpt.trim(),
      tags: formData.value.tags,
      status: 'published',
      published_at: publishedAt
    }

    // 打印提交的数据（便于调试，包括生产环境）
    console.log('Submitting article data:', {
      title: articleData.title,
      slug: articleData.slug,
      genre: articleData.genre,
      contentLength: articleData.content.length,
      excerpt: articleData.excerpt,
      tagsCount: articleData.tags.length,
      status: articleData.status,
      published_at: articleData.published_at
    })
    console.log('Full articleData object:', JSON.stringify(articleData, null, 2))

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
    // 如果有详细的错误信息（如missingFields），显示详细信息
    if (error.missingFields && Array.isArray(error.missingFields)) {
      const missingFieldNames = error.missingFields.map(field => {
        const fieldMap = {
          title: t('blog.title') || 'Title',
          slug: t('blog.slug') || 'Slug',
          genre: t('blog.genre') || 'Genre',
          content: t('blog.content') || 'Content',
          excerpt: t('blog.excerpt') || 'Excerpt'
        }
        return fieldMap[field] || field
      })
      errors.value = [`${t('blog.missingFields') || 'Missing required fields'}: ${missingFieldNames.join(', ')}`]
    } else {
    errors.value = [error.message || t('blog.submitError') || 'Failed to submit article']
    }
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
  checkThemeTransparent()
  // 监听主题变化
  const observer = new MutationObserver(() => {
    checkThemeTransparent()
  })
  if (typeof document !== 'undefined') {
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style', 'class']
    })
  }
})
</script>

