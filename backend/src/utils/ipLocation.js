/**
 * IP地址定位工具
 * 根据IP地址获取用户的地理位置和时区信息
 * 支持多个备用API和重试机制
 */

// 内存缓存，避免频繁请求
const locationCache = new Map()
const CACHE_DURATION = 60 * 60 * 1000 // 1小时缓存

/**
 * 检测IP地址是否是本地/保留IP
 * 包括IPv4和IPv6的本地地址
 * @param {string} ip - IP地址
 * @returns {boolean} 如果是本地/保留IP返回true
 */
export function isLocalOrReservedIP(ip) {
  if (!ip) return true
  
  const trimmedIp = ip.split(',')[0].trim()
  
  // IPv4本地/保留IP检测
  if (trimmedIp.startsWith('127.') || 
      trimmedIp.startsWith('192.168.') || 
      trimmedIp.startsWith('10.') ||
      trimmedIp.startsWith('172.16.') ||
      trimmedIp.startsWith('172.17.') ||
      trimmedIp.startsWith('172.18.') ||
      trimmedIp.startsWith('172.19.') ||
      trimmedIp.startsWith('172.20.') ||
      trimmedIp.startsWith('172.21.') ||
      trimmedIp.startsWith('172.22.') ||
      trimmedIp.startsWith('172.23.') ||
      trimmedIp.startsWith('172.24.') ||
      trimmedIp.startsWith('172.25.') ||
      trimmedIp.startsWith('172.26.') ||
      trimmedIp.startsWith('172.27.') ||
      trimmedIp.startsWith('172.28.') ||
      trimmedIp.startsWith('172.29.') ||
      trimmedIp.startsWith('172.30.') ||
      trimmedIp.startsWith('172.31.') ||
      trimmedIp === 'localhost' ||
      trimmedIp === '0.0.0.0') {
    return true
  }
  
  // IPv6本地/保留IP检测
  if (trimmedIp === '::1' || 
      trimmedIp === '::' ||
      trimmedIp.startsWith('::ffff:127.') ||
      trimmedIp.startsWith('::ffff:192.168.') ||
      trimmedIp.startsWith('::ffff:10.') ||
      trimmedIp.startsWith('fe80:') ||
      trimmedIp.startsWith('fc00:') ||
      trimmedIp.startsWith('fd00:')) {
    return true
  }
  
  return false
}

/**
 * 从ipapi.co获取位置信息（主API）
 * @param {string} ip - IP地址（可选）
 * @returns {Promise<Object>} 位置信息
 */
async function getLocationFromIpapi(ip = null) {
  const apiUrl = ip ? `https://ipapi.co/${ip}/json/` : 'https://ipapi.co/json/'
  const response = await fetch(apiUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  })
  
  if (!response.ok) {
    // 429错误表示限流，需要重试
    if (response.status === 429) {
      throw new Error('RATE_LIMITED')
    }
    throw new Error(`IP API returned ${response.status}`)
  }
  
  const data = await response.json()
  
  // 如果API返回错误
  if (data.error) {
    throw new Error(data.reason || 'Failed to get location')
  }
  
  // 格式化位置字符串
  const location = data.city && data.country_name 
    ? `${data.city}, ${data.country_name}` 
    : data.country_name || null
  
  return {
    city: data.city || null,
    country: data.country_name || null,
    countryCode: data.country_code || null,
    timezone: data.timezone || null,
    utcOffset: data.utc_offset || null,
    lat: data.latitude || null,
    lon: data.longitude || null,
    location
  }
}

/**
 * 从ip-api.com获取位置信息（备用API）
 * @param {string} ip - IP地址（可选）
 * @returns {Promise<Object>} 位置信息
 */
async function getLocationFromIpApi(ip = null) {
  const apiUrl = ip 
    ? `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,city,lat,lon,timezone,offset`
    : 'http://ip-api.com/json?fields=status,message,country,countryCode,city,lat,lon,timezone,offset'
  
  const response = await fetch(apiUrl)
  
  if (!response.ok) {
    throw new Error(`IP-API returned ${response.status}`)
  }
  
  const data = await response.json()
  
  if (data.status === 'fail') {
    throw new Error(data.message || 'Failed to get location')
  }
  
  // 格式化UTC偏移量
  const utcOffset = data.offset ? `UTC${data.offset >= 0 ? '+' : ''}${data.offset / 3600}` : null
  
  // 格式化位置字符串
  const location = data.city && data.country 
    ? `${data.city}, ${data.country}` 
    : data.country || null
  
  return {
    city: data.city || null,
    country: data.country || null,
    countryCode: data.countryCode || null,
    timezone: data.timezone || null,
    utcOffset: utcOffset,
    lat: data.lat || null,
    lon: data.lon || null,
    location
  }
}

/**
 * 根据IP地址获取位置和时区信息
 * 支持重试机制和多个备用API
 * @param {string} ip - IP地址（可选，不提供则使用请求的IP）
 * @param {Object} options - 选项
 * @param {boolean} options.useCache - 是否使用缓存（默认true）
 * @param {number} options.maxRetries - 最大重试次数（默认2）
 * @param {number} options.retryDelay - 重试延迟（毫秒，默认1000）
 * @returns {Promise<Object|null>} 包含位置和时区信息的对象，失败返回null
 */
export async function getLocationByIP(ip = null, options = {}) {
  const { useCache = true, maxRetries = 2, retryDelay = 1000 } = options
  
  // 检查缓存
  if (useCache && ip) {
    const cacheKey = ip
    const cached = locationCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      // 检查缓存中是否是错误的默认值（Beijing, China），如果是则清除缓存
      if (cached.data && cached.data.location === 'Beijing, China') {
        locationCache.delete(cacheKey)
        console.warn('Cleared cached default location (Beijing, China)')
      } else {
        return cached.data
      }
    }
  }
  
  // API列表（按优先级）
  const apis = [
    { name: 'ipapi.co', fn: () => getLocationFromIpapi(ip) },
    { name: 'ip-api.com', fn: () => getLocationFromIpApi(ip) }
  ]
  
  // 尝试每个API，支持重试
  for (const api of apis) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // 重试前等待
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
        }
        
        const result = await api.fn()
        
        // 验证结果
        if (result && result.location && result.timezone) {
          // 存入缓存
          if (useCache && ip) {
            locationCache.set(ip, {
              data: result,
              timestamp: Date.now()
            })
          }
          return result
        }
      } catch (error) {
        // 如果是限流错误且还有重试机会，继续重试
        if (error.message === 'RATE_LIMITED' && attempt < maxRetries) {
          console.warn(`API ${api.name} rate limited, retrying... (attempt ${attempt + 1}/${maxRetries + 1})`)
          continue
        }
        
        // 如果是最后一次尝试，记录错误并尝试下一个API
        if (attempt === maxRetries) {
          console.warn(`API ${api.name} failed after ${maxRetries + 1} attempts:`, error.message)
          break // 尝试下一个API
        }
      }
    }
  }
  
  // 所有API都失败，返回null而不是默认值
  console.error('All IP location APIs failed')
  return null
}

/**
 * 从UTC偏移量计算时区字符串
 * @param {string} utcOffset - UTC偏移量（如 "+08:00"）
 * @returns {string} 时区字符串（如 "UTC+8"）
 */
export function formatTimezone(utcOffset) {
  if (!utcOffset) return 'UTC'
  
  // 解析 "+08:00" 格式
  const match = utcOffset.match(/([+-])(\d{2}):(\d{2})/)
  if (!match) return 'UTC'
  
  const sign = match[1]
  const hours = parseInt(match[2])
  const minutes = parseInt(match[3])
  
  if (minutes === 0) {
    return `UTC${sign}${hours}`
  } else {
    const totalMinutes = hours * 60 + minutes
    const totalHours = (sign === '+' ? 1 : -1) * totalMinutes / 60
    return `UTC${sign}${Math.abs(totalHours)}`
  }
}

