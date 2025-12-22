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

      <!-- 预设主题 -->
      <div class="mb-8">
        <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">{{ $t('theme.presets') }}</h3>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
          <button 
            v-for="(theme, key) in presetThemes"
            :key="key"
            @click="selectPreset(key)"
            class="p-4 rounded-xl border-2 transition-all"
            :class="currentPreset === key 
              ? '' 
              : 'border-slate-200 dark:border-slate-700'"
            :style="currentPreset === key 
              ? {
                  borderColor: 'var(--theme-primary)',
                  backgroundColor: 'color-mix(in srgb, var(--theme-primary-lighter) 50%, transparent)',
                  '--dark-bg': 'color-mix(in srgb, var(--theme-primary) 20%, transparent)'
                }
              : {
                  '--hover-border': 'var(--theme-primary-light)',
                  '--hover-border-dark': 'var(--theme-primary-darker)'
                }"
            @mouseenter="if (currentPreset !== key) {
              $event.currentTarget.style.borderColor = document.documentElement.classList.contains('dark') ? 'var(--hover-border-dark)' : 'var(--hover-border)';
            }"
            @mouseleave="if (currentPreset !== key) {
              $event.currentTarget.style.borderColor = '';
            }"
          >
            <div class="flex items-center gap-3 mb-2">
              <div class="w-8 h-8 rounded-lg" :style="{ backgroundColor: theme.primary }"></div>
              <div class="w-8 h-8 rounded-lg" :style="{ backgroundColor: theme.primaryDark }"></div>
            </div>
            <div class="text-sm font-bold text-slate-700 dark:text-slate-300">{{ theme.name }}</div>
          </button>
        </div>
      </div>

      <!-- 自定义颜色 -->
      <div class="mb-8">
        <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">{{ $t('theme.custom') }}</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {{ $t('theme.primaryColor') }}
            </label>
            <div class="flex items-center gap-3">
              <input 
                v-model="customPrimary"
                type="color"
                class="w-16 h-16 rounded-lg border-2 border-slate-200 dark:border-slate-700 cursor-pointer"
              >
              <input 
                v-model="customPrimary"
                type="text"
                class="flex-1 px-4 py-2 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                placeholder="#22c55e"
              >
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {{ $t('theme.primaryDark') }}
            </label>
            <div class="flex items-center gap-3">
              <input 
                v-model="customPrimaryDark"
                type="color"
                class="w-16 h-16 rounded-lg border-2 border-slate-200 dark:border-slate-700 cursor-pointer"
              >
              <input 
                v-model="customPrimaryDark"
                type="text"
                class="flex-1 px-4 py-2 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                placeholder="#4ade80"
              >
            </div>
          </div>
          <button 
            @click="applyCustomTheme"
            class="w-full py-3 bg-green-500 dark:bg-green-600 text-white rounded-xl hover:bg-green-600 dark:hover:bg-green-700 font-bold transition-colors"
          >
            {{ $t('theme.applyCustom') }}
          </button>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex gap-3">
        <button 
          @click="resetTheme"
          class="flex-1 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 font-bold transition-colors"
        >
          {{ $t('theme.reset') }}
        </button>
        <button 
          @click="$emit('close')"
          class="flex-1 py-3 bg-green-500 dark:bg-green-600 text-white rounded-xl hover:bg-green-600 dark:hover:bg-green-700 font-bold transition-colors"
        >
          {{ $t('common.save') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useCustomTheme } from '../composables/useCustomTheme'

const emit = defineEmits(['close'])

const { presetThemes, currentPreset, setPresetTheme, setCustomTheme, resetTheme: resetThemeFunc } = useCustomTheme()

const customPrimary = ref('#22c55e')
const customPrimaryDark = ref('#4ade80')

/**
 * 选择预设主题
 */
const selectPreset = (preset) => {
  setPresetTheme(preset)
  // 更新自定义颜色输入框
  const theme = presetThemes[preset]
  customPrimary.value = theme.primary
  customPrimaryDark.value = theme.primaryDark
}

/**
 * 应用自定义主题
 */
const applyCustomTheme = () => {
  setCustomTheme({
    primary: customPrimary.value,
    primaryDark: customPrimaryDark.value
  })
}

/**
 * 重置主题
 */
const resetTheme = () => {
  resetThemeFunc()
  selectPreset('default')
}
</script>
