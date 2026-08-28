<template>
  <div
    class="theme-customizer-backdrop"
    role="presentation"
    @click.self="emit('close')"
  >
    <section
      class="surface-float theme-customizer-shell"
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-customizer-title"
    >
      <header class="theme-customizer-header">
        <div class="theme-header-copy">
          <span class="theme-header-swatch" :style="{ backgroundColor: customPrimary }" aria-hidden="true"></span>
          <div class="min-w-0">
            <h2 id="theme-customizer-title" class="theme-title">{{ $t('theme.title') }}</h2>
            <span class="theme-active-label">{{ activeThemeLabel }}</span>
          </div>
        </div>
        <button
          ref="closeButton"
          type="button"
          class="icon-btn theme-close-btn"
          :title="$t('common.close')"
          @click="emit('close')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true" class="w-5 h-5">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </header>

      <div class="theme-customizer-body custom-scrollbar">
        <section class="theme-section" aria-labelledby="theme-presets-title">
          <div class="theme-section-head">
            <h3 id="theme-presets-title" class="theme-section-title">{{ $t('theme.presets') }}</h3>
            <span class="theme-section-count">{{ Object.keys(presetThemes).length }}</span>
          </div>

          <div class="theme-preset-grid">
            <button
              v-for="(theme, key) in presetThemes"
              :key="key"
              type="button"
              class="theme-preset-card"
              :class="{ 'is-active': currentPreset === key }"
              :aria-pressed="currentPreset === key"
              @click="applyPreset(key)"
            >
              <span
                class="theme-preset-swatch"
                :style="{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark || theme.primary})` }"
                aria-hidden="true"
              >
                <svg v-if="currentPreset === key" viewBox="0 0 20 20" fill="currentColor" class="theme-preset-check">
                  <path fill-rule="evenodd" d="M16.7 4.15a.75.75 0 0 1 .15 1.05l-8 10.5a.75.75 0 0 1-1.13.08l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.9 3.89 7.47-9.81a.75.75 0 0 1 1.05-.15Z" clip-rule="evenodd" />
                </svg>
              </span>
              <span class="theme-preset-name">{{ $t(theme.nameKey) }}</span>
            </button>
          </div>
        </section>

        <section class="theme-section theme-custom-color" aria-labelledby="theme-primary-title">
          <div class="theme-section-head">
            <h3 id="theme-primary-title" class="theme-section-title">{{ $t('theme.primaryColor') }}</h3>
            <output class="theme-hex-value">{{ customPrimary.toUpperCase() }}</output>
          </div>

          <label class="theme-color-picker">
            <input
              type="color"
              :value="customPrimary"
              :aria-label="$t('theme.pick')"
              @input="handleCustomColorChange"
            >
            <span class="theme-color-preview" :style="{ backgroundColor: customPrimary }" aria-hidden="true"></span>
            <span class="theme-color-action">{{ $t('theme.pick') }}</span>
          </label>
        </section>
      </div>

      <footer class="theme-footer">
        <button type="button" class="action-btn action-btn-secondary" @click="resetToDefault">
          {{ $t('theme.reset') }}
        </button>
        <button type="button" class="action-btn action-btn-primary" @click="emit('close')">
          {{ $t('theme.saveAndClose') }}
        </button>
      </footer>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCustomTheme } from '../composables/useCustomTheme'

const emit = defineEmits(['close'])
const { t } = useI18n()
const closeButton = ref(null)

const {
  presetThemes,
  currentPreset,
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
  if (hex.length === 3) hex = hex.split('').map(char => char + char).join('')
  return `#${hex.toLowerCase()}`
}

const activeThemeLabel = computed(() => {
  if (currentPreset.value === 'custom') return t('theme.custom')
  const preset = presetThemes[currentPreset.value]
  return preset?.nameKey ? t(preset.nameKey) : t('theme.presetsMap.none')
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

const handleKeydown = (event) => {
  if (event.key === 'Escape') emit('close')
}

onMounted(async () => {
  const current = getComputedStyle(document.documentElement).getPropertyValue('--theme-primary').trim()
  customPrimary.value = normalizeHexColor(current)
  window.addEventListener('keydown', handleKeydown)
  await nextTick()
  closeButton.value?.focus()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.theme-customizer-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgb(2 6 23 / 0.56);
}

.theme-customizer-shell {
  width: min(42rem, 100%);
  max-height: min(90dvh, 44rem);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 24px;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.theme-customizer-header,
.theme-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.1rem;
}

.theme-customizer-header {
  border-bottom: 1px solid var(--border-strong);
}

.theme-header-copy {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-width: 0;
}

.theme-header-swatch {
  width: 2.5rem;
  height: 2.5rem;
  flex: none;
  border-radius: 12px;
  border: 2px solid var(--border-highlight);
  box-shadow: 0 8px 20px color-mix(in srgb, var(--theme-primary) 24%, transparent);
}

.theme-title {
  color: var(--text-main);
  font-size: 1.15rem;
  font-weight: 850;
  line-height: 1.2;
  letter-spacing: 0;
}

.theme-active-label {
  display: block;
  margin-top: 0.15rem;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 700;
}

.theme-close-btn {
  flex: none;
}

.theme-customizer-body {
  overflow-y: auto;
  padding: 0 1.1rem;
}

.theme-section {
  padding: 1.05rem 0 1.15rem;
}

.theme-section + .theme-section {
  border-top: 1px solid var(--border-strong);
}

.theme-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  margin-bottom: 0.8rem;
}

.theme-section-title {
  color: var(--text-main);
  font-size: 0.82rem;
  font-weight: 850;
  letter-spacing: 0;
}

.theme-section-count,
.theme-hex-value {
  color: var(--text-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.72rem;
  font-weight: 800;
}

.theme-preset-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.65rem;
}

.theme-preset-card {
  min-width: 0;
  min-height: 5rem;
  display: grid;
  grid-template-rows: 2.65rem auto;
  gap: 0.45rem;
  padding: 0.45rem;
  color: var(--text-secondary);
  background: var(--surface-elevated);
  border: 1px solid var(--border-strong);
  border-radius: 12px;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.theme-preset-card:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--theme-primary) 34%, var(--border-strong));
  box-shadow: var(--shadow-soft);
}

.theme-preset-card.is-active {
  border-color: var(--theme-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--theme-primary) 14%, transparent);
}

.theme-preset-swatch {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  min-width: 0;
  border-radius: 8px;
}

.theme-preset-check {
  width: 1.1rem;
  height: 1.1rem;
  color: white;
  filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.4));
}

.theme-preset-name {
  overflow: hidden;
  color: var(--text-main);
  font-size: 0.75rem;
  font-weight: 780;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.theme-custom-color {
  padding-bottom: 1.25rem;
}

.theme-color-picker {
  position: relative;
  min-height: 3.2rem;
  display: grid;
  grid-template-columns: 2.2rem minmax(0, 1fr);
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  background: var(--surface-elevated);
  border: 1px solid var(--border-strong);
  border-radius: 12px;
}

.theme-color-picker:focus-within {
  border-color: var(--theme-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--theme-primary) 12%, transparent);
}

.theme-color-picker input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.theme-color-preview {
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 9px;
  border: 2px solid var(--border-highlight);
}

.theme-color-action {
  color: var(--text-main);
  font-size: 0.84rem;
  font-weight: 780;
}

.theme-footer {
  justify-content: flex-end;
  border-top: 1px solid var(--border-strong);
}

.theme-footer .action-btn {
  min-width: 7rem;
  padding-block: 0.72rem;
}

@media (max-width: 640px) {
  .theme-customizer-backdrop {
    align-items: end;
    padding: 0.5rem;
  }

  .theme-customizer-shell {
    max-height: calc(100dvh - 1rem);
    border-radius: 20px;
  }

  .theme-preset-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .theme-footer {
    display: grid;
    grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  }

  .theme-footer .action-btn {
    min-width: 0;
  }
}
</style>
