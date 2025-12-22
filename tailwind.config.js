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
          'primary-darkest': 'var(--theme-primary-darkest)',
          'primary-emerald': 'var(--theme-primary-emerald)',
          'primary-emerald-dark': 'var(--theme-primary-emerald-dark)',
          'primary-emerald-light': 'var(--theme-primary-emerald-light)',
          'primary-emerald-lighter': 'var(--theme-primary-emerald-lighter)',
        }
      },
    },
  },
  plugins: [],
}
