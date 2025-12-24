/**
 * IP地址定位工具
 * 根据IP地址获取用户的地理位置和时区信息
 */

/**
 * 根据IP地址获取位置和时区信息
 * 使用 ipapi.co API（免费，无需API key）
 * @param {string} ip - IP地址（可选，不提供则使用请求的IP）
 * @returns {Promise<Object>} 包含位置和时区信息的对象
 */
export async function getLocationByIP(ip = null) {
  try {
    const apiUrl = ip ? `https://ipapi.co/${ip}/json/` : 'https://ipapi.co/json/'
    const response = await fetch(apiUrl)
    
    if (!response.ok) {
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
      timezone: data.timezone || null,  // 如 "Asia/Shanghai"
      utcOffset: data.utc_offset || null,  // 如 "+08:00"
      lat: data.latitude || null,
      lon: data.longitude || null,
      location  // 格式化位置字符串
    }
  } catch (error) {
    console.error('Failed to get location by IP:', error)
    // 返回默认值（北京）
    return {
      city: 'Beijing',
      country: 'China',
      countryCode: 'CN',
      timezone: 'Asia/Shanghai',
      utcOffset: '+08:00',
      lat: 39.9042,
      lon: 116.4074,
      location: 'Beijing, China'
    }
  }
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

