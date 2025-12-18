<!--
  JSON格式化工具组件
  支持JSON格式化和压缩
-->
<template>
  <div class="h-full flex flex-col pt-2">
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-bold text-xl text-slate-800 dark:text-slate-200">JSON Prettier</h3>
      <div class="flex gap-2">
        <button 
          @click="formatJson" 
          class="px-4 py-1.5 bg-green-500 dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-700 text-sm font-medium shadow-md shadow-green-500/20 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          Format
        </button>
        <button 
          @click="compressJson" 
          class="px-4 py-1.5 bg-slate-600 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 text-sm font-medium shadow-md shadow-slate-500/20 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          Minify
        </button>
        <button 
          @click="jsonInput = ''" 
          class="px-3 py-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>
    <textarea 
      v-model="jsonInput" 
      placeholder="Paste JSON here..." 
      class="flex-1 p-4 glass-input rounded-xl focus:border-green-500 dark:focus:border-green-400 outline-none text-sm font-mono resize-none shadow-inner leading-relaxed"
    ></textarea>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const jsonInput = ref('')

/**
 * 格式化JSON
 * 将压缩的JSON格式化为可读格式
 */
const formatJson = () => {
  try {
    const obj = JSON.parse(jsonInput.value)
    jsonInput.value = JSON.stringify(obj, null, 2)
  } catch (e) {
    alert('Invalid JSON')
  }
}

/**
 * 压缩JSON
 * 移除所有空白字符
 */
const compressJson = () => {
  try {
    const obj = JSON.parse(jsonInput.value)
    jsonInput.value = JSON.stringify(obj)
  } catch (e) {
    alert('Invalid JSON')
  }
}
</script>
