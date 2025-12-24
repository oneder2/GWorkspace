/**
 * 用户认证组合式函数
 * 管理用户登录状态、token存储和自动刷新
 */

import { ref, computed } from 'vue'
import { authApi } from '../utils/api'

// 用户状态
const user = ref(null)
const token = ref(localStorage.getItem('token') || null)
const isLoading = ref(false)

/**
 * 初始化：从localStorage恢复token并验证
 */
async function initAuth() {
  const savedToken = localStorage.getItem('token')
  if (savedToken) {
    token.value = savedToken
    try {
      const response = await authApi.verify()
      user.value = response.user
    } catch (error) {
      // token无效，清除
      localStorage.removeItem('token')
      token.value = null
    }
  }
}

// 自动初始化
initAuth()

/**
 * 用户认证组合式函数
 */
export function useAuth() {
  /**
   * 用户注册
   * @param {Object} data - 注册数据
   */
  const register = async (data) => {
    isLoading.value = true
    try {
      const response = await authApi.register(data)
      user.value = response.user
      token.value = response.token
      localStorage.setItem('token', response.token)
      return { success: true, user: response.user }
    } catch (error) {
      return { success: false, error: error.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 用户登录
   * @param {Object} data - 登录数据
   */
  const login = async (data) => {
    isLoading.value = true
    try {
      const response = await authApi.login(data)
      user.value = response.user
      token.value = response.token
      localStorage.setItem('token', response.token)
      return { success: true, user: response.user }
    } catch (error) {
      return { success: false, error: error.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 用户登出
   */
  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      user.value = null
      token.value = null
      localStorage.removeItem('token')
    }
  }

  /**
   * 删除账户（注销）
   */
  const deleteAccount = async () => {
    try {
      await authApi.deleteAccount()
      // 删除成功后清除本地状态
      user.value = null
      token.value = null
      localStorage.removeItem('token')
      return { success: true }
    } catch (error) {
      console.error('Delete account error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 检查是否已登录
   */
  const isAuthenticated = computed(() => !!user.value)

  /**
   * 检查是否是管理员
   */
  const isAdmin = computed(() => user.value?.role === 'admin')

  return {
    user,
    token,
    isLoading,
    register,
    login,
    logout,
    deleteAccount,
    isAuthenticated,
    isAdmin
  }
}


