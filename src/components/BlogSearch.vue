<!--
  博客搜索组件
  提供文章搜索功能
-->
<template>
  <div class="mb-6">
    <div class="glass-card p-4 rounded-xl">
      <div class="relative">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400">
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
          class="glass-input w-full pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none"
        >
        <button 
          v-if="searchQuery"
          @click="clearSearch"
          class="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const searchQuery = ref(props.modelValue)

watch(searchQuery, (newValue) => {
  emit('update:modelValue', newValue)
})

watch(() => props.modelValue, (newValue) => {
  searchQuery.value = newValue
})

/**
 * 清空搜索
 */
const clearSearch = () => {
  searchQuery.value = ''
}
</script>
