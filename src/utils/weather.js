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
 * 采用多重回退机制确保可靠性
 * @returns {Promise<Object>} 包含城市、国家等位置信息
 */
export async function getLocationByIP() {
  const providers = [
    {
      url: 'https://ipapi.co/json/',
      parse: (data) => ({
        city: data.city,
        country: data.country_name,
        lat: data.latitude,
        lon: data.longitude
      })
    },
    {
      url: 'https://ipwho.is/',
      parse: (data) => ({
        city: data.city,
        country: data.country,
        lat: data.latitude,
        lon: data.longitude
      })
    },
    {
      url: 'https://freeipapi.com/api/json',
      parse: (data) => ({
        city: data.cityName,
        country: data.countryName,
        lat: data.latitude,
        lon: data.longitude
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
      
      if (result.lat && result.lon) {
        console.log(`[Weather] Location found using ${provider.url}:`, result.city)
        return {
          city: result.city || 'Unknown',
          country: result.country || 'Unknown',
          lat: result.lat,
          lon: result.lon
        }
      }
    } catch (error) {
      console.warn(`[Weather] Provider ${provider.url} failed:`, error.message)
    }
  }

  // 最终回退：北京
  console.error('[Weather] All location providers failed, falling back to Beijing')
  return {
    city: 'Beijing',
    country: 'China',
    lat: 39.9042,
    lon: 116.4074
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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    // 尝试 wttr.in (JSON 格式)
    const url = `https://wttr.in/${lat},${lon}?format=j1&lang=zh`
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json()
      
      if (data.current_condition && data.current_condition[0]) {
        const current = data.current_condition[0]
        return {
          temp: parseInt(current.temp_C) || parseInt(current.temp_F) || 0,
          condition: current.lang_zh?.[0]?.value || current.weatherDesc?.[0]?.value || 'Unknown',
          icon: current.weatherCode,
          humidity: current.humidity,
          windSpeed: current.windspeedKmph,
          city: data.nearest_area?.[0]?.areaName?.[0]?.value || 'Unknown'
        }
      }
    }
    
    throw new Error('wttr.in provided invalid or empty data')
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn('[Weather] wttr.in failed or timed out:', error.message);
    
    // 尝试 fallback: Open-Meteo (非常稳定，不需要 API Key)
    try {
      const fallbackUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
      const fallbackRes = await fetch(fallbackUrl)
      if (fallbackRes.ok) {
        const fbData = await fallbackRes.json()
        if (fbData.current_weather) {
          console.log('[Weather] Successfully used Open-Meteo as fallback')
          return {
            temp: Math.round(fbData.current_weather.temperature),
            condition: 'Clear', // Open-Meteo current_weather doesn't give text desc easily without code mapping
            icon: String(fbData.current_weather.weathercode),
            humidity: '--',
            windSpeed: fbData.current_weather.windspeed,
            city: 'Local'
          }
        }
      }
    } catch (fbError) {
      console.warn('[Weather] Fallback weather provider also failed:', fbError.message)
    }

    // 最终回退数据
    return {
      temp: '--',
      condition: 'Unknown',
      icon: '116',
      humidity: '--',
      windSpeed: '--',
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
