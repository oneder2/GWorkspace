<!--
  留言板管理页面
  显示所有留言，支持删除（软删除）
-->
<template>
  <div class="space-y-6">
    <div class="admin-panel rounded-[24px] overflow-hidden">
      <div class="admin-toolbar flex-col sm:flex-row sm:items-end">
        <div class="space-y-2">
          <span class="section-kicker">{{ $t('admin.community') }}</span>
          <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200">{{ $t('admin.guestbook') }}</h2>
          <p class="text-sm text-secondary">{{ $t('admin.guestbookCopy') }}</p>
        </div>
      </div>
    </div>

    <div class="admin-panel rounded-[24px] overflow-hidden">
      <div v-if="isLoading" class="p-8 text-center text-slate-500 dark:text-slate-400">
        {{ $t('common.loading') }}
      </div>
      <div v-else-if="messages.length === 0" class="p-8 text-center text-slate-500 dark:text-slate-400">
        {{ $t('admin.noGuestbookMessages') }}
      </div>
      <div v-else class="divide-y divide-slate-200 dark:divide-slate-700">
        <div
          v-for="message in messages"
          :key="message.id"
          class="p-5 sm:p-6 hover:bg-white/20 dark:hover:bg-white/5 transition-colors"
        >
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div class="flex-1 min-w-0 space-y-3">
              <div class="flex flex-wrap items-center gap-2.5">
                <span class="font-semibold text-slate-800 dark:text-slate-200">
                  {{ message.user_id === null ? $t('auth.deletedUser') : (message.author_name || $t('common.anonymous')) }}
                </span>
                <span class="text-xs text-slate-500 dark:text-slate-400">{{ formatDate(message.created_at) }}</span>
                <span class="status-pill" :class="getStatusClass(message.status)">
                  {{ getStatusLabel(message.status) }}
                </span>
              </div>
              <p v-if="message.status === 'deleted'" class="text-slate-400 dark:text-slate-500 italic">
                {{ $t('admin.messageDeleted') }}
              </p>
              <p v-else class="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-7">{{ message.content }}</p>
              <p v-if="message.author_email" class="text-xs text-slate-500 dark:text-slate-400">
                {{ message.author_email }}
              </p>
            </div>
            <div class="flex items-center gap-2 lg:pl-4">
              <button
                v-if="message.status !== 'deleted'"
                @click="deleteMessage(message.id)"
                class="action-btn px-4 py-2 text-sm text-white bg-rose-600 hover:bg-rose-700"
              >
                {{ $t('admin.delete') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { adminApi, guestbookApi } from '../../utils/api'

const { t } = useI18n()

const messages = ref([])
const isLoading = ref(false)

const getStatusClass = (status) => {
  if (status === 'approved') return 'status-pill-success'
  if (status === 'deleted') return 'status-pill-danger'
  return 'status-pill-warm'
}

const getStatusLabel = (status) => {
  if (status === 'deleted') return t('admin.deleted')
  if (status === 'approved') return t('admin.approved')
  return t('admin.pending')
}

/**
 * 格式化日期
 */
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return t('common.justNow')
  if (minutes < 60) return t('common.minutesAgo', { minutes })
  if (hours < 24) return t('common.hoursAgo', { hours })
  if (days < 7) return t('common.daysAgo', { days })
  
  return date.toLocaleDateString()
}

/**
 * 加载所有留言（包括已删除的）
 */
const loadMessages = async () => {
  isLoading.value = true
  try {
    messages.value = await adminApi.getGuestbook({ status: 'all' })
  } catch (error) {
    console.error('Failed to load guestbook messages:', error)
    messages.value = []
  } finally {
    isLoading.value = false
  }
}

/**
 * 删除留言
 */
const deleteMessage = async (id) => {
  if (!confirm(t('admin.confirmDelete'))) {
    return
  }

  try {
    await guestbookApi.delete(id)
    await loadMessages()
  } catch (error) {
    console.error('Failed to delete message:', error)
    alert(error.message || t('admin.deleteFailed'))
  }
}

onMounted(() => {
  loadMessages()
})
</script>
