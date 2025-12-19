/**
 * 存储 Composable
 * 提供响应式的数据持久化功能
 * 自动同步数据到 localStorage 或 IndexedDB
 */

import { ref, watch } from 'vue'
import { localStorage as ls, indexedDB as idb } from '../utils/storage'

/**
 * 使用 localStorage 的响应式存储
 * 适用于简单配置数据
 * 
 * @param {string} key - 存储键名
 * @param {any} defaultValue - 默认值
 * @param {object} options - 配置选项
 * @param {boolean} options.sync - 是否自动同步（默认true）
 * @returns {object} 包含 value 和 update 方法的对象
 */
export function useLocalStorage(key, defaultValue = null, options = {}) {
  const { sync = true } = options
  
  // 从存储中读取初始值
  const storedValue = ls.get(key, defaultValue)
  // 确保默认值类型正确
  let initialValue = storedValue
  if (initialValue === null || initialValue === undefined) {
    initialValue = defaultValue
  }
  // 如果默认值是数组，确保存储的值也是数组
  if (Array.isArray(defaultValue) && !Array.isArray(initialValue)) {
    initialValue = defaultValue
  }
  const value = ref(initialValue)

  // 自动同步到存储
  let isUpdating = false
  if (sync) {
    watch(value, (newValue) => {
      // 如果正在手动更新，跳过 watch（避免重复保存）
      if (isUpdating) {
        isUpdating = false
        return
      }
      console.log(`[useLocalStorage] Watch triggered, saving to ${key}:`, newValue)
      ls.set(key, newValue)
    }, { deep: true })
  }

  /**
   * 手动更新值
   * @param {any} newValue - 新值
   */
  const update = (newValue) => {
    console.log(`[useLocalStorage] Updating ${key}:`, newValue)
    isUpdating = true
    // 先更新响应式值
    value.value = newValue
    // 立即同步到存储（不依赖 watch）
    ls.set(key, newValue)
    console.log(`[useLocalStorage] After update, value.value:`, value.value)
  }

  /**
   * 重置为默认值
   */
  const reset = () => {
    value.value = defaultValue
    ls.remove(key)
  }

  return {
    value,
    update,
    reset
  }
}

/**
 * 使用 IndexedDB 的响应式存储
 * 适用于大量数据或复杂结构
 * 
 * @param {string} storeName - 存储名称
 * @param {string} key - 数据键名（可选，用于单条数据）
 * @param {any} defaultValue - 默认值
 * @returns {object} 包含 value、load、save 方法的对象
 */
export function useIndexedDB(storeName, key = null, defaultValue = null) {
  const value = ref(defaultValue)
  const loading = ref(false)
  const error = ref(null)

  /**
   * 加载数据
   */
  const load = async () => {
    loading.value = true
    error.value = null
    try {
      if (key) {
        const data = await idb.get(storeName, key)
        value.value = data || defaultValue
      } else {
        const data = await idb.getAll(storeName)
        value.value = data || defaultValue
      }
    } catch (err) {
      error.value = err
      console.error('Failed to load from IndexedDB:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 保存数据
   * @param {any} data - 要保存的数据（可选，默认使用当前value）
   */
  const save = async (data = null) => {
    loading.value = true
    error.value = null
    try {
      const dataToSave = data !== null ? data : value.value
      if (key && typeof dataToSave === 'object') {
        await idb.put(storeName, { ...dataToSave, id: key })
      } else {
        await idb.put(storeName, dataToSave)
      }
    } catch (err) {
      error.value = err
      console.error('Failed to save to IndexedDB:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除数据
   */
  const remove = async () => {
    if (!key) return
    loading.value = true
    error.value = null
    try {
      await idb.delete(storeName, key)
      value.value = defaultValue
    } catch (err) {
      error.value = err
      console.error('Failed to delete from IndexedDB:', err)
    } finally {
      loading.value = false
    }
  }

  // 自动加载
  load()

  return {
    value,
    loading,
    error,
    load,
    save,
    remove
  }
}
