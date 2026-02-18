/**
 * API客户端工具
 * 封装所有后端API调用
 */

const getApiBaseUrl = () => {
  // 1. 优先使用注入的环境变量
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  
  // 2. 生产环境推断 (兼容 www 和根域名)
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host.includes('gellaronline.cc')) {
      return 'https://workspace.gellaronline.cc/api'
    }
  }
  
  // 3. 兜底开发环境
  return 'http://localhost:3001/api'
}

const API_BASE_URL = getApiBaseUrl()
console.log('[API] Using Base URL:', API_BASE_URL)

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
    // 抛出错误供上层组件捕获，但可以返回一个安全的默认值如果需要
    throw error
  }
}

/**
 * 博客API
 */
export const blogApi = {
  /**
   * 获取博客列表
   * @param {Object} params - 查询参数
   * @returns {Promise<Array>}
   */
  getList: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/blogs${queryString ? `?${queryString}` : ''}`)
  },

  /**
   * 根据ID获取博客
   * @param {number} id - 文章ID
   * @returns {Promise<Object>}
   */
  getById: (id) => request(`/blogs/${id}`),

  /**
   * 根据slug获取博客
   * @param {string} slug - 文章slug
   * @returns {Promise<Object>}
   */
  getBySlug: (slug) => request(`/blogs/slug/${slug}`),

  /**
   * 创建新博客
   * @param {Object} data - 文章数据
   * @returns {Promise<Object>}
   */
  create: (data) => request('/blogs', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  /**
   * 更新博客
   * @param {number} id - 文章ID
   * @param {Object} data - 更新数据
   * @returns {Promise<Object>}
   */
  update: (id, data) => request(`/blogs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  /**
   * 删除博客
   * @param {number} id - 文章ID
   * @returns {Promise<Object>}
   */
  delete: (id) => request(`/blogs/${id}`, {
    method: 'DELETE'
  }),

  /**
   * 增加浏览量
   * @param {number} id - 文章ID
   * @returns {Promise<Object>}
   */
  incrementViews: (id) => request(`/blogs/${id}/views`, {
    method: 'POST'
  }),

  /**
   * 获取博客统计信息
   * @returns {Promise<Object>}
   */
  getStats: () => request('/blogs/stats'),

  /**
   * 获取所有分类（Genre）
   * @param {Object} params - 查询参数
   * @param {string} params.status - 状态筛选（可选）
   * @returns {Promise<Array>}
   */
  getAllGenres: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/blogs/genres${queryString ? `?${queryString}` : ''}`)
  },

  /**
   * 获取所有标签（Tags）
   * @param {Object} params - 查询参数
   * @param {string} params.status - 状态筛选（可选）
   * @returns {Promise<Array>}
   */
  getAllTags: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/blogs/tags${queryString ? `?${queryString}` : ''}`)
  }
}

/**
 * 点赞API
 */
export const likesApi = {
  /**
   * 获取点赞数
   * @param {number} blogId - 文章ID
   * @returns {Promise<Object>}
   */
  getCount: (blogId) => request(`/blogs/${blogId}/likes`),

  /**
   * 检查是否已点赞
   * @param {number} blogId - 文章ID
   * @returns {Promise<Object>}
   */
  checkLiked: (blogId) => request(`/blogs/${blogId}/liked`),

  /**
   * 点赞/取消点赞
   * @param {number} blogId - 文章ID
   * @returns {Promise<Object>}
   */
  toggle: (blogId) => request(`/blogs/${blogId}/likes`, {
    method: 'POST'
  })
}

/**
 * 评论API
 */
export const commentsApi = {
  /**
   * 获取评论列表
   * @param {number} blogId - 文章ID
   * @param {Object} params - 查询参数
   * @returns {Promise<Array>}
   */
  getList: (blogId, params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/blogs/${blogId}/comments${queryString ? `?${queryString}` : ''}`)
  },

  /**
   * 发表评论
   * @param {number} blogId - 文章ID
   * @param {Object} data - 评论数据
   * @returns {Promise<Object>}
   */
  create: (blogId, data) => request(`/blogs/${blogId}/comments`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  /**
   * 更新评论
   * @param {number} id - 评论ID
   * @param {Object} data - 更新数据
   * @returns {Promise<Object>}
   */
  update: (id, data) => request(`/comments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  /**
   * 删除评论
   * @param {number} id - 评论ID
   * @returns {Promise<Object>}
   */
  delete: (id) => request(`/comments/${id}`, {
    method: 'DELETE'
  }),

  /**
   * 回复评论
   * @param {number} parentId - 父评论ID
   * @param {Object} data - 评论数据
   * @returns {Promise<Object>}
   */
  reply: (parentId, data) => request(`/comments/${parentId}/reply`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

/**
 * 统计分析API
 */
export const analyticsApi = {
  /**
   * 记录访问
   * @param {Object} data - 访问数据
   * @returns {Promise<Object>}
   */
  recordVisit: (data) => request('/analytics/visits', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  /**
   * 获取访问统计
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>}
   */
  getStats: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/analytics/visits${queryString ? `?${queryString}` : ''}`)
  },

  /**
   * 获取单篇博客统计
   * @param {number} blogId - 文章ID
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>}
   */
  getBlogStats: (blogId, params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/analytics/blogs/${blogId}/stats${queryString ? `?${queryString}` : ''}`)
  },

  /**
   * 获取概览统计
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>}
   */
  getOverview: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/analytics/overview${queryString ? `?${queryString}` : ''}`)
  }
}

/**
 * 认证API
 */
export const authApi = {
  /**
   * 用户注册
   * @param {Object} data - 注册数据
   * @returns {Promise<Object>}
   */
  register: (data) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  /**
   * 用户登录
   * @param {Object} data - 登录数据
   * @returns {Promise<Object>}
   */
  login: (data) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  /**
   * 用户登出
   * @returns {Promise<Object>}
   */
  logout: () => request('/auth/logout', {
    method: 'POST'
  }),

  /**
   * 删除账户（注销）
   * @param {boolean} force - 是否强制删除（用于删除admin账户）
   * @returns {Promise<Object>}
   */
  deleteAccount: (force = false) => {
    const url = force ? '/auth/account?force=true' : '/auth/account'
    return request(url, {
      method: 'DELETE'
    })
  },

  /**
   * 验证token
   * @returns {Promise<Object>}
   */
  verify: () => request('/auth/verify'),

  /**
   * 获取用户收藏站点
   */
  getFavorites: () => request('/auth/favorites'),

  /**
   * 更新用户收藏站点
   */
  updateFavorites: (favorites) => request('/auth/favorites', {
    method: 'POST',
    body: JSON.stringify({ favorites })
  }),

  /**
   * 刷新token
   */
  refresh: () => request('/auth/refresh', {
    method: 'POST'
  })
}

/**
 * 上传API
 */
export const uploadApi = {
  /**
   * 上传博客图片
   * @param {File} file - 图片文件
   * @returns {Promise<Object>} 上传结果
   */
  uploadBlogImage: (file) => {
    const formData = new FormData()
    formData.append('image', file)
    
    const token = localStorage.getItem('token')
    const headers = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

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
  /**
   * 获取管理员设置
   * @returns {Promise<Object>}
   */
  get: () => request('/admin/settings'),

  /**
   * 更新管理员设置
   * @param {Object} data - 设置数据
   * @returns {Promise<Object>}
   */
  update: (data) => request('/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

/**
 * 留言板API
 */
export const guestbookApi = {
  /**
   * 获取留言列表
   * @param {Object} params - 查询参数
   * @returns {Promise<Array>}
   */
  getList: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/guestbook${queryString ? `?${queryString}` : ''}`)
  },

  /**
   * 根据ID获取留言
   * @param {number} id - 留言ID
   * @returns {Promise<Object>}
   */
  getById: (id) => request(`/guestbook/${id}`),

  /**
   * 创建新留言
   * @param {Object} data - 留言数据
   * @returns {Promise<Object>}
   */
  create: (data) => request('/guestbook', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  /**
   * 更新留言
   * @param {number} id - 留言ID
   * @param {Object} data - 更新数据
   * @returns {Promise<Object>}
   */
  update: (id, data) => request(`/guestbook/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  /**
   * 删除留言
   * @param {number} id - 留言ID
   * @returns {Promise<Object>}
   */
  delete: (id) => request(`/guestbook/${id}`, {
    method: 'DELETE'
  }),

  /**
   * 获取留言总数
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>}
   */
  getCount: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/guestbook/stats/count${queryString ? `?${queryString}` : ''}`)
  }
}

/**
 * 从标题生成 URL 友好的 slug
 * 支持中文字符和 Unicode 字符
 * @param {string} title - 文章标题
 * @returns {string} - 生成的 slug，如果输入无效或结果为空，返回空字符串（由调用方处理）
 */
export function generateSlug(title) {
  if (!title || typeof title !== 'string') {
    return ''
  }
  
  return title
    .toLowerCase()
    // 保留字母、数字、中文字符、空格、连字符
    // \w 匹配字母、数字、下划线，但不包含中文字符
    // 使用 Unicode 属性来匹配中文字符：\p{L} 匹配所有字母（包括中文），\p{N} 匹配所有数字
    // 如果浏览器不支持 Unicode 属性，使用 \u4e00-\u9fff 匹配常用中文字符
    .replace(/[^\w\s\u4e00-\u9fff-]/g, '') // 移除特殊字符，但保留中文字符
    .replace(/\s+/g, '-') // 空格替换为连字符
    .replace(/-+/g, '-') // 多个连字符合并为一个
    .replace(/^-+|-+$/g, '') // 移除开头和结尾的连字符
    .trim() || 'untitled' // 如果结果为空，使用默认值 'untitled'
}

