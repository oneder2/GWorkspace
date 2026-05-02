<template>
  <teleport to="body">
    <transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        class="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
        @click.self="$emit('close')"
      >
        <div class="surface-float w-full max-w-5xl rounded-[32px] overflow-hidden shadow-2xl animate-fade-in">
          <div class="flex items-center justify-between gap-4 px-6 py-5 divider-strong-b">
            <div>
              <div class="section-kicker">{{ $t('common.updates') }}</div>
              <h2 class="text-2xl font-bold text-main tracking-tight mt-2">{{ $t('home.updateLog') }}</h2>
            </div>
            <button
              @click="$emit('close')"
              class="icon-btn"
              :title="$t('common.close')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="max-h-[calc(90vh-6.5rem)] overflow-y-auto custom-scrollbar p-6 md:p-8">
            <UpdateLog />
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import UpdateLog from './UpdateLog.vue'

useI18n()
defineEmits(['close'])
</script>
