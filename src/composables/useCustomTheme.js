/**
 * 自定义主题 Composable
 * 提供主题颜色自定义功能
 */

import { ref, computed } from 'vue'
import { useLocalStorage } from './useStorage'

/**
 * 预设主题配置
 */
const presetThemes = {
  default: {
    name: 'Default',
    primary: '#22c55e', // green-500
    primaryDark: '#4ade80', // green-400
  },
  blue: {
    name: 'Blue',
    primary: '#3b82f6', // blue-500
    primaryDark: '#60a5fa', // blue-400
  },
  purple: {
    name: 'Purple',
    primary: '#a855f7', // purple-500
    primaryDark: '#c084fc', // purple-400
  },
  orange: {
    name: 'Orange',
    primary: '#f97316', // orange-500
    primaryDark: '#fb923c', // orange-400
  },
  pink: {
    name: 'Pink',
    primary: '#ec4899', // pink-500
    primaryDark: '#f472b6', // pink-400
  }
}

/**
 * 使用自定义主题
 * @returns {object} 主题相关的方法和状态
 */
export function useCustomTheme() {
  // 从存储加载自定义主题
  const customTheme = useLocalStorage('customTheme', null)
  const currentPreset = useLocalStorage('themePreset', 'default')

  /**
   * 当前主题颜色
   */
  const themeColors = computed(() => {
    if (customTheme.value) {
      return customTheme.value
    }
    return presetThemes[currentPreset.value] || presetThemes.default
  })

  /**
   * 应用主题颜色
   * @param {object} colors - 颜色对象 { primary, primaryDark }
   */
  const applyTheme = (colors) => {
    const root = document.documentElement
    root.style.setProperty('--theme-primary', colors.primary)
    root.style.setProperty('--theme-primary-dark', colors.primaryDark)
  }

  /**
   * 设置预设主题
   * @param {string} preset - 预设主题名称
   */
  const setPresetTheme = (preset) => {
    if (presetThemes[preset]) {
      currentPreset.update(preset)
      customTheme.update(null)
      applyTheme(presetThemes[preset])
    }
  }

  /**
   * 设置自定义主题
   * @param {object} colors - 颜色对象
   */
  const setCustomTheme = (colors) => {
    customTheme.update(colors)
    applyTheme(colors)
  }

  /**
   * 重置为默认主题
   */
  const resetTheme = () => {
    customTheme.update(null)
    currentPreset.update('default')
    applyTheme(presetThemes.default)
  }

  // 初始化时应用主题
  if (typeof document !== 'undefined') {
    applyTheme(themeColors.value)
  }

  return {
    presetThemes,
    themeColors,
    currentPreset,
    setPresetTheme,
    setCustomTheme,
    resetTheme,
    applyTheme
  }
}
