/**
 * 自动补全建议缓存工具
 * 用于缓存genre和tag的自动补全数据，减少API请求
 */

// 内存缓存
const memoryCache = {
  genres: null,
  tags: null,
  timestamp: null,
  // 缓存有效期：5分钟
  CACHE_DURATION: 5 * 60 * 1000
}

/**
 * 检查缓存是否有效
 * @returns {boolean}
 */
const isCacheValid = () => {
  if (!memoryCache.timestamp) return false
  const now = Date.now()
  return (now - memoryCache.timestamp) < memoryCache.CACHE_DURATION
}

/**
 * 获取缓存的分类列表
 * @returns {Array|null}
 */
export const getCachedGenres = () => {
  if (isCacheValid() && memoryCache.genres) {
    return memoryCache.genres
  }
  return null
}

/**
 * 获取缓存的标签列表
 * @returns {Array|null}
 */
export const getCachedTags = () => {
  if (isCacheValid() && memoryCache.tags) {
    return memoryCache.tags
  }
  return null
}

/**
 * 设置缓存的分类列表
 * @param {Array} genres
 */
export const setCachedGenres = (genres) => {
  memoryCache.genres = genres
  memoryCache.timestamp = Date.now()
}

/**
 * 设置缓存的标签列表
 * @param {Array} tags
 */
export const setCachedTags = (tags) => {
  memoryCache.tags = tags
  memoryCache.timestamp = Date.now()
}

/**
 * 清除所有缓存
 */
export const clearCache = () => {
  memoryCache.genres = null
  memoryCache.tags = null
  memoryCache.timestamp = null
}

