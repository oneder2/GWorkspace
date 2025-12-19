<!--
  二维码生成器工具
  支持文本、URL等内容的二维码生成
-->
<template>
  <div class="space-y-6 w-full">
    <div class="text-center mb-6">
      <h2 class="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">{{ $t('tools.qrCode') }}</h2>
      <p class="text-slate-600 dark:text-slate-400 text-sm md:text-base">{{ $t('tools.qrCodeDesc') }}</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- 输入区域 -->
      <div class="glass-card p-6 rounded-2xl space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {{ $t('tools.qrContent') }}
          </label>
          <textarea 
            v-model="qrContent"
            @input="generateQR"
            rows="6"
            class="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 resize-none"
            :placeholder="$t('tools.qrPlaceholder')"
          ></textarea>
        </div>
        <div class="flex gap-3">
          <button 
            @click="generateQR"
            class="flex-1 py-3 bg-green-500 dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-700 font-bold transition-colors"
          >
            {{ $t('tools.generate') }}
          </button>
          <button 
            @click="downloadQR"
            :disabled="!qrCodeDataUrl"
            class="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ $t('tools.download') }}
          </button>
        </div>
      </div>

      <!-- 二维码预览 -->
      <div class="glass-card p-6 rounded-2xl flex flex-col items-center justify-center">
        <div v-if="qrCodeDataUrl" class="mb-4">
          <img :src="qrCodeDataUrl" alt="QR Code" class="w-64 h-64 rounded-lg border-2 border-slate-200 dark:border-slate-700">
        </div>
        <div v-else class="text-center text-slate-400 dark:text-slate-500">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-32 h-32 mx-auto mb-4 opacity-50">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <path d="M9 9h6v6H9z"/>
          </svg>
          <p>{{ $t('tools.qrPreview') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import QRCode from 'qrcode'

const qrContent = ref('')
const qrCodeDataUrl = ref('')

/**
 * 生成二维码
 */
const generateQR = async () => {
  if (!qrContent.value.trim()) {
    qrCodeDataUrl.value = ''
    return
  }

  try {
    const dataUrl = await QRCode.toDataURL(qrContent.value, {
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    qrCodeDataUrl.value = dataUrl
  } catch (error) {
    console.error('Failed to generate QR code:', error)
  }
}

/**
 * 下载二维码
 */
const downloadQR = () => {
  if (!qrCodeDataUrl.value) return

  const link = document.createElement('a')
  link.download = 'qrcode.png'
  link.href = qrCodeDataUrl.value
  link.click()
}

onMounted(() => {
  // 初始化时生成示例二维码
  qrContent.value = 'https://example.com'
  generateQR()
})
</script>
