/**
 * 主题色工具函数
 * 提供主题色相关的 Tailwind 类名生成和颜色获取
 */

/**
 * 获取主题色相关的 Tailwind 类名
 * 这些类名会使用 CSS 变量，支持动态主题切换
 */
export const themeClasses = {
  // 背景色
  bg: {
    primary: 'bg-[var(--theme-primary)]',
    primaryDark: 'bg-[var(--theme-primary-dark)]',
    primaryLight: 'bg-[var(--theme-primary-light)]',
    primaryLighter: 'bg-[var(--theme-primary-lighter)]',
    primaryDarker: 'bg-[var(--theme-primary-darker)]',
    primaryHover: 'hover:bg-[var(--theme-primary-darker)]',
    primaryLightBg: 'bg-[color-mix(in_srgb,var(--theme-primary-lighter)_50%,transparent)]',
    primaryLightBgDark: 'dark:bg-[color-mix(in_srgb,var(--theme-primary)_20%,transparent)]',
  },
  
  // 文字颜色
  text: {
    primary: 'text-[var(--theme-primary)]',
    primaryDark: 'text-[var(--theme-primary-dark)]',
    primaryDarker: 'text-[var(--theme-primary-darker)]',
    primaryHover: 'hover:text-[var(--theme-primary)]',
    primaryDarkHover: 'hover:text-[var(--theme-primary-dark)]',
  },
  
  // 边框颜色
  border: {
    primary: 'border-[var(--theme-primary)]',
    primaryDark: 'border-[var(--theme-primary-dark)]',
    primaryHover: 'hover:border-[var(--theme-primary)]',
  },
  
  // Ring 颜色（focus 状态）
  ring: {
    primary: 'ring-[var(--theme-primary)]',
    primaryFocus: 'focus:ring-[var(--theme-primary)]',
  },
  
  // Shadow 颜色
  shadow: {
    primary: 'shadow-[0_4px_12px_color-mix(in_srgb,var(--theme-primary)_20%,transparent)]',
    primaryLg: 'shadow-[0_8px_24px_color-mix(in_srgb,var(--theme-primary)_30%,transparent)]',
  },
  
  // 渐变
  gradient: {
    primary: 'bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-primary-emerald)]',
    primaryVertical: 'bg-gradient-to-b from-[var(--theme-primary)] to-[var(--theme-primary-darker)]',
  }
}

/**
 * 获取主题色的内联样式
 * @param {string} type - 类型：'bg', 'text', 'border', 'shadow'
 * @param {string} variant - 变体：'primary', 'primaryDark', etc.
 * @returns {string} CSS 值
 */
export function getThemeColor(type, variant = 'primary') {
  const colorMap = {
    bg: {
      primary: 'var(--theme-primary)',
      primaryDark: 'var(--theme-primary-dark)',
      primaryLight: 'var(--theme-primary-light)',
      primaryLighter: 'var(--theme-primary-lighter)',
      primaryDarker: 'var(--theme-primary-darker)',
    },
    text: {
      primary: 'var(--theme-primary)',
      primaryDark: 'var(--theme-primary-dark)',
      primaryDarker: 'var(--theme-primary-darker)',
    },
    border: {
      primary: 'var(--theme-primary)',
      primaryDark: 'var(--theme-primary-dark)',
    }
  }
  
  return colorMap[type]?.[variant] || 'var(--theme-primary)'
}

/**
 * 生成主题色相关的 Tailwind 类名组合
 * @param {object} options - 选项
 * @returns {string} 类名字符串
 */
export function getThemeClasses(options = {}) {
  const {
    bg = false,
    text = false,
    border = false,
    ring = false,
    hover = false,
    focus = false
  } = options
  
  const classes = []
  
  if (bg) classes.push(themeClasses.bg[bg] || themeClasses.bg.primary)
  if (text) classes.push(themeClasses.text[text] || themeClasses.text.primary)
  if (border) classes.push(themeClasses.border[border] || themeClasses.border.primary)
  if (ring) classes.push(themeClasses.ring[ring] || themeClasses.ring.primary)
  if (hover?.bg) classes.push(`hover:${themeClasses.bg[hover.bg]}`)
  if (hover?.text) classes.push(`hover:${themeClasses.text[hover.text]}`)
  if (focus) classes.push(themeClasses.ring.primaryFocus)
  
  return classes.join(' ')
}

