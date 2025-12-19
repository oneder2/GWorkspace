<!--
  待办事项项组件
  单个待办事项的展示和操作
-->
<template>
  <div class="glass-card p-4 rounded-xl flex items-center gap-3 group">
    <!-- 完成复选框 -->
    <button 
      @click="$emit('toggle', todo.id)"
      class="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0"
      :class="todo.completed 
        ? 'bg-green-500 dark:bg-green-600 border-green-500 dark:border-green-600' 
        : 'border-slate-300 dark:border-slate-600 hover:border-green-500 dark:hover:border-green-400'"
    >
      <svg v-if="todo.completed" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </button>

    <!-- 待办内容 -->
    <div class="flex-1 min-w-0">
      <input 
        v-if="isEditing"
        v-model="editText"
        @blur="finishEdit"
        @keyup.enter="finishEdit"
        @keyup.esc="cancelEdit"
        class="w-full bg-transparent border-b border-green-500 dark:border-green-400 outline-none text-slate-800 dark:text-slate-200"
        ref="editInput"
      >
      <div 
        v-else
        @dblclick="startEdit"
        class="text-slate-700 dark:text-slate-300 cursor-text"
        :class="todo.completed ? 'line-through opacity-50' : ''"
      >
        {{ todo.text }}
      </div>
      <div class="flex items-center gap-2 mt-1">
        <span 
          class="text-xs px-2 py-0.5 rounded-full font-bold"
          :class="priorityColors[todo.priority]"
        >
          {{ $t(`todo.priority.${todo.priority}`) }}
        </span>
        <span class="text-xs text-slate-400 dark:text-slate-500">
          {{ formatDate(todo.createdAt) }}
        </span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button 
        @click="startEdit"
        class="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 transition-colors"
        :title="$t('todo.edit')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <button 
        @click="$emit('remove', todo.id)"
        class="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 transition-colors"
        :title="$t('todo.delete')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  todo: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['toggle', 'remove', 'update'])

const { t } = useI18n()

const isEditing = ref(false)
const editText = ref('')
const editInput = ref(null)

/**
 * 优先级颜色映射
 */
const priorityColors = {
  low: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
  high: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
}

/**
 * 开始编辑
 */
const startEdit = () => {
  isEditing.value = true
  editText.value = props.todo.text
  nextTick(() => {
    editInput.value?.focus()
  })
}

/**
 * 完成编辑
 */
const finishEdit = () => {
  if (editText.value.trim()) {
    emit('update', props.todo.id, { text: editText.value.trim() })
  }
  isEditing.value = false
}

/**
 * 取消编辑
 */
const cancelEdit = () => {
  isEditing.value = false
  editText.value = props.todo.text
}

/**
 * 格式化日期
 */
const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return t('todo.today')
  if (days === 1) return t('todo.yesterday')
  if (days < 7) return t('todo.daysAgo', { days })
  return date.toLocaleDateString()
}
</script>
