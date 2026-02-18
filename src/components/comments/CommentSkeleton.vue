<template>
  <div class="animate-pulse space-y-6">
    <div v-for="i in 2" :key="i" class="flex gap-4">
      <div class="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0"></div>
      <div class="flex-1 space-y-3">
        <div class="flex items-center gap-3">
          <div class="w-24 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div class="w-16 h-3 bg-slate-100 dark:bg-slate-800 rounded"></div>
        </div>
        <div class="h-16 bg-white/40 dark:bg-slate-800/40 rounded-xl"></div>
      </div>
    </div>
  </div>
</template>
