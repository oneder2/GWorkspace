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
  const providers = [
    'https://api.ipify.org?format=json',
    'https://ipapi.co/json/',
    'https://ipwho.is/'
  ]

  for (const url of providers) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId);
      
      if (!response.ok) continue
      
      const data = await response.json()
      // 不同 API 的 IP 字段名不同
      const ip = data.ip || data.ipAddress || data.query
      
      if (ip) return ip
    } catch (error) {
      console.warn(`[IP] Provider ${url} failed:`, error.message)
    }
  }

  return null
}

/**
 * 获取访问者的位置信息
 * 采用多重回退机制，确保在不同网络环境下均能获取信息
 */
export async function getClientLocationInfo() {
  const providers = [
    {
      url: 'https://ipapi.co/json/',
      parse: (data) => ({
        ip: data.ip,
        location: `${data.city}, ${data.country_name}`,
        timezone: data.timezone
      })
    },
    {
      url: 'https://ipwho.is/',
      parse: (data) => ({
        ip: data.ip,
        location: `${data.city}, ${data.country}`,
        timezone: data.timezone?.id
      })
    },
    {
      url: 'https://freeipapi.com/api/json',
      parse: (data) => ({
        ip: data.ipAddress,
        location: `${data.cityName}, ${data.countryName}`,
        timezone: data.timeZone
      })
    }
  ]

  for (const provider of providers) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(provider.url, { signal: controller.signal })
      clearTimeout(timeoutId);
      
      if (!response.ok) continue
      
      const data = await response.json()
      const result = provider.parse(data)
      
      if (result.ip && result.location) {
        return result
      }
    } catch (error) {
      console.warn(`[IP Location] Provider ${provider.url} failed:`, error.message)
    }
  }

  console.error('[IP Location] All location providers failed')
  return null
}

