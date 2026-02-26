<!--
  更新日志组件 - 美化版
  采用清淡的磨砂玻璃设计，条理清晰
-->
<template>
  <div class="glass-card rounded-3xl p-6 md:p-8 flex flex-col border border-border-base shadow-xl backdrop-blur-xl bg-white/40 dark:bg-slate-900/40">
    <div class="flex items-center justify-between mb-8 pb-4 border-b border-border-base">
      <div class="flex items-center gap-3">
        <div class="w-1.5 h-6 bg-[var(--theme-primary)] rounded-full"></div>
        <h3 class="font-bold text-xl tracking-tight text-main">
          {{ $t('home.updateLog') }}
        </h3>
      </div>
      <span class="text-[10px] uppercase tracking-widest text-muted font-bold opacity-60">Changelog</span>
    </div>

    <div class="space-y-8 overflow-y-auto custom-scrollbar pr-2 flex-1 max-h-[400px]">
      <div v-for="(update, index) in updates" :key="index" class="group">
        <div class="flex items-baseline gap-4 mb-3">
          <span class="text-sm font-black text-[var(--theme-primary)] opacity-80 group-hover:opacity-100 transition-opacity">
            {{ update.version }}
          </span>
          <span class="text-[11px] font-bold text-muted uppercase tracking-tighter">
            {{ update.date }}
          </span>
        </div>
        
        <ul class="space-y-2.5 ml-1">
          <li v-for="(item, i) in update.items" :key="i" class="text-sm text-secondary flex items-start gap-3 leading-relaxed">
            <div class="mt-1.5 w-1 h-1 rounded-full bg-border-base shrink-0 group-hover:bg-[var(--theme-primary)] transition-colors"></div>
            <span>{{ item }}</span>
          </li>
        </ul>
      </div>
    </div>
    
    <div class="mt-8 pt-6 border-t border-border-base flex justify-center">
      <a 
        href="https://github.com/oneder2/GWorkspace/blob/main/CHANGELOG.md" 
        target="_blank" 
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
import { ref } from 'vue'

const updates = ref([
  {
    version: 'v2.5.0',
    date: '2026-02-24',
    items: [
      '设计系统：全站语义化变量重构，废弃硬编码颜色',
      '主题自定义：新增背景透明度、毛玻璃强度调节滑块',
      'PWA 增强：支持将网页作为独立应用安装至桌面',
      '交互优化：重构全局 hover 效果，提升复杂背景下的文字可读性',
      '体验修复：修复博客页面及编辑器底部滚动遮挡问题'
    ]
  },
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
