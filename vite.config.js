/**
 * Vite配置文件
 * 用于构建Vue 3项目的开发和生产环境
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'images/icons/*.svg', 'backgrounds/*.jpg'],
      manifest: {
        name: 'GWorkspace',
        short_name: 'GWorkspace',
        description: 'Personal workspace website with Vue.js, featuring blog, tools, and portfolio management.',
        theme_color: '#475569',
        icons: [
          {
            src: 'images/icons/icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'images/icons/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-ui': ['vue', 'vue-router', 'vue-i18n'],
          'vendor-charts': ['chart.js'],
          'vendor-utils': ['marked', 'highlight.js', 'fuse.js']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 3000,
    open: true,
    // 配置代理，用于开发环境
    // 将 /api 请求代理到后端服务器
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  publicDir: 'public'
})
