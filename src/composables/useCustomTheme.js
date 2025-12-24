/**
 * 自定义主题 Composable
 * 提供主题颜色自定义功能
 */

import { ref, computed } from 'vue'
import { useLocalStorage } from './useStorage'

/**
 * 预设主题配置
 * 默认使用黑白灰色主题
 */
const presetThemes = {
  none: {
    name: 'None',
    primary: '#475569', // slate-600 - 深灰色
    primaryDark: '#cbd5e1', // slate-300 - 浅灰色
  }
}

/**
 * 使用自定义主题
 * @returns {object} 主题相关的方法和状态
 */
export function useCustomTheme() {
  // 从存储加载自定义主题（当前功能已禁用，保留接口以供未来扩展）
  const customTheme = useLocalStorage('customTheme', null)
  const currentPreset = useLocalStorage('themePreset', 'none') // 默认使用无主题色主题

  /**
   * 当前主题颜色
   * 默认使用黑白灰色主题
   */
  const themeColors = computed(() => {
    // 当前禁用自定义主题功能，始终使用默认的黑白灰色主题
    return presetThemes.none
  })

  /**
   * 从主色生成完整的主题色系
   * 如果主色是透明，使用黑白灰色主题作为fallback
   * @param {string} primary - 主色
   * @returns {object} 完整的主题色对象
   */
  const generateThemeColors = (primary) => {
    // 如果主色是transparent，使用黑白灰色主题
    if (primary === 'transparent') {
      return {
        primary: '#475569', // slate-600
        primaryDark: '#cbd5e1', // slate-300
        primaryLight: '#64748b', // slate-500
        primaryLighter: '#94a3b8', // slate-400
        primaryDarker: '#334155', // slate-700
        primaryDarkest: '#1e293b', // slate-800
        primaryEmerald: '#64748b', // slate-500
        primaryEmeraldDark: '#94a3b8', // slate-400
        primaryEmeraldLight: '#475569', // slate-600
        primaryEmeraldLighter: '#64748b' // slate-500
      }
    }
    
    // 保留原有逻辑以支持未来扩展（如果需要）
    return {
      primary: primary,
      primaryDark: primary,
      primaryLight: primary,
      primaryLighter: primary,
      primaryDarker: primary,
      primaryDarkest: primary,
      primaryEmerald: primary,
      primaryEmeraldDark: primary,
      primaryEmeraldLight: primary,
      primaryEmeraldLighter: primary
    }
  }

  /**
   * 应用主题颜色
   * @param {object} colors - 颜色对象 { primary, primaryDark } 或完整色系
   */
  const applyTheme = (colors) => {
    const root = document.documentElement
    const themeColors = colors.primaryLight ? colors : generateThemeColors(colors.primary)
    
    root.style.setProperty('--theme-primary', themeColors.primary)
    root.style.setProperty('--theme-primary-dark', themeColors.primaryDark || colors.primaryDark)
    root.style.setProperty('--theme-primary-light', themeColors.primaryLight)
    root.style.setProperty('--theme-primary-lighter', themeColors.primaryLighter)
    root.style.setProperty('--theme-primary-darker', themeColors.primaryDarker)
    root.style.setProperty('--theme-primary-darkest', themeColors.primaryDarkest)
    root.style.setProperty('--theme-primary-emerald', themeColors.primaryEmerald)
    root.style.setProperty('--theme-primary-emerald-dark', themeColors.primaryEmeraldDark)
    root.style.setProperty('--theme-primary-emerald-light', themeColors.primaryEmeraldLight)
    root.style.setProperty('--theme-primary-emerald-lighter', themeColors.primaryEmeraldLighter)
  }

  /**
   * 设置预设主题
   * @param {string} preset - 预设主题名称（当前仅支持'none'）
   */
  const setPresetTheme = (preset) => {
    // 当前禁用主题切换功能，始终使用透明主题
    currentPreset.update('none')
    customTheme.update(null)
    applyTheme(presetThemes.none)
  }

  /**
   * 设置自定义主题
   * 当前功能已禁用，保留接口以供未来扩展
   * @param {object} colors - 颜色对象
   */
  const setCustomTheme = (colors) => {
    // 当前禁用自定义主题功能，始终使用透明主题
    customTheme.update(null)
    currentPreset.update('none')
    applyTheme(presetThemes.none)
  }

  /**
   * 重置为默认主题（透明主题）
   */
  const resetTheme = () => {
    customTheme.update(null)
    currentPreset.update('none')
    applyTheme(presetThemes.none)
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
