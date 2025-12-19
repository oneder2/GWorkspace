/**
 * 待办事项 Composable
 * 提供待办事项的增删改查功能
 */

import { ref, computed } from 'vue'
import { useLocalStorage } from './useStorage'

/**
 * 使用待办事项
 * @returns {object} 待办事项相关的方法和状态
 */
export function useTodo() {
  // 从存储加载待办事项，确保始终是数组
  // useLocalStorage 返回 { value: ref, update, reset }
  // 所以 todos.value 就是 ref，todos.value.value 才是数组
  const todosStorage = useLocalStorage('todos', [])
  // 直接使用 todosStorage.value，它已经是 ref 了
  const todos = todosStorage.value
  
  /**
   * 获取安全的待办事项数组
   */
  const getTodosArray = () => {
    // todos 本身已经是 ref，所以直接访问 todos.value
    const value = todos.value
    console.log('[useTodo] getTodosArray, todos.value type:', typeof value, 'isArray:', Array.isArray(value), 'value:', value)
    // 检查是否是数组（包括 Proxy 包装的数组）
    if (!value) {
      return []
    }
    // Proxy 数组也会通过 Array.isArray 检查
    if (Array.isArray(value)) {
      return value
    }
    // 如果不是数组，尝试转换为数组
    if (value && typeof value === 'object' && 'length' in value) {
      return Array.from(value)
    }
    return []
  }
  
  // 确保初始值是数组
  if (!Array.isArray(todos.value)) {
    todosStorage.update([])
  }
  
  /**
   * 添加待办事项
   * @param {string} text - 待办事项文本
   * @param {string} priority - 优先级（low, medium, high）
   */
  const addTodo = (text, priority = 'medium') => {
    console.log('[useTodo] addTodo called with:', { text, priority })
    const newTodo = {
      id: Date.now(),
      text,
      completed: false,
      priority,
      createdAt: new Date().toISOString()
    }
    // 使用 getTodosArray() 获取当前数组，确保类型安全
    const currentTodos = getTodosArray()
    console.log('[useTodo] Current todos before add:', currentTodos)
    const updatedTodos = [...currentTodos, newTodo]
    console.log('[useTodo] Updated todos:', updatedTodos)
    todosStorage.update(updatedTodos)
    // 等待下一个 tick 后检查值
    setTimeout(() => {
      console.log('[useTodo] After update (next tick), todos.value:', todos.value)
    }, 0)
  }

  /**
   * 删除待办事项
   * @param {number} id - 待办事项ID
   */
  const removeTodo = (id) => {
    todosStorage.update(getTodosArray().filter(todo => todo.id !== id))
  }

  /**
   * 切换完成状态
   * @param {number} id - 待办事项ID
   */
  const toggleTodo = (id) => {
    todosStorage.update(getTodosArray().map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  /**
   * 更新待办事项
   * @param {number} id - 待办事项ID
   * @param {object} updates - 更新的字段
   */
  const updateTodo = (id, updates) => {
    todosStorage.update(getTodosArray().map(todo => 
      todo.id === id ? { ...todo, ...updates } : todo
    ))
  }

  /**
   * 清空已完成
   */
  const clearCompleted = () => {
    todosStorage.update(getTodosArray().filter(todo => !todo.completed))
  }

  /**
   * 未完成的待办事项
   */
  const activeTodos = computed(() => {
    // 使用 getTodosArray() 确保类型安全
    const todosArray = getTodosArray()
    console.log('[useTodo] activeTodos computed, todosArray:', todosArray, 'length:', todosArray.length)
    const filtered = todosArray.filter(todo => {
      const isActive = !todo.completed
      console.log('[useTodo] Filtering todo:', todo.text, 'completed:', todo.completed, 'isActive:', isActive)
      return isActive
    })
    console.log('[useTodo] activeTodos filtered result:', filtered, 'length:', filtered.length)
    return filtered
  })

  /**
   * 已完成的待办事项
   */
  const completedTodos = computed(() => {
    const todosArray = getTodosArray()
    return todosArray.filter(todo => todo.completed)
  })

  return {
    todos,
    addTodo,
    removeTodo,
    toggleTodo,
    updateTodo,
    clearCompleted,
    activeTodos,
    completedTodos
  }
}
