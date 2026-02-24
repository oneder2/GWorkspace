<!--
  更新日志组件 - 美化版
  采用清淡的磨砂玻璃设计，条理清晰
-->
<template>
  <div class="glass-card rounded-3xl p-6 md:p-8 flex flex-col border border-white/30 dark:border-slate-700/30 shadow-xl backdrop-blur-xl bg-white/40 dark:bg-slate-900/40">
    <div class="flex items-center justify-between mb-8 pb-4 border-b border-slate-200/30 dark:border-slate-700/30">
      <div class="flex items-center gap-3">
        <div class="w-1.5 h-6 bg-[var(--theme-primary)] rounded-full"></div>
        <h3 class="font-bold text-xl tracking-tight text-slate-800 dark:text-slate-100">
          {{ $t('home.updateLog') }}
        </h3>
      </div>
      <span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold opacity-60">Changelog</span>
    </div>

    <div class="space-y-8 overflow-y-auto custom-scrollbar pr-2 flex-1 max-h-[400px]">
      <div v-for="(update, index) in updates" :key="index" class="group">
        <div class="flex items-baseline gap-4 mb-3">
          <span class="text-sm font-black text-[var(--theme-primary)] opacity-80 group-hover:opacity-100 transition-opacity">
            {{ update.version }}
          </span>
          <span class="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
            {{ update.date }}
          </span>
        </div>
        
        <ul class="space-y-2.5 ml-1">
          <li v-for="(item, i) in update.items" :key="i" class="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-3 leading-relaxed">
            <div class="mt-1.5 w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0 group-hover:bg-[var(--theme-primary)] transition-colors"></div>
            <span>{{ item }}</span>
          </li>
        </ul>
      </div>
    </div>
    
    <div class="mt-8 pt-6 border-t border-slate-200/30 dark:border-slate-700/30 flex justify-center">
      <a 
        href="https://github.com/oneder2/GWorkspace/blob/main/CHANGELOG.md" 
        target="_blank" 
        class="group flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-[var(--theme-primary)] dark:hover:text-[var(--theme-primary)] transition-all"
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
import { ref } from 'vue'

const updates = ref([
  {
    version: 'v2.4.0',
    date: '2026-02-23',
    items: [
      '后端性能优化：引入敏感词过滤正则缓存',
      '交互增强：编码工具与编辑器添加复制成功反馈',
      '架构优化：彻底移除 PWA 系统及相关依赖',
      '布局修复：恢复首页居中布局并美化更新日志',
      'Bug 修复：修正天气经纬度定位逻辑、修复登录弹窗层级'
    ]
  },
  {
    version: 'v2.3.0',
    date: '2026-01-29',
    items: [
      '新增友站链接分区及模块化设计',
      '博客页面样式深度优化及热度计算',
      '工具页面 CSS 变量引用修复'
    ]
  }
])
</script>
