<template>
  <div class="space-y-6">
    <div 
      v-for="i in count" 
      :key="i" 
      class="skeleton-card glass-card p-6 sm:p-8 rounded-2xl relative overflow-hidden"
    >
      <!-- 分类和日期 -->
      <div class="flex items-center gap-4 mb-6">
        <div class="w-20 h-7 bg-slate-200 dark:bg-slate-700/50 rounded-md skeleton-item"></div>
        <div class="w-24 h-4 bg-slate-200/60 dark:bg-slate-700/30 rounded skeleton-item"></div>
      </div>
      
      <!-- 标题 -->
      <div class="h-10 bg-slate-200 dark:bg-slate-700/50 rounded-xl w-3/4 mb-6 skeleton-item"></div>
      
      <!-- 摘要 -->
      <div class="space-y-3 mb-8">
        <div class="h-4 bg-slate-200/60 dark:bg-slate-700/30 rounded w-full skeleton-item"></div>
        <div class="h-4 bg-slate-200/60 dark:bg-slate-700/30 rounded w-11/12 skeleton-item"></div>
        <div class="h-4 bg-slate-200/60 dark:bg-slate-700/30 rounded w-4/5 skeleton-item"></div>
      </div>
      
      <!-- 底部统计 -->
      <div class="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5">
        <div class="flex gap-6">
          <div class="flex items-center gap-2">
            <div class="w-5 h-5 bg-slate-200/60 dark:bg-slate-700/30 rounded-full skeleton-item"></div>
            <div class="w-8 h-4 bg-slate-200/40 dark:bg-slate-700/20 rounded skeleton-item"></div>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-5 h-5 bg-slate-200/60 dark:bg-slate-700/30 rounded-full skeleton-item"></div>
            <div class="w-8 h-4 bg-slate-200/40 dark:bg-slate-700/20 rounded skeleton-item"></div>
          </div>
        </div>
        <div class="w-24 h-5 bg-slate-200/60 dark:bg-slate-700/30 rounded-lg skeleton-item"></div>
      </div>

      <!-- 流光遮罩层 -->
      <div class="shimmer-overlay"></div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-card {
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.skeleton-item {
  position: relative;
}

.shimmer-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.03) 45%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.03) 55%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.8s infinite linear;
}

.dark .shimmer-overlay {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.01) 45%,
    rgba(255, 255, 255, 0.03) 50%,
    rgba(255, 255, 255, 0.01) 55%,
    transparent 100%
  );
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>

<script setup>
defineProps({
  count: {
    type: Number,
    default: 3
  }
})
</script>
