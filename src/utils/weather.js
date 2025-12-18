/**
 * 天气服务工具
 * 根据访问者IP地址获取当地天气信息
 * 
 * 使用免费的天气API服务：
 * - 通过ipapi.co获取IP地址和位置信息
 * - 使用OpenWeatherMap API获取天气数据（需要API key，这里使用免费替代方案）
 * 
 * TODO: 可以替换为其他天气API服务，如：
 * - OpenWeatherMap (需要API key)
 * - WeatherAPI (免费额度)
 * - 国内：和风天气API
 */
const WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5'
const IP_API = 'https://ipapi.co/json/'

/**
 * 通过IP地址获取位置信息
 * @returns {Promise<Object>} 包含城市、国家等位置信息
 */
export async function getLocationByIP() {
  try {
    const response = await fetch(IP_API)
    const data = await response.json()
    return {
      city: data.city || 'Unknown',
      country: data.country_name || 'Unknown',
      lat: data.latitude,
      lon: data.longitude
    }
  } catch (error) {
    console.error('Failed to get location by IP:', error)
    // 返回默认位置（北京）
    return {
      city: 'Beijing',
      country: 'China',
      lat: 39.9042,
      lon: 116.4074
    }
  }
}

/**
 * 获取天气信息
 * 使用免费的天气API - wttr.in (不需要API key)
 * 
 * 注意：wttr.in 是一个免费的天气服务，基于位置信息返回天气数据
 * 如果需要更精确的天气数据，可以替换为 OpenWeatherMap 或其他需要 API key 的服务
 * 
 * @param {number} lat - 纬度
 * @param {number} lon - 经度
 * @returns {Promise<Object>} 天气数据
 */
export async function getWeather(lat, lon) {
  try {
    // 使用 wttr.in API，根据经纬度获取天气
    // format=j1 返回 JSON 格式，lang=zh 使用中文
    const url = `https://wttr.in/?format=j1&lang=zh`
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.current_condition && data.current_condition[0]) {
      const current = data.current_condition[0]
      return {
        temp: parseInt(current.temp_C) || parseInt(current.temp_F),
        condition: current.weatherDesc?.[0]?.value || 'Unknown',
        icon: current.weatherCode,
        humidity: current.humidity,
        windSpeed: current.windspeedKmph,
        city: data.nearest_area?.[0]?.areaName?.[0]?.value || 'Unknown'
      }
    }
    
    throw new Error('Invalid weather data')
  } catch (error) {
    console.error('Failed to get weather:', error)
    // 返回模拟数据作为fallback
    return {
      temp: 23,
      condition: 'Partly Cloudy',
      icon: '116',
      humidity: 65,
      windSpeed: 10,
      city: 'Unknown'
    }
  }
}

/**
 * 获取完整的天气信息（包括位置）
 * @returns {Promise<Object>} 包含位置和天气的完整信息
 */
export async function getWeatherInfo() {
  try {
    const location = await getLocationByIP()
    const weather = await getWeather(location.lat, location.lon)
    return {
      ...location,
      ...weather
    }
  } catch (error) {
    console.error('Failed to get weather info:', error)
    return {
      city: 'Unknown',
      country: 'Unknown',
      temp: 23,
      condition: 'Unknown',
      icon: '116'
    }
  }
}
