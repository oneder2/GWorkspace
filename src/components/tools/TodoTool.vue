<!--
  待办事项工具组件
  提供待办事项的增删改查功能
  支持显示已完成和未完成的待办事项
-->
<template>
  <div class="h-full">
    <div class="max-w-4xl mx-auto">
      <!-- 标题和操作栏 -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200">{{ $t('todo.title') }}</h2>
        <button 
          v-if="completedTodos.length > 0"
          @click="clearCompleted"
          class="text-sm text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors px-3 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          {{ $t('todo.clearCompleted') }}
        </button>
      </div>

      <!-- 添加待办事项 -->
      <div class="glass-card p-4 rounded-xl mb-6">
        <div class="flex gap-2">
          <label for="new-todo-text" class="sr-only">{{ $t('todo.addPlaceholder') }}</label>
          <input 
            id="new-todo-text"
            name="new-todo-text"
            v-model="newTodoText"
            @keyup.enter="addTodo"
            type="text"
            :placeholder="$t('todo.addPlaceholder')"
            class="flex-1 bg-transparent border-b border-slate-300 dark:border-slate-600 focus:border-green-500 dark:focus:border-green-400 outline-none text-slate-800 dark:text-slate-200"
          >
          <label for="new-todo-priority" class="sr-only">{{ $t('todo.priority.medium') }}</label>
          <select 
            id="new-todo-priority"
            name="new-todo-priority"
            v-model="newTodoPriority"
            class="bg-transparent border-b border-slate-300 dark:border-slate-600 focus:border-green-500 dark:focus:border-green-400 outline-none text-slate-600 dark:text-slate-400 text-sm"
          >
            <option value="low">{{ $t('todo.priority.low') }}</option>
            <option value="medium">{{ $t('todo.priority.medium') }}</option>
            <option value="high">{{ $t('todo.priority.high') }}</option>
          </select>
          <button 
            @click="addTodo"
            class="px-4 py-2 bg-green-500 dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-700 transition-colors font-bold"
          >
            {{ $t('common.save') }}
          </button>
        </div>
      </div>

      <!-- 未完成的待办事项 -->
      <div v-if="activeTodos.length > 0" class="mb-6">
        <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3">{{ $t('todo.active') }}</h3>
        <div class="space-y-2">
          <TodoItem 
            v-for="todo in activeTodos" 
            :key="todo.id"
            :todo="todo"
            @toggle="toggleTodo"
            @remove="removeTodo"
            @update="updateTodo"
          />
        </div>
      </div>

      <!-- 已完成的待办事项 -->
      <div v-if="completedTodos.length > 0">
        <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3">{{ $t('todo.completed') }}</h3>
        <div class="space-y-2">
          <TodoItem 
            v-for="todo in completedTodos" 
            :key="todo.id"
            :todo="todo"
            @toggle="toggleTodo"
            @remove="removeTodo"
            @update="updateTodo"
          />
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="activeTodos.length === 0 && completedTodos.length === 0" class="text-center py-20 text-slate-400 dark:text-slate-500">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-16 h-16 mx-auto mb-4 opacity-50">
          <path d="M9 11l3 3L22 4"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/>
        </svg>
        <p>{{ $t('todo.noTodos') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useTodo } from '../../composables/useTodo'
import TodoItem from '../TodoItem.vue'

// 待办事项
const { todos, addTodo: addTodoItem, removeTodo, toggleTodo, updateTodo, clearCompleted, activeTodos, completedTodos } = useTodo()
const newTodoText = ref('')
const newTodoPriority = ref('medium')

/**
 * 添加待办事项
 */
const addTodo = () => {
  const text = newTodoText.value.trim()
  const priority = newTodoPriority.value
  if (text) {
    addTodoItem(text, priority)
    newTodoText.value = ''
    newTodoPriority.value = 'medium'
  }
}
</script>

