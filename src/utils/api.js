/**
 * API客户端工具
 * 封装所有后端API调用
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

/**
 * 通用请求函数
 * @param {string} url - API端点
 * @param {Object} options - 请求选项
 * @returns {Promise<Response>}
 */
async function request(url, options = {}) {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(error.error || error.message || `HTTP ${response.status}`)
  }

  return response.json()
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
  })
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
 * 生成文章slug
 * @param {string} title - 文章标题
 * @returns {string} slug
 */
export function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // 移除特殊字符
    .replace(/\s+/g, '-') // 空格替换为连字符
    .replace(/-+/g, '-') // 多个连字符合并为一个
    .trim()
}

