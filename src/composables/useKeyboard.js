/**
 * 键盘快捷键 Composable
 * 提供全局快捷键管理功能
 */

import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { shortcutsConfig } from '../config/shortcuts'

/**
 * 使用键盘快捷键
 * @param {object} handlers - 快捷键处理函数映射
 * @param {function} handlers.openCommandPalette - 打开命令面板
 * @param {function} handlers.toggleSidebar - 切换侧边栏
 * @param {function} handlers.toggleTheme - 切换主题
 * @param {function} handlers.closeModal - 关闭弹窗
 */
export function useKeyboard(handlers = {}) {
  const router = useRouter()

  /**
   * 检查是否为 Mac 系统
   */
  const isMac = () => {
    return /Mac|iPhone|iPad|iPod/.test(navigator.platform)
  }

  /**
   * 处理键盘事件
   * @param {KeyboardEvent} event - 键盘事件
   */
  const handleKeyDown = (event) => {
    // 如果用户在输入框中，不触发快捷键（除了 Escape）
    if (
      event.target.tagName === 'INPUT' ||
      event.target.tagName === 'TEXTAREA' ||
      event.target.isContentEditable
    ) {
      if (event.key !== 'Escape') {
        return
      }
    }

    // 查找匹配的快捷键
    const shortcut = shortcutsConfig.find(config => {
      const keyMatch = config.key.toLowerCase() === event.key.toLowerCase() ||
                      config.key === event.key
      
      if (!keyMatch) return false

      // 检查修饰键
      const ctrlMatch = !config.ctrl || (event.ctrlKey && !isMac()) || (event.metaKey && isMac())
      const metaMatch = !config.meta || (event.metaKey && isMac()) || (event.ctrlKey && !isMac())
      const shiftMatch = !config.shift || event.shiftKey
      const altMatch = !config.alt || event.altKey

      return ctrlMatch && metaMatch && shiftMatch && altMatch
    })

    if (shortcut) {
      event.preventDefault()
      event.stopPropagation()

      // 执行对应的操作
      switch (shortcut.action) {
        case 'navigate':
          if (shortcut.route) {
            router.push(shortcut.route)
          }
          break
        case 'toggleSidebar':
          if (handlers.toggleSidebar) {
            handlers.toggleSidebar()
          }
          break
        case 'toggleTheme':
          if (handlers.toggleTheme) {
            handlers.toggleTheme()
          }
          break
        case 'openCommandPalette':
          if (handlers.openCommandPalette) {
            handlers.openCommandPalette()
          }
          break
        case 'closeModal':
          if (handlers.closeModal) {
            handlers.closeModal()
          }
          break
        default:
          // 自定义处理函数
          if (handlers[shortcut.action]) {
            handlers[shortcut.action]()
          }
      }
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })

  return {
    handleKeyDown
  }
}
