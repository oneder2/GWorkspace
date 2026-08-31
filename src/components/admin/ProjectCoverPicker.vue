<template>
  <section class="cover-picker" :class="{ 'is-dragging': isDragging }">
    <div
      class="cover-preview"
      @dragenter.prevent="isDragging = true"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <img
        v-if="previewSource && !previewFailed"
        :src="previewSource"
        :alt="alt || $t('admin.projectCover')"
        @error="previewFailed = true"
      />
      <div v-else class="cover-placeholder">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="8.5" cy="9" r="1.5" />
          <path d="m4 17 5-5 4 4 2-2 5 5" />
        </svg>
        <span>{{ previewFailed ? $t('admin.coverPreviewUnavailable') : $t('admin.noProjectCover') }}</span>
      </div>
      <div v-if="isUploading" class="upload-overlay" role="status">
        <span class="upload-spinner" />
        {{ $t('admin.uploadingCover') }}
      </div>
      <span class="cover-format">16:9</span>
    </div>

    <div class="cover-controls">
      <div>
        <span class="cover-eyebrow">{{ $t('admin.projectCover') }}</span>
        <h4>{{ $t('admin.coverWorkspace') }}</h4>
      </div>

      <div class="cover-actions">
        <button type="button" class="cover-action primary" :disabled="isUploading" @click="openFilePicker">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 20h14" /></svg>
          {{ $t('admin.uploadCover') }}
        </button>
        <button type="button" class="cover-action" :disabled="!mediaOptions.length || isUploading" @click="libraryOpen = !libraryOpen">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="m4 17 5-5 4 4 2-2 5 5" /></svg>
          {{ $t('admin.chooseExistingCover') }}
          <span v-if="mediaOptions.length" class="media-count">{{ mediaOptions.length }}</span>
        </button>
        <button
          v-if="modelValue"
          type="button"
          class="cover-action icon-action"
          :aria-label="$t('admin.removeCover')"
          :title="$t('admin.removeCover')"
          :disabled="isUploading"
          @click="clearCover"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
        </button>
      </div>

      <input
        ref="fileInput"
        class="visually-hidden"
        type="file"
        tabindex="-1"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        @change="handleFileInput"
      />

      <p v-if="feedback.message" class="cover-feedback" :class="`is-${feedback.tone}`" role="status">
        {{ feedback.message }}
      </p>

      <details class="manual-cover">
        <summary>{{ $t('admin.manualCoverUrl') }}</summary>
        <label>
          <span>{{ $t('admin.coverUrl') }}</span>
          <input :value="modelValue" type="text" inputmode="url" placeholder="/images/project-cover.webp" @input="updateManualUrl" />
        </label>
      </details>
    </div>

    <div v-if="libraryOpen" class="cover-library">
      <div class="library-heading">
        <div>
          <span class="cover-eyebrow">{{ $t('admin.mediaLibrary') }}</span>
          <h4>{{ $t('admin.chooseExistingCover') }}</h4>
        </div>
        <button type="button" :aria-label="$t('common.close')" :title="$t('common.close')" @click="libraryOpen = false">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
        </button>
      </div>
      <div class="media-grid">
        <button
          v-for="media in mediaOptions"
          :key="media.url"
          type="button"
          class="media-option"
          :class="{ selected: media.url === modelValue }"
          :aria-label="media.label"
          @click="chooseMedia(media.url)"
        >
          <img :src="media.url" :alt="media.label" loading="lazy" />
          <span>{{ media.label }}</span>
          <svg v-if="media.url === modelValue" class="selected-mark" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { uploadApi } from '../../utils/api'

const MAX_FILE_SIZE = 20 * 1024 * 1024

const props = defineProps({
  modelValue: { type: String, default: '' },
  media: { type: Array, default: () => [] },
  alt: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue', 'uploading'])
const { t } = useI18n()

const fileInput = ref(null)
const isUploading = ref(false)
const isDragging = ref(false)
const libraryOpen = ref(false)
const previewFailed = ref(false)
const localPreview = ref('')
const feedback = reactive({ tone: 'neutral', message: '' })

const previewSource = computed(() => localPreview.value || props.modelValue)
const mediaOptions = computed(() => {
  const seen = new Set()
  return props.media
    .map((item, index) => typeof item === 'string' ? { url: item, label: item } : {
      url: item?.url || '',
      label: item?.label || item?.alt?.zh || item?.alt?.en || `${t('admin.projectCover')} ${index + 1}`
    })
    .filter(item => {
      if (!item.url || seen.has(item.url)) return false
      seen.add(item.url)
      return true
    })
})

function revokeLocalPreview() {
  if (localPreview.value) URL.revokeObjectURL(localPreview.value)
  localPreview.value = ''
}

function setFeedback(tone = 'neutral', message = '') {
  feedback.tone = tone
  feedback.message = message
}

function openFilePicker() {
  fileInput.value?.click()
}

function validateFile(file) {
  if (!file?.type?.startsWith('image/')) return t('admin.coverImageOnly')
  if (file.size > MAX_FILE_SIZE) return t('admin.coverFileTooLarge')
  return ''
}

async function uploadFile(file) {
  const validationMessage = validateFile(file)
  if (validationMessage) {
    setFeedback('danger', validationMessage)
    return
  }

  revokeLocalPreview()
  localPreview.value = URL.createObjectURL(file)
  previewFailed.value = false
  isUploading.value = true
  emit('uploading', true)
  setFeedback()

  try {
    const result = await uploadApi.uploadProjectCover(file)
    emit('update:modelValue', result.url)
    setFeedback('success', t('admin.coverUploadComplete'))
  } catch (error) {
    setFeedback('danger', error.message || t('admin.coverUploadFailed'))
  } finally {
    isUploading.value = false
    emit('uploading', false)
    revokeLocalPreview()
    if (fileInput.value) fileInput.value.value = ''
  }
}

function handleFileInput(event) {
  const [file] = event.target.files || []
  if (file) uploadFile(file)
}

function handleDrop(event) {
  isDragging.value = false
  if (isUploading.value) return
  const [file] = event.dataTransfer?.files || []
  if (file) uploadFile(file)
}

function chooseMedia(url) {
  revokeLocalPreview()
  previewFailed.value = false
  emit('update:modelValue', url)
  libraryOpen.value = false
  setFeedback('success', t('admin.coverSelected'))
}

function clearCover() {
  revokeLocalPreview()
  previewFailed.value = false
  emit('update:modelValue', '')
  setFeedback()
}

function updateManualUrl(event) {
  revokeLocalPreview()
  previewFailed.value = false
  emit('update:modelValue', event.target.value)
  setFeedback()
}

watch(() => props.modelValue, () => { previewFailed.value = false })
onBeforeUnmount(revokeLocalPreview)
</script>

<style scoped>
.cover-picker {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(250px, .85fr);
  border: 1px solid var(--border-strong);
  border-left: 3px solid var(--theme-primary);
  border-radius: 8px;
  overflow: hidden;
  background: color-mix(in srgb, var(--bg-input) 72%, var(--bg-card));
}

.cover-picker.is-dragging {
  border-color: var(--theme-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--theme-primary) 14%, transparent);
}

.cover-preview {
  position: relative;
  min-width: 0;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: color-mix(in srgb, var(--text-main) 7%, var(--bg-card));
}

.cover-preview img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: .65rem;
  color: var(--text-muted);
  font-size: .72rem;
}

.cover-placeholder svg {
  width: 34px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.4;
}

.cover-format {
  position: absolute;
  right: .6rem;
  bottom: .6rem;
  padding: .2rem .38rem;
  border: 1px solid rgba(255, 255, 255, .25);
  background: rgba(12, 18, 28, .7);
  color: white;
  font: 600 .58rem ui-monospace, monospace;
}

.upload-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: .6rem;
  background: rgba(12, 18, 28, .76);
  color: white;
  font-size: .72rem;
}

.upload-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, .35);
  border-top-color: white;
  border-radius: 50%;
  animation: cover-spin .7s linear infinite;
}

.cover-controls {
  min-width: 0;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: .8rem;
}

.cover-eyebrow {
  color: var(--text-muted);
  font: .61rem ui-monospace, monospace;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.cover-controls h4,
.library-heading h4 {
  margin: .25rem 0 0;
  color: var(--text-main);
  font-size: .9rem;
}

.cover-actions {
  display: flex;
  flex-wrap: wrap;
  gap: .45rem;
}

.cover-action,
.library-heading button {
  min-height: 38px;
  padding: 0 .65rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .45rem;
  border: 1px solid var(--border-strong);
  border-radius: 6px;
  background: var(--bg-card);
  color: var(--text-main);
  font-size: .7rem;
  cursor: pointer;
}

.cover-action.primary {
  border-color: var(--theme-primary);
  background: var(--theme-primary);
  color: white;
}

.cover-action:hover:not(:disabled),
.library-heading button:hover {
  border-color: var(--theme-primary);
}

.cover-action:focus-visible,
.library-heading button:focus-visible,
.media-option:focus-visible,
.manual-cover summary:focus-visible,
.manual-cover input:focus-visible {
  outline: 2px solid var(--theme-primary);
  outline-offset: 2px;
}

.cover-action:disabled {
  opacity: .48;
  cursor: not-allowed;
}

.cover-action svg,
.library-heading button svg {
  width: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.cover-action.icon-action,
.library-heading button {
  width: 38px;
  padding: 0;
}

.media-count {
  min-width: 18px;
  height: 18px;
  padding: 0 .28rem;
  display: inline-grid;
  place-items: center;
  border-radius: 9px;
  background: color-mix(in srgb, var(--theme-primary) 12%, transparent);
  color: var(--theme-primary);
  font: 600 .58rem ui-monospace, monospace;
}

.cover-feedback {
  margin: 0;
  padding-left: .55rem;
  border-left: 2px solid currentColor;
  font-size: .68rem;
  line-height: 1.45;
}

.cover-feedback.is-success { color: #16803c; }
.cover-feedback.is-danger { color: #c62f3f; }

.manual-cover {
  margin-top: auto;
  color: var(--text-secondary);
  font-size: .68rem;
}

.manual-cover summary {
  cursor: pointer;
}

.manual-cover label {
  margin-top: .65rem;
  display: grid;
  gap: .4rem;
}

.manual-cover input {
  width: 100%;
  min-height: 40px;
  padding: .62rem .7rem;
  border: 1px solid var(--border-strong);
  border-radius: 6px;
  background: var(--bg-input);
  color: var(--text-main);
  font: inherit;
}

.cover-library {
  grid-column: 1 / -1;
  padding: .9rem 1rem 1rem;
  display: grid;
  gap: .8rem;
  border-top: 1px solid var(--border-strong);
  background: var(--bg-card);
}

.library-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
}

.media-grid {
  max-height: 260px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: .55rem;
  overflow-y: auto;
}

.media-option {
  position: relative;
  min-width: 0;
  padding: 0;
  display: grid;
  border: 1px solid var(--border-strong);
  border-radius: 6px;
  overflow: hidden;
  background: var(--bg-input);
  color: var(--text-secondary);
  text-align: left;
  cursor: pointer;
}

.media-option:hover,
.media-option.selected {
  border-color: var(--theme-primary);
}

.media-option img {
  width: 100%;
  aspect-ratio: 16 / 9;
  display: block;
  object-fit: cover;
  background: color-mix(in srgb, var(--text-main) 7%, var(--bg-card));
}

.media-option > span {
  padding: .45rem .5rem;
  overflow: hidden;
  font-size: .63rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-mark {
  position: absolute;
  top: .4rem;
  right: .4rem;
  width: 22px;
  height: 22px;
  padding: .25rem;
  border-radius: 50%;
  background: var(--theme-primary);
  fill: none;
  stroke: white;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@keyframes cover-spin { to { transform: rotate(360deg); } }

@media (max-width: 720px) {
  .cover-picker { grid-template-columns: 1fr; }
  .media-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .cover-library { grid-column: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .upload-spinner { animation: none; }
}
</style>
