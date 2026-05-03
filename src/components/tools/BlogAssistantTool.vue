<template>
  <div class="space-y-6 w-full">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div class="text-xs font-semibold uppercase tracking-[0.22em] text-muted mb-2">
          {{ $t('tools.workspace.badges.featured') }}
        </div>
        <h2 class="text-2xl md:text-3xl font-bold text-main">{{ $t('tools.blogAssistant.title') }}</h2>
        <p class="text-secondary text-sm md:text-base mt-2 max-w-3xl">
          {{ $t('tools.blogAssistant.desc') }}
        </p>
      </div>
      <div class="flex flex-wrap gap-3">
        <button
          @click="applySuggestedExcerpt"
          class="assistant-action-btn assistant-action-btn-secondary"
          :disabled="!suggestedExcerpt"
        >
          {{ $t('tools.blogAssistant.useSuggestedExcerpt') }}
        </button>
        <button
          @click="copyField('payload', payloadJson)"
          class="assistant-action-btn assistant-action-btn-primary"
        >
          {{ copiedKey === 'payload' ? copiedLabel : $t('tools.blogAssistant.copyPayload') }}
        </button>
      </div>
    </div>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
      <div class="space-y-6">
        <section class="assistant-card">
          <div class="assistant-card-head">
            <div>
              <h3 class="assistant-section-title">{{ $t('tools.blogAssistant.identityTitle') }}</h3>
              <p class="assistant-section-desc">{{ $t('tools.blogAssistant.identityDesc') }}</p>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <label class="assistant-field md:col-span-2">
              <span class="assistant-label">{{ $t('blog.title') }}</span>
              <input
                v-model="title"
                type="text"
                class="assistant-input"
                :placeholder="$t('blog.titlePlaceholder')"
              >
            </label>

            <label class="assistant-field">
              <span class="assistant-label">{{ $t('blog.slug') }}</span>
              <div class="assistant-inline-input">
                <input
                  :value="slug"
                  type="text"
                  class="assistant-input"
                  :placeholder="$t('tools.blogAssistant.slugPlaceholder')"
                  @input="handleSlugInput"
                >
                <button
                  type="button"
                  class="assistant-mini-btn"
                  @click="resetSlug"
                  :disabled="!slugTouched"
                >
                  {{ $t('tools.blogAssistant.resetSlug') }}
                </button>
              </div>
            </label>

            <label class="assistant-field">
              <span class="assistant-label">{{ $t('blog.date') }}</span>
              <input
                v-model="publishedAt"
                type="date"
                class="assistant-input"
              >
            </label>

            <label class="assistant-field md:col-span-2">
              <span class="assistant-label">{{ $t('blog.tags') }}</span>
              <textarea
                v-model="tagSource"
                rows="3"
                class="assistant-textarea"
                :placeholder="$t('tools.blogAssistant.tagsPlaceholder')"
              ></textarea>
            </label>
          </div>

          <div class="flex flex-wrap gap-2 pt-2">
            <span
              v-for="tag in normalizedTags"
              :key="tag"
              class="assistant-tag-chip"
            >
              #{{ tag }}
            </span>
            <span v-if="normalizedTags.length === 0" class="assistant-empty-copy">
              {{ $t('tools.blogAssistant.noTags') }}
            </span>
          </div>
        </section>

        <section class="assistant-card">
          <div class="assistant-card-head">
            <div>
              <h3 class="assistant-section-title">{{ $t('tools.blogAssistant.contentTitle') }}</h3>
              <p class="assistant-section-desc">{{ $t('tools.blogAssistant.contentDesc') }}</p>
            </div>
            <div class="assistant-metric-pill">
              {{ $t('tools.blogAssistant.readingTimeValue', { minutes: readingTimeMinutes }) }}
            </div>
          </div>

          <label class="assistant-field">
            <span class="assistant-label">{{ $t('blog.content') }}</span>
            <textarea
              v-model="content"
              rows="12"
              class="assistant-textarea assistant-textarea-large"
              :placeholder="$t('blog.contentPlaceholder')"
            ></textarea>
          </label>

          <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <label class="assistant-field">
              <span class="assistant-label">{{ $t('blog.excerpt') }}</span>
              <textarea
                v-model="excerpt"
                rows="5"
                class="assistant-textarea"
                :placeholder="$t('blog.excerptPlaceholder')"
              ></textarea>
            </label>

            <div class="assistant-suggestion-panel">
              <div class="assistant-suggestion-head">
                <div>
                  <div class="assistant-section-title text-base">{{ $t('tools.blogAssistant.suggestedExcerpt') }}</div>
                  <p class="assistant-section-desc">{{ $t('tools.blogAssistant.suggestedExcerptDesc') }}</p>
                </div>
                <button
                  type="button"
                  class="assistant-mini-btn"
                  @click="copyField('excerpt', effectiveExcerpt)"
                  :disabled="!effectiveExcerpt"
                >
                  {{ copiedKey === 'excerpt' ? copiedLabel : $t('common.copy') }}
                </button>
              </div>
              <p class="assistant-suggestion-copy">
                {{ suggestedExcerpt || $t('tools.blogAssistant.noExcerptSuggestion') }}
              </p>
              <div class="assistant-length-note">
                {{ $t('tools.blogAssistant.excerptLength', { count: effectiveExcerpt.length }) }}
              </div>
            </div>
          </div>
        </section>
      </div>

      <div class="space-y-6">
        <section class="assistant-card">
          <div class="assistant-card-head">
            <div>
              <h3 class="assistant-section-title">{{ $t('tools.blogAssistant.aiTitle') }}</h3>
              <p class="assistant-section-desc">{{ $t('tools.blogAssistant.aiDesc') }}</p>
            </div>
            <button
              type="button"
              class="assistant-action-btn assistant-action-btn-primary"
              :disabled="!canGenerateBlogIdea || isGeneratingBlogIdea"
              @click="generateBlogIdea"
            >
              {{ isGeneratingBlogIdea ? $t('common.loading') : $t('tools.blogAssistant.generateIdea') }}
            </button>
          </div>

          <div v-if="blogIdeaError" class="text-sm text-rose-500 dark:text-rose-400">
            {{ blogIdeaError }}
          </div>

          <div v-if="blogIdea" class="space-y-4">
            <div class="assistant-output-card">
              <div class="assistant-output-head">
                <span>{{ $t('tools.blogAssistant.aiSections.thesis') }}</span>
                <button type="button" class="assistant-mini-btn" @click="copyField('idea-thesis', blogIdea.thesis)" :disabled="!blogIdea.thesis">
                  {{ copiedKey === 'idea-thesis' ? copiedLabel : $t('common.copy') }}
                </button>
              </div>
              <div class="assistant-output-value assistant-output-multiline">{{ blogIdea.thesis }}</div>
            </div>

            <div class="assistant-output-card">
              <div class="assistant-output-head">
                <span>{{ $t('tools.blogAssistant.aiSections.angles') }}</span>
                <button type="button" class="assistant-mini-btn" @click="copyField('idea-angles', ideaAnglesText)" :disabled="!ideaAnglesText">
                  {{ copiedKey === 'idea-angles' ? copiedLabel : $t('common.copy') }}
                </button>
              </div>
              <div class="assistant-output-value assistant-output-multiline">{{ ideaAnglesText || '—' }}</div>
            </div>

            <div class="assistant-output-card">
              <div class="assistant-output-head">
                <span>{{ $t('tools.blogAssistant.aiSections.title') }}</span>
                <button type="button" class="assistant-mini-btn" @click="copyField('idea-title', blogIdea.title_suggestion)" :disabled="!blogIdea.title_suggestion">
                  {{ copiedKey === 'idea-title' ? copiedLabel : $t('common.copy') }}
                </button>
              </div>
              <div class="assistant-output-value assistant-output-multiline">{{ blogIdea.title_suggestion || '—' }}</div>
            </div>

            <div class="assistant-output-card">
              <div class="assistant-output-head">
                <span>{{ $t('tools.blogAssistant.aiSections.outline') }}</span>
                <button type="button" class="assistant-mini-btn" @click="copyField('idea-outline', blogIdea.outline_or_closing)" :disabled="!blogIdea.outline_or_closing">
                  {{ copiedKey === 'idea-outline' ? copiedLabel : $t('common.copy') }}
                </button>
              </div>
              <div class="assistant-output-value assistant-output-multiline">{{ blogIdea.outline_or_closing || '—' }}</div>
            </div>
          </div>

          <div v-else class="assistant-output-card">
            <div class="assistant-output-head">
              <span>{{ $t('tools.blogAssistant.aiIdleTitle') }}</span>
            </div>
            <div class="assistant-output-value assistant-output-multiline">
              {{ $t('tools.blogAssistant.aiIdleCopy') }}
            </div>
          </div>
        </section>

        <section class="assistant-card">
          <div class="assistant-card-head">
            <div>
              <h3 class="assistant-section-title">{{ $t('tools.blogAssistant.payloadTitle') }}</h3>
              <p class="assistant-section-desc">{{ $t('tools.blogAssistant.payloadDesc') }}</p>
            </div>
          </div>

          <div class="space-y-4">
            <div class="assistant-output-card">
              <div class="assistant-output-head">
                <span>{{ $t('blog.title') }}</span>
                <button type="button" class="assistant-mini-btn" @click="copyField('title', payload.title)" :disabled="!payload.title">
                  {{ copiedKey === 'title' ? copiedLabel : $t('common.copy') }}
                </button>
              </div>
              <div class="assistant-output-value">{{ payload.title || '—' }}</div>
            </div>

            <div class="assistant-output-card">
              <div class="assistant-output-head">
                <span>{{ $t('blog.slug') }}</span>
                <button type="button" class="assistant-mini-btn" @click="copyField('slug', payload.slug)" :disabled="!payload.slug">
                  {{ copiedKey === 'slug' ? copiedLabel : $t('common.copy') }}
                </button>
              </div>
              <div class="assistant-output-value font-mono">{{ payload.slug || '—' }}</div>
            </div>

            <div class="assistant-output-card">
              <div class="assistant-output-head">
                <span>{{ $t('blog.tags') }}</span>
                <button type="button" class="assistant-mini-btn" @click="copyField('tags', payload.tags.join(', '))" :disabled="payload.tags.length === 0">
                  {{ copiedKey === 'tags' ? copiedLabel : $t('common.copy') }}
                </button>
              </div>
              <div class="assistant-output-value">
                <span v-if="payload.tags.length">{{ payload.tags.join(', ') }}</span>
                <span v-else>—</span>
              </div>
            </div>

            <div class="assistant-output-card">
              <div class="assistant-output-head">
                <span>{{ $t('blog.excerpt') }}</span>
                <button type="button" class="assistant-mini-btn" @click="copyField('excerpt-final', payload.excerpt)" :disabled="!payload.excerpt">
                  {{ copiedKey === 'excerpt-final' ? copiedLabel : $t('common.copy') }}
                </button>
              </div>
              <div class="assistant-output-value assistant-output-multiline">
                {{ payload.excerpt || '—' }}
              </div>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <div class="assistant-output-card">
                <div class="assistant-output-head">
                  <span>{{ $t('blog.date') }}</span>
                </div>
                <div class="assistant-output-value">{{ localizedDate }}</div>
              </div>
              <div class="assistant-output-card">
                <div class="assistant-output-head">
                  <span>{{ $t('blog.readingTime') }}</span>
                </div>
                <div class="assistant-output-value">{{ $t('tools.blogAssistant.readingTimeValue', { minutes: readingTimeMinutes }) }}</div>
              </div>
            </div>
          </div>
        </section>

        <section class="assistant-card">
          <div class="assistant-card-head">
            <div>
              <h3 class="assistant-section-title">{{ $t('tools.blogAssistant.readinessTitle') }}</h3>
              <p class="assistant-section-desc">{{ $t('tools.blogAssistant.readinessDesc') }}</p>
            </div>
          </div>

          <div class="space-y-3">
            <div
              v-for="check in readinessChecks"
              :key="check.label"
              class="assistant-readiness-row"
            >
              <div class="assistant-readiness-icon" :class="check.done ? 'is-done' : 'is-pending'">
                <svg v-if="check.done" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-main text-sm">{{ check.label }}</div>
                <div class="text-xs text-secondary mt-1">{{ check.hint }}</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { aiApi, generateSlug } from '../../utils/api'
import { formatBlogDate, getTodayDateString, isDateOnlyString } from '../../utils/blogDate'

const { t, locale } = useI18n()

const title = ref('')
const slug = ref('')
const slugTouched = ref(false)
const publishedAt = ref(getTodayDateString())
const tagSource = ref('')
const content = ref('')
const excerpt = ref('')
const copiedKey = ref('')
const blogIdea = ref(null)
const blogIdeaError = ref('')
const isGeneratingBlogIdea = ref(false)
let copiedTimer = null

onUnmounted(() => {
  clearTimeout(copiedTimer)
})

watch(title, (nextTitle) => {
  if (!slugTouched.value) {
    slug.value = nextTitle ? generateSlug(nextTitle) : ''
  }
})

const plainContent = computed(() => stripMarkdown(content.value))

const suggestedExcerpt = computed(() => {
  const plain = plainContent.value
  if (!plain) return ''
  return truncateText(plain, 110)
})

const effectiveExcerpt = computed(() => excerpt.value.trim() || suggestedExcerpt.value)

const normalizedTags = computed(() => {
  const seen = new Set()
  return tagSource.value
    .split(/[\n,，、]+/g)
    .map(tag => tag.replace(/^#+/, '').trim())
    .filter(Boolean)
    .filter((tag) => {
      const lower = tag.toLowerCase()
      if (seen.has(lower)) return false
      seen.add(lower)
      return true
    })
})

const readingTimeMinutes = computed(() => {
  const chineseChars = (plainContent.value.match(/[\u4e00-\u9fff]/g) || []).length
  const latinWords = plainContent.value
    .replace(/[\u4e00-\u9fff]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length

  const estimatedMinutes = Math.ceil((chineseChars / 320) + (latinWords / 220))
  return Math.max(1, estimatedMinutes || 0)
})

const payload = computed(() => ({
  title: title.value.trim(),
  slug: slug.value.trim(),
  excerpt: effectiveExcerpt.value.trim(),
  tags: normalizedTags.value,
  readingTime: readingTimeMinutes.value,
  publishedAt: isDateOnlyString(publishedAt.value) ? publishedAt.value : getTodayDateString()
}))

const payloadJson = computed(() => JSON.stringify(payload.value, null, 2))
const canGenerateBlogIdea = computed(() => (
  Boolean(title.value.trim() || excerpt.value.trim() || normalizedTags.value.length > 0 || plainContent.value.length > 0)
))
const ideaAnglesText = computed(() => (
  Array.isArray(blogIdea.value?.angles)
    ? blogIdea.value.angles.map((angle, index) => `${index + 1}. ${angle}`).join('\n')
    : ''
))

const localizedDate = computed(() => {
  const nextLocale = locale.value === 'zh' ? 'zh' : 'iso'
  return formatBlogDate(payload.value.publishedAt, nextLocale)
})

const readinessChecks = computed(() => [
  {
    label: t('tools.blogAssistant.readiness.title'),
    done: payload.value.title.length > 0,
    hint: payload.value.title.length > 0
      ? t('tools.blogAssistant.ready')
      : t('tools.blogAssistant.readinessHints.title')
  },
  {
    label: t('tools.blogAssistant.readiness.slug'),
    done: payload.value.slug.length > 0,
    hint: payload.value.slug.length > 0
      ? payload.value.slug
      : t('tools.blogAssistant.readinessHints.slug')
  },
  {
    label: t('tools.blogAssistant.readiness.excerpt'),
    done: payload.value.excerpt.length >= 36,
    hint: payload.value.excerpt.length >= 36
      ? t('tools.blogAssistant.excerptLength', { count: payload.value.excerpt.length })
      : t('tools.blogAssistant.readinessHints.excerpt')
  },
  {
    label: t('tools.blogAssistant.readiness.tags'),
    done: payload.value.tags.length > 0,
    hint: payload.value.tags.length > 0
      ? payload.value.tags.join(', ')
      : t('tools.blogAssistant.readinessHints.tags')
  },
  {
    label: t('tools.blogAssistant.readiness.content'),
    done: plainContent.value.length >= 120,
    hint: plainContent.value.length >= 120
      ? t('tools.blogAssistant.readinessHints.contentReady', { count: plainContent.value.length })
      : t('tools.blogAssistant.readinessHints.content')
  }
])

const copiedLabel = computed(() => t('common.copied') || 'Copied')

function handleSlugInput(event) {
  slugTouched.value = true
  slug.value = generateSlug(event.target.value)
}

function resetSlug() {
  slugTouched.value = false
  slug.value = title.value ? generateSlug(title.value) : ''
}

function applySuggestedExcerpt() {
  if (!suggestedExcerpt.value) return
  excerpt.value = suggestedExcerpt.value
}

async function copyField(key, value) {
  if (!value) return

  try {
    await copyText(String(value))
    copiedKey.value = key
    clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => {
      copiedKey.value = ''
    }, 1800)
  } catch (error) {
    console.error('Failed to copy assistant field:', error)
  }
}

async function generateBlogIdea() {
  if (!canGenerateBlogIdea.value || isGeneratingBlogIdea.value) {
    return
  }

  isGeneratingBlogIdea.value = true
  blogIdeaError.value = ''

  try {
    blogIdea.value = await aiApi.getBlogSeed({
      title: title.value.trim(),
      excerpt: excerpt.value.trim(),
      tags: normalizedTags.value,
      content: plainContent.value.slice(0, 3200)
    })
  } catch (error) {
    blogIdeaError.value = error.message || t('tools.blogAssistant.aiError')
  } finally {
    isGeneratingBlogIdea.value = false
  }
}

async function copyText(value) {
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'absolute'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

function stripMarkdown(input) {
  return String(input || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, ' ')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~|]/g, ' ')
    .replace(/<\/?[^>]+(>|$)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function truncateText(input, maxLength) {
  const normalized = String(input || '').trim()
  if (!normalized) return ''
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength).trim()}...`
}
</script>

<style scoped>
.assistant-card {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.25rem;
  border-radius: 1.75rem;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.62));
}

.assistant-card-head {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.assistant-section-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text-main, #0f172a);
}

.assistant-section-desc {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary, #475569);
}

.assistant-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.assistant-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary, #475569);
}

.assistant-input,
.assistant-textarea {
  width: 100%;
  border-radius: 1rem;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(255, 255, 255, 0.72);
  padding: 0.85rem 1rem;
  color: var(--color-text-main, #0f172a);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.assistant-input:focus,
.assistant-textarea:focus {
  border-color: color-mix(in srgb, var(--theme-primary) 55%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--theme-primary) 14%, transparent);
}

.assistant-textarea {
  min-height: 110px;
  resize: vertical;
}

.assistant-textarea-large {
  min-height: 280px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace;
  font-size: 0.875rem;
  line-height: 1.7;
}

.assistant-inline-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.assistant-mini-btn {
  flex-shrink: 0;
  border-radius: 9999px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary, #475569);
  transition: all 0.2s ease;
}

.assistant-mini-btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--theme-primary-lighter) 38%, transparent);
  color: var(--theme-primary-darker);
}

.assistant-mini-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.assistant-action-btn {
  border-radius: 9999px;
  padding: 0.65rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.assistant-action-btn-primary {
  color: white;
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-darker));
  box-shadow: 0 16px 32px -20px color-mix(in srgb, var(--theme-primary) 55%, transparent);
}

.assistant-action-btn-secondary {
  border: 1px solid rgba(148, 163, 184, 0.18);
  color: var(--color-text-secondary, #475569);
  background: rgba(255, 255, 255, 0.7);
}

.dark .assistant-action-btn-secondary {
  background: rgba(15, 23, 42, 0.55);
}

.assistant-action-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.assistant-tag-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.72);
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-main, #0f172a);
}

.assistant-empty-copy {
  font-size: 0.875rem;
  color: var(--color-text-muted, #64748b);
}

.assistant-metric-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary, #475569);
  background: color-mix(in srgb, var(--theme-primary-lighter) 24%, transparent);
}

.assistant-suggestion-panel {
  border-radius: 1.5rem;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.6);
  padding: 1rem;
}

.assistant-suggestion-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.assistant-suggestion-copy {
  margin-top: 1rem;
  font-size: 0.875rem;
  line-height: 1.7;
  color: var(--color-text-main, #0f172a);
}

.assistant-length-note {
  margin-top: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-muted, #64748b);
}

.assistant-output-card {
  border-radius: 1.5rem;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.65);
  padding: 1rem;
}

.assistant-output-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-text-muted, #64748b);
}

.assistant-output-value {
  margin-top: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-main, #0f172a);
  word-break: break-word;
}

.assistant-output-multiline {
  white-space: pre-wrap;
  line-height: 1.7;
  font-weight: 500;
}

.assistant-readiness-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  border-radius: 1.375rem;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.6);
  padding: 0.75rem 1rem;
}

.assistant-readiness-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
  border-radius: 9999px;
}

.assistant-readiness-icon.is-done {
  background: color-mix(in srgb, #22c55e 28%, transparent);
  color: #16a34a;
}

.assistant-readiness-icon.is-pending {
  background: color-mix(in srgb, #f59e0b 24%, transparent);
  color: #d97706;
}

.dark .assistant-card,
.dark .assistant-suggestion-panel,
.dark .assistant-output-card,
.dark .assistant-readiness-row {
  background: rgba(15, 23, 42, 0.38);
  border-color: rgba(255, 255, 255, 0.08);
}

.dark .assistant-input,
.dark .assistant-textarea,
.dark .assistant-tag-chip {
  background: rgba(15, 23, 42, 0.52);
  border-color: rgba(255, 255, 255, 0.08);
  color: rgba(248, 250, 252, 0.92);
}

.dark .assistant-section-title,
.dark .assistant-output-value,
.dark .assistant-suggestion-copy,
.dark .assistant-tag-chip {
  color: rgba(248, 250, 252, 0.92);
}

.dark .assistant-section-desc,
.dark .assistant-label,
.dark .assistant-mini-btn,
.dark .assistant-metric-pill,
.dark .assistant-action-btn-secondary {
  color: rgba(226, 232, 240, 0.78);
}

.dark .assistant-empty-copy,
.dark .assistant-length-note,
.dark .assistant-output-head {
  color: rgba(148, 163, 184, 0.85);
}

@media (min-width: 640px) {
  .assistant-card-head {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
  }
}

@media (min-width: 768px) {
  .assistant-card {
    padding: 1.5rem;
  }
}
</style>
