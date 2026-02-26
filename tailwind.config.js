/**
 * Tailwind CSS配置文件
 * 定义项目的设计系统和主题变量
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // 启用class-based暗色模式
  theme: {
    extend: {
      fontFamily: {
        sans: ['Noto Sans SC', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // 主题色 - 使用 CSS 变量
        'theme': {
          'primary': 'var(--theme-primary)',
          'primary-dark': 'var(--theme-primary-dark)',
          'primary-light': 'var(--theme-primary-light)',
          'primary-lighter': 'var(--theme-primary-lighter)',
          'primary-darker': 'var(--theme-primary-darker)',
        },
        // 语义化背景色
        'base': 'var(--bg-app)',
        'surface': 'var(--bg-surface)',
        'card': 'var(--bg-card)',
        // 语义化文字色
        'main': 'var(--text-main)',
        'secondary': 'var(--text-secondary)',
        'muted': 'var(--text-muted)',
      },
      borderColor: {
        'base': 'var(--border-base)',
        'highlight': 'var(--border-highlight)',
      }
    },
  },
  plugins: [],
}
