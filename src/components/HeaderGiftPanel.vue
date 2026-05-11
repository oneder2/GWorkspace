<template>
  <div
    ref="containerRef"
    class="relative hidden lg:flex items-center min-w-0 flex-1 max-w-[26rem] xl:max-w-[32rem]"
  >
    <button
      type="button"
      class="gift-trigger"
      :class="{ 'gift-trigger-open': isOpen }"
      :aria-expanded="isOpen ? 'true' : 'false'"
      :title="$t('common.stationGift')"
      @click="togglePanel"
    >
      <span class="gift-trigger-mark" aria-hidden="true"></span>
      <span class="gift-trigger-copy">
        <span class="gift-trigger-label">{{ $t('common.stationGift') }}</span>
        <span class="gift-trigger-text">{{ summaryLine }}</span>
      </span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="gift-trigger-chevron"
        :class="{ 'gift-trigger-chevron-open': isOpen }"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>

    <transition name="gift-panel">
      <div
        v-if="isOpen"
        class="gift-panel surface-float"
      >
        <div class="gift-panel-top">
          <div class="gift-panel-kicker">{{ $t('common.stationGift') }}</div>
          <button
            type="button"
            class="gift-close"
            :title="$t('common.close')"
            @click="isOpen = false"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="w-4 h-4"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <template v-if="capsule">
          <div class="gift-panel-body">
            <div v-if="capsule.greeting" class="gift-panel-greeting">
              {{ trimDisplayText(capsule.greeting, 20) }}
            </div>
            <p class="gift-panel-quote">“{{ capsule.source_text }}”</p>
            <p class="gift-panel-thesis">{{ capsule.thesis }}</p>
            <p class="gift-panel-note">
              <span>{{ $t('common.stationGiftBoundary') }}</span>
              {{ capsule.boundary }}
            </p>
            <p class="gift-panel-note">
              <span>{{ $t('common.stationGiftTakeaway') }}</span>
              {{ capsule.takeaway }}
            </p>
          </div>

          <div class="gift-panel-actions">
            <router-link to="/tools?tool=thesis-parser" class="gift-link">
              {{ $t('common.stationGiftRead') }}
            </router-link>
            <router-link to="/tools?tool=blog-assistant" class="gift-link gift-link-primary">
              {{ $t('common.stationGiftWrite') }}
            </router-link>
          </div>
        </template>

        <div v-else class="gift-panel-empty">
          {{ $t('home.dailyCapsule.empty') }}
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDailyCapsule } from '../composables/useDailyCapsule'

const { t } = useI18n()
const { capsule, loadDailyCapsule } = useDailyCapsule()

const isOpen = ref(false)
const containerRef = ref(null)

const trimDisplayText = (value, maxLength) => {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim()
  if (!normalized) return ''
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, Math.max(1, maxLength - 1)).trim()}…`
}

const summaryLine = computed(() => {
  if (!capsule.value) return t('common.stationGiftIdle')
  return trimDisplayText(capsule.value.greeting || capsule.value.source_text, 24)
})

const handlePointerDown = (event) => {
  if (!containerRef.value?.contains(event.target)) {
    isOpen.value = false
  }
}

const togglePanel = () => {
  isOpen.value = !isOpen.value
}

onMounted(() => {
  loadDailyCapsule().catch((error) => {
    console.error('Failed to load station gift:', error)
  })
  document.addEventListener('pointerdown', handlePointerDown)
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', handlePointerDown)
})
</script>

<style scoped>
.gift-panel-enter-active,
.gift-panel-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.gift-panel-enter-from,
.gift-panel-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}

.gift-trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 0;
  width: 100%;
  padding: 0.72rem 0.95rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--theme-primary) 12%, var(--border-strong));
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--surface-elevated) 94%, transparent), color-mix(in srgb, var(--surface-panel) 94%, transparent));
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
  color: var(--text-secondary);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.gift-trigger:hover,
.gift-trigger-open {
  transform: translateY(-1px);
  color: var(--text-main);
  border-color: color-mix(in srgb, var(--theme-primary) 24%, var(--border-strong));
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.12);
}

.gift-trigger::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background:
    radial-gradient(circle at 14% 50%, color-mix(in srgb, var(--theme-primary) 16%, transparent), transparent 38%),
    linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.36), transparent);
  opacity: 0.72;
  pointer-events: none;
}

.gift-trigger-mark {
  position: relative;
  flex: 0 0 auto;
  width: 0.62rem;
  height: 0.62rem;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--theme-primary), color-mix(in srgb, var(--theme-primary-light) 70%, white));
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--theme-primary) 12%, transparent), 0 0 24px color-mix(in srgb, var(--theme-primary) 25%, transparent);
}

.gift-trigger-copy {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  text-align: left;
}

.gift-trigger-label {
  font-size: 0.66rem;
  line-height: 1;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--theme-primary);
  font-weight: 800;
}

.gift-trigger-text {
  margin-top: 0.28rem;
  font-size: 0.88rem;
  line-height: 1.2rem;
  font-weight: 600;
  color: inherit;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gift-trigger-chevron {
  position: relative;
  flex: 0 0 auto;
  width: 1rem;
  height: 1rem;
  color: var(--text-muted);
  transition: transform 0.2s ease, color 0.2s ease;
}

.gift-trigger-chevron-open {
  transform: rotate(180deg);
  color: var(--theme-primary);
}

.gift-panel {
  position: absolute;
  top: calc(100% + 0.9rem);
  left: 0;
  width: min(33rem, calc(100vw - 16rem));
  padding: 1rem;
  border-radius: 26px;
  z-index: 60;
  overflow: hidden;
}

.gift-panel::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--theme-primary) 15%, transparent), transparent 34%),
    radial-gradient(circle at bottom left, color-mix(in srgb, var(--theme-primary-light) 12%, transparent), transparent 40%);
  pointer-events: none;
}

.gift-panel-top,
.gift-panel-body,
.gift-panel-actions,
.gift-panel-empty {
  position: relative;
  z-index: 1;
}

.gift-panel-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.9rem;
  border-bottom: 1px solid color-mix(in srgb, var(--border-strong) 92%, transparent);
}

.gift-panel-kicker {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--theme-primary);
}

.gift-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  color: var(--text-muted);
  transition: background-color 0.2s ease, color 0.2s ease;
}

.gift-close:hover {
  color: var(--text-main);
  background: color-mix(in srgb, var(--theme-primary) 10%, transparent);
}

.gift-panel-body {
  display: grid;
  gap: 0.78rem;
  padding-top: 1rem;
}

.gift-panel-greeting {
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--text-muted);
}

.gift-panel-quote {
  font-size: 1.05rem;
  line-height: 1.7;
  font-weight: 700;
  color: var(--text-main);
}

.gift-panel-thesis {
  font-size: 0.92rem;
  line-height: 1.75;
  color: var(--text-secondary);
}

.gift-panel-note {
  font-size: 0.83rem;
  line-height: 1.65;
  color: var(--text-secondary);
}

.gift-panel-note span {
  margin-right: 0.42rem;
  font-weight: 700;
  color: var(--text-main);
}

.gift-panel-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  padding-top: 1rem;
}

.gift-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.3rem;
  padding: 0.58rem 0.9rem;
  border-radius: 14px;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-main);
  border: 1px solid color-mix(in srgb, var(--border-strong) 90%, transparent);
  background: color-mix(in srgb, var(--surface-elevated) 88%, transparent);
  transition: transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
}

.gift-link:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--theme-primary) 20%, var(--border-strong));
}

.gift-link-primary {
  color: white;
  border-color: transparent;
  background: linear-gradient(135deg, var(--theme-primary), color-mix(in srgb, var(--theme-primary) 76%, white));
}

.gift-panel-empty {
  padding-top: 1rem;
  font-size: 0.88rem;
  line-height: 1.7;
  color: var(--text-secondary);
}
</style>
