/**
 * Vite配置文件
 * 用于构建Vue 3项目的开发和生产环境
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    open: true
  }
})
