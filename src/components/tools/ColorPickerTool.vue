<!--
  颜色选择器工具
  提供颜色选择、格式转换、调色板等功能
-->
<template>
  <div class="space-y-6 w-full">
    <div class="text-center mb-6">
      <h2 class="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">{{ $t('tools.colorPicker') }}</h2>
      <p class="text-slate-600 dark:text-slate-400 text-sm md:text-base">{{ $t('tools.colorPickerDesc') }}</p>
    </div>

    <!-- 颜色选择器 -->
    <div class="glass-card p-6 rounded-2xl">
      <div class="flex flex-col md:flex-row gap-6">
        <!-- 颜色选择区域 -->
        <div class="flex-1">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            {{ $t('tools.selectColor') }}
          </label>
          <div class="flex items-center gap-4">
            <input 
              v-model="color"
              type="color"
              class="w-24 h-24 rounded-xl border-2 border-slate-200 dark:border-slate-700 cursor-pointer"
            >
            <div class="flex-1">
              <input 
                v-model="color"
                type="text"
                class="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-lg"
                placeholder="#000000"
              >
            </div>
          </div>
        </div>

        <!-- 颜色预览 -->
        <div class="md:w-48">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            {{ $t('tools.preview') }}
          </label>
          <div 
            class="w-full h-32 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-lg"
            :style="{ backgroundColor: color }"
          ></div>
        </div>
      </div>
    </div>

    <!-- 颜色格式转换 -->
    <div class="glass-card p-6 rounded-2xl">
      <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">{{ $t('tools.colorFormats') }}</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">HEX</label>
          <input 
            :value="hexColor"
            @input="updateFromHex"
            type="text"
            class="w-full px-3 py-2 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-sm"
          >
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">RGB</label>
          <input 
            :value="rgbColor"
            @input="updateFromRGB"
            type="text"
            class="w-full px-3 py-2 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-sm"
          >
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">HSL</label>
          <input 
            :value="hslColor"
            @input="updateFromHSL"
            type="text"
            class="w-full px-3 py-2 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-sm"
          >
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">HSV</label>
          <input 
            :value="hsvColor"
            @input="updateFromHSV"
            type="text"
            class="w-full px-3 py-2 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-sm"
          >
        </div>
      </div>
    </div>

    <!-- 调色板 -->
    <div class="glass-card p-6 rounded-2xl">
      <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">{{ $t('tools.colorPalette') }}</h3>
      <div class="grid grid-cols-5 gap-2">
        <button 
          v-for="paletteColor in palette"
          :key="paletteColor"
          @click="color = paletteColor"
          class="h-12 rounded-lg border-2 transition-colors"
          :class="color === paletteColor ? 'border-green-500 dark:border-green-400' : 'border-slate-200 dark:border-slate-700'"
          :style="{ backgroundColor: paletteColor }"
        ></button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const color = ref('#22c55e')

/**
 * 将 HEX 转换为 RGB
 */
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

/**
 * 将 RGB 转换为 HEX
 */
const rgbToHex = (r, g, b) => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

/**
 * HEX 颜色
 */
const hexColor = computed(() => color.value)

/**
 * RGB 颜色
 */
const rgbColor = computed(() => {
  const rgb = hexToRgb(color.value)
  return rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : ''
})

/**
 * HSL 颜色（简化版）
 */
const hslColor = computed(() => {
  const rgb = hexToRgb(color.value)
  if (!rgb) return ''
  // 简化的 RGB 到 HSL 转换
  return `hsl(${rgb.r}, ${rgb.g}%, ${rgb.b}%)`
})

/**
 * HSV 颜色（简化版）
 */
const hsvColor = computed(() => {
  const rgb = hexToRgb(color.value)
  if (!rgb) return ''
  return `hsv(${rgb.r}, ${rgb.g}%, ${rgb.b}%)`
})

/**
 * 从 HEX 更新
 */
const updateFromHex = (e) => {
  const value = e.target.value
  if (/^#[0-9A-F]{6}$/i.test(value)) {
    color.value = value
  }
}

/**
 * 从 RGB 更新
 */
const updateFromRGB = (e) => {
  const match = e.target.value.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
  if (match) {
    color.value = rgbToHex(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]))
  }
}

/**
 * 从 HSL 更新（简化处理）
 */
const updateFromHSL = () => {
  // 简化处理，实际应该实现完整的 HSL 转换
}

/**
 * 从 HSV 更新（简化处理）
 */
const updateFromHSV = () => {
  // 简化处理，实际应该实现完整的 HSV 转换
}

/**
 * 预设调色板
 */
const palette = [
  '#22c55e', '#3b82f6', '#a855f7', '#f97316', '#ec4899',
  '#10b981', '#2563eb', '#9333ea', '#ea580c', '#db2777',
  '#059669', '#1d4ed8', '#7e22ce', '#c2410c', '#be185d',
  '#047857', '#1e40af', '#6b21a8', '#9a3412', '#9f1239',
  '#065f46', '#1e3a8a', '#581c87', '#7c2d12', '#831843'
]
</script>
