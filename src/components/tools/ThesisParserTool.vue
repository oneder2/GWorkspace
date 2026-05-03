<template>
  <div class="parser-shell space-y-6">
    <section class="parser-panel">
      <div class="space-y-3">
        <div class="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
          {{ $t('tools.workspace.badges.featured') }}
        </div>
        <h2 class="text-2xl md:text-3xl font-bold text-main">{{ $t('tools.thesisParser.title') }}</h2>
        <p class="text-secondary text-sm md:text-base max-w-3xl">
          {{ $t('tools.thesisParser.desc') }}
        </p>
      </div>

      <div class="space-y-4">
        <label class="parser-field">
          <span class="parser-label">{{ $t('tools.thesisParser.inputLabel') }}</span>
          <textarea
            v-model="input"
            rows="4"
            class="parser-input"
            :placeholder="$t('tools.thesisParser.placeholder')"
          ></textarea>
        </label>

        <div class="flex justify-end">
          <button
            type="button"
            class="parser-submit"
            :disabled="isLoading || !canSubmit"
            @click="submitAnalysis"
          >
            {{ isLoading ? $t('common.loading') : $t('tools.thesisParser.submit') }}
          </button>
        </div>

        <p v-if="errorMessage" class="text-sm text-rose-500 dark:text-rose-400">
          {{ errorMessage }}
        </p>
      </div>
    </section>

    <section class="grid gap-4 md:grid-cols-2">
      <article
        v-for="section in sections"
        :key="section.key"
        class="parser-card"
      >
        <div class="parser-card-head">{{ section.label }}</div>
        <div class="parser-card-copy">{{ section.content }}</div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { aiApi } from '../../utils/api'

const { t } = useI18n()

const input = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const result = ref(null)

const canSubmit = computed(() => input.value.trim().length > 0)

const sections = computed(() => {
  const fallback = {
    thesis: t('tools.thesisParser.fallbacks.thesis'),
    appeal: t('tools.thesisParser.fallbacks.appeal'),
    boundary: t('tools.thesisParser.fallbacks.boundary'),
    takeaway: t('tools.thesisParser.fallbacks.takeaway')
  }

  const current = result.value || fallback

  return [
    { key: 'thesis', label: t('tools.thesisParser.sections.thesis'), content: current.thesis || fallback.thesis },
    { key: 'appeal', label: t('tools.thesisParser.sections.appeal'), content: current.appeal || fallback.appeal },
    { key: 'boundary', label: t('tools.thesisParser.sections.boundary'), content: current.boundary || fallback.boundary },
    { key: 'takeaway', label: t('tools.thesisParser.sections.takeaway'), content: current.takeaway || fallback.takeaway }
  ]
})

async function submitAnalysis() {
  if (!canSubmit.value || isLoading.value) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    result.value = await aiApi.analyze({ text: input.value.trim() })
  } catch (error) {
    errorMessage.value = error.message || t('tools.thesisParser.error')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.parser-shell {
  width: 100%;
}

.parser-panel,
.parser-card {
  border-radius: 1.75rem;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.62));
  padding: 1.25rem;
}

.parser-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.parser-label,
.parser-card-head {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-text-muted, #64748b);
}

.parser-input {
  width: 100%;
  min-height: 7rem;
  resize: vertical;
  border-radius: 1.25rem;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.72);
  padding: 1rem;
  color: var(--color-text-main, #0f172a);
  line-height: 1.7;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.parser-input:focus {
  border-color: color-mix(in srgb, var(--theme-primary) 55%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--theme-primary) 14%, transparent);
}

.parser-submit {
  border-radius: 9999px;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-darker));
  box-shadow: 0 16px 32px -20px color-mix(in srgb, var(--theme-primary) 55%, transparent);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.parser-submit:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.parser-card-copy {
  margin-top: 0.75rem;
  font-size: 0.9375rem;
  line-height: 1.8;
  color: var(--color-text-main, #0f172a);
  white-space: pre-wrap;
}

.dark .parser-panel,
.dark .parser-card {
  background: rgba(15, 23, 42, 0.38);
  border-color: rgba(255, 255, 255, 0.08);
}

.dark .parser-input {
  background: rgba(15, 23, 42, 0.52);
  border-color: rgba(255, 255, 255, 0.08);
  color: rgba(248, 250, 252, 0.92);
}

.dark .parser-card-copy {
  color: rgba(248, 250, 252, 0.92);
}

@media (min-width: 768px) {
  .parser-panel,
  .parser-card {
    padding: 1.5rem;
  }
}
</style>
