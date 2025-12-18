/**
 * 主题切换Composable
 * 管理暗色/亮色模式切换
 * 
 * 使用localStorage持久化用户偏好
 */
import { ref, watch, onMounted } from 'vue'

export function useTheme() {
  const isDark = ref(false)

  /**
   * 初始化主题
   * 优先使用localStorage中的设置，其次使用系统偏好
   */
  const initTheme = () => {
    const saved = localStorage.getItem('theme')
    if (saved) {
      isDark.value = saved === 'dark'
    } else {
      // 检测系统偏好
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    applyTheme()
  }

  /**
   * 应用主题到DOM
   */
  const applyTheme = () => {
    if (isDark.value) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  /**
   * 切换主题
   */
  const toggleTheme = () => {
    isDark.value = !isDark.value
    applyTheme()
  }

  // 监听主题变化
  watch(isDark, applyTheme)

  // 组件挂载时初始化
  onMounted(() => {
    initTheme()
  })

  return {
    isDark,
    toggleTheme
  }
}
