<!--
  作品展示页面组件
  展示个人项目和作品集
  模块化设计，便于添加新作品
-->
<template>
  <div class="animate-fade-in max-w-6xl mx-auto">
    <div class="text-center mb-10">
      <h2 class="text-3xl font-bold text-slate-800 dark:text-slate-200">{{ $t('portfolio.title') }}</h2>
      <p class="text-slate-500 dark:text-slate-400 mt-2">{{ $t('portfolio.subtitle') }}</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <a 
        v-for="work in portfolio" 
        :key="work.title" 
        :href="work.url" 
        target="_blank" 
        class="glass-card p-3 rounded-2xl group flex flex-col h-full hover:shadow-2xl transition-all duration-500"
      >
        <!-- 作品预览图 -->
        <div class="h-48 rounded-xl relative overflow-hidden bg-slate-100 dark:bg-slate-800">
          <!-- 实际预览图（如果存在） -->
          <img 
            v-if="work.image"
            :src="work.image"
            :alt="work.title"
            class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <!-- 渐变背景模拟图片（如果没有预览图） -->
          <div 
            v-else
            class="absolute inset-0 bg-gradient-to-br transition-transform duration-700 group-hover:scale-110" 
            :class="work.color"
          ></div>
          <!-- Icon 浮层（仅在无预览图时显示） -->
          <div v-if="!work.image" class="absolute inset-0 flex items-center justify-center">
            <div class="w-20 h-20 bg-white/20 dark:bg-slate-900/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white border border-white/30 dark:border-slate-700/30 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <component :is="work.icon" class="w-10 h-10" />
            </div>
          </div>
          <!-- 遮罩 -->
          <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 dark:group-hover:bg-black/20 transition-colors duration-300"></div>
        </div>
        
        <!-- 作品信息 -->
        <div class="p-4 flex-1 flex flex-col">
          <h3 class="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
            {{ work.title }}
          </h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-3 leading-relaxed">
            {{ work.desc }}
          </p>
          
          <!-- 标签 -->
          <div class="mt-auto flex flex-wrap gap-2">
            <span 
              v-for="tag in work.tags" 
              :key="tag"
              class="text-xs px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg font-medium shadow-sm"
            >
              {{ tag }}
            </span>
          </div>
        </div>
      </a>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { portfolioConfig } from '../config/portfolio'
import { getIcon } from '../utils/iconMapper'

// 从配置文件加载作品数据，并映射图标组件
const portfolio = computed(() => {
  return portfolioConfig.map(work => ({
    ...work,
    icon: getIcon(work.iconName)
  }))
})
</script>
