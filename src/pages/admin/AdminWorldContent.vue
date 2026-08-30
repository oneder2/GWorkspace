<template>
  <div class="world-admin space-y-6">
    <section class="admin-panel rounded-[24px] overflow-hidden">
      <div class="admin-toolbar flex-col lg:flex-row lg:items-end">
        <div class="space-y-2">
          <span class="section-kicker">GELLARIA CONTENT</span>
          <h2 class="text-2xl font-bold text-main">{{ $t('admin.worldContent') }}</h2>
          <p class="text-sm text-secondary">{{ $t('admin.worldContentCopy') }}</p>
        </div>
        <div class="world-tabs" role="tablist" :aria-label="$t('admin.worldContent')">
          <button v-for="tab in tabs" :key="tab.id" type="button" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
            {{ tab.label }}
          </button>
        </div>
      </div>
    </section>

    <p v-if="status.message" class="world-status" :class="`is-${status.tone}`" role="status">{{ status.message }}</p>

    <section v-if="activeTab === 'profile'" class="admin-panel rounded-[24px] p-5 sm:p-7">
      <form class="world-form" @submit.prevent="saveProfile">
        <div class="world-form-heading">
          <div><span>PUBLIC IDENTITY</span><h3>{{ $t('admin.publicProfile') }}</h3></div>
          <button class="action-btn action-btn-primary" type="submit" :disabled="isSaving">{{ $t('common.save') }}</button>
        </div>
        <label class="field-wide"><span>{{ $t('admin.profileName') }}</span><input v-model="profileForm.name" required /></label>
        <div class="field-pair">
          <label><span>{{ $t('admin.roleZh') }}</span><input v-model="profileForm.role.zh" /></label>
          <label><span>{{ $t('admin.roleEn') }}</span><input v-model="profileForm.role.en" /></label>
        </div>
        <div class="field-pair">
          <label><span>{{ $t('admin.bioZh') }}</span><textarea v-model="profileForm.bio.zh" rows="5" /></label>
          <label><span>{{ $t('admin.bioEn') }}</span><textarea v-model="profileForm.bio.en" rows="5" /></label>
        </div>
        <div class="field-pair">
          <label><span>{{ $t('admin.responsibilitiesZh') }}</span><textarea v-model="profileResponsibilities.zh" rows="5" /></label>
          <label><span>{{ $t('admin.responsibilitiesEn') }}</span><textarea v-model="profileResponsibilities.en" rows="5" /></label>
        </div>
      </form>
    </section>

    <template v-else-if="activeTab === 'projects'">
      <section class="admin-panel rounded-[24px] overflow-hidden">
        <div class="world-section-head"><div><span>PROJECT REGISTER</span><h3>{{ $t('admin.projects') }}</h3></div><button class="action-btn action-btn-primary" type="button" @click="editProject()">{{ $t('admin.addProject') }}</button></div>
        <div v-if="isLoading" class="world-empty">{{ $t('common.loading') }}</div>
        <div v-else-if="!projects.length" class="world-empty">{{ $t('admin.noProjects') }}</div>
        <div v-else class="world-records">
          <article v-for="project in projects" :key="project.id">
            <div class="record-order">{{ String(project.sort_order).padStart(2, '0') }}</div>
            <div><span>{{ project.slug }} · {{ project.status }}</span><h4>{{ project.title.zh }}</h4><p>{{ project.summary.zh }}</p><small>{{ project.tags.join(' / ') }}</small></div>
            <div class="record-actions"><button type="button" @click="editProject(project)">{{ $t('admin.edit') }}</button><button type="button" class="danger" @click="removeProject(project)">{{ $t('admin.delete') }}</button></div>
          </article>
        </div>
      </section>
    </template>

    <template v-else>
      <section class="admin-panel rounded-[24px] overflow-hidden">
        <div class="world-section-head"><div><span>SPATIAL PLACEMENT</span><h3>{{ $t('admin.worldExhibits') }}</h3></div><button class="action-btn action-btn-primary" type="button" @click="editExhibit()">{{ $t('admin.addExhibit') }}</button></div>
        <div v-if="isLoading" class="world-empty">{{ $t('common.loading') }}</div>
        <div v-else-if="!exhibits.length" class="world-empty">{{ $t('admin.noExhibits') }}</div>
        <div v-else class="world-records">
          <article v-for="exhibit in exhibits" :key="exhibit.id">
            <div class="region-swatch" :class="`region-${exhibit.region_id}`" />
            <div><span>{{ regionLabel(exhibit.region_id) }} · {{ exhibit.source_type }}</span><h4>{{ exhibit.label.zh || exhibit.source_key }}</h4><p>{{ exhibit.source_key }}</p><small>{{ exhibit.status }} / {{ exhibit.sort_order }}</small></div>
            <div class="record-actions"><button type="button" @click="editExhibit(exhibit)">{{ $t('admin.edit') }}</button><button type="button" class="danger" @click="removeExhibit(exhibit)">{{ $t('admin.delete') }}</button></div>
          </article>
        </div>
      </section>
    </template>

    <div v-if="projectEditorOpen" class="editor-overlay" @click.self="projectEditorOpen = false">
      <form class="editor-sheet" @submit.prevent="saveProject">
        <div class="editor-title"><div><span>PROJECT</span><h3>{{ projectForm.id ? $t('admin.editProject') : $t('admin.addProject') }}</h3></div><button type="button" @click="projectEditorOpen = false">×</button></div>
        <div class="field-pair"><label><span>Slug</span><input v-model="projectForm.slug" required /></label><label><span>URL</span><input v-model="projectForm.url" required /></label></div>
        <div class="field-pair"><label><span>{{ $t('admin.titleZh') }}</span><input v-model="projectForm.title.zh" required /></label><label><span>{{ $t('admin.titleEn') }}</span><input v-model="projectForm.title.en" /></label></div>
        <div class="field-pair"><label><span>{{ $t('admin.summaryZh') }}</span><textarea v-model="projectForm.summary.zh" rows="4" required /></label><label><span>{{ $t('admin.summaryEn') }}</span><textarea v-model="projectForm.summary.en" rows="4" /></label></div>
        <label><span>{{ $t('admin.imageUrl') }}</span><input v-model="projectForm.image_url" /></label>
        <label><span>{{ $t('admin.tagsComma') }}</span><input v-model="projectTags" /></label>
        <div class="field-pair"><label><span>{{ $t('admin.status') }}</span><select v-model="projectForm.status"><option value="published">{{ $t('admin.published') }}</option><option value="draft">{{ $t('admin.draft') }}</option></select></label><label><span>{{ $t('admin.sortOrder') }}</span><input v-model.number="projectForm.sort_order" type="number" /></label></div>
        <button class="action-btn action-btn-primary" type="submit" :disabled="isSaving">{{ $t('common.save') }}</button>
      </form>
    </div>

    <div v-if="exhibitEditorOpen" class="editor-overlay" @click.self="exhibitEditorOpen = false">
      <form class="editor-sheet" @submit.prevent="saveExhibit">
        <div class="editor-title"><div><span>WORLD EXHIBIT</span><h3>{{ exhibitForm.id ? $t('admin.editExhibit') : $t('admin.addExhibit') }}</h3></div><button type="button" @click="exhibitEditorOpen = false">×</button></div>
        <div class="field-pair"><label><span>{{ $t('admin.region') }}</span><select v-model="exhibitForm.region_id"><option value="workshop">{{ regionLabel('workshop') }}</option><option value="observatory">{{ regionLabel('observatory') }}</option><option value="memory-grove">{{ regionLabel('memory-grove') }}</option></select></label><label><span>{{ $t('admin.sourceType') }}</span><select v-model="exhibitForm.source_type"><option value="project">Project</option><option value="blog">Blog</option><option value="guestbook">Guestbook</option><option value="external">External</option></select></label></div>
        <label><span>{{ $t('admin.sourceKey') }}</span><input v-model="exhibitForm.source_key" required /></label>
        <div class="field-pair"><label><span>{{ $t('admin.labelZh') }}</span><input v-model="exhibitForm.label.zh" /></label><label><span>{{ $t('admin.labelEn') }}</span><input v-model="exhibitForm.label.en" /></label></div>
        <label><span>{{ $t('admin.overrideHref') }}</span><input v-model="exhibitForm.href" /></label>
        <div class="field-pair"><label><span>{{ $t('admin.status') }}</span><select v-model="exhibitForm.status"><option value="published">{{ $t('admin.published') }}</option><option value="draft">{{ $t('admin.draft') }}</option></select></label><label><span>{{ $t('admin.sortOrder') }}</span><input v-model.number="exhibitForm.sort_order" type="number" /></label></div>
        <button class="action-btn action-btn-primary" type="submit" :disabled="isSaving">{{ $t('common.save') }}</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { adminSettingsApi, contentAdminApi } from '../../utils/api'

const { t } = useI18n()
const activeTab = ref('profile')
const isLoading = ref(false)
const isSaving = ref(false)
const projects = ref([])
const exhibits = ref([])
const projectEditorOpen = ref(false)
const exhibitEditorOpen = ref(false)
const projectTags = ref('')
const profileResponsibilities = reactive({ zh: '', en: '' })
const status = reactive({ tone: 'neutral', message: '' })
const tabs = computed(() => [
  { id: 'profile', label: t('admin.publicProfile') },
  { id: 'projects', label: t('admin.projects') },
  { id: 'exhibits', label: t('admin.worldExhibits') }
])

const profileForm = reactive({ name: '', role: { zh: '', en: '' }, bio: { zh: '', en: '' } })
const emptyProject = () => ({ id: null, slug: '', title: { zh: '', en: '' }, summary: { zh: '', en: '' }, url: '', image_url: '', tags: [], status: 'published', sort_order: 0 })
const emptyExhibit = () => ({ id: null, region_id: 'workshop', source_type: 'project', source_key: '', label: { zh: '', en: '' }, href: '', status: 'published', sort_order: 0 })
const projectForm = reactive(emptyProject())
const exhibitForm = reactive(emptyExhibit())
const lines = value => String(value || '').split(/\r?\n/).map(item => item.trim()).filter(Boolean)

const setStatus = (tone, message) => { status.tone = tone; status.message = message }
const regionLabel = id => ({ workshop: t('admin.regionWorkshop'), observatory: t('admin.regionObservatory'), 'memory-grove': t('admin.regionGrove') }[id] || id)

async function loadContent() {
  isLoading.value = true
  try {
    const [settings, projectRecords, exhibitRecords] = await Promise.all([adminSettingsApi.get(), contentAdminApi.getProjects(), contentAdminApi.getWorldExhibits()])
    const owner = settings?.profile_content?.owner || {}
    profileForm.name = owner.name || ''
    profileForm.role.zh = owner.role?.zh || ''
    profileForm.role.en = owner.role?.en || ''
    profileForm.bio.zh = owner.bio?.zh || ''
    profileForm.bio.en = owner.bio?.en || ''
    profileResponsibilities.zh = (owner.responsibilities?.zh || []).join('\n')
    profileResponsibilities.en = (owner.responsibilities?.en || []).join('\n')
    projects.value = projectRecords
    exhibits.value = exhibitRecords
  } catch (error) { setStatus('danger', error.message || t('admin.loadFailed')) } finally { isLoading.value = false }
}

async function saveProfile() {
  isSaving.value = true
  try {
    await adminSettingsApi.update({ profile_content: { owner: { name: profileForm.name, role: profileForm.role, bio: profileForm.bio, responsibilities: { zh: lines(profileResponsibilities.zh), en: lines(profileResponsibilities.en) } } } })
    setStatus('success', t('admin.worldContentSaved'))
  } catch (error) { setStatus('danger', error.message) } finally { isSaving.value = false }
}

function editProject(project = null) {
  Object.assign(projectForm, emptyProject(), project || {})
  projectForm.title = { zh: project?.title?.zh || '', en: project?.title?.en || '' }
  projectForm.summary = { zh: project?.summary?.zh || '', en: project?.summary?.en || '' }
  projectTags.value = (project?.tags || []).join(', ')
  projectEditorOpen.value = true
}
async function saveProject() {
  isSaving.value = true
  try {
    const payload = { ...projectForm, tags: projectTags.value.split(',').map(tag => tag.trim()).filter(Boolean) }
    if (projectForm.id) await contentAdminApi.updateProject(projectForm.id, payload)
    else await contentAdminApi.createProject(payload)
    projectEditorOpen.value = false
    await loadContent()
    setStatus('success', t('admin.worldContentSaved'))
  } catch (error) { setStatus('danger', error.message) } finally { isSaving.value = false }
}
async function removeProject(project) { if (confirm(t('admin.confirmDelete'))) { await contentAdminApi.deleteProject(project.id); await loadContent() } }

function editExhibit(exhibit = null) {
  Object.assign(exhibitForm, emptyExhibit(), exhibit || {})
  exhibitForm.label = { zh: exhibit?.label?.zh || '', en: exhibit?.label?.en || '' }
  exhibitEditorOpen.value = true
}
async function saveExhibit() {
  isSaving.value = true
  try {
    if (exhibitForm.id) await contentAdminApi.updateWorldExhibit(exhibitForm.id, exhibitForm)
    else await contentAdminApi.createWorldExhibit(exhibitForm)
    exhibitEditorOpen.value = false
    await loadContent()
    setStatus('success', t('admin.worldContentSaved'))
  } catch (error) { setStatus('danger', error.message) } finally { isSaving.value = false }
}
async function removeExhibit(exhibit) { if (confirm(t('admin.confirmDelete'))) { await contentAdminApi.deleteWorldExhibit(exhibit.id); await loadContent() } }

onMounted(loadContent)
</script>

<style scoped>
.world-tabs { display: flex; border: 1px solid var(--border-strong); }
.world-tabs button { min-height: 40px; padding: 0 16px; border: 0; border-right: 1px solid var(--border-strong); background: transparent; color: var(--text-secondary); font-size: .78rem; cursor: pointer; }
.world-tabs button:last-child { border-right: 0; }
.world-tabs button.active { background: var(--theme-primary); color: white; }
.world-status { margin: 0; padding: .8rem 1rem; border-left: 3px solid currentColor; background: rgba(148, 163, 184, .08); font-size: .82rem; }
.world-status.is-success { color: #16a34a; }.world-status.is-danger { color: #dc2626; }
.world-form { display: grid; gap: 1.25rem; }
.world-form-heading, .world-section-head, .editor-title { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; }
.world-form-heading span, .world-section-head span, .editor-title span, .world-records article > div:nth-child(2) > span { color: var(--text-secondary); font: .65rem ui-monospace, monospace; letter-spacing: .08em; }
.world-form-heading h3, .world-section-head h3, .editor-title h3 { margin: .3rem 0 0; color: var(--text-main); font-size: 1.25rem; }
.field-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
label { display: grid; gap: .45rem; color: var(--text-secondary); font-size: .75rem; }
input, textarea, select { width: 100%; border: 1px solid var(--border-strong); border-radius: 6px; background: var(--bg-input); color: var(--text-main); padding: .7rem .75rem; font: inherit; }
textarea { resize: vertical; line-height: 1.6; }
.world-section-head { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-strong); }
.world-empty { padding: 3rem 1.5rem; color: var(--text-secondary); text-align: center; }
.world-records article { min-height: 130px; padding: 1.25rem 1.5rem; display: grid; grid-template-columns: 42px minmax(0, 1fr) auto; gap: 1rem; align-items: start; border-bottom: 1px solid var(--border-strong); }
.world-records article:last-child { border-bottom: 0; }
.record-order { color: var(--text-secondary); font: .7rem ui-monospace, monospace; }
.world-records h4 { margin: .45rem 0; color: var(--text-main); font-size: 1rem; }
.world-records p { margin: 0; color: var(--text-secondary); font-size: .8rem; line-height: 1.65; }
.world-records small { display: block; margin-top: .55rem; color: var(--text-muted); }
.record-actions { display: flex; gap: .5rem; }
.record-actions button { border: 1px solid var(--border-strong); background: transparent; color: var(--text-secondary); padding: .45rem .7rem; cursor: pointer; }
.record-actions button.danger { color: #dc2626; }
.region-swatch { width: 12px; height: 42px; background: #94a3b8; }.region-workshop { background: #ef8d63; }.region-observatory { background: #9ec5e8; }.region-memory-grove { background: #9fbd73; }
.editor-overlay { position: fixed; z-index: 80; inset: 0; padding: 1.5rem; display: grid; place-items: center; background: rgba(15, 23, 42, .65); backdrop-filter: blur(8px); }
.editor-sheet { width: min(780px, 100%); max-height: 92vh; overflow-y: auto; padding: 1.5rem; display: grid; gap: 1rem; border: 1px solid var(--border-strong); border-radius: 8px; background: var(--bg-card); box-shadow: 0 24px 80px rgba(15, 23, 42, .3); }
.editor-title > button { width: 36px; height: 36px; border: 1px solid var(--border-strong); background: transparent; color: var(--text-main); font-size: 1.4rem; cursor: pointer; }
@media (max-width: 700px) { .field-pair { grid-template-columns: 1fr; }.world-tabs { width: 100%; }.world-tabs button { min-width: 0; flex: 1; padding: 0 .4rem; }.world-records article { grid-template-columns: 22px minmax(0, 1fr); }.record-actions { grid-column: 2; }.world-section-head { align-items: flex-start; }.editor-overlay { padding: 0; }.editor-sheet { min-height: 100dvh; max-height: 100dvh; border-radius: 0; } }
</style>
