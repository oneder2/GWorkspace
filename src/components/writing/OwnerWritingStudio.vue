<template>
  <section class="owner-writing-shell">
    <header class="writing-access-band is-owner">
      <div>
        <span class="writing-access-kicker">{{ $t('writingStudio.owner.kicker') }}</span>
        <strong>{{ $t('writingStudio.owner.title', { name: user?.username || 'Owner' }) }}</strong>
      </div>
      <span class="writing-access-state">{{ saveStateLabel }}</span>
    </header>

    <div v-if="loading" class="writing-loading">{{ $t('common.loading') }}</div>
    <div v-else-if="loadError && !activeProject" class="writing-empty-state">
      <strong>{{ $t('writingStudio.owner.loadError') }}</strong>
      <p>{{ loadError }}</p>
      <button type="button" class="writing-button" @click="loadProjects">{{ $t('common.retry') }}</button>
    </div>

    <template v-else-if="!activeProject">
      <div class="owner-studio-intro">
        <div>
          <span class="writing-kicker">PRIVATE WRITING STUDIO</span>
          <h1>{{ $t('writingStudio.owner.heading') }}</h1>
          <p>{{ $t('writingStudio.owner.description') }}</p>
        </div>
        <div class="owner-create-actions">
          <button type="button" class="writing-button is-primary" :disabled="creating" @click="createProject('essay')">
            {{ $t('writingStudio.owner.newEssay') }}
          </button>
          <button type="button" class="writing-button" :disabled="creating" @click="createProject('novel')">
            {{ $t('writingStudio.owner.newNovel') }}
          </button>
        </div>
      </div>

      <button v-if="projects[0]" type="button" class="writing-resume-band" @click="openProject(projects[0].id)">
        <span>
          <small>{{ $t('writingStudio.owner.continue') }}</small>
          <strong>{{ projects[0].title }}</strong>
        </span>
        <span>{{ formatProjectMeta(projects[0]) }}</span>
      </button>

      <section class="writing-project-library">
        <div class="writing-section-heading">
          <div>
            <span class="writing-kicker">LIBRARY</span>
            <h2>{{ $t('writingStudio.owner.library') }}</h2>
          </div>
          <span>{{ projects.length }}</span>
        </div>
        <div v-if="projects.length" class="writing-project-grid">
          <button v-for="project in projects" :key="project.id" type="button" class="writing-project-card" @click="openProject(project.id)">
            <span class="writing-project-type">{{ projectTypeLabel(project.type) }}</span>
            <strong>{{ project.title }}</strong>
            <p>{{ project.description || $t('writingStudio.owner.noDescription') }}</p>
            <span class="writing-project-meta">{{ formatProjectMeta(project) }}</span>
          </button>
        </div>
        <div v-else class="writing-empty-state is-inline">
          <strong>{{ $t('writingStudio.owner.emptyLibrary') }}</strong>
          <p>{{ $t('writingStudio.owner.emptyLibraryCopy') }}</p>
        </div>
      </section>
    </template>

    <template v-else>
      <div class="writing-studio-toolbar">
        <button type="button" class="writing-icon-button" :title="$t('writingStudio.owner.backLibrary')" @click="closeProject">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="m15 18-6-6 6-6"></path>
          </svg>
        </button>
        <div class="writing-studio-identity">
          <span>{{ projectTypeLabel(activeProject.type) }}</span>
          <input v-model="activeProject.title" :aria-label="$t('writingStudio.owner.projectTitle')" @change="saveProjectSettings">
        </div>
        <div class="writing-studio-metrics">
          <span>{{ totalWordCount.toLocaleString() }} {{ $t('writingStudio.owner.words') }}</span>
          <span v-if="activeProject.target_words">{{ progressPercent }}%</span>
        </div>
      </div>

      <div class="writing-studio-frame">
        <aside class="writing-document-rail" :aria-label="$t('writingStudio.owner.documents')">
          <div class="writing-rail-heading">
            <span>{{ $t('writingStudio.owner.documents') }}</span>
            <button v-if="activeProject.type === 'novel'" type="button" class="writing-mini-button" @click="createDocument">
              {{ $t('writingStudio.owner.newChapter') }}
            </button>
          </div>
          <div
            v-for="(document, index) in activeProject.documents"
            :key="document.id"
            class="writing-document-row"
            :class="{ 'is-active': activeDocument?.id === document.id }"
          >
            <button type="button" class="writing-document-select" @click="selectDocument(document.id)">
              <span>{{ document.title }}</span>
              <small>{{ document.word_count }} {{ $t('writingStudio.owner.words') }}</small>
            </button>
            <div v-if="activeProject.type === 'novel' && document.kind === 'chapter'" class="writing-document-actions">
              <button type="button" :title="$t('writingStudio.owner.moveChapterUp')" :disabled="reordering || index === 0" @click="moveChapter(document.id, -1)">↑</button>
              <button type="button" :title="$t('writingStudio.owner.moveChapterDown')" :disabled="reordering || index === activeProject.documents.length - 1" @click="moveChapter(document.id, 1)">↓</button>
              <button type="button" class="is-danger" :title="$t('writingStudio.owner.deleteChapter')" :disabled="deletingDocument" @click="deleteDocument(document)">×</button>
            </div>
          </div>
        </aside>

        <main v-if="activeDocument" class="writing-editor-pane">
          <div class="writing-editor-header">
            <input v-model="activeDocument.title" class="writing-document-title" :aria-label="$t('writingStudio.owner.documentTitle')">
            <div>
              <select v-model="activeDocument.status" :aria-label="$t('writingStudio.owner.documentStatus')">
                <option value="planned">{{ $t('writingStudio.status.planned') }}</option>
                <option value="drafting">{{ $t('writingStudio.status.drafting') }}</option>
                <option value="revising">{{ $t('writingStudio.status.revising') }}</option>
                <option value="done">{{ $t('writingStudio.status.done') }}</option>
              </select>
              <button type="button" class="writing-mini-button" :disabled="revisionSaving" @click="createRevision">
                {{ $t('writingStudio.owner.snapshot') }}
              </button>
            </div>
          </div>
          <textarea
            v-if="activeProject.type === 'novel'"
            v-model="activeDocument.synopsis"
            class="writing-synopsis-input"
            rows="2"
            :placeholder="$t('writingStudio.owner.synopsisPlaceholder')"
            :aria-label="$t('writingStudio.owner.synopsis')"
          ></textarea>
          <textarea
            v-model="activeDocument.content"
            class="writing-manuscript-input"
            :placeholder="activeProject.type === 'novel' ? $t('writingStudio.owner.novelPlaceholder') : $t('writingStudio.owner.essayPlaceholder')"
            :aria-label="$t('writingStudio.owner.manuscript')"
            spellcheck="true"
          ></textarea>
          <footer class="writing-editor-footer">
            <span>{{ activeDocument.word_count }} {{ $t('writingStudio.owner.words') }}</span>
            <span>{{ activeDocument.content.length.toLocaleString() }} {{ $t('writingStudio.owner.characters') }}</span>
            <span>{{ saveStateLabel }}</span>
          </footer>
        </main>

        <aside class="writing-context-pane">
          <div class="writing-context-tabs" role="tablist">
            <button type="button" :class="{ 'is-active': contextTab === 'project' }" @click="contextTab = 'project'">
              {{ $t('writingStudio.owner.projectTab') }}
            </button>
            <button type="button" :class="{ 'is-active': contextTab === 'assistant' }" @click="contextTab = 'assistant'">
              {{ $t('writingStudio.owner.aiTab') }}
            </button>
            <button type="button" :class="{ 'is-active': contextTab === contextThirdTab }" @click="contextTab = contextThirdTab">
              {{ activeProject.type === 'essay' ? $t('writingStudio.owner.publishTab') : $t('writingStudio.owner.codexTab') }}
            </button>
          </div>

          <section v-if="contextTab === 'project'" class="writing-context-content">
            <label v-if="activeProject.type === 'novel'">
              <span>{{ $t('writingStudio.owner.globalOutline') }}</span>
              <textarea v-model="activeProject.outline" class="writing-outline-input" rows="9" :placeholder="$t('writingStudio.owner.globalOutlinePlaceholder')"></textarea>
            </label>
            <label>
              <span>{{ $t('writingStudio.owner.projectDescription') }}</span>
              <textarea v-model="activeProject.description" rows="5" :placeholder="$t('writingStudio.owner.projectDescriptionPlaceholder')"></textarea>
            </label>
            <label>
              <span>{{ $t('writingStudio.owner.targetWords') }}</span>
              <input v-model.number="activeProject.target_words" type="number" min="0" step="1000">
            </label>
            <label>
              <span>{{ $t('writingStudio.owner.projectStatus') }}</span>
              <select v-model="activeProject.status">
                <option value="active">{{ $t('writingStudio.status.active') }}</option>
                <option value="revising">{{ $t('writingStudio.status.revising') }}</option>
                <option value="completed">{{ $t('writingStudio.status.completed') }}</option>
                <option value="archived">{{ $t('writingStudio.status.archived') }}</option>
              </select>
            </label>
            <button type="button" class="writing-button is-primary" :disabled="projectSaving" @click="saveProjectSettings">
              {{ projectSaving ? $t('common.saving') : $t('writingStudio.owner.saveProject') }}
            </button>
          </section>

          <section v-else-if="contextTab === 'assistant'" class="writing-context-content">
            <div class="writing-context-copy">
              <strong>{{ $t('writingStudio.owner.aiHeading') }}</strong>
              <p>{{ activeProject.type === 'essay' ? $t('writingStudio.owner.aiEssayCopy') : $t('writingStudio.owner.aiNovelCopy') }}</p>
            </div>
            <button type="button" class="writing-button is-primary" :disabled="aiLoading || !activeDocument?.content.trim()" @click="analyzeDocument">
              {{ aiLoading ? $t('common.loading') : $t('writingStudio.owner.analyzeCurrent') }}
            </button>
            <p v-if="aiError" class="writing-error" role="alert">{{ aiError }}</p>
            <div v-if="aiResult" class="writing-ai-result">
              <article v-for="section in aiSections" :key="section.key">
                <span>{{ section.label }}</span>
                <p>{{ section.content }}</p>
              </article>
            </div>
          </section>

          <section v-else-if="contextTab === 'publish'" class="writing-context-content">
            <div class="writing-context-copy">
              <strong>{{ $t('writingStudio.owner.publishHeading') }}</strong>
              <p>{{ $t('writingStudio.owner.publishCopy') }}</p>
            </div>
            <label>
              <span>{{ $t('blog.genre') }}</span>
              <input v-model="activeProject.genre" type="text" :placeholder="$t('writingStudio.owner.genrePlaceholder')">
            </label>
            <label>
              <span>{{ $t('blog.excerpt') }}</span>
              <textarea v-model="activeProject.excerpt" rows="5" :placeholder="$t('writingStudio.owner.excerptPlaceholder')"></textarea>
            </label>
            <label>
              <span>{{ $t('blog.tags') }}</span>
              <input v-model="tagInput" type="text" :placeholder="$t('writingStudio.owner.tagsPlaceholder')">
            </label>
            <div class="writing-publish-actions">
              <button type="button" class="writing-button" :disabled="publishing" @click="publishEssay('draft')">
                {{ $t('blog.saveDraft') }}
              </button>
              <button type="button" class="writing-button is-primary" :disabled="publishing" @click="publishEssay('published')">
                {{ $t('blog.publishArticle') }}
              </button>
            </div>
            <p v-if="publishMessage" class="writing-success" aria-live="polite">{{ publishMessage }}</p>
            <p v-if="publishError" class="writing-error" role="alert">{{ publishError }}</p>
            <a v-if="activeProject.blog_id && activeProject.blog_status === 'published'" class="writing-text-link" :href="`/blog/${activeProject.blog_id}`" target="_blank">
              {{ $t('writingStudio.owner.openPublished') }}
            </a>
          </section>

          <section v-else class="writing-context-content">
            <div class="writing-context-copy">
              <strong>{{ $t('writingStudio.owner.codexHeading') }}</strong>
              <p>{{ $t('writingStudio.owner.codexCopy') }}</p>
            </div>
            <div class="writing-entity-form">
              <select v-model="entityDraft.entity_type" :aria-label="$t('writingStudio.owner.entityType')">
                <option value="character">{{ $t('writingStudio.entities.character') }}</option>
                <option value="location">{{ $t('writingStudio.entities.location') }}</option>
                <option value="organization">{{ $t('writingStudio.entities.organization') }}</option>
                <option value="object">{{ $t('writingStudio.entities.object') }}</option>
                <option value="rule">{{ $t('writingStudio.entities.rule') }}</option>
              </select>
              <input v-model="entityDraft.name" type="text" :placeholder="$t('writingStudio.owner.entityName')">
              <textarea v-model="entityDraft.summary" rows="3" :placeholder="$t('writingStudio.owner.entitySummary')"></textarea>
              <button type="button" class="writing-button is-primary" :disabled="entitySaving || !entityDraft.name.trim()" @click="createEntity">
                {{ $t('writingStudio.owner.addEntity') }}
              </button>
            </div>
            <div class="writing-entity-list">
              <article v-for="entity in activeProject.entities" :key="entity.id">
                <span>{{ entityTypeLabel(entity.entity_type) }}</span>
                <strong>{{ entity.name }}</strong>
                <p>{{ entity.summary || $t('writingStudio.owner.noEntitySummary') }}</p>
              </article>
            </div>
          </section>
        </aside>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { aiApi, writingAdminApi } from '../../utils/api'

defineProps({ user: { type: Object, default: null } })

const { t } = useI18n()
const loading = ref(true)
const creating = ref(false)
const loadError = ref('')
const projects = ref([])
const activeProject = ref(null)
const activeDocument = ref(null)
const contextTab = ref('project')
const saveState = ref('idle')
const projectSaving = ref(false)
const revisionSaving = ref(false)
const reordering = ref(false)
const deletingDocument = ref(false)
const aiLoading = ref(false)
const aiError = ref('')
const aiResult = ref(null)
const publishing = ref(false)
const publishMessage = ref('')
const publishError = ref('')
const tagInput = ref('')
const entitySaving = ref(false)
const entityDraft = ref({ entity_type: 'character', name: '', summary: '' })
let saveTimer = null
let suppressAutosave = false
let documentDirty = false
let documentSavePromise = null

const contextThirdTab = computed(() => activeProject.value?.type === 'essay' ? 'publish' : 'codex')
const totalWordCount = computed(() => activeProject.value?.documents?.reduce((sum, document) => sum + Number(document.word_count || 0), 0) || 0)
const progressPercent = computed(() => {
  const target = Number(activeProject.value?.target_words || 0)
  return target > 0 ? Math.min(100, Math.round((totalWordCount.value / target) * 100)) : 0
})
const saveStateLabel = computed(() => t(`writingStudio.saveState.${saveState.value}`))
const aiSections = computed(() => {
  const result = aiResult.value || {}
  return [
    { key: 'thesis', label: t('tools.thesisParser.sections.thesis'), content: result.thesis || '' },
    { key: 'appeal', label: t('tools.thesisParser.sections.appeal'), content: result.appeal || '' },
    { key: 'boundary', label: t('tools.thesisParser.sections.boundary'), content: result.boundary || '' },
    { key: 'takeaway', label: t('tools.thesisParser.sections.takeaway'), content: result.takeaway || '' }
  ].filter((section) => section.content)
})

watch(
  () => [activeDocument.value?.title, activeDocument.value?.synopsis, activeDocument.value?.content, activeDocument.value?.status],
  () => {
    if (!activeDocument.value || suppressAutosave) return
    documentDirty = true
    saveState.value = 'editing'
    clearTimeout(saveTimer)
    saveTimer = setTimeout(saveDocument, 900)
  }
)

onMounted(loadProjects)
onBeforeUnmount(() => {
  clearTimeout(saveTimer)
  if (documentDirty) saveDocument()
})

async function loadProjects() {
  loading.value = true
  loadError.value = ''
  try {
    projects.value = await writingAdminApi.getProjects()
  } catch (error) {
    loadError.value = error.message
  } finally {
    loading.value = false
  }
}

async function createProject(type) {
  if (creating.value) return
  creating.value = true
  try {
    const project = await writingAdminApi.createProject({
      type,
      title: type === 'novel' ? t('writingStudio.owner.defaultNovelTitle') : t('writingStudio.owner.defaultEssayTitle'),
      target_words: type === 'novel' ? 1000000 : 0
    })
    await loadProjects()
    setActiveProject(project)
  } catch (error) {
    loadError.value = error.message
  } finally {
    creating.value = false
  }
}

async function openProject(id) {
  loadError.value = ''
  try {
    setActiveProject(await writingAdminApi.getProject(id))
  } catch (error) {
    loadError.value = error.message
  }
}

function setActiveProject(project) {
  suppressAutosave = true
  activeProject.value = project
  activeDocument.value = project.documents?.[0] || null
  tagInput.value = (project.tags || []).join(', ')
  contextTab.value = 'project'
  aiResult.value = null
  documentDirty = false
  saveState.value = 'idle'
  nextTick(() => { suppressAutosave = false })
}

async function closeProject() {
  await flushDocumentSave()
  activeProject.value = null
  activeDocument.value = null
  await loadProjects()
}

async function selectDocument(id) {
  if (activeDocument.value?.id === id) return
  await flushDocumentSave()
  suppressAutosave = true
  activeDocument.value = activeProject.value.documents.find((document) => document.id === id) || null
  aiResult.value = null
  documentDirty = false
  saveState.value = 'idle'
  await nextTick()
  suppressAutosave = false
}

async function createDocument() {
  try {
    const count = activeProject.value.documents.filter((document) => document.kind === 'chapter').length + 1
    const document = await writingAdminApi.createDocument(activeProject.value.id, {
      kind: 'chapter',
      title: t('writingStudio.owner.chapterNumber', { count })
    })
    activeProject.value.documents.push(document)
    await selectDocument(document.id)
  } catch (error) {
    loadError.value = error.message
  }
}

async function moveChapter(documentId, offset) {
  if (reordering.value) return
  const documents = activeProject.value.documents
  const currentIndex = documents.findIndex((document) => document.id === documentId)
  const targetIndex = currentIndex + offset
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= documents.length) return

  await flushDocumentSave()
  const reordered = [...documents]
  const [chapter] = reordered.splice(currentIndex, 1)
  reordered.splice(targetIndex, 0, chapter)
  reordering.value = true
  try {
    activeProject.value.documents = await writingAdminApi.reorderChapters(
      activeProject.value.id,
      reordered.filter((document) => document.kind === 'chapter' && document.parent_id == null).map((document) => document.id)
    )
    activeDocument.value = activeProject.value.documents.find((document) => document.id === documentId) || activeDocument.value
  } catch (error) {
    loadError.value = error.message
  } finally {
    reordering.value = false
  }
}

async function deleteDocument(document) {
  if (deletingDocument.value) return
  if (!window.confirm(t('writingStudio.owner.deleteChapterConfirm', { title: document.title }))) return

  await flushDocumentSave()
  deletingDocument.value = true
  try {
    await writingAdminApi.deleteDocument(document.id)
    activeProject.value.documents = activeProject.value.documents.filter((item) => item.id !== document.id)
    if (activeDocument.value?.id === document.id) {
      await selectDocument(activeProject.value.documents[0]?.id)
    }
  } catch (error) {
    loadError.value = error.message
  } finally {
    deletingDocument.value = false
  }
}

function saveDocument() {
  clearTimeout(saveTimer)
  if (!activeDocument.value) return Promise.resolve(true)
  if (documentSavePromise) return documentSavePromise

  const document = activeDocument.value
  const payload = {
    title: document.title,
    synopsis: document.synopsis,
    content: document.content,
    status: document.status
  }
  documentDirty = false
  saveState.value = 'saving'
  const documentId = document.id
  documentSavePromise = (async () => {
    try {
      const updated = await writingAdminApi.updateDocument(documentId, payload)
      if (activeDocument.value?.id === documentId) {
        const changedDuringSave = ['title', 'synopsis', 'content', 'status']
          .some((field) => activeDocument.value[field] !== payload[field])

        if (changedDuringSave) {
          documentDirty = true
          saveState.value = 'editing'
        } else {
          suppressAutosave = true
          Object.assign(activeDocument.value, {
            word_count: updated.word_count,
            updated_at: updated.updated_at
          })
          await nextTick()
          suppressAutosave = false
          saveState.value = 'saved'
        }
      }
      return true
    } catch {
      documentDirty = true
      saveState.value = 'error'
      return false
    } finally {
      documentSavePromise = null
      if (documentDirty && activeDocument.value?.id === documentId) {
        clearTimeout(saveTimer)
        saveTimer = setTimeout(saveDocument, 900)
      }
    }
  })()

  return documentSavePromise
}

async function flushDocumentSave() {
  clearTimeout(saveTimer)
  if (documentSavePromise) await documentSavePromise
  if (documentDirty) return saveDocument()
  return true
}

async function saveProjectSettings() {
  if (!activeProject.value || projectSaving.value) return
  projectSaving.value = true
  try {
    const projectId = activeProject.value.id
    const updated = await writingAdminApi.updateProject(activeProject.value.id, {
      title: activeProject.value.title,
      description: activeProject.value.description,
      outline: activeProject.value.outline,
      status: activeProject.value.status,
      target_words: activeProject.value.target_words,
      genre: activeProject.value.genre,
      excerpt: activeProject.value.excerpt,
      tags: parseTags(tagInput.value)
    })
    if (activeProject.value?.id !== projectId) return

    const documents = activeProject.value.documents
    const entities = activeProject.value.entities
    Object.assign(activeProject.value, updated, { documents, entities })
    if (!documentDirty && !documentSavePromise) saveState.value = 'saved'
  } catch {
    saveState.value = 'error'
  } finally {
    projectSaving.value = false
  }
}

async function createRevision() {
  if (!activeDocument.value || revisionSaving.value) return
  const saved = await flushDocumentSave()
  if (!saved) return
  revisionSaving.value = true
  try {
    await writingAdminApi.createRevision(activeDocument.value.id, { reason: 'manual' })
    saveState.value = 'snapshot'
  } catch {
    saveState.value = 'error'
  } finally {
    revisionSaving.value = false
  }
}

async function analyzeDocument() {
  if (!activeDocument.value?.content.trim() || aiLoading.value) return
  aiLoading.value = true
  aiError.value = ''
  aiResult.value = null
  try {
    const context = [activeProject.value.description, activeDocument.value.synopsis, activeDocument.value.content].filter(Boolean).join('\n\n').slice(0, 7800)
    aiResult.value = await aiApi.analyze({ text: context })
  } catch (error) {
    aiError.value = error.message
  } finally {
    aiLoading.value = false
  }
}

async function publishEssay(status) {
  if (publishing.value) return
  const saved = await flushDocumentSave()
  if (!saved) return
  publishing.value = true
  publishMessage.value = ''
  publishError.value = ''
  try {
    const result = await writingAdminApi.publishEssay(activeProject.value.id, {
      status,
      title: activeProject.value.title,
      genre: activeProject.value.genre,
      excerpt: activeProject.value.excerpt,
      tags: parseTags(tagInput.value)
    })
    setActiveProject(result.project)
    contextTab.value = 'publish'
    publishMessage.value = status === 'published' ? t('writingStudio.owner.publishedSuccess') : t('writingStudio.owner.draftSuccess')
  } catch (error) {
    publishError.value = error.message
  } finally {
    publishing.value = false
  }
}

async function createEntity() {
  if (!entityDraft.value.name.trim() || entitySaving.value) return
  entitySaving.value = true
  try {
    activeProject.value.entities.push(await writingAdminApi.createEntity(activeProject.value.id, entityDraft.value))
    entityDraft.value = { entity_type: 'character', name: '', summary: '' }
  } catch (error) {
    loadError.value = error.message
  } finally {
    entitySaving.value = false
  }
}

function parseTags(value) {
  return String(value || '').split(/[,，、\n]/).map((tag) => tag.trim()).filter(Boolean)
}

function projectTypeLabel(type) {
  return t(`writingStudio.projectType.${type}`)
}

function entityTypeLabel(type) {
  return t(`writingStudio.entities.${type}`)
}

function formatProjectMeta(project) {
  const words = Number(project.word_count ?? project.documents?.reduce((sum, item) => sum + item.word_count, 0) ?? 0)
  return t('writingStudio.owner.projectMeta', {
    documents: project.document_count ?? project.documents?.length ?? 0,
    words: words.toLocaleString()
  })
}
</script>
