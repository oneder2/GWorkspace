<template>
  <section class="guest-writing-shell">
    <header class="writing-access-band is-guest">
      <div>
        <span class="writing-access-kicker">{{ $t('writingStudio.guest.kicker') }}</span>
        <strong>{{ $t('writingStudio.guest.title') }}</strong>
      </div>
      <span class="writing-access-state">{{ $t('writingStudio.guest.ephemeral') }}</span>
    </header>

    <div class="guest-writing-intro">
      <div>
        <span class="writing-kicker">PUBLIC WRITING LAB</span>
        <h1>{{ $t('writingStudio.guest.heading') }}</h1>
        <p>{{ $t('writingStudio.guest.description') }}</p>
      </div>
      <button type="button" class="writing-button is-primary" @click="$emit('open-auth')">
        {{ $t('writingStudio.guest.ownerLogin') }}
      </button>
    </div>

    <div class="guest-lab-frame">
      <div class="guest-lab-tabs" role="tablist" :aria-label="$t('writingStudio.guest.toolsLabel')">
        <button
          type="button"
          :class="{ 'is-active': activeTool === 'analyze' }"
          role="tab"
          :aria-selected="activeTool === 'analyze'"
          @click="activeTool = 'analyze'"
        >
          {{ $t('writingStudio.guest.analyzeTab') }}
        </button>
        <button
          type="button"
          :class="{ 'is-active': activeTool === 'markdown' }"
          role="tab"
          :aria-selected="activeTool === 'markdown'"
          @click="activeTool = 'markdown'"
        >
          {{ $t('writingStudio.guest.markdownTab') }}
        </button>
      </div>

      <section v-if="activeTool === 'analyze'" class="guest-tool-panel">
        <div class="guest-tool-editor">
          <label for="guest-thesis-input">{{ $t('writingStudio.guest.analyzeLabel') }}</label>
          <textarea
            id="guest-thesis-input"
            v-model="analysisInput"
            rows="8"
            maxlength="500"
            :placeholder="$t('writingStudio.guest.analyzePlaceholder')"
          ></textarea>
          <div class="guest-tool-footer">
            <span>{{ analysisInput.length }} / 500</span>
            <button
              type="button"
              class="writing-button is-primary"
              :disabled="analysisLoading || !analysisInput.trim()"
              @click="runAnalysis"
            >
              {{ analysisLoading ? $t('common.loading') : $t('writingStudio.guest.analyzeAction') }}
            </button>
          </div>
          <p v-if="analysisError" class="writing-error" role="alert">{{ analysisError }}</p>
        </div>

        <div class="guest-analysis-output" aria-live="polite">
          <article v-for="section in analysisSections" :key="section.key">
            <span>{{ section.label }}</span>
            <p>{{ section.content }}</p>
          </article>
        </div>
      </section>

      <section v-else class="guest-tool-panel is-markdown">
        <div class="guest-tool-editor">
          <label for="guest-markdown-input">{{ $t('writingStudio.guest.markdownInput') }}</label>
          <textarea
            id="guest-markdown-input"
            v-model="markdownInput"
            rows="16"
            maxlength="8000"
            :placeholder="$t('writingStudio.guest.markdownPlaceholder')"
          ></textarea>
        </div>
        <div class="guest-markdown-preview">
          <span>{{ $t('writingStudio.guest.preview') }}</span>
          <div class="writing-prose" v-html="markdownPreview"></div>
        </div>
      </section>
    </div>

    <p class="guest-privacy-note">{{ $t('writingStudio.guest.privacy') }}</p>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { marked } from 'marked'
import { aiApi } from '../../utils/api'

defineEmits(['open-auth'])

const { t } = useI18n()
const activeTool = ref('analyze')
const analysisInput = ref('')
const analysisLoading = ref(false)
const analysisError = ref('')
const analysisResult = ref(null)
const markdownInput = ref('')

const analysisSections = computed(() => {
  const result = analysisResult.value || {}
  return [
    { key: 'thesis', label: t('tools.thesisParser.sections.thesis'), content: result.thesis || t('tools.thesisParser.fallbacks.thesis') },
    { key: 'appeal', label: t('tools.thesisParser.sections.appeal'), content: result.appeal || t('tools.thesisParser.fallbacks.appeal') },
    { key: 'boundary', label: t('tools.thesisParser.sections.boundary'), content: result.boundary || t('tools.thesisParser.fallbacks.boundary') },
    { key: 'takeaway', label: t('tools.thesisParser.sections.takeaway'), content: result.takeaway || t('tools.thesisParser.fallbacks.takeaway') }
  ]
})

const markdownPreview = computed(() => {
  if (!markdownInput.value.trim()) return `<p>${t('writingStudio.guest.previewEmpty')}</p>`
  try {
    const safeMarkdown = markdownInput.value.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return marked.parse(safeMarkdown)
  } catch {
    return `<p>${t('tools.markdownPreviewError')}</p>`
  }
})

async function runAnalysis() {
  if (!analysisInput.value.trim() || analysisLoading.value) return
  analysisLoading.value = true
  analysisError.value = ''
  try {
    analysisResult.value = await aiApi.analyze({ text: analysisInput.value.trim() })
  } catch (error) {
    analysisError.value = error.status === 429
      ? t('writingStudio.guest.limitReached')
      : (error.message || t('tools.thesisParser.error'))
  } finally {
    analysisLoading.value = false
  }
}
</script>
