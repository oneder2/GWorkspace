<!--
  Markdown 编辑器工具
  提供 Markdown 编辑和实时预览功能
-->
<template>
  <div class="space-y-6 h-full flex flex-col w-full">
    <div class="text-center mb-4">
      <h2 class="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">{{ $t('tools.markdown') }}</h2>
      <p class="text-slate-600 dark:text-slate-400 text-sm md:text-base">{{ $t('tools.markdownDesc') }}</p>
    </div>

    <div class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
      <!-- 编辑区域 -->
      <div class="glass-card p-6 rounded-2xl flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200">{{ $t('tools.editor') }}</h3>
          <button 
            @click="clearContent"
            class="px-3 py-1 text-sm text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            {{ $t('tools.clear') }}
          </button>
        </div>
        <textarea 
          v-model="markdownContent"
          class="flex-1 w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-sm resize-none custom-scrollbar"
          :placeholder="$t('tools.markdownPlaceholder')"
        ></textarea>
      </div>

      <!-- 预览区域 -->
      <div class="glass-card p-6 rounded-2xl flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200">{{ $t('tools.preview') }}</h3>
          <button 
            @click="copyHTML"
            class="px-3 py-1 text-sm bg-green-500 dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-700 transition-colors"
          >
            {{ $t('tools.copyHTML') }}
          </button>
        </div>
        <div 
          class="flex-1 w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 overflow-y-auto custom-scrollbar prose prose-slate dark:prose-invert max-w-none"
          v-html="htmlContent"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { marked } from 'marked'

// 配置 marked 选项
marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: true,
  mangle: false
})

const markdownContent = ref(`# Markdown Editor

## Features

- **Bold text**
- *Italic text*
- [Links](https://example.com)
- \`Code\`

### Lists

1. First item
2. Second item
3. Third item

- Unordered item
- Another item

### Code Block

\`\`\`javascript
function hello() {
  console.log('Hello, World!');
}
\`\`\`

> This is a blockquote`)

/**
 * HTML 内容（从 Markdown 转换）
 */
const htmlContent = computed(() => {
  if (!markdownContent.value.trim()) {
    return '<p class="text-slate-400 dark:text-slate-500">Start typing to see preview...</p>'
  }
  try {
    return marked.parse(markdownContent.value)
  } catch (error) {
    console.error('Markdown parsing error:', error)
    return '<p class="text-red-500">Error parsing Markdown</p>'
  }
})

/**
 * 清空内容
 */
const clearContent = () => {
  markdownContent.value = ''
}

/**
 * 复制 HTML
 */
const copyHTML = async () => {
  try {
    await navigator.clipboard.writeText(htmlContent.value)
    // TODO: 显示成功提示
  } catch (error) {
    console.error('Failed to copy:', error)
  }
}
</script>
