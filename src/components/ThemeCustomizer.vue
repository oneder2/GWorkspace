<!--
  主题自定义组件
  允许用户自定义主题颜色、选择预设主题以及调节玻璃效果
-->
<template>
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm" @click.self="$emit('close')">
    <div class="glass-card-panel rounded-3xl p-6 md:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar animate-fade-in">
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-3">
          <div class="w-1.5 h-6 bg-[var(--theme-primary)] rounded-full"></div>
          <h2 class="text-2xl font-bold text-main">{{ $t('theme.title') }}</h2>
        </div>
        <button 
          @click="$emit('close')"
          class="p-2 rounded-lg hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 text-secondary">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="space-y-8">
        <!-- 预设主题选择 -->
        <section>
          <h3 class="text-sm font-bold text-muted uppercase tracking-wider mb-4">{{ $t('theme.presets') }}</h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button 
              v-for="(theme, key) in presetThemes" 
              :key="key"
              @click="applyPreset(key)"
              class="group relative p-4 rounded-2xl border-2 transition-all overflow-hidden"
              :class="currentPreset === key ? 'border-[var(--theme-primary)] bg-white/10' : 'border-border-base bg-white/5 hover:border-border-highlight'"
            >
              <div class="flex flex-col items-center gap-2">
                <div class="w-8 h-8 rounded-full shadow-inner" :style="{ backgroundColor: theme.primary }"></div>
                <span class="text-xs font-bold text-main">{{ theme.name }}</span>
              </div>
              <!-- 激活标记 -->
              <div v-if="currentPreset === key" class="absolute top-1 right-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 text-[var(--theme-primary)]">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4.143-5.7z" clip-rule="evenodd" />
                </svg>
              </div>
            </button>
          </div>
        </section>

        <!-- 自定义主色 -->
        <section>
          <h3 class="text-sm font-bold text-muted uppercase tracking-wider mb-4">{{ $t('theme.custom') }}</h3>
          <div class="theme-custom-card p-6 rounded-2xl space-y-6">
            <div class="flex flex-col sm:flex-row items-center gap-6">
              <div class="theme-color-picker-wrap shrink-0">
                <input 
                  type="color" 
                  :value="customPrimary"
                  class="theme-native-color-picker"
                  @input="handleCustomColorChange"
                >
              </div>
              <div class="flex-1 space-y-2 text-center sm:text-left">
                <p class="font-bold text-main">{{ $t('theme.primaryColor') }}</p>
                <p class="text-xs text-muted leading-relaxed">选择您最喜欢的基准色，系统将自动生成配套的协调色阶和磨砂感背景。</p>
                <div class="flex items-center gap-2 justify-center sm:justify-start pt-2">
                  <span class="px-2 py-1 bg-border-base/50 rounded font-mono text-xs text-secondary uppercase">{{ customPrimary }}</span>
                  <button 
                    @click="resetToDefault"
                    class="text-xs text-[var(--theme-primary)] font-bold hover:underline"
                  >
                    {{ $t('theme.reset') }}
                  </button>
                </div>
              </div>
            </div>

            <!-- 玻璃效果调节 -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-border-base">
              <div class="space-y-3">
                <div class="flex justify-between items-center">
                  <label class="text-sm font-bold text-main">背景透明度</label>
                  <span class="text-xs font-mono text-secondary">{{ (bgOpacity * 100).toFixed(0) }}%</span>
                </div>
                <input 
                  type="range" 
                  v-model.number="bgOpacity" 
                  min="0.1" 
                  max="0.9" 
                  step="0.05"
                  class="w-full accent-[var(--theme-primary)] cursor-pointer"
                >
              </div>
              <div class="space-y-3">
                <div class="flex justify-between items-center">
                  <label class="text-sm font-bold text-main">毛玻璃强度</label>
                  <span class="text-xs font-mono text-secondary">{{ glassBlur }}px</span>
                </div>
                <input 
                  type="range" 
                  v-model.number="glassBlur" 
                  min="0" 
                  max="40" 
                  step="1"
                  class="w-full accent-[var(--theme-primary)] cursor-pointer"
                >
              </div>
            </div>
          </div>
        </section>

        <!-- 实时预览预览区 -->
        <section>
          <h3 class="text-sm font-bold text-muted uppercase tracking-wider mb-4">{{ $t('tools.preview') }}</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="glass-card p-4 rounded-xl flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-[var(--theme-primary)] flex items-center justify-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
              <div>
                <div class="text-sm font-bold text-main">主色应用</div>
                <div class="text-xs text-muted">Primary Theme Color</div>
              </div>
            </div>
            <div class="glass-card p-4 rounded-xl flex items-center gap-3 opacity-80">
              <div class="w-10 h-10 rounded-lg border-2 border-border-base border-dashed flex items-center justify-center text-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              </div>
              <div>
                <div class="text-sm font-bold text-main">玻璃质感</div>
                <div class="text-xs text-muted">Glassmorphism Texture</div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- 底部操作按钮 -->
      <div class="flex gap-3 mt-10">
        <button 
          @click="$emit('close')"
          class="w-full py-3.5 bg-border-base/50 dark:bg-slate-700 text-main rounded-2xl hover:bg-border-base dark:hover:bg-slate-600 font-bold transition-all active:scale-[0.98]"
        >
          {{ $t('common.close') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCustomTheme } from '../composables/useCustomTheme'

const emit = defineEmits(['close'])
const { t } = useI18n()
const { presetThemes, currentPreset, glassBlur, bgOpacity, setPresetTheme, setCustomTheme, resetTheme } = useCustomTheme()

const customPrimary = ref('#475569')

const normalizeHexColor = (value, fallback = '#475569') => {
  const input = String(value || '').trim()
  const shortMatch = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(input)
  if (shortMatch) {
    return `#${shortMatch[1]}${shortMatch[1]}${shortMatch[2]}${shortMatch[2]}${shortMatch[3]}${shortMatch[3]}`.toLowerCase()
  }

  const fullMatch = /^#?([a-f\d]{6})$/i.exec(input)
  return fullMatch ? `#${fullMatch[1]}`.toLowerCase() : fallback
}

onMounted(() => {
  // 获取当前生效的主色
  const current = getComputedStyle(document.documentElement).getPropertyValue('--theme-primary').trim()
  customPrimary.value = normalizeHexColor(current)
})

/**
 * 应用预设
 */
const applyPreset = (key) => {
  setPresetTheme(key)
  customPrimary.value = normalizeHexColor(presetThemes[key]?.primary)
}

/**
 * 处理自定义颜色选择
 */
const handleCustomColorChange = (event) => {
  const nextColor = normalizeHexColor(event?.target?.value, customPrimary.value)
  customPrimary.value = nextColor
  setCustomTheme({ primary: nextColor })
}

/**
 * 重置
 */
const resetToDefault = () => {
  resetTheme()
  customPrimary.value = '#475569'
}
</script>

<style scoped>
.theme-custom-card {
  border: 1px solid var(--border-color);
  background: color-mix(in srgb, var(--surface-bg) 86%, transparent);
  box-shadow: var(--shadow-soft);
}

.theme-color-picker-wrap {
  width: 5.5rem;
  height: 5.5rem;
  padding: 0.35rem;
  border: 1px solid var(--border-color);
  border-radius: 1.35rem;
  background: color-mix(in srgb, var(--surface-bg) 92%, transparent);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.18), 0 14px 32px rgb(15 23 42 / 0.12);
  isolation: isolate;
  filter: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.theme-native-color-picker {
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  border-radius: 1rem;
  background: transparent;
  cursor: pointer;
  color: transparent;
  filter: none;
  mix-blend-mode: normal;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.theme-native-color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}

.theme-native-color-picker::-webkit-color-swatch {
  border: 0;
  border-radius: 1rem;
}

.theme-native-color-picker::-moz-color-swatch {
  border: 0;
  border-radius: 1rem;
}
</style>
