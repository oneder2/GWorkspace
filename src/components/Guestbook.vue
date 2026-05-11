<!--
  留言板组件
  显示留言列表和提交表单
-->
<template>
  <div class="guestbook-shell h-full min-h-0 rounded-[28px] p-5 flex flex-col">
    <div class="guestbook-header shrink-0">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <p class="guestbook-kicker">{{ $t('blog.guestbookStatus') }}</p>
          <div class="mt-2 flex items-center gap-2 min-w-0">
            <h3 class="text-2xl font-black text-main tracking-tight">
              {{ $t('blog.guestbookTitle') }}
            </h3>
            <div class="guestbook-rules-tooltip-wrap relative shrink-0">
              <button
                type="button"
                class="guestbook-rules-icon"
                :aria-label="$t('blog.guestbookRules')"
                :title="$t('blog.guestbookRules')"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                  <path d="M12 16v.01"/>
                  <path d="M12 13a3 3 0 1 0-3-3"/>
                  <path d="M12 3a9 9 0 1 0 9 9"/>
                </svg>
              </button>
              <div class="guestbook-rules-tooltip custom-scrollbar">
                <p class="text-xs font-bold text-main">{{ $t('blog.guestbookRules') }}</p>
                <ul class="mt-2 space-y-2 text-xs text-secondary leading-relaxed">
                  <li class="guestbook-rule-item">
                    <span class="guestbook-rule-dot"></span>
                    <span>{{ $t('blog.guestbookRule1') }}</span>
                  </li>
                  <li class="guestbook-rule-item">
                    <span class="guestbook-rule-dot"></span>
                    <span>{{ $t('blog.guestbookRule2') }}</span>
                  </li>
                  <li class="guestbook-rule-item">
                    <span class="guestbook-rule-dot"></span>
                    <span>{{ $t('blog.guestbookRule3') }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <p class="mt-2 text-sm text-secondary leading-relaxed">
            {{ $t('blog.guestbookSubtitle') }}
          </p>
        </div>
        <div class="guestbook-counter shrink-0">
          <span class="guestbook-counter-value">{{ totalCount }}</span>
          <span class="guestbook-counter-label">{{ $t('blog.guestbookCount') }}</span>
        </div>
      </div>
    </div>

    <!-- 留言表单 -->
    <div class="guestbook-compose shrink-0">
      <button
        v-if="!composerExpanded"
        @click="handleOpenComposer"
        class="guestbook-compose-trigger"
      >
        <span class="guestbook-compose-trigger-copy">
          <span class="guestbook-compose-trigger-title">{{ $t('blog.guestbookPlaceholder') }}</span>
          <span class="guestbook-compose-trigger-meta">
            {{ user ? `${$t('blog.guestbookPostingAs')} ${user.username}` : $t('blog.guestbookLoginRequired') }}
          </span>
        </span>
        <span class="guestbook-compose-trigger-action">{{ $t('common.expand') }}</span>
      </button>

      <div v-else class="space-y-3">
        <div v-if="!user" class="text-center py-3">
          <p class="text-sm text-secondary mb-4">
            {{ $t('blog.guestbookLoginRequired') }}
          </p>
          <button
            @click="handleShowLogin"
            class="guestbook-submit guestbook-login-btn px-4 py-2 rounded-xl text-sm font-bold transition-all"
          >
            {{ $t('auth.login') }}
          </button>
        </div>

        <template v-else>
          <div class="flex items-center justify-between gap-3 text-sm text-secondary mb-2">
            <div class="flex items-center gap-2 min-w-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 shrink-0">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span class="truncate">{{ $t('blog.guestbookPostingAs') }} <strong class="text-main">{{ user.username }}</strong></span>
            </div>
            <button
              @click="collapseComposer"
              class="guestbook-inline-action"
              type="button"
            >
              {{ $t('common.collapse') }}
            </button>
          </div>
          <textarea
            v-model="formData.content"
            :placeholder="$t('blog.guestbookPlaceholder')"
            rows="3"
            class="guestbook-textarea w-full px-3.5 py-3 rounded-2xl text-sm focus:outline-none transition-all resize-none"
          ></textarea>
          <div class="flex items-center gap-2">
            <button
              @click="submitMessage"
              :disabled="!formData.content || formData.content.trim().length === 0 || isSubmitting"
              class="guestbook-submit flex-1 px-4 py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isSubmitting ? $t('common.submitting') : $t('blog.guestbookSubmit') }}
            </button>
            <button
              @click="collapseComposer"
              type="button"
              class="guestbook-ghost-action"
            >
              {{ $t('common.cancel') }}
            </button>
          </div>
        </template>
      </div>
    </div>

    <!-- 留言列表 -->
    <div class="guestbook-stream flex-1 min-h-0">
      <div class="guestbook-stream-head">
        <div>
          <p class="text-sm font-bold text-main">{{ $t('blog.guestbookStreamTitle') }}</p>
          <p class="text-[11px] text-muted mt-1">{{ $t('blog.guestbookStreamHint') }}</p>
        </div>
        <span v-if="hasMore" class="guestbook-stream-chip">{{ messages.length }}/{{ totalCount }}</span>
      </div>

      <div
        ref="messageViewport"
        class="guestbook-stream-body custom-scrollbar"
        @scroll.passive="handleMessageScroll"
      >
        <div v-if="isLoading" class="guestbook-stream-state">
          {{ $t('common.loading') }}
        </div>

        <template v-else-if="messages.length > 0">
          <article
            v-for="message in messages"
            :key="message.id"
            class="guestbook-message"
          >
            <div class="flex items-start gap-3">
              <div class="guestbook-avatar" aria-hidden="true">
                {{ getMessageInitial(message.author_name) }}
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-3 mb-2">
                  <div class="min-w-0">
                    <span class="block text-sm font-bold text-main truncate">
                      {{ message.user_id === null ? $t('auth.deletedUser') : (message.author_name || $t('common.anonymous')) }}
                    </span>
                    <span class="text-[11px] text-muted">
                      {{ formatDate(message.created_at) }}
                    </span>
                  </div>
                </div>
                <p v-if="message.status === 'deleted'" class="text-sm text-muted italic">
                  {{ $t('admin.messageDeleted') }}
                </p>
                <p v-else class="text-sm text-secondary leading-relaxed whitespace-pre-wrap break-words">
                  {{ message.content }}
                </p>
              </div>
            </div>
          </article>

          <div v-if="isLoadingMore" class="guestbook-stream-state">
            {{ $t('common.loading') }}
          </div>

          <div v-else-if="!hasMore" class="guestbook-stream-state guestbook-stream-state-muted">
            {{ $t('blog.guestbookStreamEnd') }}
          </div>
        </template>

        <div v-else class="guestbook-stream-state guestbook-stream-state-muted">
          {{ $t('common.noData') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../composables/useAuth'
import { guestbookApi } from '../utils/api'

const { t } = useI18n()
const { user } = useAuth()

const messages = ref([])
const totalCount = ref(0)
const formData = ref({
  content: ''
})
const composerExpanded = ref(false)
const isLoading = ref(true)
const isSubmitting = ref(false)
const isLoadingMore = ref(false)
const hasMore = ref(true)
const messageViewport = ref(null)
const pageSize = 8

// 监听登录状态变化
const emit = defineEmits(['show-login'])

// 当需要登录时，触发父组件显示登录弹窗
const handleShowLogin = () => {
  emit('show-login')
}

const handleOpenComposer = () => {
  if (!user.value) {
    handleShowLogin()
    return
  }

  composerExpanded.value = true
}

const collapseComposer = () => {
  composerExpanded.value = false
  formData.value = {
    content: ''
  }
}

const syncHasMore = () => {
  hasMore.value = messages.value.length < totalCount.value
}

/**
 * 加载留言总数
 */
const loadMessageCount = async () => {
  try {
    const data = await guestbookApi.getCount()
    totalCount.value = data?.count || 0
    syncHasMore()
  } catch (error) {
    console.error('Failed to load guestbook count:', error)
  }
}

/**
 * 加载留言列表
 */
const loadMessages = async ({ append = false } = {}) => {
  if (append && (isLoadingMore.value || !hasMore.value)) {
    return
  }

  if (append) {
    isLoadingMore.value = true
  } else {
    isLoading.value = true
  }

  try {
    const data = await guestbookApi.getList({
      limit: pageSize + 1,
      offset: append ? messages.value.length : 0,
      sortBy: 'created_at',
      sortOrder: 'desc'
    })

    const normalizedMessages = Array.isArray(data) ? data : []
    const nextMessages = normalizedMessages.slice(0, pageSize)

    messages.value = append
      ? [...messages.value, ...nextMessages]
      : nextMessages

    if (!totalCount.value) {
      totalCount.value = messages.value.length
    }

    hasMore.value = normalizedMessages.length > pageSize
  } catch (error) {
    console.error('Failed to load guestbook messages:', error)
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
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
    totalCount.value += 1
    syncHasMore()

    // 清空表单
    formData.value = {
      content: ''
    }
    composerExpanded.value = false

    await nextTick()
    messageViewport.value?.scrollTo({ top: 0, behavior: 'smooth' })
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
  if (minutes < 60) return t('common.minutesAgo', { minutes })
  if (hours < 24) return t('common.hoursAgo', { hours })
  if (days < 7) return t('common.daysAgo', { days })

  return date.toLocaleDateString()
}

/**
 * 获取留言头像首字母
 */
const getMessageInitial = (name) => {
  const safeName = String(name || '').trim()
  if (!safeName) {
    return '·'
  }

  return safeName.charAt(0).toUpperCase()
}

/**
 * 独立滚动区接近底部时加载更多
 */
const handleMessageScroll = () => {
  const viewport = messageViewport.value
  if (!viewport || isLoading.value || isLoadingMore.value || !hasMore.value) {
    return
  }

  const remaining = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight
  if (remaining < 120) {
    loadMessages({ append: true })
  }
}

// 初始化时加载留言
onMounted(() => {
  loadMessageCount()
  loadMessages()
})
</script>

<style scoped>
.guestbook-shell {
  position: relative;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--theme-primary) 18%, var(--border-strong));
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--accent-warm) 26%, transparent), transparent 34%),
    radial-gradient(circle at top left, color-mix(in srgb, var(--theme-primary) 28%, transparent), transparent 42%),
    linear-gradient(180deg, color-mix(in srgb, var(--surface-panel) 92%, transparent), color-mix(in srgb, var(--surface-base) 96%, transparent));
  box-shadow: var(--shadow-medium);
  backdrop-filter: blur(calc(var(--glass-blur) + 8px));
  -webkit-backdrop-filter: blur(calc(var(--glass-blur) + 8px));
}

.guestbook-shell::after {
  content: "";
  position: absolute;
  right: -3.5rem;
  bottom: -3.5rem;
  width: 12rem;
  height: 12rem;
  border-radius: 999px;
  background: radial-gradient(circle, color-mix(in srgb, var(--theme-primary) 22%, transparent), transparent 70%);
  pointer-events: none;
}

.guestbook-header {
  margin-bottom: 0.8rem;
}

.guestbook-kicker {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--theme-primary-darker) 72%, var(--accent-warm));
}

.guestbook-kicker::before {
  content: "";
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--theme-primary), var(--accent-warm));
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--theme-primary) 14%, transparent);
}

.guestbook-counter {
  min-width: 4.75rem;
  padding: 0.8rem 0.75rem;
  border-radius: 1.2rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: linear-gradient(145deg, var(--theme-primary), color-mix(in srgb, var(--accent-warm) 70%, var(--theme-primary)));
  color: white;
  text-align: center;
  box-shadow: 0 16px 30px color-mix(in srgb, var(--theme-primary) 26%, transparent);
}

.guestbook-counter-value {
  display: block;
  font-size: 1.35rem;
  line-height: 1;
  font-weight: 900;
}

.guestbook-counter-label {
  display: block;
  margin-top: 0.28rem;
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.84;
}

.guestbook-compose,
.guestbook-stream {
  position: relative;
  border: 1px solid color-mix(in srgb, var(--theme-primary) 12%, var(--border-base));
  background: color-mix(in srgb, var(--surface-elevated) 84%, transparent);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.guestbook-compose {
  margin-bottom: 0.7rem;
  padding: 0.8rem;
  border-radius: 1.25rem;
}

.guestbook-compose-trigger,
.guestbook-rules-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  text-align: left;
}

.guestbook-compose-trigger {
  padding: 0.05rem;
}

.guestbook-compose-trigger-copy {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.guestbook-compose-trigger-title {
  display: block;
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--text-main);
}

.guestbook-compose-trigger-meta {
  display: block;
  font-size: 0.74rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.guestbook-compose-trigger-action,
.guestbook-inline-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--theme-primary) 12%, transparent);
  color: var(--theme-primary-darker);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  flex-shrink: 0;
}

.guestbook-inline-action:hover,
.guestbook-compose-trigger:hover .guestbook-compose-trigger-action {
  background: color-mix(in srgb, var(--theme-primary) 18%, transparent);
}

.guestbook-rules-tooltip-wrap {
  display: inline-flex;
  align-items: center;
}

.guestbook-rules-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.7rem;
  height: 1.7rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--theme-primary) 12%, var(--border-base));
  background: color-mix(in srgb, var(--surface-base) 88%, transparent);
  color: var(--theme-primary-darker);
  box-shadow: 0 8px 18px color-mix(in srgb, var(--theme-primary) 12%, transparent);
}

.guestbook-rules-icon:hover,
.guestbook-rules-tooltip-wrap:focus-within .guestbook-rules-icon {
  background: color-mix(in srgb, var(--theme-primary) 12%, var(--surface-elevated));
  color: var(--theme-primary);
}

.guestbook-rules-tooltip {
  position: absolute;
  top: calc(100% + 0.65rem);
  left: 0;
  z-index: 40;
  width: min(17rem, calc(100vw - 2rem));
  max-height: 12rem;
  padding: 0.9rem 1rem;
  border-radius: 1rem;
  border: 1px solid color-mix(in srgb, var(--theme-primary) 12%, var(--border-base));
  background: linear-gradient(180deg, color-mix(in srgb, var(--surface-elevated) 98%, transparent), color-mix(in srgb, var(--surface-panel) 92%, transparent));
  box-shadow: var(--shadow-medium);
  backdrop-filter: blur(calc(var(--glass-blur) + 6px));
  -webkit-backdrop-filter: blur(calc(var(--glass-blur) + 6px));
  opacity: 0;
  visibility: hidden;
  transform: translateY(8px);
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease, visibility 0s linear 0.2s;
}

.guestbook-rules-tooltip-wrap:hover .guestbook-rules-tooltip,
.guestbook-rules-tooltip-wrap:focus-within .guestbook-rules-tooltip {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  pointer-events: auto;
  transition-delay: 0s;
}

.guestbook-ghost-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 4.8rem;
  padding: 0.8rem 0.95rem;
  border-radius: 1rem;
  border: 1px solid color-mix(in srgb, var(--theme-primary) 10%, var(--border-base));
  background: color-mix(in srgb, var(--surface-base) 84%, transparent);
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 700;
}

.guestbook-textarea {
  min-height: 5rem;
  color: var(--text-main);
  background: color-mix(in srgb, var(--surface-base) 86%, transparent);
  border: 1px solid color-mix(in srgb, var(--theme-primary) 15%, var(--border-base));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.46);
}

.guestbook-textarea:focus {
  border-color: color-mix(in srgb, var(--theme-primary) 34%, var(--border-strong));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--theme-primary) 18%, transparent);
}

.guestbook-submit {
  color: white;
  background: linear-gradient(135deg, var(--theme-primary), color-mix(in srgb, var(--accent-warm) 82%, var(--theme-primary)));
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow: 0 14px 28px color-mix(in srgb, var(--theme-primary) 26%, transparent);
}

.guestbook-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: saturate(1.08) brightness(1.03);
  box-shadow: 0 18px 34px color-mix(in srgb, var(--theme-primary) 30%, transparent);
}

.guestbook-login-btn {
  min-width: 8rem;
}

.guestbook-rule-item {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
}

.guestbook-rule-dot {
  width: 0.44rem;
  height: 0.44rem;
  margin-top: 0.32rem;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--theme-primary), var(--accent-warm));
  flex-shrink: 0;
}

.guestbook-stream {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border-radius: 1.4rem;
}

.guestbook-stream-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.8rem 0.95rem 0.72rem;
  border-bottom: 1px solid color-mix(in srgb, var(--theme-primary) 10%, var(--border-base));
}

.guestbook-stream-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 3.7rem;
  padding: 0.32rem 0.65rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--theme-primary) 12%, transparent);
  color: var(--theme-primary-darker);
  font-size: 0.7rem;
  font-weight: 800;
}

.guestbook-stream-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0.85rem 0.85rem 1rem;
}

.guestbook-message + .guestbook-message {
  margin-top: 0.75rem;
}

.guestbook-message {
  padding: 0.95rem;
  border-radius: 1.15rem;
  border: 1px solid color-mix(in srgb, var(--theme-primary) 12%, var(--border-base));
  border-left: 3px solid color-mix(in srgb, var(--accent-warm) 54%, var(--theme-primary));
  background: color-mix(in srgb, var(--theme-primary) 7%, var(--surface-elevated));
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.guestbook-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--theme-primary), var(--accent-warm));
  color: white;
  font-size: 0.82rem;
  font-weight: 900;
  box-shadow: 0 10px 18px color-mix(in srgb, var(--theme-primary) 20%, transparent);
}

.guestbook-stream-state {
  padding: 0.9rem 0.35rem 0.35rem;
  text-align: center;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.guestbook-stream-state-muted {
  color: var(--text-muted);
}

.dark .guestbook-shell {
  box-shadow: var(--shadow-strong), inset 0 1px 0 rgba(255, 255, 255, 0.08), inset 0 0 0 1px rgba(255, 255, 255, 0.04);
}

.dark .guestbook-compose,
.dark .guestbook-stream {
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), inset 0 0 0 1px rgba(255, 255, 255, 0.03);
}

.dark .guestbook-rules-icon {
  color: var(--theme-primary-dark);
}

.dark .guestbook-rules-icon:hover,
.dark .guestbook-rules-tooltip-wrap:focus-within .guestbook-rules-icon {
  color: var(--theme-primary-dark);
}

.dark .guestbook-rules-tooltip {
  background: linear-gradient(180deg, color-mix(in srgb, var(--surface-elevated) 98%, transparent), color-mix(in srgb, var(--surface-panel) 90%, transparent));
}

.dark .guestbook-textarea {
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.dark .guestbook-message {
  box-shadow: 0 16px 30px rgba(2, 6, 23, 0.28);
}
</style>
