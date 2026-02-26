<template>
  <div class="animate-pulse space-y-4">
    <div v-for="i in count" :key="i" class="glass-card p-5 sm:p-6 rounded-2xl border border-white/20">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-16 h-6 bg-border-base rounded-md"></div>
        <div class="w-24 h-4 bg-border-base/50 rounded"></div>
      </div>
      <div class="h-8 bg-border-base rounded-lg w-3/4 mb-4"></div>
      <div class="space-y-2 mb-6">
        <div class="h-4 bg-border-base/50 rounded w-full"></div>
        <div class="h-4 bg-border-base/50 rounded w-5/6"></div>
      </div>
      <div class="flex items-center justify-between pt-4 border-t border-border-base">
        <div class="flex gap-4">
          <div class="w-12 h-4 bg-border-base/50 rounded"></div>
          <div class="w-12 h-4 bg-border-base/50 rounded"></div>
        </div>
        <div class="w-20 h-4 bg-border-base rounded"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  count: {
    type: Number,
    default: 3
  }
})
</script>
