<template>
  <div class="mt-12 sm:mt-16" id="comments">
    <div class="flex items-center justify-between mb-8">
      <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        {{ $t('blog.comments') }}
        <span class="text-sm font-normal text-slate-500 ml-2">({{ totalComments }})</span>
      </h2>
    </div>

    <!-- Main Comment Form -->
    <div class="mb-10">
      <CommentForm :blog-id="blogId" @success="handleCommentAdded" />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 border-t-[var(--theme-primary)] rounded-full animate-spin"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="comments.length === 0" class="text-center py-12 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
      <div class="text-4xl mb-3 opacity-50">💬</div>
      <p class="text-slate-500 dark:text-slate-400 font-medium">{{ $t('blog.noComments') }}</p>
    </div>

    <!-- Comments List -->
    <div v-else class="space-y-6 sm:space-y-8">
      <CommentItem 
        v-for="comment in comments" 
        :key="comment.id" 
        :comment="comment"
        @reply-added="refreshComments"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { commentsApi } from '../../utils/api'
import CommentForm from './CommentForm.vue'
import CommentItem from './CommentItem.vue'

const props = defineProps({
  blogId: {
    type: Number,
    required: true
  }
})

const loading = ref(true)
const comments = ref([])

const totalComments = computed(() => {
  // Helper to count comments recursively
  const countRecursive = (list) => {
    let count = 0
    for (const item of list) {
      count++
      if (item.replies && item.replies.length > 0) {
        count += countRecursive(item.replies)
      }
    }
    return count
  }
  return countRecursive(comments.value)
})

const fetchComments = async () => {
  if (!props.blogId) return
  
  loading.value = true
  try {
    comments.value = await commentsApi.getList(props.blogId)
  } catch (error) {
    console.error('Failed to fetch comments:', error)
  } finally {
    loading.value = false
  }
}

const handleCommentAdded = (newComment) => {
  // For root comments, we can optimistically add it to the list
  // But since we need nested structure for replies, re-fetching is safer and simpler for now
  // Or we could append it if it's a root comment
  if (!newComment.parent_id) {
    comments.value.push({ ...newComment, replies: [] })
  } else {
    // For replies, just refresh to get correct nested structure
    fetchComments()
  }
}

const refreshComments = () => {
  fetchComments()
}

watch(() => props.blogId, (newId) => {
  if (newId) {
    fetchComments()
  }
}, { immediate: true })
</script>
