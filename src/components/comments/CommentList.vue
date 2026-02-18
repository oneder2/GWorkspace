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
    <div v-if="loading" class="py-6">
      <CommentSkeleton />
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
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { commentsApi } from '../../utils/api'
import CommentForm from './CommentForm.vue'
import CommentItem from './CommentItem.vue'
import CommentSkeleton from './CommentSkeleton.vue'

const props = defineProps({
  blogId: {
    type: Number,
    required: true
  }
})

const loading = ref(true)
const comments = ref([])
const hasLoaded = ref(false)
const containerRef = ref(null)
let observer = null

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
  if (!props.blogId || hasLoaded.value) return
  
  loading.value = true
  try {
    comments.value = await commentsApi.getList(props.blogId)
    hasLoaded.value = true
  } catch (error) {
    console.error('Failed to fetch comments:', error)
  } finally {
    loading.value = false
  }
}

const handleCommentAdded = (newComment) => {
  if (!newComment.parent_id) {
    comments.value.push({ ...newComment, replies: [] })
  } else {
    // 强制重新抓取以获取嵌套结构
    hasLoaded.value = false
    fetchComments()
  }
}

const refreshComments = () => {
  hasLoaded.value = false
  fetchComments()
}

// 监听进入视口事件
onMounted(() => {
  const element = document.getElementById('comments')
  if (element) {
    observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        fetchComments()
        observer.disconnect()
      }
    }, { threshold: 0.1 })
    observer.observe(element)
  }
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})

watch(() => props.blogId, (newId) => {
  if (newId) {
    hasLoaded.value = false
    // 如果已经在视口中，直接加载
    const element = document.getElementById('comments')
    if (element) {
      const rect = element.getBoundingClientRect()
      if (rect.top < window.innerHeight) {
        fetchComments()
      }
    }
  }
})
</script>
