<!--
  评论管理页面
  显示所有评论，支持审核、删除、标记垃圾
-->
<template>
  <div class="space-y-6">
    <div class="admin-panel rounded-[24px] overflow-hidden">
      <div class="admin-toolbar flex-col sm:flex-row sm:items-end">
        <div class="space-y-2">
          <span class="section-kicker">Moderation</span>
          <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200">{{ $t('admin.comments') }}</h2>
          <p class="text-sm text-secondary">Review, approve, or remove discussion without leaving the queue.</p>
        </div>
      </div>
    </div>

    <div class="admin-panel rounded-[24px] overflow-hidden">
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
          class="p-5 sm:p-6 hover:bg-white/20 dark:hover:bg-white/5 transition-colors"
        >
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div class="flex-1 min-w-0 space-y-3">
              <div class="flex flex-wrap items-center gap-2.5">
                <span class="font-semibold text-slate-800 dark:text-slate-200">
                  {{ comment.user_id === null ? $t('auth.deletedUser') : comment.author_name }}
                </span>
                <span class="status-pill" :class="getStatusClass(comment.status)">
                  {{ comment.status }}
                </span>
                <span class="text-xs text-slate-500 dark:text-slate-400">{{ comment.created_at }}</span>
                <span class="text-xs text-slate-500 dark:text-slate-400">{{ $t('admin.blogId') }}: {{ comment.blog_id }}</span>
              </div>
              <p class="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-7">{{ comment.content }}</p>
            </div>
            <div class="flex flex-wrap items-center gap-2 lg:pl-4">
              <button
                v-if="comment.status !== 'approved'"
                @click="approveComment(comment.id)"
                class="action-btn px-4 py-2 text-sm text-white bg-emerald-600 hover:bg-emerald-700"
              >
                {{ $t('admin.approve') }}
              </button>
              <button
                v-if="comment.status !== 'spam'"
                @click="markSpam(comment.id)"
                class="action-btn px-4 py-2 text-sm text-white bg-rose-600 hover:bg-rose-700"
              >
                {{ $t('admin.markSpam') }}
              </button>
              <button
                @click="deleteComment(comment.id)"
                class="action-btn action-btn-secondary px-4 py-2 text-sm"
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
import { adminApi, commentsApi } from '../../utils/api'

const { t } = useI18n()

const comments = ref([])
const isLoading = ref(false)

const getStatusClass = (status) => {
  if (status === 'approved') return 'status-pill-success'
  if (status === 'spam') return 'status-pill-danger'
  return 'status-pill-neutral'
}

/**
 * 加载所有评论
 */
const loadComments = async () => {
  isLoading.value = true
  try {
    comments.value = await adminApi.getComments()
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
