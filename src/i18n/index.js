/**
 * 国际化配置文件
 * 支持中英双语切换
 */
import { createI18n } from 'vue-i18n'
import zh from './locales/zh.json'
import en from './locales/en.json'

export const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('locale') || 'zh', // 默认中文
  fallbackLocale: 'zh',
  messages: {
    zh,
    en
  }
})
