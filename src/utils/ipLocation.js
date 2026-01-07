/**
 * 前端IP定位工具
 * 获取访问者的真实公网IP地址和位置信息
 * 用于管理员位置更新功能
 */

const IP_API = 'https://ipapi.co/json/'

/**
 * 获取访问者的真实公网IP地址
 * @returns {Promise<string|null>} IP地址，失败返回null
 */
export async function getClientIP() {
  try {
    const response = await fetch(IP_API)
    const data = await response.json()
    return data.ip || null
  } catch (error) {
    console.error('Failed to get client IP:', error)
    return null
  }
}

/**
 * 获取访问者的位置信息（包含IP、位置、时区）
 * @returns {Promise<Object|null>} 位置信息对象，包含ip, location, timezone，失败返回null
 */
export async function getClientLocationInfo() {
  try {
    const response = await fetch(IP_API)
    const data = await response.json()
    
    // 检查API是否返回错误
    if (data.error) {
      console.warn('IP API returned error:', data.reason || data.error)
      return null
    }
    
    // 格式化位置字符串
    const location = data.city && data.country_name 
      ? `${data.city}, ${data.country_name}` 
      : data.country_name || null
    
    return {
      ip: data.ip || null,
      location: location,
      timezone: data.timezone || null
    }
  } catch (error) {
    console.error('Failed to get client location info:', error)
    return null
  }
}

