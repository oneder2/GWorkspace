<template>
  <div class="animate-pulse space-y-4">
    <div v-for="i in count" :key="i" class="glass-card p-5 sm:p-6 rounded-2xl border border-white/20">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-16 h-6 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
        <div class="w-24 h-4 bg-slate-100 dark:bg-slate-800 rounded"></div>
      </div>
      <div class="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-3/4 mb-4"></div>
      <div class="space-y-2 mb-6">
        <div class="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
        <div class="h-4 bg-slate-100 dark:bg-slate-800 rounded w-5/6"></div>
      </div>
      <div class="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
        <div class="flex gap-4">
          <div class="w-12 h-4 bg-slate-100 dark:bg-slate-800 rounded"></div>
          <div class="w-12 h-4 bg-slate-100 dark:bg-slate-800 rounded"></div>
        </div>
        <div class="w-20 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
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
