/**
 * 内容过滤工具
 * 提供敏感词过滤功能，支持扩展敏感词库
 */

/**
 * 敏感词库
 * TODO: 未来可以从数据库或配置文件加载，支持动态更新
 */
const sensitiveWords = [
  // 基础敏感词示例（可根据需要扩展）
  'spam',
  'advertisement',
  'promotion',
  // 可以添加更多敏感词
]

/**
 * 检查内容是否包含敏感词
 * @param {string} content - 要检查的内容
 * @returns {boolean} 是否包含敏感词
 */
export function containsSensitiveWords(content) {
  if (!content || typeof content !== 'string') {
    return false
  }

  const lowerContent = content.toLowerCase()
  
  // 检查是否包含敏感词
  return sensitiveWords.some(word => {
    // 使用单词边界匹配，避免误判
    const regex = new RegExp(`\\b${word}\\b`, 'i')
    return regex.test(lowerContent)
  })
}

/**
 * 过滤敏感词（替换为*）
 * @param {string} content - 要过滤的内容
 * @returns {string} 过滤后的内容
 */
export function filterSensitiveWords(content) {
  if (!content || typeof content !== 'string') {
    return content
  }

  let filteredContent = content
  
  sensitiveWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    filteredContent = filteredContent.replace(regex, '*'.repeat(word.length))
  })
  
  return filteredContent
}

/**
 * 添加敏感词到词库
 * @param {string} word - 要添加的敏感词
 */
export function addSensitiveWord(word) {
  if (word && typeof word === 'string' && !sensitiveWords.includes(word.toLowerCase())) {
    sensitiveWords.push(word.toLowerCase())
  }
}

/**
 * 获取敏感词列表（用于管理）
 * @returns {Array<string>} 敏感词列表
 */
export function getSensitiveWords() {
  return [...sensitiveWords]
}

