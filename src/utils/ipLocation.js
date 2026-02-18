/**
 * 前端IP定位工具
 * 获取访问者的真实公网IP地址和位置信息
 * 用于管理员位置更新功能
 */

const IP_API_PRIMARY = 'https://ipapi.co/json/'
const IP_API_SECONDARY = 'https://ip-api.com/json'

/**
 * 获取访问者的真实公网IP地址
 */
export async function getClientIP() {
  try {
    const response = await fetch(IP_API_PRIMARY)
    if (!response.ok) throw new Error('Primary IP API failed')
    const data = await response.json()
    return data.ip || null
  } catch (error) {
    try {
      const response = await fetch(IP_API_SECONDARY)
      const data = await response.json()
      return data.query || null
    } catch (e) {
      console.error('All IP APIs failed:', e)
      return null
    }
  }
}

/**
 * 获取访问者的位置信息
 */
export async function getClientLocationInfo() {
  // 尝试首选 API
  try {
    const response = await fetch(IP_API_PRIMARY)
    if (response.ok) {
      const data = await response.json()
      if (!data.error) {
        return {
          ip: data.ip,
          location: `${data.city}, ${data.country_name}`,
          timezone: data.timezone
        }
      }
    }
  } catch (error) {
    console.warn('Primary IP API failed, trying fallback...')
  }

  // 尝试备用 API
  try {
    const response = await fetch(IP_API_SECONDARY)
    if (response.ok) {
      const data = await response.json()
      if (data.status === 'success') {
        return {
          ip: data.query,
          location: `${data.city}, ${data.country}`,
          timezone: data.timezone
        }
      }
    }
  } catch (error) {
    console.error('All IP location APIs failed')
  }

  return null
}

