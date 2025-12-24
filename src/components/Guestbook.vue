<!--
  留言板组件
  显示留言列表和提交表单
-->
<template>
  <div class="glass-card p-6 rounded-2xl h-full flex flex-col">
    <div class="mb-6">
      <h3 class="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">
        {{ $t('blog.guestbookTitle') }}
      </h3>
      <p class="text-sm text-slate-600 dark:text-slate-400">
        {{ $t('blog.guestbookSubtitle') }}
      </p>
    </div>

    <!-- 留言表单 -->
    <div class="mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
      <!-- 未登录提示 -->
      <div v-if="!user" class="text-center py-8">
        <p class="text-sm text-slate-600 dark:text-slate-400 mb-4">
          {{ $t('blog.guestbookLoginRequired') }}
        </p>
        <button
          @click="handleShowLogin"
          class="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style="background: linear-gradient(to right, var(--theme-primary), var(--theme-primary-emerald)); color: white;"
        >
          {{ $t('auth.login') }}
        </button>
      </div>
      
      <!-- 已登录表单 -->
      <div v-else class="space-y-3">
        <div class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span>{{ $t('blog.guestbookPostingAs') }}: <strong class="text-slate-800 dark:text-slate-200">{{ user.username }}</strong></span>
        </div>
        <textarea
          v-model="formData.content"
          :placeholder="$t('blog.guestbookPlaceholder')"
          rows="4"
          class="glass-input w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all resize-none"
          style="--focus-ring: color-mix(in srgb, var(--theme-primary) 50%, transparent);"
          @focus="$event.currentTarget.style.setProperty('--tw-ring-color', 'var(--focus-ring)')"
        ></textarea>
        <button
          @click="submitMessage"
          :disabled="!formData.content || formData.content.trim().length === 0 || isSubmitting"
          class="w-full px-4 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          :class="(!formData.content || formData.content.trim().length === 0 || isSubmitting) ? 'text-slate-400' : 'text-white'"
          style="background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-emerald)); border: 2px solid rgba(255, 255, 255, 0.2);"
          @mouseenter="handleButtonHover"
          @mouseleave="handleButtonLeave"
        >
          {{ isSubmitting ? $t('common.submitting') : $t('blog.guestbookSubmit') }}
        </button>
      </div>
    </div>

    <!-- 留言规范 -->
    <div class="mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
      <h4 class="text-sm font-bold mb-3 text-slate-800 dark:text-slate-200">
        {{ $t('blog.guestbookRules') }}
      </h4>
      <ul class="space-y-2 text-xs text-slate-600 dark:text-slate-400">
        <li class="flex items-start gap-2">
          <span class="text-slate-400 dark:text-slate-500">•</span>
          <span>{{ $t('blog.guestbookRule1') }}</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-slate-400 dark:text-slate-500">•</span>
          <span>{{ $t('blog.guestbookRule2') }}</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-slate-400 dark:text-slate-500">•</span>
          <span>{{ $t('blog.guestbookRule3') }}</span>
        </li>
      </ul>
    </div>

    <!-- 留言列表 -->
    <div class="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
      <div
        v-for="message in messages"
        :key="message.id"
        class="p-4 rounded-lg bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm border border-white/50 dark:border-slate-700/50"
      >
        <div class="flex items-start justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {{ message.author_name || $t('common.anonymous') }}
            </span>
            <span class="text-xs text-slate-400 dark:text-slate-500">
              {{ formatDate(message.created_at) }}
            </span>
          </div>
        </div>
        <p v-if="message.status === 'deleted'" class="text-sm text-slate-400 dark:text-slate-500 italic">
          {{ $t('admin.messageDeleted') }}
        </p>
        <p v-else class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
          {{ message.content }}
        </p>
      </div>
      <div v-if="messages.length === 0" class="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
        {{ $t('common.noData') }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../composables/useAuth'
import { guestbookApi } from '../utils/api'

const { t } = useI18n()
const { user } = useAuth()

const messages = ref([])
const formData = ref({
  content: ''
})
const isSubmitting = ref(false)
const showLoginModal = ref(false)

// 监听登录状态变化
const emit = defineEmits(['show-login'])

// 当需要登录时，触发父组件显示登录弹窗
const handleShowLogin = () => {
  emit('show-login')
  showLoginModal.value = true
}

/**
 * 加载留言列表
 */
const loadMessages = async () => {
  try {
    const data = await guestbookApi.getList({
      status: 'approved',
      limit: 20,
      sortBy: 'created_at',
      sortOrder: 'desc'
    })
    messages.value = data || []
  } catch (error) {
    console.error('Failed to load guestbook messages:', error)
  }
}

/**
 * 提交留言
 */
const submitMessage = async () => {
  // 检查是否已登录
  if (!user.value) {
    handleShowLogin()
    return
  }

  if (!formData.value.content || !formData.value.content.trim()) {
    return
  }

  isSubmitting.value = true
  try {
    const newMessage = await guestbookApi.create({
      content: formData.value.content.trim()
    })

    // 添加到列表顶部
    messages.value.unshift(newMessage)

    // 清空表单
    formData.value = {
      content: ''
    }
  } catch (error) {
    console.error('Failed to submit message:', error)
    const errorMessage = error.response?.data?.error || error.message || t('common.submitError')
    alert(errorMessage)
  } finally {
    isSubmitting.value = false
  }
}

/**
 * 格式化日期
 * @param {string} dateStr - 日期字符串
 * @returns {string} 格式化后的日期
 */
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return t('common.justNow')
  if (minutes < 60) return `${minutes}${t('common.minutesAgo')}`
  if (hours < 24) return `${hours}${t('common.hoursAgo')}`
  if (days < 7) return `${days}${t('common.daysAgo')}`

  return date.toLocaleDateString()
}

/**
 * 处理按钮悬停效果
 */
const handleButtonHover = (event) => {
  const el = event?.currentTarget
  if (el && !el.disabled) {
    el.style.transform = 'translateY(-1px)'
    el.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.2)'
  }
}

/**
 * 处理按钮离开效果
 */
const handleButtonLeave = (event) => {
  const el = event?.currentTarget
  if (el && !el.disabled) {
    el.style.transform = ''
    el.style.boxShadow = ''
  }
}

// 初始化时加载留言
onMounted(() => {
  loadMessages()
})
</script>

