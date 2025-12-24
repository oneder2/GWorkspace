<!--
  编码转换工具组件
  支持Base64和URL编码/解码
-->
<template>
  <div class="space-y-6 w-full max-w-4xl mx-auto">
    <div class="flex items-center justify-between pb-4 border-b border-slate-200/50 dark:border-slate-700/50">
      <h3 class="font-bold text-xl text-slate-800 dark:text-slate-200">Encoder / Decoder</h3>
      <span class="text-xs px-2 py-1 rounded"
        style="background-color: color-mix(in srgb, var(--theme-primary-lighter) 30%, transparent); color: var(--theme-primary-darker);"
      >UTF-8</span>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- 输入区 -->
      <div class="space-y-2">
        <label class="block text-sm font-bold text-slate-600 dark:text-slate-400">
          Input <span class="font-normal opacity-50">(Raw)</span>
        </label>
        <textarea 
          v-model="encodeInput" 
          class="w-full h-48 p-4 glass-input rounded-xl outline-none text-sm font-mono resize-none shadow-inner transition-colors"
          style="--focus-border: var(--theme-primary);"
          @focus="$event.currentTarget.style.borderColor = 'var(--focus-border)'"
          @blur="$event.currentTarget.style.borderColor = ''" 
          placeholder="Paste your text here..."
        ></textarea>
      </div>
      
      <!-- 输出区 -->
      <div class="space-y-2">
        <label class="block text-sm font-bold text-slate-600 dark:text-slate-400">
          Output <span class="font-normal opacity-50">(Processed)</span>
        </label>
        <div class="relative">
          <textarea 
            readonly 
            :value="encodeResult" 
            class="w-full h-48 p-4 bg-slate-50/80 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 outline-none text-sm font-mono resize-none"
          ></textarea>
          <button 
            @click="copyToClipboard(encodeResult)" 
            class="absolute top-2 right-2 p-1.5 bg-white dark:bg-slate-700 rounded-md shadow-sm transition-colors"
            style="--hover-text: var(--theme-primary-darker); --hover-text-dark: var(--theme-primary-light);"
            @mouseenter="const el = $event.currentTarget; const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark'); el.style.color = isDark ? 'var(--hover-text-dark)' : 'var(--hover-text)';"
            @mouseleave="$event.currentTarget.style.color = '';" 
            title="Copy"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 操作按钮 -->
    <div class="p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-white/60 dark:border-slate-700/60 flex flex-wrap gap-3">
      <button 
        @click="doBase64Encode" 
        class="px-5 py-2.5 text-white rounded-lg text-sm font-bold shadow-lg transition-colors"
        style="background: linear-gradient(to right, var(--theme-primary), var(--theme-primary-darker)); box-shadow: 0 4px 6px -1px color-mix(in srgb, var(--theme-primary) 30%, transparent), 0 2px 4px -1px color-mix(in srgb, var(--theme-primary) 20%, transparent);"
        @mouseenter="$event.currentTarget.style.background = 'linear-gradient(to right, var(--theme-primary-light), var(--theme-primary))'"
        @mouseleave="$event.currentTarget.style.background = 'linear-gradient(to right, var(--theme-primary), var(--theme-primary-darker))'"
      >
        Base64 Encode
      </button>
      <button 
        @click="doBase64Decode" 
        class="px-5 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 text-sm font-bold shadow-sm transition-colors"
      >
        Base64 Decode
      </button>
      <div class="w-[1px] h-10 bg-slate-300 dark:bg-slate-600 mx-2 hidden md:block"></div>
      <button 
        @click="doUrlEncode" 
        class="px-5 py-2.5 bg-slate-800 dark:bg-slate-700 text-white dark:text-slate-100 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-600 text-sm font-bold shadow-lg shadow-slate-500/20 transition-colors"
      >
        URL Encode
      </button>
      <button 
        @click="doUrlDecode" 
        class="px-5 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 text-sm font-bold shadow-sm transition-colors"
      >
        URL Decode
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const encodeInput = ref('')
const encodeResult = ref('')

/**
 * Base64编码
 */
const doBase64Encode = () => {
  try { 
    encodeResult.value = btoa(encodeInput.value) 
  } catch(e) { 
    encodeResult.value = 'Error: Invalid Input' 
  }
}

/**
 * Base64解码
 */
const doBase64Decode = () => {
  try { 
    encodeResult.value = atob(encodeInput.value) 
  } catch(e) { 
    encodeResult.value = 'Error: Invalid Base64' 
  }
}

/**
 * URL编码
 */
const doUrlEncode = () => {
  encodeResult.value = encodeURIComponent(encodeInput.value)
}

/**
 * URL解码
 */
const doUrlDecode = () => {
  try {
    encodeResult.value = decodeURIComponent(encodeInput.value)
  } catch(e) {
    encodeResult.value = 'Error: Invalid URL encoding'
  }
}

/**
 * 复制到剪贴板
 */
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    // TODO: 可以添加成功提示
  } catch (error) {
    console.error('Failed to copy:', error)
  }
}
</script>
