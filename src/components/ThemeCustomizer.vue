<!--
  主题自定义组件
  允许用户选择预设主题、调整主色与玻璃表面参数
-->
<template>
  <div
    class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-md"
    @click.self="$emit('close')"
  >
    <div class="surface-float theme-customizer-shell animate-fade-in custom-scrollbar">
      <header class="theme-customizer-header">
        <div class="theme-header-copy">
          <div class="theme-header-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 text-white">
              <circle cx="12" cy="12" r="3"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
            </svg>
          </div>
          <div class="min-w-0">
            <h2 class="theme-title">{{ $t('theme.title') }}</h2>
            <p class="theme-subtitle">{{ $t('theme.customHint') }}</p>
          </div>
        </div>
        <button
          @click="$emit('close')"
          class="icon-btn theme-close-btn"
          :title="$t('common.close')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </header>

      <div class="theme-customizer-body">
        <div class="theme-column space-y-6">
          <section class="theme-surface-card">
            <div class="theme-section-head">
              <div>
                <h3 class="theme-label-group">{{ $t('theme.presets') }}</h3>
                <p class="theme-section-copy">{{ $t('theme.presetsDesc') }}</p>
              </div>
              <span class="theme-section-chip">{{ Object.keys(presetThemes).length }}</span>
            </div>
            <div class="theme-preset-grid">
              <button
                v-for="(theme, key) in presetThemes"
                :key="key"
                type="button"
                class="theme-preset-card group"
                :class="{ 'is-active': currentPreset === key }"
                @click="applyPreset(key)"
              >
                <div class="theme-preset-swatch" :style="{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark || theme.primary})` }">
                  <div v-if="currentPreset === key" class="theme-check-overlay">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                      <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                    </svg>
                  </div>
                </div>
                <span class="theme-preset-name">{{ $t(theme.nameKey) }}</span>
              </button>
            </div>
          </section>

          <section class="theme-surface-card">
            <div class="theme-section-head">
              <div>
                <h3 class="theme-label-group !m-0">{{ $t('theme.primaryColor') }}</h3>
                <p class="theme-section-copy">{{ $t('theme.primaryColorDesc') }}</p>
              </div>
              <div class="theme-hex-badge">{{ customPrimary.toUpperCase() }}</div>
            </div>
            <div class="theme-color-row">
              <label class="color-picker-trigger" :style="{ backgroundColor: customPrimary }">
                <input
                  type="color"
                  :value="customPrimary"
                  class="sr-only"
                  @input="handleCustomColorChange"
                >
                <div class="picker-plus">{{ $t('theme.pick') }}</div>
              </label>
              <div class="theme-color-meta">
                <div class="theme-color-preview-band" :style="{ background: `linear-gradient(135deg, ${customPrimary}, color-mix(in srgb, ${customPrimary} 58%, white))` }"></div>
                <p class="theme-color-note">{{ $t('theme.primaryColorHint') }}</p>
              </div>
              <div class="theme-color-tools">
                <button
                  type="button"
                  class="action-btn action-btn-secondary !py-2 text-xs"
                  @click="resetToDefault"
                >
                  {{ $t('theme.reset') }}
                </button>
              </div>
            </div>
          </section>
        </div>

        <div class="theme-column space-y-6">
          <section class="theme-surface-card space-y-6">
            <div class="theme-section-head">
              <div>
                <h3 class="theme-label-group !m-0">{{ $t('theme.glassParameters') }}</h3>
                <p class="theme-section-copy">{{ $t('theme.glassParametersDesc') }}</p>
              </div>
              <span class="theme-section-chip">{{ $t('theme.previewGlass') }}</span>
            </div>
            <div class="space-y-6">
              <div class="theme-slider-group">
                <div class="slider-header">
                  <span class="slider-title">{{ $t('theme.panelOpacity') }}</span>
                  <span class="slider-val">{{ Math.round(panelOpacity * 100) }}%</span>
                </div>
                <input v-model.number="panelOpacity" type="range" min="0.2" max="0.95" step="0.01" class="modern-slider">
              </div>

              <div class="theme-slider-group">
                <div class="slider-header">
                  <span class="slider-title">{{ $t('theme.bgOpacity') }}</span>
                  <span class="slider-val">{{ Math.round(bgOpacity * 100) }}%</span>
                </div>
                <input v-model.number="bgOpacity" type="range" min="0" max="0.5" step="0.01" class="modern-slider">
              </div>

              <div class="theme-slider-group">
                <div class="slider-header">
                  <span class="slider-title">{{ $t('theme.glassBlur') }}</span>
                  <span class="slider-val">{{ glassBlur }}px</span>
                </div>
                <input v-model.number="glassBlur" type="range" min="0" max="40" step="1" class="modern-slider">
              </div>
            </div>
          </section>

          <section class="theme-preview-shell">
            <div class="theme-section-head theme-section-head-compact">
              <div>
                <h3 class="theme-label-group !m-0">{{ $t('theme.previewTitle') }}</h3>
                <p class="theme-section-copy">{{ $t('theme.previewDesc') }}</p>
              </div>
              <span class="theme-section-chip">{{ activeThemeLabel }}</span>
            </div>
            <div class="theme-preview-box" :style="previewBoxStyle">
              <div class="preview-inner-glass" :style="previewPanelStyle">
                <div class="preview-topbar">
                  <div class="preview-topbar-dots">
                    <span class="preview-topbar-dot" :style="{ backgroundColor: customPrimary }"></span>
                    <span class="preview-topbar-dot muted"></span>
                    <span class="preview-topbar-dot muted"></span>
                  </div>
                  <span class="preview-topbar-label">{{ $t('theme.previewMode') }}</span>
                </div>

                <div class="preview-header">
                  <div class="preview-dot" :style="{ backgroundColor: customPrimary }"></div>
                  <div class="min-w-0">
                    <div class="preview-title">{{ $t('theme.previewPrimary') }}</div>
                    <div class="preview-copy">{{ $t('theme.previewPrimaryMeta') }}</div>
                  </div>
                </div>

                <div class="preview-copy-lines">
                  <div class="preview-line strong"></div>
                  <div class="preview-line soft"></div>
                  <div class="preview-line medium"></div>
                </div>

                <div class="theme-preview-mini-grid">
                  <div class="theme-preview-mini-card">
                    <span class="theme-preview-mini-label">{{ $t('theme.panelOpacity') }}</span>
                    <span class="theme-preview-mini-value">{{ Math.round(panelOpacity * 100) }}%</span>
                  </div>
                  <div class="theme-preview-mini-card">
                    <span class="theme-preview-mini-label">{{ $t('theme.bgOpacity') }}</span>
                    <span class="theme-preview-mini-value">{{ Math.round(bgOpacity * 100) }}%</span>
                  </div>
                  <div class="theme-preview-mini-card">
                    <span class="theme-preview-mini-label">{{ $t('theme.glassBlur') }}</span>
                    <span class="theme-preview-mini-value">{{ glassBlur }}px</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <footer class="theme-footer divider-strong-t">
        <button
          @click="resetToDefault"
          class="action-btn action-btn-secondary theme-footer-btn"
        >
          {{ $t('theme.reset') }}
        </button>
        <button
          @click="$emit('close')"
          class="action-btn action-btn-primary theme-footer-btn"
        >
          {{ $t('theme.saveAndClose') }}
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCustomTheme } from '../composables/useCustomTheme'

defineEmits(['close'])
const { t } = useI18n()

const {
  presetThemes,
  currentPreset,
  glassBlur,
  bgOpacity,
  panelOpacity,
  setPresetTheme,
  setCustomTheme,
  resetTheme
} = useCustomTheme()

const customPrimary = ref('#475569')

const normalizeHexColor = (value, fallback = '#475569') => {
  const input = String(value || '').trim()
  const fullMatch = /^#?([a-f\d]{6}|[a-f\d]{3})$/i.exec(input)
  if (!fullMatch) return fallback
  let hex = fullMatch[1]
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('')
  return `#${hex.toLowerCase()}`
}

const previewBoxStyle = computed(() => ({
  background: `radial-gradient(circle at 0% 0%, color-mix(in srgb, ${customPrimary.value} 20%, transparent), transparent 60%), radial-gradient(circle at 100% 100%, color-mix(in srgb, ${customPrimary.value} 15%, transparent), transparent 60%)`,
  backgroundColor: 'var(--surface-base)'
}))

const previewPanelStyle = computed(() => {
  const isDark = document.documentElement.classList.contains('dark')
  const baseColor = isDark ? '15, 23, 42' : '255, 255, 255'
  return {
    background: `rgba(${baseColor}, ${panelOpacity.value})`,
    backdropFilter: `blur(${glassBlur.value}px)`,
    WebkitBackdropFilter: `blur(${glassBlur.value}px)`,
    border: `1px solid color-mix(in srgb, ${customPrimary.value} 25%, var(--border-strong))`
  }
})

const activeThemeLabel = computed(() => {
  if (currentPreset.value === 'custom') return t('theme.custom')
  const preset = presetThemes[currentPreset.value]
  return preset?.nameKey ? t(preset.nameKey) : t('theme.presetsMap.none')
})

onMounted(() => {
  const current = getComputedStyle(document.documentElement).getPropertyValue('--theme-primary').trim()
  customPrimary.value = normalizeHexColor(current)
})

const applyPreset = (key) => {
  setPresetTheme(key)
  customPrimary.value = normalizeHexColor(presetThemes[key]?.primary, customPrimary.value)
}

const handleCustomColorChange = (event) => {
  const nextColor = normalizeHexColor(event?.target?.value, customPrimary.value)
  customPrimary.value = nextColor
  setCustomTheme({ primary: nextColor })
}

const resetToDefault = () => {
  resetTheme()
  customPrimary.value = '#475569'
}
</script>

<style scoped>
.theme-customizer-shell {
  width: min(980px, 100%);
  max-height: min(90vh, 860px);
  padding: 1rem;
  border-radius: 30px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: var(--shadow-strong);
}

.theme-customizer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.8rem;
  padding-bottom: 0.8rem;
  border-bottom: 1px solid color-mix(in srgb, var(--border-strong) 88%, transparent);
}

.theme-header-copy {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-width: 0;
}

.theme-header-icon {
  width: 2.7rem;
  height: 2.7rem;
  border-radius: 0.95rem;
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-dark));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 24px color-mix(in srgb, var(--theme-primary) 30%, transparent);
}

.theme-title {
  font-size: clamp(1.28rem, 1.7vw, 1.72rem);
  line-height: 1.05;
  font-weight: 900;
  letter-spacing: -0.03em;
  color: var(--text-main);
}

.theme-subtitle {
  margin-top: 0.22rem;
  font-size: 0.76rem;
  line-height: 1.45;
  color: var(--text-secondary);
}

.theme-customizer-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0.85rem;
  min-height: 0;
  overflow-y: auto;
  padding-right: 0.2rem;
}

.theme-column {
  min-width: 0;
}

.theme-label-group {
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.theme-surface-card,
.theme-preview-shell {
  border-radius: 22px;
  padding: 0.8rem;
  border: 1px solid var(--border-strong);
  background: linear-gradient(180deg, color-mix(in srgb, var(--surface-panel) 96%, transparent), color-mix(in srgb, var(--surface-elevated) 92%, transparent));
  box-shadow: var(--shadow-soft);
}

.theme-section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.72rem;
}

.theme-section-head-compact {
  margin-bottom: 0.72rem;
}

.theme-section-copy {
  margin-top: 0.24rem;
  font-size: 0.75rem;
  line-height: 1.45;
  color: var(--text-secondary);
}

.theme-section-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 1.55rem;
  padding: 0 0.62rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--theme-primary) 10%, transparent);
  color: var(--theme-primary);
  font-size: 0.7rem;
  font-weight: 800;
  white-space: nowrap;
}

.theme-preset-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.55rem;
}

.theme-preset-card {
  padding: 0.58rem;
  border-radius: 16px;
  background: color-mix(in srgb, var(--surface-panel) 96%, transparent);
  border: 1px solid var(--border-strong);
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.theme-preset-card:hover {
  border-color: var(--theme-primary-light);
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
}

.theme-preset-card.is-active {
  border-color: var(--theme-primary);
  background: color-mix(in srgb, var(--theme-primary) 8%, var(--surface-panel));
  box-shadow: var(--shadow-medium);
}

.theme-preset-swatch {
  width: 100%;
  aspect-ratio: 2.2;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 1px 1px rgba(255,255,255,0.2);
}

.theme-check-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.15);
  color: white;
  backdrop-filter: blur(2px);
}

.theme-preset-name {
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--text-main);
  text-align: left;
}

.theme-hex-badge {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 0.7rem;
  font-weight: 900;
  color: var(--theme-primary);
  background: color-mix(in srgb, var(--theme-primary) 12%, transparent);
  padding: 0.22rem 0.52rem;
  border-radius: 8px;
}

.theme-color-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.8rem;
}

.color-picker-trigger {
  width: 3.95rem;
  height: 3.95rem;
  border-radius: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-medium), inset 0 2px 4px rgba(255,255,255,0.3);
  transition: transform 0.2s ease;
  border: 2px solid white;
}

.dark .color-picker-trigger {
  border-color: rgba(255,255,255,0.1);
}

.color-picker-trigger:hover {
  transform: scale(1.05);
}

.picker-plus {
  font-size: 0.66rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.theme-color-meta {
  min-width: 0;
}

.theme-color-preview-band {
  height: 0.65rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--border-strong) 84%, transparent);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.2);
}

.theme-color-note {
  margin-top: 0.45rem;
  font-size: 0.75rem;
  line-height: 1.45;
  color: var(--text-secondary);
}

.theme-color-tools {
  display: flex;
  justify-content: flex-end;
}

.theme-slider-group {
  display: block;
}

.slider-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.55rem;
}

.slider-title {
  font-size: 0.84rem;
  font-weight: 800;
  color: var(--text-main);
}

.slider-val {
  font-family: ui-monospace, monospace;
  font-size: 0.76rem;
  font-weight: 900;
  color: var(--theme-primary);
}

.modern-slider {
  width: 100%;
  appearance: none;
  height: 6px;
  background: linear-gradient(90deg, color-mix(in srgb, var(--theme-primary) 24%, transparent), color-mix(in srgb, var(--theme-primary) 72%, white));
  border-radius: 3px;
  outline: none;
  border: 1px solid color-mix(in srgb, var(--theme-primary) 14%, var(--border-strong));
}

.modern-slider::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  border: 4px solid var(--theme-primary);
  box-shadow: 0 4px 10px rgba(0,0,0,0.15);
  cursor: pointer;
  transition: all 0.2s ease;
}

.modern-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 0 8px color-mix(in srgb, var(--theme-primary) 15%, transparent);
}

.theme-preview-box {
  border-radius: 26px;
  padding: 0.75rem;
  display: flex;
  align-items: stretch;
  border: 1.5px solid var(--border-strong);
  min-height: 11.4rem;
}

.preview-inner-glass {
  width: 100%;
  border-radius: 16px;
  padding: 0.8rem;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  min-height: 9.7rem;
}

.preview-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.preview-topbar-dots {
  display: flex;
  align-items: center;
  gap: 0.38rem;
}

.preview-topbar-dot {
  width: 0.46rem;
  height: 0.46rem;
  border-radius: 999px;
}

.preview-topbar-dot.muted {
  background: color-mix(in srgb, var(--text-muted) 28%, transparent);
}

.preview-topbar-label {
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 0.65rem;
}

.preview-dot {
  width: 0.68rem;
  height: 0.68rem;
  border-radius: 50%;
  box-shadow: 0 0 12px currentColor;
}

.preview-title {
  font-size: 0.86rem;
  font-weight: 800;
  color: var(--text-main);
}

.preview-copy {
  margin-top: 0.12rem;
  font-size: 0.72rem;
  line-height: 1.35;
  color: var(--text-secondary);
}

.preview-copy-lines {
  margin-top: 0.7rem;
  display: grid;
  gap: 0.36rem;
}

.preview-line {
  height: 0.34rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--text-main) 8%, transparent);
}

.preview-line.strong {
  width: 78%;
}

.preview-line.soft {
  width: 100%;
}

.preview-line.medium {
  width: 65%;
}

.theme-preview-mini-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 0.75rem;
}

.theme-preview-mini-card {
  border-radius: 14px;
  padding: 0.58rem;
  background: color-mix(in srgb, var(--surface-panel) 46%, transparent);
  border: 1px solid var(--border-strong);
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.theme-preview-mini-label {
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  font-weight: 700;
}

.theme-preview-mini-value {
  font-size: 0.82rem;
  line-height: 1.2;
  font-weight: 800;
  color: var(--text-main);
}

.theme-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.8rem;
  padding-top: 0.8rem;
}

.theme-footer-btn {
  min-width: 8rem;
}

@media (max-width: 960px) {
  .theme-customizer-shell {
    width: min(780px, 100%);
    max-height: 92vh;
    padding: 0.9rem;
    border-radius: 28px;
  }

  .theme-customizer-body {
    grid-template-columns: 1fr;
    gap: 0.8rem;
  }

  .theme-preset-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .theme-preview-box {
    min-height: 10.6rem;
  }
}

@media (max-width: 640px) {
  .theme-customizer-shell {
    padding: 0.78rem;
    border-radius: 22px;
  }

  .theme-header-icon {
    width: 2.45rem;
    height: 2.45rem;
    border-radius: 0.8rem;
  }

  .theme-title {
    font-size: 1.14rem;
  }

  .theme-subtitle {
    font-size: 0.72rem;
  }

  .theme-section-head {
    flex-direction: column;
    gap: 0.45rem;
  }

  .theme-preset-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
  }

  .theme-color-row {
    grid-template-columns: minmax(0, 1fr);
    align-items: stretch;
  }

  .theme-preview-box {
    padding: 0.65rem;
    min-height: 10rem;
  }

  .preview-inner-glass {
    padding: 0.72rem;
  }

  .theme-color-tools {
    justify-content: stretch;
  }

  .theme-color-tools > .action-btn {
    width: 100%;
  }

  .theme-preview-mini-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .theme-footer {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .theme-footer-btn {
    width: 100%;
  }
}

@media (max-height: 820px) and (min-width: 961px) {
  .theme-customizer-shell {
    padding: 0.9rem;
  }

  .theme-customizer-body {
    gap: 0.75rem;
  }

  .theme-surface-card,
  .theme-preview-shell {
    padding: 0.75rem;
  }

  .theme-preview-box {
    min-height: 10.4rem;
  }
}
</style>
