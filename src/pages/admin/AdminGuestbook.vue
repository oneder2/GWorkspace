<!--
  留言板管理页面
  显示所有留言，支持删除（软删除）
-->
<template>
  <div class="space-y-6">
    <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200">{{ $t('admin.guestbook') }}</h2>

    <!-- 留言列表 -->
    <div class="glass-card rounded-2xl overflow-hidden">
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
          class="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <span class="font-semibold text-slate-800 dark:text-slate-200">{{ message.author_name || $t('common.anonymous') }}</span>
                <span class="text-xs text-slate-500 dark:text-slate-400">{{ formatDate(message.created_at) }}</span>
                <span
                  v-if="message.status === 'deleted'"
                  class="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400"
                >
                  {{ $t('admin.deleted') }}
                </span>
                <span
                  v-else-if="message.status === 'approved'"
                  class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                >
                  {{ $t('admin.approved') }}
                </span>
                <span
                  v-else-if="message.status === 'pending'"
                  class="px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                >
                  {{ $t('admin.pending') }}
                </span>
              </div>
              <p v-if="message.status === 'deleted'" class="text-slate-400 dark:text-slate-500 italic">
                {{ $t('admin.messageDeleted') }}
              </p>
              <p v-else class="text-slate-700 dark:text-slate-300 mb-2 whitespace-pre-wrap">{{ message.content }}</p>
              <p v-if="message.author_email" class="text-xs text-slate-500 dark:text-slate-400">
                {{ message.author_email }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <button
                v-if="message.status !== 'deleted'"
                @click="deleteMessage(message.id)"
                class="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
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
import { guestbookApi } from '../../utils/api'

const { t } = useI18n()

const messages = ref([])
const isLoading = ref(false)

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
    messages.value = await guestbookApi.getList({ status: 'all' })
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

