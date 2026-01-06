/**
 * URL工具函数
 * 提供URL相关的辅助功能
 */

/**
 * 从URL中提取域名
 * @param {string} url - 完整的URL
 * @returns {string} 域名（不含协议和路径）
 */
export function extractDomain(url) {
  if (!url) return ''
  
  try {
    // 如果URL不包含协议，添加https://
    const urlWithProtocol = url.startsWith('http://') || url.startsWith('https://') 
      ? url 
      : `https://${url}`
    
    const urlObj = new URL(urlWithProtocol)
    return urlObj.hostname.replace('www.', '')
  } catch (error) {
    // 如果URL解析失败，尝试简单提取
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/]+)/)
    return match ? match[1] : url
  }
}

/**
 * 生成Google Favicon URL
 * @param {string} url - 网站URL
 * @param {number} size - 图标尺寸，默认64
 * @returns {string} Google Favicon API URL
 */
export function getFaviconUrl(url, size = 64) {
  const domain = extractDomain(url)
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`
}

