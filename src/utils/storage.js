/**
 * 存储工具函数
 * 封装 localStorage 和 IndexedDB 操作
 * 提供统一的数据持久化接口
 */

const STORAGE_PREFIX = 'gworkspace_'

/**
 * localStorage 操作
 * 适用于小数据量、简单配置
 */
export const localStorage = {
  /**
   * 设置值
   * @param {string} key - 键名
   * @param {any} value - 值（会自动序列化为JSON）
   */
  set(key, value) {
    try {
      const serialized = JSON.stringify(value)
      window.localStorage.setItem(STORAGE_PREFIX + key, serialized)
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  },

  /**
   * 获取值
   * @param {string} key - 键名
   * @param {any} defaultValue - 默认值
   * @returns {any} 存储的值或默认值
   */
  get(key, defaultValue = null) {
    try {
      const item = window.localStorage.getItem(STORAGE_PREFIX + key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error('Failed to read from localStorage:', error)
      return defaultValue
    }
  },

  /**
   * 删除值
   * @param {string} key - 键名
   */
  remove(key) {
    try {
      window.localStorage.removeItem(STORAGE_PREFIX + key)
    } catch (error) {
      console.error('Failed to remove from localStorage:', error)
    }
  },

  /**
   * 清空所有应用相关的存储
   */
  clear() {
    try {
      const keys = Object.keys(window.localStorage)
      keys.forEach(key => {
        if (key.startsWith(STORAGE_PREFIX)) {
          window.localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
    }
  }
}

/**
 * IndexedDB 操作
 * 适用于大数据量、复杂数据结构
 */
let dbInstance = null
const DB_NAME = 'GWorkspaceDB'
const DB_VERSION = 1

/**
 * 初始化 IndexedDB
 * @returns {Promise<IDBDatabase>} 数据库实例
 */
function initDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      
      // 创建对象存储
      if (!db.objectStoreNames.contains('favorites')) {
        db.createObjectStore('favorites', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('todos')) {
        const todoStore = db.createObjectStore('todos', { keyPath: 'id', autoIncrement: true })
        todoStore.createIndex('completed', 'completed', { unique: false })
      }
      if (!db.objectStoreNames.contains('customLinks')) {
        db.createObjectStore('customLinks', { keyPath: 'id' })
      }
    }
  })
}

/**
 * IndexedDB 操作封装
 */
export const indexedDB = {
  /**
   * 添加或更新数据
   * @param {string} storeName - 存储名称
   * @param {any} data - 数据对象
   */
  async put(storeName, data) {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(data)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  },

  /**
   * 获取数据
   * @param {string} storeName - 存储名称
   * @param {any} key - 键值
   */
  async get(storeName, key) {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  },

  /**
   * 获取所有数据
   * @param {string} storeName - 存储名称
   */
  async getAll(storeName) {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  },

  /**
   * 删除数据
   * @param {string} storeName - 存储名称
   * @param {any} key - 键值
   */
  async delete(storeName, key) {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(key)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  },

  /**
   * 清空存储
   * @param {string} storeName - 存储名称
   */
  async clear(storeName) {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}
