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
   * 从主色生成完整的主题色系
   * @param {string} primary - 主色（如 #22c55e）
   * @returns {object} 完整的主题色对象
   */
  const generateThemeColors = (primary) => {
    // 将十六进制颜色转换为 RGB
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null
    }

    // RGB 转十六进制
    const rgbToHex = (r, g, b) => {
      return '#' + [r, g, b].map(x => {
        const hex = x.toString(16)
        return hex.length === 1 ? '0' + hex : hex
      }).join('')
    }

    // 调整亮度
    const adjustBrightness = (rgb, factor) => {
      return {
        r: Math.min(255, Math.max(0, Math.round(rgb.r * factor))),
        g: Math.min(255, Math.max(0, Math.round(rgb.g * factor))),
        b: Math.min(255, Math.max(0, Math.round(rgb.b * factor)))
      }
    }

    const rgb = hexToRgb(primary)
    if (!rgb) return { primary, primaryDark: primary }

    return {
      primary: primary,
      primaryDark: rgbToHex(...Object.values(adjustBrightness(rgb, 1.15))), // 更亮
      primaryLight: rgbToHex(...Object.values(adjustBrightness(rgb, 1.4))), // 更亮
      primaryLighter: rgbToHex(...Object.values(adjustBrightness(rgb, 1.8))), // 最亮
      primaryDarker: rgbToHex(...Object.values(adjustBrightness(rgb, 0.85))), // 更暗
      primaryDarkest: rgbToHex(...Object.values(adjustBrightness(rgb, 0.7))), // 最暗
      // Emerald 变体（稍微偏蓝）
      primaryEmerald: rgbToHex(
        Math.min(255, rgb.r - 10),
        Math.min(255, rgb.g + 5),
        Math.min(255, rgb.b - 5)
      ),
      primaryEmeraldDark: rgbToHex(
        Math.min(255, rgb.r - 15),
        Math.min(255, rgb.g),
        Math.min(255, rgb.b - 10)
      ),
      primaryEmeraldLight: rgbToHex(
        Math.min(255, rgb.r + 20),
        Math.min(255, rgb.g + 30),
        Math.min(255, rgb.b + 10)
      ),
      primaryEmeraldLighter: rgbToHex(
        Math.min(255, rgb.r + 50),
        Math.min(255, rgb.g + 80),
        Math.min(255, rgb.b + 40)
      )
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
