<!--
  主题自定义组件
  允许用户自定义主题颜色
-->
<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm" @click.self="$emit('close')">
    <div class="glass-card-panel rounded-3xl p-6 md:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200">{{ $t('theme.title') }}</h2>
        <button 
          @click="$emit('close')"
          class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- 主题功能说明 -->
      <div class="mb-8">
        <div class="glass-card p-6 rounded-xl">
          <p class="text-sm text-slate-600 dark:text-slate-400 text-center">
            {{ $t('theme.comingSoon') }}
          </p>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex gap-3">
        <button 
          @click="$emit('close')"
          class="w-full py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 font-bold transition-colors"
        >
          {{ $t('common.close') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const emit = defineEmits(['close'])
const { t } = useI18n()
</script>
