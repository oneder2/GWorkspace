<template>
  <div class="glass-card p-4 sm:p-6 rounded-xl transition-all duration-300">
    <h3 v-if="!parentId" class="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">
      {{ $t('blog.leaveComment') }}
    </h3>
    
    <!-- User Logged In: Show Comment Form -->
    <form v-if="user" @submit.prevent="submitComment" class="space-y-4">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs"
          style="background: linear-gradient(to right, var(--theme-primary), var(--theme-primary-darker));">
          {{ user.username.charAt(0).toUpperCase() }}
        </div>
        <span class="text-sm font-medium text-slate-700 dark:text-slate-300">{{ user.username }}</span>
      </div>

      <!-- Comment Content -->
      <div>
        <textarea 
          v-model="formData.content"
          required
          rows="3"
          class="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] transition-all resize-none text-sm"
          :placeholder="parentId ? $t('blog.commentPlaceholder') : $t('blog.commentPlaceholder')"
        ></textarea>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-between">
        <div v-if="error" class="text-xs text-red-500 font-medium">
          {{ error }}
        </div>
        <div v-else></div>
        
        <div class="flex gap-2">
          <button 
            v-if="parentId"
            type="button"
            @click="$emit('cancel')"
            class="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            {{ $t('common.cancel') }}
          </button>
          
          <button 
            type="submit"
            :disabled="loading || !formData.content.trim()"
            class="px-6 py-2 bg-[var(--theme-primary)] text-white text-sm font-medium rounded-lg hover:brightness-110 active:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {{ parentId ? $t('blog.reply') : $t('blog.submit') }}
          </button>
        </div>
      </div>
    </form>

    <!-- User Not Logged In: Show Login Prompt -->
    <div v-else class="py-6 text-center space-y-4">
      <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </div>
      <p class="text-slate-600 dark:text-slate-400 text-sm">
        {{ $t('blog.loginRequired') }}
      </p>
      <button 
        @click="showAuthModal = true"
        class="px-8 py-2.5 bg-[var(--theme-primary)] text-white text-sm font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[var(--theme-primary)]/20"
      >
        {{ $t('auth.login') }} / {{ $t('auth.register') }}
      </button>
    </div>

    <!-- Auth Modal Overlay -->
    <AuthModal 
      v-if="showAuthModal" 
      @close="showAuthModal = false"
      @success="handleAuthSuccess"
    />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useAuth } from '../../composables/useAuth'
import { commentsApi } from '../../utils/api'
import { useI18n } from 'vue-i18n'
import AuthModal from '../AuthModal.vue'

const props = defineProps({
  blogId: {
    type: Number,
    required: true
  },
  parentId: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['success', 'cancel'])

const { user } = useAuth()
const { t } = useI18n()

const loading = ref(false)
const error = ref('')
const showAuthModal = ref(false)

const formData = reactive({
  content: ''
})

const handleAuthSuccess = () => {
  showAuthModal.value = false
}

const submitComment = async () => {
  if (!user.value) {
    showAuthModal.value = true
    return
  }

  if (!formData.content.trim()) return

  loading.value = true
  error.value = ''
  
  try {
    const data = {
      content: formData.content
    }

    let response
    if (props.parentId) {
      response = await commentsApi.reply(props.parentId, data)
    } else {
      response = await commentsApi.create(props.blogId, data)
    }
    
    // Clear form
    formData.content = ''
    emit('success', response)
  } catch (err) {
    console.error('Failed to submit comment:', err)
    error.value = err.message || t('blog.submitError')
  } finally {
    loading.value = false
  }
}
</script>
