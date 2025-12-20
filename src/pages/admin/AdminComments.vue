<!--
  评论管理页面
  显示所有评论，支持审核、删除、标记垃圾
-->
<template>
  <div class="space-y-6">
    <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200">{{ $t('admin.comments') }}</h2>

    <!-- 评论列表 -->
    <div class="glass-card rounded-2xl overflow-hidden">
      <div v-if="isLoading" class="p-8 text-center text-slate-500 dark:text-slate-400">
        {{ $t('common.loading') }}
      </div>
      <div v-else-if="comments.length === 0" class="p-8 text-center text-slate-500 dark:text-slate-400">
        {{ $t('admin.noComments') }}
      </div>
      <div v-else class="divide-y divide-slate-200 dark:divide-slate-700">
        <div
          v-for="comment in comments"
          :key="comment.id"
          class="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <span class="font-semibold text-slate-800 dark:text-slate-200">{{ comment.author_name }}</span>
                <span class="text-xs text-slate-500 dark:text-slate-400">{{ comment.created_at }}</span>
                <span
                  class="px-2 py-1 text-xs font-semibold rounded-full"
                  :class="comment.status === 'approved'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    : comment.status === 'spam'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'"
                >
                  {{ comment.status }}
                </span>
              </div>
              <p class="text-slate-700 dark:text-slate-300 mb-2">{{ comment.content }}</p>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                {{ $t('admin.blogId') }}: {{ comment.blog_id }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <button
                v-if="comment.status !== 'approved'"
                @click="approveComment(comment.id)"
                class="px-3 py-1 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                {{ $t('admin.approve') }}
              </button>
              <button
                v-if="comment.status !== 'spam'"
                @click="markSpam(comment.id)"
                class="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                {{ $t('admin.markSpam') }}
              </button>
              <button
                @click="deleteComment(comment.id)"
                class="px-3 py-1 text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
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
import { commentsApi } from '../../utils/api'

const { t } = useI18n()

const comments = ref([])
const isLoading = ref(false)

/**
 * 加载所有评论
 */
const loadComments = async () => {
  isLoading.value = true
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE_URL}/admin/comments`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (!response.ok) throw new Error('Failed to fetch comments')
    comments.value = await response.json()
  } catch (error) {
    console.error('Failed to load comments:', error)
    comments.value = []
  } finally {
    isLoading.value = false
  }
}

/**
 * 批准评论
 */
const approveComment = async (id) => {
  try {
    await commentsApi.update(id, { status: 'approved' })
    await loadComments()
  } catch (error) {
    console.error('Failed to approve comment:', error)
  }
}

/**
 * 标记为垃圾
 */
const markSpam = async (id) => {
  try {
    await commentsApi.update(id, { status: 'spam' })
    await loadComments()
  } catch (error) {
    console.error('Failed to mark spam:', error)
  }
}

/**
 * 删除评论
 */
const deleteComment = async (id) => {
  if (!confirm(t('admin.confirmDelete'))) {
    return
  }

  try {
    await commentsApi.delete(id)
    await loadComments()
  } catch (error) {
    console.error('Failed to delete comment:', error)
  }
}

onMounted(() => {
  loadComments()
})
</script>

