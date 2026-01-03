/**
 * 标签颜色生成工具
 * 使用哈希函数和HSL范围生成确定性的标签颜色
 * 相同的标签文本会生成相同的颜色
 */

/**
 * 简单的字符串哈希函数
 * @param {string} str - 输入字符串
 * @returns {number} 哈希值
 */
function hashString(str) {
  let hash = 0
  if (str.length === 0) return hash
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * 生成标签的颜色样式（HSL格式）
 * @param {string} tagName - 标签名称
 * @param {Object} options - 选项
 * @param {number} options.hueMin - 色相最小值（0-360）
 * @param {number} options.hueMax - 色相最大值（0-360）
 * @param {number} options.saturationMin - 饱和度最小值（0-100）
 * @param {number} options.saturationMax - 饱和度最大值（0-100）
 * @param {number} options.lightnessMin - 亮度最小值（0-100）
 * @param {number} options.lightnessMax - 亮度最大值（0-100）
 * @param {boolean} options.isDarkMode - 是否为暗色模式
 * @returns {Object} 包含背景色和文字色的对象
 */
export function generateTagColor(tagName, options = {}) {
  const {
    hueMin = 0,        // 从红色开始，覆盖所有色相
    hueMax = 360,      // 到红色结束（360=0），包含所有颜色
    saturationMin = 60, // 提高饱和度，颜色更鲜艳
    saturationMax = 85,
    lightnessMin = 85, // 亮色模式背景更亮更柔和
    lightnessMax = 95,
    isDarkMode = false
  } = options

  // 生成哈希值
  const hash = hashString(tagName)

  // 根据哈希值计算HSL值
  const hue = (hash % (hueMax - hueMin + 1)) + hueMin
  const saturation = (hash % (saturationMax - saturationMin + 1)) + saturationMin
  const lightness = (hash % (lightnessMax - lightnessMin + 1)) + lightnessMin

  // 暗色模式使用不同的亮度范围，背景稍亮一些以保持可见度
  const darkLightnessMin = 30
  const darkLightnessMax = 50
  const darkLightness = isDarkMode 
    ? ((hash % (darkLightnessMax - darkLightnessMin + 1)) + darkLightnessMin)
    : lightness

  // 计算文字颜色（确保对比度）
  // 亮色模式：深色文字（降低亮度但保持同色系）；暗色模式：浅色文字
  const textLightness = isDarkMode ? 90 : 25
  // 亮色模式下文字饱和度可以稍高，暗色模式下保持一致
  const textSaturation = isDarkMode ? saturation : Math.min(saturation + 10, 100)

  // 生成HSL颜色字符串
  const bgColor = `hsl(${hue}, ${saturation}%, ${darkLightness}%)`
  const textColor = `hsl(${hue}, ${textSaturation}%, ${textLightness}%)`

  return {
    backgroundColor: bgColor,
    color: textColor
  }
}

/**
 * 生成Tailwind CSS类名（用于已定义的标签）
 * 对于新标签，使用HSL颜色
 * @param {string} tagName - 标签名称
 * @param {boolean} isDarkMode - 是否为暗色模式
 * @returns {Object} 包含style对象或class字符串
 */
export function getTagStyle(tagName, isDarkMode = false) {
  if (!tagName) {
    return {
      class: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
    }
  }

  // 使用HSL生成颜色，覆盖所有色相范围（包括红色和黄色）
  const colors = generateTagColor(tagName, {
    hueMin: 0,        // 从红色开始
    hueMax: 360,      // 到红色结束，包含所有颜色
    saturationMin: 60, // 更鲜艳
    saturationMax: 85,
    lightnessMin: 85, // 更柔和
    lightnessMax: 95,
    isDarkMode
  })

  return {
    style: {
      backgroundColor: colors.backgroundColor,
      color: colors.color
    }
  }
}

