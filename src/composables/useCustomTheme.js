/**
 * 自定义主题 Composable
 * 提供主题颜色自定义功能，支持预设切换和主色推导
 */

import { computed, onMounted, watch } from 'vue'
import { useLocalStorage } from './useStorage'

/**
 * 预设主题配置
 */
const availablePresets = {
  none: { name: 'None', primary: '#475569', primaryDark: '#334155' },
  aurora: { name: 'Aurora', primary: '#10b981', primaryDark: '#059669' },
  ocean: { name: 'Ocean', primary: '#0ea5e9', primaryDark: '#0284c7' },
  sunset: { name: 'Sunset', primary: '#f59e0b', primaryDark: '#d97706' },
  royal: { name: 'Royal', primary: '#8b5cf6', primaryDark: '#7c3aed' },
  sakura: { name: 'Sakura', primary: '#ec4899', primaryDark: '#db2777' },
  crimson: { name: 'Crimson', primary: '#ef4444', primaryDark: '#dc2626' }
}

/**
 * 使用自定义主题
 * @returns {object} 主题相关的方法和状态
 */
export function useCustomTheme() {
  // useLocalStorage 返回的是 { value: Ref, update, reset }
  const customThemeStore = useLocalStorage('customTheme', null)
  const currentPresetStore = useLocalStorage('themePreset', 'none')
  const glassBlurStore = useLocalStorage('themeGlassBlur', 12)
  const bgOpacityStore = useLocalStorage('themeBgOpacity', 0.4)

  // 提取真正的 Ref
  const customTheme = customThemeStore.value
  const currentPreset = currentPresetStore.value
  const glassBlur = glassBlurStore.value
  const bgOpacity = bgOpacityStore.value

  /**
   * 当前主题颜色数据
   */
  const themeColors = computed(() => {
    if (customTheme.value) return customTheme.value
    return availablePresets[currentPreset.value] || availablePresets.none
  })

  /**
   * 从主色生成完整的主题色系
   * @param {string} primary - 主色 (HEX格式)
   * @returns {object} 完整的主题色对象
   */
  const generateThemeColors = (primary) => {
    if (!primary || primary === 'transparent') {
      return availablePresets.none
    }

    const adjustBrightness = (hex, percent) => {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)

      const adjust = (val) => {
        const amount = Math.floor(val * (percent / 100))
        return Math.min(255, Math.max(0, val + amount)).toString(16).padStart(2, '0')
      }

      return `#${adjust(r)}${adjust(g)}${adjust(b)}`
    }

    const isDark = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      const brightness = (r * 299 + g * 587 + b * 114) / 1000
      return brightness < 155
    }

    return {
      primary: primary,
      primaryDark: adjustBrightness(primary, -15),
      primaryLight: adjustBrightness(primary, 15),
      primaryLighter: adjustBrightness(primary, 30),
      primaryDarker: adjustBrightness(primary, -30),
      textOnPrimary: isDark(primary) ? '#ffffff' : '#1e293b'
    }
  }

  /**
   * 应用主题颜色到 CSS 变量
   */
  const applyTheme = () => {
    const colors = themeColors.value
    if (!colors) return
    
    const root = document.documentElement
    const theme = colors.primaryLight ? colors : generateThemeColors(colors.primary)
    
    // 主题核心色
    root.style.setProperty('--theme-primary', theme.primary)
    if (theme.primaryDark) root.style.setProperty('--theme-primary-dark', theme.primaryDark)
    if (theme.primaryLight) root.style.setProperty('--theme-primary-light', theme.primaryLight)
    if (theme.primaryLighter) root.style.setProperty('--theme-primary-lighter', theme.primaryLighter)
    if (theme.primaryDarker) root.style.setProperty('--theme-primary-darker', theme.primaryDarker)

    // 应用玻璃效果参数
    root.style.setProperty('--glass-blur', `${glassBlur.value}px`)
    root.style.setProperty('--bg-opacity', bgOpacity.value)
  }

  /**
   * 设置预设主题
   */
  const setPresetTheme = (preset) => {
    currentPresetStore.update(preset)
    customThemeStore.update(null)
    applyTheme()
  }

  /**
   * 设置自定义主题
   */
  const setCustomTheme = (colors) => {
    customThemeStore.update(colors)
    currentPresetStore.update('custom')
    applyTheme()
  }

  /**
   * 重置为默认主题
   */
  const resetTheme = () => {
    customThemeStore.update(null)
    currentPresetStore.update('none')
    glassBlurStore.update(12)
    bgOpacityStore.update(0.4)
    applyTheme()
  }

  // 监听玻璃效果变化即时应用
  watch([glassBlur, bgOpacity], () => {
    applyTheme()
  })

  // 初始化应用
  onMounted(() => {
    applyTheme()
  })

  return {
    presetThemes: availablePresets,
    themeColors,
    currentPreset,
    glassBlur,
    bgOpacity,
    setPresetTheme,
    setCustomTheme,
    resetTheme,
    applyTheme
  }
}
