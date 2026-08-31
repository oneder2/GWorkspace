/**
 * API客户端工具
 * 封装所有后端API调用
 */

const getApiBaseUrl = () => {
  // 1. 优先使用注入的环境变量
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  
  // 2. 生产环境：API 仍由独立后端域名提供
  if (import.meta.env.PROD) return 'https://workspace.gellaronline.cc/api'
  
  // 3. 开发环境
  return 'http://localhost:3001/api'
}

const API_BASE_URL = getApiBaseUrl()
export { API_BASE_URL }

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
      const errorPayload = await response.json().catch(() => ({ error: response.statusText }))
      const requestError = new Error(errorPayload.message || errorPayload.error || `HTTP ${response.status}`)
      Object.assign(requestError, errorPayload, { status: response.status })
      throw requestError
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
  getMetadata: () => request('/blogs/metadata'),
  getAllGenres: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/blogs/genres${queryString ? `?${queryString}` : ''}`)
  },
  getAllTags: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/blogs/tags${queryString ? `?${queryString}` : ''}`)
  }
}

export const aiApi = {
  getDailyCapsule: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/ai/daily-capsule${queryString ? `?${queryString}` : ''}`)
  },
  analyze: (data) => request('/ai/analyze', { method: 'POST', body: JSON.stringify(data) }),
  getBlogSeed: (data) => request('/ai/blog-seed', { method: 'POST', body: JSON.stringify(data) })
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
    }).then(async res => {
      const payload = await res.json().catch(() => ({ error: 'Upload failed' }))
      if (!res.ok) {
        const uploadError = new Error(payload.message || payload.error || 'Upload failed')
        Object.assign(uploadError, payload, { status: res.status })
        throw uploadError
      }
      return payload
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

export const publicContentApi = {
  getWorld: (locale = 'zh') => request(`/public/world?locale=${encodeURIComponent(locale)}`),
  getProjects: (locale = 'zh') => request(`/public/projects?locale=${encodeURIComponent(locale)}`)
}

export const contentAdminApi = {
  getResume: () => request('/admin/content/resume'),
  updateResumeProfile: (data) => request('/admin/content/resume/profile', { method: 'PUT', body: JSON.stringify(data) }),
  createResumeContact: (data) => request('/admin/content/resume/contacts', { method: 'POST', body: JSON.stringify(data) }),
  updateResumeContact: (id, data) => request(`/admin/content/resume/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteResumeContact: (id) => request(`/admin/content/resume/contacts/${id}`, { method: 'DELETE' }),
  createResumeSkill: (data) => request('/admin/content/resume/skills', { method: 'POST', body: JSON.stringify(data) }),
  updateResumeSkill: (id, data) => request(`/admin/content/resume/skills/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteResumeSkill: (id) => request(`/admin/content/resume/skills/${id}`, { method: 'DELETE' }),
  createResumeTimeline: (data) => request('/admin/content/resume/timeline', { method: 'POST', body: JSON.stringify(data) }),
  updateResumeTimeline: (id, data) => request(`/admin/content/resume/timeline/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteResumeTimeline: (id) => request(`/admin/content/resume/timeline/${id}`, { method: 'DELETE' }),
  getProjects: () => request('/admin/content/projects'),
  createProject: (data) => request('/admin/content/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id, data) => request(`/admin/content/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id) => request(`/admin/content/projects/${id}`, { method: 'DELETE' }),
  getWorldExhibits: () => request('/admin/content/world-exhibits'),
  createWorldExhibit: (data) => request('/admin/content/world-exhibits', { method: 'POST', body: JSON.stringify(data) }),
  updateWorldExhibit: (id, data) => request(`/admin/content/world-exhibits/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWorldExhibit: (id) => request(`/admin/content/world-exhibits/${id}`, { method: 'DELETE' })
}

export const writingAdminApi = {
  getProjects: () => request('/admin/writing/projects'),
  createProject: (data) => request('/admin/writing/projects', { method: 'POST', body: JSON.stringify(data) }),
  getProject: (id) => request(`/admin/writing/projects/${id}`),
  updateProject: (id, data) => request(`/admin/writing/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProject: (id) => request(`/admin/writing/projects/${id}`, { method: 'DELETE' }),
  createDocument: (projectId, data) => request(`/admin/writing/projects/${projectId}/documents`, { method: 'POST', body: JSON.stringify(data) }),
  updateDocument: (id, data) => request(`/admin/writing/documents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteDocument: (id) => request(`/admin/writing/documents/${id}`, { method: 'DELETE' }),
  getRevisions: (id) => request(`/admin/writing/documents/${id}/revisions`),
  createRevision: (id, data = {}) => request(`/admin/writing/documents/${id}/revisions`, { method: 'POST', body: JSON.stringify(data) }),
  createEntity: (projectId, data) => request(`/admin/writing/projects/${projectId}/entities`, { method: 'POST', body: JSON.stringify(data) }),
  updateEntity: (id, data) => request(`/admin/writing/entities/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteEntity: (id) => request(`/admin/writing/entities/${id}`, { method: 'DELETE' }),
  publishEssay: (projectId, data) => request(`/admin/writing/projects/${projectId}/publish`, { method: 'POST', body: JSON.stringify(data) })
}

export const adminApi = {
  getBlogs: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/admin/blogs${queryString ? `?${queryString}` : ''}`)
  },
  getBlogById: (id) => request(`/admin/blogs/${id}`),
  getBlogGenres: () => request('/admin/blogs/genres'),
  getBlogTags: () => request('/admin/blogs/tags'),
  getComments: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/admin/comments${queryString ? `?${queryString}` : ''}`)
  },
  getGuestbook: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/admin/guestbook${queryString ? `?${queryString}` : ''}`)
  },
  getAnalyticsOverview: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/admin/analytics/overview${queryString ? `?${queryString}` : ''}`)
  },
  getStats: () => request('/admin/stats'),
  getSystemHealth: () => request('/admin/system/health'),
  createSystemBackup: () => request('/admin/system/backup', { method: 'POST' }),
  getSystemAssets: () => request('/admin/system/assets'),
  deleteSystemAsset: (key) => request('/admin/system/assets', {
    method: 'DELETE',
    body: JSON.stringify({ key })
  }),
  getAiSeeds: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/admin/ai/seeds${queryString ? `?${queryString}` : ''}`)
  },
  createAiSeed: (data) => request('/admin/ai/seeds', { method: 'POST', body: JSON.stringify(data) }),
  updateAiSeed: (id, data) => request(`/admin/ai/seeds/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  importAiSeeds: (data) => request('/admin/ai/seeds/import', { method: 'POST', body: JSON.stringify(data) }),
  getAiDailyCapsule: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/admin/ai/daily-capsule${queryString ? `?${queryString}` : ''}`)
  },
  refreshAiDailyCapsule: (data = {}) => request('/admin/ai/daily-capsule/refresh', { method: 'POST', body: JSON.stringify(data) })
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
