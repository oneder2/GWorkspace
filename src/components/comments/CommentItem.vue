<template>
  <div :id="`comment-${comment.id}`" class="group">
    <div class="flex gap-3 sm:gap-4">
      <!-- Avatar -->
      <div 
        class="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-sm"
        :style="{ backgroundColor: avatarColor }"
      >
        {{ firstLetter }}
      </div>

      <!-- Content -->
      <div class="flex-grow min-w-0">
        <div class="bg-white/40 dark:bg-slate-800/40 rounded-xl p-3 sm:p-4 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors">
          <!-- Header -->
          <div class="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <div class="flex items-center gap-2">
              <span class="font-bold text-slate-800 dark:text-slate-200 text-sm sm:text-base">
                {{ comment.author_name }}
              </span>
              <span 
                v-if="comment.user_id === 1" 
                class="px-1.5 py-0.5 bg-[var(--theme-primary)] text-white text-[10px] rounded uppercase font-bold"
              >
                Admin
              </span>
            </div>
            <time class="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
              {{ formattedDate }}
            </time>
          </div>

          <!-- Body -->
          <div class="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap break-words">
            {{ comment.content }}
          </div>

          <!-- Footer Actions -->
          <div class="mt-2 flex items-center gap-4">
            <button 
              @click="showReplyForm = !showReplyForm"
              class="text-xs font-medium text-slate-500 hover:text-[var(--theme-primary)] dark:text-slate-400 dark:hover:text-[var(--theme-primary)] transition-colors flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {{ showReplyForm ? $t('common.cancel') : $t('blog.reply') }}
            </button>
          </div>
        </div>

        <!-- Reply Form -->
        <div v-if="showReplyForm" class="mt-3 animate-fade-in">
          <CommentForm 
            :blog-id="comment.blog_id" 
            :parent-id="comment.id"
            @success="handleReplySuccess"
            @cancel="showReplyForm = false"
          />
        </div>

        <!-- Nested Replies -->
        <div v-if="comment.replies && comment.replies.length > 0" class="mt-4 pl-4 sm:pl-6 border-l-2 border-slate-100 dark:border-slate-700/50 space-y-4">
          <CommentItem 
            v-for="reply in comment.replies" 
            :key="reply.id" 
            :comment="reply"
            @reply-added="$emit('reply-added', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import CommentForm from './CommentForm.vue'

// Recursive component definition
defineOptions({
  name: 'CommentItem'
})

const props = defineProps({
  comment: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['reply-added'])

const { locale } = useI18n()
const showReplyForm = ref(false)

const firstLetter = computed(() => {
  return (props.comment.author_name || '?').charAt(0).toUpperCase()
})

// Generate a consistent color based on the name
const avatarColor = computed(() => {
  const colors = [
    '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4', 
    '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#64748B'
  ]
  let hash = 0
  const name = props.comment.author_name || ''
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash % colors.length)
  return colors[index]
})

const formattedDate = computed(() => {
  try {
    const date = new Date(props.comment.created_at)
    return new Intl.DateTimeFormat(locale.value, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  } catch (e) {
    return props.comment.created_at
  }
})

const handleReplySuccess = (newReply) => {
  showReplyForm.value = false
  // Ideally, we should emit an event to refresh the list or add the reply locally
  // Here we emit upwards to the parent (CommentList or CommentItem)
  emit('reply-added', newReply)
}
</script>
