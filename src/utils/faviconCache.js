/**
 * Favicon缓存管理器
 * 提供favicon URL的缓存功能，减少重复请求
 * 使用内存缓存和localStorage双重缓存机制
 */

import { getFaviconUrl } from './urlHelper'

// 内存缓存（快速访问）
const memoryCache = new Map()

// 缓存配置
const CACHE_CONFIG = {
  // localStorage键名
  STORAGE_KEY: 'favicon_cache',
  // 缓存过期时间（7天）
  EXPIRY_DAYS: 7,
  // 最大缓存条目数
  MAX_ENTRIES: 500
}

/**
 * 从localStorage加载缓存
 */
function loadCacheFromStorage() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {}
  }
  
  try {
    const cached = window.localStorage.getItem(CACHE_CONFIG.STORAGE_KEY)
    if (cached) {
      const data = JSON.parse(cached)
      // 清理过期条目
      const now = Date.now()
      const validEntries = {}
      
      for (const [domain, entry] of Object.entries(data)) {
        if (entry.expiry && entry.expiry > now) {
          validEntries[domain] = entry
          // 同时加载到内存缓存
          memoryCache.set(domain, entry)
        }
      }
      
      // 如果有过期条目，更新存储
      if (Object.keys(validEntries).length !== Object.keys(data).length) {
        saveCacheToStorage(validEntries)
      }
      
      return validEntries
    }
  } catch (error) {
    console.error('[FaviconCache] Failed to load cache from storage:', error)
  }
  return {}
}

/**
 * 保存缓存到localStorage
 */
function saveCacheToStorage(cache) {
  try {
    // 限制缓存大小
    const entries = Object.entries(cache)
    if (entries.length > CACHE_CONFIG.MAX_ENTRIES) {
      // 按过期时间排序，保留最新的
      const sorted = entries.sort((a, b) => (b[1].expiry || 0) - (a[1].expiry || 0))
      const limited = Object.fromEntries(sorted.slice(0, CACHE_CONFIG.MAX_ENTRIES))
      window.localStorage.setItem(CACHE_CONFIG.STORAGE_KEY, JSON.stringify(limited))
    } else {
      window.localStorage.setItem(CACHE_CONFIG.STORAGE_KEY, JSON.stringify(cache))
    }
  } catch (error) {
    console.error('[FaviconCache] Failed to save cache to storage:', error)
    // 如果存储空间不足，清理最旧的条目
    if (error.name === 'QuotaExceededError') {
      const entries = Object.entries(cache)
      const sorted = entries.sort((a, b) => (a[1].expiry || 0) - (b[1].expiry || 0))
      const reduced = Object.fromEntries(sorted.slice(-Math.floor(CACHE_CONFIG.MAX_ENTRIES * 0.8)))
      try {
        window.localStorage.setItem(CACHE_CONFIG.STORAGE_KEY, JSON.stringify(reduced))
      } catch (e) {
        console.error('[FaviconCache] Failed to save reduced cache:', e)
      }
    }
  }
}

/**
 * 获取缓存条目
 * @param {string} domain - 域名
 * @returns {Object|null} 缓存条目或null
 */
function getCacheEntry(domain) {
  // 先检查内存缓存
  if (memoryCache.has(domain)) {
    const entry = memoryCache.get(domain)
    // 检查是否过期
    if (entry.expiry && entry.expiry > Date.now()) {
      return entry
    } else {
      // 过期了，从内存缓存中移除
      memoryCache.delete(domain)
    }
  }
  
  // 从localStorage加载
  const storageCache = loadCacheFromStorage()
  if (storageCache[domain]) {
    const entry = storageCache[domain]
    // 加载到内存缓存
    memoryCache.set(domain, entry)
    return entry
  }
  
  return null
}

/**
 * 设置缓存条目
 * @param {string} domain - 域名
 * @param {string} faviconUrl - Favicon URL
 * @param {boolean} isValid - 是否有效（加载成功）
 */
function setCacheEntry(domain, faviconUrl, isValid = true) {
  const expiry = Date.now() + (CACHE_CONFIG.EXPIRY_DAYS * 24 * 60 * 60 * 1000)
  const entry = {
    url: faviconUrl,
    isValid,
    expiry,
    cachedAt: Date.now()
  }
  
  // 保存到内存缓存
  memoryCache.set(domain, entry)
  
  // 保存到localStorage
  const storageCache = loadCacheFromStorage()
  storageCache[domain] = entry
  saveCacheToStorage(storageCache)
}

/**
 * 获取带缓存的Favicon URL
 * @param {string} url - 网站URL
 * @param {number} size - 图标尺寸，默认64
 * @returns {Object} { url: string, fromCache: boolean, isValid: boolean }
 */
export function getCachedFaviconUrl(url, size = 64) {
  if (!url) {
    return { url: '', fromCache: false, isValid: false }
  }
  
  // 提取域名
  const domain = extractDomain(url)
  if (!domain) {
    return { url: '', fromCache: false, isValid: false }
  }
  
  // 检查缓存
  const cached = getCacheEntry(domain)
  if (cached) {
    // 如果之前加载失败，返回失败标记
    if (!cached.isValid) {
      return { url: '', fromCache: true, isValid: false }
    }
    return { 
      url: cached.url, 
      fromCache: true, 
      isValid: true 
    }
  }
  
  // 没有缓存，生成新的URL
  const faviconUrl = getFaviconUrl(url, size)
  return { 
    url: faviconUrl, 
    fromCache: false, 
    isValid: true 
  }
}

/**
 * 标记Favicon加载成功
 * @param {string} url - 网站URL
 * @param {number} size - 图标尺寸，默认64
 */
export function markFaviconSuccess(url, size = 64) {
  const domain = extractDomain(url)
  if (domain) {
    const faviconUrl = getFaviconUrl(url, size)
    setCacheEntry(domain, faviconUrl, true)
  }
}

/**
 * 标记Favicon加载失败
 * @param {string} url - 网站URL
 */
export function markFaviconError(url) {
  const domain = extractDomain(url)
  if (domain) {
    // 即使失败也缓存，避免重复尝试
    const faviconUrl = getFaviconUrl(url, 64)
    setCacheEntry(domain, faviconUrl, false)
  }
}

/**
 * 从URL中提取域名（复用urlHelper的函数）
 * @param {string} url - 完整的URL
 * @returns {string} 域名
 */
function extractDomain(url) {
  if (!url) return ''
  
  try {
    const urlWithProtocol = url.startsWith('http://') || url.startsWith('https://') 
      ? url 
      : `https://${url}`
    
    const urlObj = new URL(urlWithProtocol)
    return urlObj.hostname.replace('www.', '')
  } catch (error) {
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/]+)/)
    return match ? match[1] : url
  }
}

/**
 * 清除所有缓存
 */
export function clearFaviconCache() {
  memoryCache.clear()
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(CACHE_CONFIG.STORAGE_KEY)
  }
}

/**
 * 获取缓存统计信息
 * @returns {Object} 缓存统计
 */
export function getCacheStats() {
  const storageCache = loadCacheFromStorage()
  const memorySize = memoryCache.size
  const storageSize = Object.keys(storageCache).length
  
  return {
    memoryEntries: memorySize,
    storageEntries: storageSize,
    totalEntries: Math.max(memorySize, storageSize)
  }
}

// 初始化：加载缓存到内存
if (typeof window !== 'undefined') {
  loadCacheFromStorage()
}

