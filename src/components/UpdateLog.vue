<!--
  更新日志组件 - 美化版
  采用清淡的磨砂玻璃设计，条理清晰
-->
<template>
  <div :class="['surface-panel rounded-3xl flex flex-col min-w-0', compact ? 'p-4 md:p-5' : 'p-6 md:p-8']">
    <div :class="['flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0 divider-strong-b', compact ? 'mb-5 pb-3' : 'mb-8 pb-4']">
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-1.5 h-6 bg-[var(--theme-primary)] rounded-full"></div>
        <h3 class="font-bold text-xl tracking-tight text-main min-w-0 break-words">
          {{ $t('home.updateLog') }}
        </h3>
      </div>
      <span class="text-[10px] uppercase tracking-widest text-muted font-bold opacity-60 sm:text-right">{{ $t('common.changelog') }}</span>
    </div>

    <div :class="['overflow-y-auto custom-scrollbar pr-2 flex-1', compact ? 'space-y-5 max-h-[320px]' : 'space-y-8 max-h-[400px]']">
      <div v-for="(update, index) in visibleUpdates" :key="index" class="group">
        <div class="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4 mb-3 min-w-0">
          <span class="text-sm font-black text-[var(--theme-primary)] opacity-80 group-hover:opacity-100 transition-opacity break-words">
            {{ update.version }}
          </span>
          <span class="text-[11px] font-bold text-muted uppercase tracking-tighter break-words">
            {{ update.date }}
          </span>
        </div>
        
        <ul class="space-y-2.5 ml-1">
          <li v-for="(item, i) in update.items" :key="i" class="text-sm text-secondary flex items-start gap-3 leading-relaxed min-w-0">
            <div class="mt-1.5 w-1 h-1 rounded-full bg-border-base shrink-0 group-hover:bg-[var(--theme-primary)] transition-colors"></div>
            <span class="break-words">{{ item }}</span>
          </li>
        </ul>
      </div>
    </div>
    
    <div :class="['flex justify-center divider-strong-t', compact ? 'mt-5 pt-4' : 'mt-8 pt-6']">
      <a 
        href="https://github.com/oneder2/GWorkspace/blob/main/CHANGELOG.md" 
        target="_blank"
        rel="noopener noreferrer"
        class="group flex items-center gap-2 text-xs font-bold text-muted hover:text-[var(--theme-primary)] transition-all"
      >
        <span>{{ $t('common.viewMore') }}</span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform">
          <path d="M5 12h14m-7-7 7 7-7 7"/>
        </svg>
      </a>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  compact: {
    type: Boolean,
    default: false
  }
})

const { t } = useI18n()

const updates = computed(() => ([
  {
    version: 'v3.0.0',
    date: '2026-04-30',
    items: [
      t('changelog.v3_0_0.0'),
      t('changelog.v3_0_0.1'),
      t('changelog.v3_0_0.2'),
      t('changelog.v3_0_0.3'),
      t('changelog.v3_0_0.4'),
      t('changelog.v3_0_0.5')
    ]
  },
  {
    version: 'v2.7.0',
    date: '2026-02-26',
    items: [
      t('changelog.v2_7_0.0'),
      t('changelog.v2_7_0.1'),
      t('changelog.v2_7_0.2'),
      t('changelog.v2_7_0.3'),
      t('changelog.v2_7_0.4'),
      t('changelog.v2_7_0.5')
    ]
  },
  {
    version: 'v2.6.0',
    date: '2026-02-26',
    items: [
      t('changelog.v2_6_0.0'),
      t('changelog.v2_6_0.1'),
      t('changelog.v2_6_0.2'),
      t('changelog.v2_6_0.3'),
      t('changelog.v2_6_0.4')
    ]
  },
  {
    version: 'v2.5.0',
    date: '2026-02-24',
    items: [
      t('changelog.v2_5_0.0'),
      t('changelog.v2_5_0.1'),
      t('changelog.v2_5_0.2'),
      t('changelog.v2_5_0.3'),
      t('changelog.v2_5_0.4')
    ]
  },
  {
    version: 'v2.4.0',
    date: '2026-02-23',
    items: [
      t('changelog.v2_4_0.0'),
      t('changelog.v2_4_0.1'),
      t('changelog.v2_4_0.2'),
      t('changelog.v2_4_0.3'),
      t('changelog.v2_4_0.4')
    ]
  },
  {
    version: 'v2.3.0',
    date: '2026-01-29',
    items: [
      t('changelog.v2_3_0.0'),
      t('changelog.v2_3_0.1'),
      t('changelog.v2_3_0.2')
    ]
  }
]))

const visibleUpdates = computed(() => {
  return props.compact ? updates.value.slice(0, 3) : updates.value
})
</script>
