/**
 * API客户端工具
 * 封装所有后端API调用
 */

const getApiBaseUrl = () => {
  // 1. 优先使用注入的环境变量
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  
  // 2. 生产环境：明确指向您的后端子域名
  if (import.meta.env.PROD) return 'https://workspace.gellaronline.cc/api'
  
  // 3. 开发环境
  return 'http://localhost:3001/api'
}

const API_BASE_URL = getApiBaseUrl()

/**
 * 获取认证token
 */
function getToken() {
  return typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
}

/**
 * 通用请求函数
 */
async function request(url, options = {}) {
  try {
    const token = getToken()
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers
    })

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token')
      }
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.message || error.error || `HTTP ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`API Request Failed [${url}]:`, error.message)
    throw error
  }
}

/**
 * 博客API
 */
export const blogApi = {
  getList: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/blogs${queryString ? `?${queryString}` : ''}`)
  },
  getById: (id) => request(`/blogs/${id}`),
  getBySlug: (slug) => request(`/blogs/slug/${slug}`),
  create: (data) => request('/blogs', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/blogs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/blogs/${id}`, { method: 'DELETE' }),
  incrementViews: (id) => request(`/blogs/${id}/views`, { method: 'POST' }),
  getStats: () => request('/blogs/stats'),
  getAllGenres: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/blogs/genres${queryString ? `?${queryString}` : ''}`)
  },
  getAllTags: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/blogs/tags${queryString ? `?${queryString}` : ''}`)
  }
}

/**
 * 点赞API
 */
export const likesApi = {
  getCount: (blogId) => request(`/blogs/${blogId}/likes`),
  checkLiked: (blogId) => request(`/blogs/${blogId}/liked`),
  toggle: (blogId) => request(`/blogs/${blogId}/likes`, { method: 'POST' })
}

/**
 * 评论API
 */
export const commentsApi = {
  getList: (blogId, params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/blogs/${blogId}/comments${queryString ? `?${queryString}` : ''}`)
  },
  create: (blogId, data) => request(`/blogs/${blogId}/comments`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/comments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/comments/${id}`, { method: 'DELETE' }),
  reply: (parentId, data) => request(`/comments/${parentId}/reply`, { method: 'POST', body: JSON.stringify(data) })
}

/**
 * 统计分析API
 */
export const analyticsApi = {
  recordVisit: (data) => request('/analytics/visits', { method: 'POST', body: JSON.stringify(data) }),
  getStats: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/analytics/visits${queryString ? `?${queryString}` : ''}`)
  },
  getBlogStats: (blogId, params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/analytics/blogs/${blogId}/stats${queryString ? `?${queryString}` : ''}`)
  },
  getOverview: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/analytics/overview${queryString ? `?${queryString}` : ''}`)
  }
}

/**
 * 认证API
 */
export const authApi = {
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  deleteAccount: (force = false) => {
    const url = force ? '/auth/account?force=true' : '/auth/account'
    return request(url, { method: 'DELETE' })
  },
  verify: () => request('/auth/verify'),
  getFavorites: () => request('/auth/favorites'),
  updateFavorites: (favorites) => request('/auth/favorites', {
    method: 'POST',
    body: JSON.stringify({ favorites })
  }),
  refresh: () => request('/auth/refresh', { method: 'POST' })
}

/**
 * 上传API
 */
export const uploadApi = {
  uploadBlogImage: (file) => {
    const formData = new FormData()
    formData.append('image', file)
    const token = localStorage.getItem('token')
    const headers = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    
    return fetch(`${API_BASE_URL}/upload/blog-image`, {
      method: 'POST',
      headers,
      body: formData
    }).then(res => {
      if (!res.ok) throw new Error('Upload failed')
      return res.json()
    })
  }
}

/**
 * 管理员设置API
 */
export const adminSettingsApi = {
  get: () => request('/admin/settings'),
  update: (data) => request('/admin/settings', { method: 'PUT', body: JSON.stringify(data) })
}

/**
 * 留言板API
 */
export const guestbookApi = {
  getList: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/guestbook${queryString ? `?${queryString}` : ''}`)
  },
  getById: (id) => request(`/guestbook/${id}`),
  create: (data) => request('/guestbook', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/guestbook/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/guestbook/${id}`, { method: 'DELETE' }),
  getCount: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/guestbook/stats/count${queryString ? `?${queryString}` : ''}`)
  }
}

/**
 * 从标题生成 URL 友好的 slug
 */
export function generateSlug(title) {
  if (!title || typeof title !== 'string') return ''
  return title.toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fff-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim() || 'untitled'
}
