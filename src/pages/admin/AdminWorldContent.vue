<template>
  <div class="content-admin">
    <section class="admin-panel content-header">
      <div>
        <span class="section-kicker">PUBLIC RECORDS</span>
        <h2>{{ $t('admin.publicContent') }}</h2>
        <p>{{ $t('admin.publicContentCopy') }}</p>
      </div>
      <div class="dataset-counts" aria-label="Record counts">
        <span><b>{{ contacts.length }}</b>{{ $t('admin.contacts') }}</span>
        <span><b>{{ skills.length }}</b>{{ $t('admin.skills') }}</span>
        <span><b>{{ timelineRecords.length }}</b>{{ $t('admin.timeline') }}</span>
        <span><b>{{ projects.length }}</b>{{ $t('admin.projects') }}</span>
      </div>
    </section>

    <nav class="content-tabs" role="tablist" :aria-label="$t('admin.publicContent')">
      <button v-for="tab in tabs" :key="tab.id" type="button" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
        {{ tab.label }}
      </button>
    </nav>

    <p v-if="status.message" class="content-status" :class="`is-${status.tone}`" role="status">{{ status.message }}</p>

    <section v-if="activeTab === 'profile'" class="admin-panel content-section">
      <form class="record-form" @submit.prevent="saveProfile">
        <SectionHeading eyebrow="IDENTITY" :title="$t('admin.publicProfile')">
          <button class="action-btn action-btn-primary" type="submit" :disabled="isSaving">{{ $t('common.save') }}</button>
        </SectionHeading>
        <div class="field-grid two">
          <label><span>{{ $t('admin.profileNameZh') }}</span><input v-model="profileForm.name.zh" required /></label>
          <label><span>{{ $t('admin.profileNameEn') }}</span><input v-model="profileForm.name.en" required /></label>
          <label><span>{{ $t('admin.fullNameZh') }}</span><input v-model="profileForm.full_name.zh" required /></label>
          <label><span>{{ $t('admin.fullNameEn') }}</span><input v-model="profileForm.full_name.en" required /></label>
          <label><span>{{ $t('admin.headlineZh') }}</span><input v-model="profileForm.headline.zh" required /></label>
          <label><span>{{ $t('admin.headlineEn') }}</span><input v-model="profileForm.headline.en" required /></label>
          <label><span>{{ $t('admin.locationZh') }}</span><input v-model="profileForm.location.zh" required /></label>
          <label><span>{{ $t('admin.locationEn') }}</span><input v-model="profileForm.location.en" required /></label>
          <label><span>{{ $t('admin.summaryZh') }}</span><textarea v-model="profileForm.summary.zh" rows="5" required /></label>
          <label><span>{{ $t('admin.summaryEn') }}</span><textarea v-model="profileForm.summary.en" rows="5" required /></label>
        </div>
        <div class="field-grid three compact-grid">
          <label><span>{{ $t('admin.status') }}</span><select v-model="profileForm.status"><option value="published">{{ $t('admin.published') }}</option><option value="draft">{{ $t('admin.draft') }}</option></select></label>
          <label><span>{{ $t('admin.defaultLanguage') }}</span><select v-model="profileForm.settings.default_language"><option value="en">English</option><option value="zh">中文</option></select></label>
          <label><span>{{ $t('admin.pdfProjectLimit') }}</span><input v-model.number="profileForm.settings.pdf.project_limit" type="number" min="1" /></label>
          <label><span>{{ $t('admin.pdfFilenameZh') }}</span><input v-model="profileForm.settings.pdf.filename.zh" /></label>
          <label><span>{{ $t('admin.pdfFilenameEn') }}</span><input v-model="profileForm.settings.pdf.filename.en" /></label>
          <label><span>{{ $t('admin.avatarMediaId') }}</span><input v-model="profileForm.avatar_media_id" /></label>
        </div>
        <SurfacePicker v-model="profileForm.surfaces" :label="$t('admin.surfaces')" />
      </form>
    </section>

    <RecordSection v-else-if="activeTab === 'contacts'" eyebrow="CONTACT CHANNELS" :title="$t('admin.contacts')" :empty="!contacts.length" :empty-label="$t('admin.noContacts')" :add-label="$t('admin.addContact')" @add="editContact()">
      <RecordRow v-for="record in contacts" :key="record.id" :record="record" :title="record.label" :meta="`${record.type} · ${record.value}`" @edit="editContact(record)" @remove="removeContact(record)" />
    </RecordSection>

    <RecordSection v-else-if="activeTab === 'skills'" eyebrow="SKILL GROUPS" :title="$t('admin.skills')" :empty="!skills.length" :empty-label="$t('admin.noSkills')" :add-label="$t('admin.addSkill')" @add="editSkill()">
      <RecordRow v-for="record in skills" :key="record.id" :record="record" :title="record.name.zh" :meta="record.items.join(' · ')" @edit="editSkill(record)" @remove="removeSkill(record)" />
    </RecordSection>

    <RecordSection v-else-if="activeTab === 'timeline'" eyebrow="EXPERIENCE / EDUCATION" :title="$t('admin.timeline')" :empty="!timelineRecords.length" :empty-label="$t('admin.noTimeline')" :add-label="$t('admin.addTimeline')" @add="editTimeline()">
      <RecordRow v-for="record in timelineRecords" :key="record.id" :record="record" :title="record.title.zh" :meta="`${record.section === 'education' ? $t('admin.education') : $t('admin.experience')} · ${record.organization.zh} · ${record.start_date}`" @edit="editTimeline(record)" @remove="removeTimeline(record)" />
    </RecordSection>

    <RecordSection v-else-if="activeTab === 'projects'" eyebrow="PROJECT REGISTER" :title="$t('admin.projects')" :empty="!projects.length" :empty-label="$t('admin.noProjects')" :add-label="$t('admin.addProject')" @add="editProject()">
      <RecordRow v-for="record in projects" :key="record.id" :record="record" :title="record.title.zh" :meta="`${record.slug} · ${record.start_date || '—'} · ${record.involvement}`" :summary="record.summary.zh" @edit="editProject(record)" @remove="removeProject(record)" />
    </RecordSection>

    <RecordSection v-else eyebrow="SPATIAL PLACEMENT" :title="$t('admin.worldExhibits')" :empty="!exhibits.length" :empty-label="$t('admin.noExhibits')" :add-label="$t('admin.addExhibit')" @add="editExhibit()">
      <article v-for="record in exhibits" :key="record.id" class="record-row">
        <span class="region-mark" :class="`region-${record.region_id}`" />
        <div class="record-copy"><small>{{ regionLabel(record.region_id) }} · {{ record.source_type }}</small><h4>{{ record.label.zh || record.source_key }}</h4><p>{{ record.source_key }}</p></div>
        <div class="record-actions"><button type="button" @click="editExhibit(record)">{{ $t('admin.edit') }}</button><button type="button" class="danger" @click="removeExhibit(record)">{{ $t('admin.delete') }}</button></div>
      </article>
    </RecordSection>

    <Teleport to="body">
    <EditorShell v-if="contactEditorOpen" :title="contactForm.id ? $t('admin.editContact') : $t('admin.addContact')" eyebrow="CONTACT" @close="contactEditorOpen = false" @submit="saveContact">
      <div class="field-grid two"><label><span>{{ $t('admin.contactType') }}</span><select v-model="contactForm.type"><option v-for="type in contactTypes" :key="type" :value="type">{{ type }}</option></select></label><label><span>{{ $t('admin.contactLabel') }}</span><input v-model="contactForm.label" required /></label><label><span>{{ $t('admin.contactValue') }}</span><input v-model="contactForm.value" required /></label><label><span>URL</span><input v-model="contactForm.url" required /></label></div>
      <PublishFields v-model:status="contactForm.status" v-model:surfaces="contactForm.surfaces" v-model:sort-order="contactForm.sort_order" />
    </EditorShell>

    <EditorShell v-if="skillEditorOpen" :title="skillForm.id ? $t('admin.editSkill') : $t('admin.addSkill')" eyebrow="SKILL GROUP" @close="skillEditorOpen = false" @submit="saveSkill">
      <div class="field-grid two"><label><span>{{ $t('admin.nameZh') }}</span><input v-model="skillForm.name.zh" required /></label><label><span>{{ $t('admin.nameEn') }}</span><input v-model="skillForm.name.en" required /></label></div>
      <label><span>{{ $t('admin.itemsLines') }}</span><textarea v-model="skillItems" rows="7" required /></label>
      <PublishFields v-model:status="skillForm.status" v-model:surfaces="skillForm.surfaces" v-model:sort-order="skillForm.sort_order" />
    </EditorShell>

    <EditorShell v-if="timelineEditorOpen" :title="timelineForm.id ? $t('admin.editTimeline') : $t('admin.addTimeline')" eyebrow="TIMELINE" wide @close="timelineEditorOpen = false" @submit="saveTimeline">
      <div class="field-grid three"><label><span>{{ $t('admin.timelineSection') }}</span><select v-model="timelineForm.section"><option value="experience">{{ $t('admin.experience') }}</option><option value="education">{{ $t('admin.education') }}</option></select></label><label><span>{{ $t('admin.timelineKind') }}</span><select v-model="timelineForm.kind"><option v-for="kind in timelineKinds" :key="kind" :value="kind">{{ kind }}</option></select></label><label><span>{{ $t('admin.sortOrder') }}</span><input v-model.number="timelineForm.sort_order" type="number" /></label></div>
      <div class="field-grid two"><label><span>{{ $t('admin.organizationZh') }}</span><input v-model="timelineForm.organization.zh" required /></label><label><span>{{ $t('admin.organizationEn') }}</span><input v-model="timelineForm.organization.en" required /></label><label><span>{{ $t('admin.titleZh') }}</span><input v-model="timelineForm.title.zh" required /></label><label><span>{{ $t('admin.titleEn') }}</span><input v-model="timelineForm.title.en" required /></label><label><span>{{ $t('admin.locationZh') }}</span><input v-model="timelineForm.location.zh" /></label><label><span>{{ $t('admin.locationEn') }}</span><input v-model="timelineForm.location.en" /></label><label><span>{{ $t('admin.summaryZh') }}</span><textarea v-model="timelineForm.summary.zh" rows="4" required /></label><label><span>{{ $t('admin.summaryEn') }}</span><textarea v-model="timelineForm.summary.en" rows="4" required /></label><label><span>{{ $t('admin.highlightsZh') }}</span><textarea v-model="timelineHighlights.zh" rows="5" /></label><label><span>{{ $t('admin.highlightsEn') }}</span><textarea v-model="timelineHighlights.en" rows="5" /></label></div>
      <div class="field-grid three"><label><span>{{ $t('admin.startDate') }}</span><input v-model="timelineForm.start_date" placeholder="2026-01" required /></label><label><span>{{ $t('admin.endDate') }}</span><input v-model="timelineForm.end_date" placeholder="2026-12" /></label><label><span>{{ $t('admin.canonicalUrl') }}</span><input v-model="timelineForm.canonical_url" /></label></div>
      <PublishFields v-model:status="timelineForm.status" v-model:surfaces="timelineForm.surfaces" :sort-order="timelineForm.sort_order" hide-sort />
    </EditorShell>

    <EditorShell v-if="projectEditorOpen" :title="projectForm.id ? $t('admin.editProject') : $t('admin.addProject')" eyebrow="PROJECT" wide :submit-disabled="projectCoverUploading" @close="projectEditorOpen = false" @submit="saveProject">
      <div class="field-grid three"><label><span>Slug</span><input v-model="projectForm.slug" required /></label><label><span>{{ $t('admin.startDate') }}</span><input v-model="projectForm.start_date" placeholder="2026-01" required /></label><label><span>{{ $t('admin.endDate') }}</span><input v-model="projectForm.end_date" placeholder="2026-12" /></label></div>
      <div class="field-grid two"><label><span>{{ $t('admin.nameZh') }}</span><input v-model="projectForm.title.zh" required /></label><label><span>{{ $t('admin.nameEn') }}</span><input v-model="projectForm.title.en" required /></label><label><span>{{ $t('admin.summaryZh') }}</span><textarea v-model="projectForm.summary.zh" rows="4" required /></label><label><span>{{ $t('admin.summaryEn') }}</span><textarea v-model="projectForm.summary.en" rows="4" required /></label><label><span>{{ $t('admin.roleZh') }}</span><input v-model="projectForm.role.zh" /></label><label><span>{{ $t('admin.roleEn') }}</span><input v-model="projectForm.role.en" /></label><label><span>{{ $t('admin.highlightsZh') }}</span><textarea v-model="projectHighlights.zh" rows="5" /></label><label><span>{{ $t('admin.highlightsEn') }}</span><textarea v-model="projectHighlights.en" rows="5" /></label></div>
      <div class="field-grid three"><label><span>{{ $t('admin.involvement') }}</span><select v-model="projectForm.involvement"><option value="creator">creator</option><option value="contributor">contributor</option><option value="collaborator">collaborator</option></select></label><label><span>{{ $t('admin.technologiesComma') }}</span><input v-model="projectTechnologies" /></label><label><span>{{ $t('admin.tagsComma') }}</span><input v-model="projectTags" /></label></div>
      <div class="field-grid two"><label><span>{{ $t('admin.sourceUrl') }}</span><input v-model="projectLinks.source" /></label><label><span>{{ $t('admin.demoUrl') }}</span><input v-model="projectLinks.demo" /></label><label><span>{{ $t('admin.caseStudyUrl') }}</span><input v-model="projectLinks.case_study" /></label><label><span>{{ $t('admin.canonicalUrl') }}</span><input v-model="projectForm.url" required /></label></div>
      <ProjectCoverPicker v-model="projectForm.image_url" :media="projectMediaOptions" :alt="projectForm.title.zh || projectForm.title.en" @uploading="projectCoverUploading = $event" />
      <label><span>{{ $t('admin.galleryLines') }}</span><textarea v-model="projectGallery" rows="4" /></label>
      <div class="featured-row"><label><input v-model="projectForm.featured" type="checkbox" />{{ $t('admin.featured') }}</label></div>
      <PublishFields v-model:status="projectForm.status" v-model:surfaces="projectForm.surfaces" v-model:sort-order="projectForm.sort_order" />
    </EditorShell>

    <EditorShell v-if="exhibitEditorOpen" :title="exhibitForm.id ? $t('admin.editExhibit') : $t('admin.addExhibit')" eyebrow="WORLD EXHIBIT" @close="exhibitEditorOpen = false" @submit="saveExhibit">
      <div class="field-grid two"><label><span>{{ $t('admin.region') }}</span><select v-model="exhibitForm.region_id"><option value="workshop">{{ regionLabel('workshop') }}</option><option value="observatory">{{ regionLabel('observatory') }}</option><option value="memory-grove">{{ regionLabel('memory-grove') }}</option></select></label><label><span>{{ $t('admin.sourceType') }}</span><select v-model="exhibitForm.source_type"><option value="project">Project</option><option value="blog">Blog</option><option value="guestbook">Guestbook</option><option value="external">External</option></select></label><label><span>{{ $t('admin.sourceKey') }}</span><input v-model="exhibitForm.source_key" required /></label><label><span>{{ $t('admin.overrideHref') }}</span><input v-model="exhibitForm.href" /></label><label><span>{{ $t('admin.labelZh') }}</span><input v-model="exhibitForm.label.zh" /></label><label><span>{{ $t('admin.labelEn') }}</span><input v-model="exhibitForm.label.en" /></label></div>
      <div class="field-grid two"><label><span>{{ $t('admin.status') }}</span><select v-model="exhibitForm.status"><option value="published">{{ $t('admin.published') }}</option><option value="draft">{{ $t('admin.draft') }}</option></select></label><label><span>{{ $t('admin.sortOrder') }}</span><input v-model.number="exhibitForm.sort_order" type="number" /></label></div>
    </EditorShell>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { contentAdminApi } from '../../utils/api'
import ProjectCoverPicker from '../../components/admin/ProjectCoverPicker.vue'
import SurfacePicker from '../../components/admin/SurfacePicker.vue'

const { t } = useI18n()
const activeTab = ref('profile')
const isSaving = ref(false)
const contacts = ref([])
const skills = ref([])
const experience = ref([])
const education = ref([])
const projects = ref([])
const exhibits = ref([])
const status = reactive({ tone: 'neutral', message: '' })
const timelineRecords = computed(() => [...experience.value, ...education.value].sort((a, b) => a.sort_order - b.sort_order))
const projectMediaOptions = computed(() => projects.value.flatMap(record => {
  const title = record.title?.zh || record.title?.en || record.slug
  const cover = record.image_url ? [{ url: record.image_url, label: `${title} · ${t('admin.projectCover')}` }] : []
  const gallery = (record.gallery || []).map((media, index) => ({
    ...media,
    label: media.alt?.zh || media.alt?.en || `${title} · ${t('admin.galleryImage')} ${index + 1}`
  }))
  return [...cover, ...gallery]
}))
const tabs = computed(() => [
  { id: 'profile', label: t('admin.publicProfile') },
  { id: 'contacts', label: t('admin.contacts') },
  { id: 'skills', label: t('admin.skills') },
  { id: 'timeline', label: t('admin.timeline') },
  { id: 'projects', label: t('admin.projects') },
  { id: 'exhibits', label: t('admin.worldExhibits') }
])
const allSurfaces = ['portfolio', 'resume_web', 'resume_pdf', 'gellaria']
const resumeSurfaces = ['resume_web', 'resume_pdf']
const lines = value => String(value || '').split(/\r?\n/).map(item => item.trim()).filter(Boolean)
const csv = value => String(value || '').split(',').map(item => item.trim()).filter(Boolean)
const clone = value => JSON.parse(JSON.stringify(value))
const setStatus = (tone, message) => Object.assign(status, { tone, message })
const replaceForm = (target, value) => { Object.keys(target).forEach(key => delete target[key]); Object.assign(target, clone(value)) }
const regionLabel = id => ({ workshop: t('admin.regionWorkshop'), observatory: t('admin.regionObservatory'), 'memory-grove': t('admin.regionGrove') }[id] || id)

const emptyProfile = () => ({ name: { zh: '', en: '' }, full_name: { zh: '', en: '' }, headline: { zh: '', en: '' }, location: { zh: '', en: '' }, summary: { zh: '', en: '' }, avatar_media_id: '', status: 'draft', surfaces: [], settings: { default_language: 'en', pdf: { project_limit: 6, filename: { zh: 'Gellar-Resume-ZH.pdf', en: 'Gellar-Resume-EN.pdf' } } } })
const profileForm = reactive(emptyProfile())
const emptyContact = () => ({ id: null, type: 'email', label: '', value: '', url: '', status: 'published', surfaces: [...resumeSurfaces], sort_order: 0 })
const contactForm = reactive(emptyContact())
const contactTypes = ['email', 'phone', 'website', 'github', 'linkedin', 'location', 'other']
const contactEditorOpen = ref(false)
const emptySkill = () => ({ id: null, name: { zh: '', en: '' }, items: [], status: 'published', surfaces: [...resumeSurfaces], sort_order: 0 })
const skillForm = reactive(emptySkill())
const skillItems = ref('')
const skillEditorOpen = ref(false)
const emptyTimeline = () => ({ id: null, section: 'experience', kind: 'employment', organization: { zh: '', en: '' }, title: { zh: '', en: '' }, location: { zh: '', en: '' }, summary: { zh: '', en: '' }, highlights: { zh: [], en: [] }, start_date: '', end_date: '', canonical_url: '', status: 'published', surfaces: [...resumeSurfaces], sort_order: 0 })
const timelineForm = reactive(emptyTimeline())
const timelineHighlights = reactive({ zh: '', en: '' })
const timelineKinds = ['employment', 'education', 'volunteering', 'award', 'other']
const timelineEditorOpen = ref(false)
const emptyProject = () => ({ id: null, slug: '', title: { zh: '', en: '' }, summary: { zh: '', en: '' }, role: { zh: '', en: '' }, start_date: '', end_date: '', involvement: 'creator', technologies: [], highlights: { zh: [], en: [] }, links: [], url: '', image_url: '', gallery: [], tags: [], featured: false, status: 'published', surfaces: [...allSurfaces], sort_order: 0 })
const projectForm = reactive(emptyProject())
const projectTechnologies = ref('')
const projectTags = ref('')
const projectGallery = ref('')
const projectHighlights = reactive({ zh: '', en: '' })
const projectLinks = reactive({ source: '', demo: '', case_study: '' })
const projectEditorOpen = ref(false)
const projectCoverUploading = ref(false)
const emptyExhibit = () => ({ id: null, region_id: 'workshop', source_type: 'project', source_key: '', label: { zh: '', en: '' }, href: '', status: 'published', sort_order: 0 })
const exhibitForm = reactive(emptyExhibit())
const exhibitEditorOpen = ref(false)

async function loadContent() {
  try {
    const [resume, projectRecords, exhibitRecords] = await Promise.all([contentAdminApi.getResume(), contentAdminApi.getProjects(), contentAdminApi.getWorldExhibits()])
    replaceForm(profileForm, resume.profile || emptyProfile())
    contacts.value = resume.contacts || []
    skills.value = resume.skills || []
    experience.value = resume.experience || []
    education.value = resume.education || []
    projects.value = projectRecords
    exhibits.value = exhibitRecords
  } catch (error) { setStatus('danger', error.message || t('admin.loadFailed')) }
}

async function withSave(operation, close) {
  isSaving.value = true
  try { await operation(); if (close) close.value = false; await loadContent(); setStatus('success', t('admin.publicContentSaved')) }
  catch (error) { setStatus('danger', error.message) }
  finally { isSaving.value = false }
}
const saveProfile = () => withSave(() => contentAdminApi.updateResumeProfile(profileForm))
function editContact(record = null) { replaceForm(contactForm, record || emptyContact()); contactEditorOpen.value = true }
const saveContact = () => withSave(() => contactForm.id ? contentAdminApi.updateResumeContact(contactForm.id, contactForm) : contentAdminApi.createResumeContact(contactForm), contactEditorOpen)
async function removeContact(record) { if (confirm(t('admin.confirmDelete'))) { await contentAdminApi.deleteResumeContact(record.id); await loadContent() } }
function editSkill(record = null) { replaceForm(skillForm, record || emptySkill()); skillItems.value = (record?.items || []).join('\n'); skillEditorOpen.value = true }
const saveSkill = () => withSave(() => { const payload = { ...skillForm, items: lines(skillItems.value) }; return skillForm.id ? contentAdminApi.updateResumeSkill(skillForm.id, payload) : contentAdminApi.createResumeSkill(payload) }, skillEditorOpen)
async function removeSkill(record) { if (confirm(t('admin.confirmDelete'))) { await contentAdminApi.deleteResumeSkill(record.id); await loadContent() } }
function editTimeline(record = null) { const source = record ? { ...record, location: record.location || { zh: '', en: '' } } : emptyTimeline(); replaceForm(timelineForm, source); timelineHighlights.zh = (record?.highlights?.zh || []).join('\n'); timelineHighlights.en = (record?.highlights?.en || []).join('\n'); timelineEditorOpen.value = true }
const saveTimeline = () => withSave(() => { const payload = { ...timelineForm, highlights: { zh: lines(timelineHighlights.zh), en: lines(timelineHighlights.en) } }; return timelineForm.id ? contentAdminApi.updateResumeTimeline(timelineForm.id, payload) : contentAdminApi.createResumeTimeline(payload) }, timelineEditorOpen)
async function removeTimeline(record) { if (confirm(t('admin.confirmDelete'))) { await contentAdminApi.deleteResumeTimeline(record.id); await loadContent() } }
function editProject(record = null) {
  const source = record ? { ...record, role: record.role || { zh: '', en: '' } } : emptyProject()
  replaceForm(projectForm, source)
  projectTechnologies.value = (record?.technologies || []).join(', ')
  projectTags.value = (record?.tags || []).join(', ')
  projectGallery.value = (record?.gallery || []).map(media => media.url).join('\n')
  projectHighlights.zh = (record?.highlights?.zh || []).join('\n')
  projectHighlights.en = (record?.highlights?.en || []).join('\n')
  Object.assign(projectLinks, { source: '', demo: '', case_study: '' }, Object.fromEntries((record?.links || []).map(link => [link.kind, link.url])))
  projectCoverUploading.value = false
  projectEditorOpen.value = true
}
const saveProject = () => withSave(() => {
  const links = Object.entries(projectLinks).filter(([, url]) => url).map(([kind, url]) => ({ kind, url }))
  const payload = { ...projectForm, technologies: csv(projectTechnologies.value), tags: csv(projectTags.value), highlights: { zh: lines(projectHighlights.zh), en: lines(projectHighlights.en) }, links, gallery: lines(projectGallery.value) }
  return projectForm.id ? contentAdminApi.updateProject(projectForm.id, payload) : contentAdminApi.createProject(payload)
}, projectEditorOpen)
async function removeProject(record) { if (confirm(t('admin.confirmDelete'))) { await contentAdminApi.deleteProject(record.id); await loadContent() } }
function editExhibit(record = null) { replaceForm(exhibitForm, record || emptyExhibit()); exhibitEditorOpen.value = true }
const saveExhibit = () => withSave(() => exhibitForm.id ? contentAdminApi.updateWorldExhibit(exhibitForm.id, exhibitForm) : contentAdminApi.createWorldExhibit(exhibitForm), exhibitEditorOpen)
async function removeExhibit(record) { if (confirm(t('admin.confirmDelete'))) { await contentAdminApi.deleteWorldExhibit(record.id); await loadContent() } }

const surfaceColors = { portfolio: '#0f766e', resume_web: '#2563eb', resume_pdf: '#7c3aed', gellaria: '#d97706' }
const SectionHeading = defineComponent({ props: { eyebrow: String, title: String }, setup(props, { slots }) { return () => h('div', { class: 'section-heading' }, [h('div', [h('span', props.eyebrow), h('h3', props.title)]), slots.default?.()]) } })
const RecordSection = defineComponent({ props: { eyebrow: String, title: String, empty: Boolean, emptyLabel: String, addLabel: String }, emits: ['add'], setup(props, { slots, emit }) { return () => h('section', { class: 'admin-panel record-section' }, [h('div', { class: 'section-heading section-pad' }, [h('div', [h('span', props.eyebrow), h('h3', props.title)]), h('button', { class: 'action-btn action-btn-primary', type: 'button', onClick: () => emit('add') }, props.addLabel)]), props.empty ? h('div', { class: 'empty-state' }, props.emptyLabel) : h('div', { class: 'record-list' }, slots.default?.())]) } })
const RecordRow = defineComponent({ props: { record: Object, title: String, meta: String, summary: String }, emits: ['edit', 'remove'], setup(props, { emit }) { return () => h('article', { class: 'record-row' }, [h('div', { class: 'surface-rail', 'aria-label': 'Surfaces' }, (props.record.surfaces || []).map(surface => h('span', { title: surface, style: { background: surfaceColors[surface] } }))), h('div', { class: 'record-copy' }, [h('small', `${props.meta} · ${props.record.status}`), h('h4', props.title), props.summary ? h('p', props.summary) : null]), h('div', { class: 'record-actions' }, [h('button', { type: 'button', onClick: () => emit('edit') }, t('admin.edit')), h('button', { type: 'button', class: 'danger', onClick: () => emit('remove') }, t('admin.delete'))])]) } })
const EditorShell = defineComponent({ props: { title: String, eyebrow: String, wide: Boolean, submitDisabled: Boolean }, emits: ['close', 'submit'], setup(props, { slots, emit }) { return () => h('div', { class: 'editor-overlay', onClick: event => { if (event.target === event.currentTarget) emit('close') } }, [h('form', { class: ['editor-sheet', { wide: props.wide }], onSubmit: event => { event.preventDefault(); if (!isSaving.value && !props.submitDisabled) emit('submit') } }, [h('div', { class: 'editor-heading' }, [h('div', [h('span', props.eyebrow), h('h3', props.title)]), h('button', { type: 'button', 'aria-label': t('common.close'), onClick: () => emit('close') }, '×')]), ...(slots.default?.() || []), h('button', { class: 'action-btn action-btn-primary save-editor', type: 'submit', disabled: isSaving.value || props.submitDisabled }, t('common.save'))])]) } })
const PublishFields = defineComponent({ props: { status: String, surfaces: Array, sortOrder: Number, hideSort: Boolean }, emits: ['update:status', 'update:surfaces', 'update:sortOrder'], setup(props, { emit }) { return () => h('div', { class: 'publish-fields' }, [h('label', [h('span', t('admin.status')), h('select', { value: props.status, onChange: event => emit('update:status', event.target.value) }, [h('option', { value: 'published' }, t('admin.published')), h('option', { value: 'draft' }, t('admin.draft'))])]), props.hideSort ? null : h('label', [h('span', t('admin.sortOrder')), h('input', { type: 'number', value: props.sortOrder, onInput: event => emit('update:sortOrder', Number(event.target.value)) })]), h(SurfacePicker, { modelValue: props.surfaces, label: t('admin.surfaces'), 'onUpdate:modelValue': value => emit('update:surfaces', value) })]) } })

onMounted(loadContent)
</script>

<style scoped>
.content-admin { display: grid; gap: 1rem; }
.content-header { min-height: 118px; padding: 1.35rem 1.5rem; display: flex; align-items: end; justify-content: space-between; gap: 1.5rem; border-radius: 8px; }
.content-header h2 { margin: .35rem 0; color: var(--text-main); font-size: 1.45rem; }.content-header p { margin: 0; color: var(--text-secondary); font-size: .82rem; }
.dataset-counts { display: grid; grid-template-columns: repeat(4, minmax(76px, 1fr)); border: 1px solid var(--border-strong); }.dataset-counts span { min-width: 76px; padding: .65rem .8rem; display: grid; gap: .15rem; border-right: 1px solid var(--border-strong); color: var(--text-secondary); font-size: .65rem; }.dataset-counts span:last-child { border-right: 0; }.dataset-counts b { color: var(--text-main); font: 600 1.05rem ui-monospace, monospace; }
.content-tabs { display: flex; overflow-x: auto; border: 1px solid var(--border-strong); background: var(--bg-card); }.content-tabs button { min-width: 110px; height: 42px; padding: 0 1rem; flex: 1; border: 0; border-right: 1px solid var(--border-strong); background: transparent; color: var(--text-secondary); font-size: .75rem; cursor: pointer; white-space: nowrap; }.content-tabs button:last-child { border-right: 0; }.content-tabs button.active { background: var(--theme-primary); color: white; }
.content-tabs button:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible { outline: 2px solid var(--theme-primary); outline-offset: 2px; }
.content-status { margin: 0; padding: .75rem 1rem; border-left: 3px solid currentColor; background: color-mix(in srgb, currentColor 7%, transparent); font-size: .78rem; }.content-status.is-success { color: #16803c; }.content-status.is-danger { color: #c62f3f; }
.content-section, .record-section { border-radius: 8px; overflow: hidden; }.content-section { padding: 1.5rem; }.record-form { display: grid; gap: 1.25rem; }
.section-heading, .editor-heading { display: flex; align-items: end; justify-content: space-between; gap: 1rem; }.section-heading span, .editor-heading span, .record-copy small { color: var(--text-muted); font: .64rem ui-monospace, monospace; letter-spacing: .08em; }.section-heading h3, .editor-heading h3 { margin: .3rem 0 0; color: var(--text-main); font-size: 1.1rem; }.section-pad { padding: 1.05rem 1.25rem; border-bottom: 1px solid var(--border-strong); }
.field-grid { display: grid; gap: .9rem; }.field-grid.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }.field-grid.three { grid-template-columns: repeat(3, minmax(0, 1fr)); }.compact-grid { padding-top: 1rem; border-top: 1px solid var(--border-strong); }
label { display: grid; gap: .4rem; color: var(--text-secondary); font-size: .72rem; }input, textarea, select { width: 100%; min-height: 40px; padding: .62rem .7rem; border: 1px solid var(--border-strong); border-radius: 6px; background: var(--bg-input); color: var(--text-main); font: inherit; }textarea { line-height: 1.55; resize: vertical; }
.record-list { display: grid; }.record-row { min-height: 96px; padding: 1rem 1.25rem; display: grid; grid-template-columns: 16px minmax(0, 1fr) auto; align-items: start; gap: 1rem; border-bottom: 1px solid var(--border-strong); }.record-row:last-child { border-bottom: 0; }.surface-rail { min-height: 54px; display: flex; gap: 2px; }.surface-rail span { width: 3px; min-height: 34px; }.region-mark { width: 8px; height: 52px; background: #94a3b8; }.region-workshop { background: #e56f45; }.region-observatory { background: #4a89ba; }.region-memory-grove { background: #6d973c; }
.record-copy { min-width: 0; }.record-copy h4 { margin: .35rem 0; color: var(--text-main); font-size: .92rem; }.record-copy p { margin: 0; max-width: 78ch; color: var(--text-secondary); font-size: .77rem; line-height: 1.55; }.record-actions { display: flex; gap: .45rem; }.record-actions button { min-height: 34px; padding: 0 .65rem; border: 1px solid var(--border-strong); background: transparent; color: var(--text-secondary); cursor: pointer; }.record-actions button.danger { color: #c62f3f; }.empty-state { padding: 3rem 1rem; color: var(--text-secondary); text-align: center; font-size: .82rem; }
.editor-overlay { position: fixed; z-index: 90; inset: 0; padding: 1.25rem; display: grid; place-items: center; background: rgba(10, 18, 30, .72); backdrop-filter: blur(7px); }.editor-sheet { width: min(680px, 100%); max-height: 92dvh; overflow-y: auto; padding: 1.35rem; display: grid; grid-auto-rows: max-content; gap: 1rem; border: 1px solid var(--border-strong); border-radius: 8px; background: var(--bg-card); box-shadow: 0 24px 72px rgba(0, 0, 0, .28); }.editor-sheet.wide { width: min(980px, 100%); }.editor-heading { padding-bottom: .9rem; border-bottom: 1px solid var(--border-strong); }.editor-heading button { width: 36px; height: 36px; border: 1px solid var(--border-strong); background: transparent; color: var(--text-main); font-size: 1.3rem; cursor: pointer; }.save-editor { justify-self: end; min-width: 112px; }.publish-fields { padding-top: 1rem; display: grid; grid-template-columns: 160px 120px minmax(0, 1fr); gap: 1rem; align-items: end; border-top: 1px solid var(--border-strong); }.featured-row label { display: inline-flex; grid-auto-flow: column; justify-content: start; align-items: center; gap: .5rem; }.featured-row input { width: 18px; min-height: 18px; }

/* Locally defined render components do not inherit this SFC's scope attribute. */
.content-admin :deep(.section-heading), .content-admin :deep(.editor-heading) { display: flex; align-items: end; justify-content: space-between; gap: 1rem; }
.content-admin :deep(.section-heading span), .content-admin :deep(.editor-heading span), .content-admin :deep(.record-copy small) { color: var(--text-muted); font: .64rem ui-monospace, monospace; letter-spacing: .08em; }
.content-admin :deep(.section-heading h3), .content-admin :deep(.editor-heading h3) { margin: .3rem 0 0; color: var(--text-main); font-size: 1.1rem; }
.content-admin :deep(.section-pad) { padding: 1.05rem 1.25rem; border-bottom: 1px solid var(--border-strong); }
.content-admin :deep(.record-section) { border-radius: 8px; overflow: hidden; }
.content-admin :deep(.record-list) { display: grid; }
.content-admin :deep(.record-row) { min-height: 96px; padding: 1rem 1.25rem; display: grid; grid-template-columns: 16px minmax(0, 1fr) auto; align-items: start; gap: 1rem; border-bottom: 1px solid var(--border-strong); }
.content-admin :deep(.record-row:last-child) { border-bottom: 0; }
.content-admin :deep(.surface-rail) { min-height: 54px; display: flex; gap: 2px; }
.content-admin :deep(.surface-rail span) { width: 3px; min-height: 34px; }
.content-admin :deep(.record-copy) { min-width: 0; }
.content-admin :deep(.record-copy h4) { margin: .35rem 0; color: var(--text-main); font-size: .92rem; }
.content-admin :deep(.record-copy p) { margin: 0; max-width: 78ch; color: var(--text-secondary); font-size: .77rem; line-height: 1.55; }
.content-admin :deep(.record-actions) { display: flex; gap: .45rem; }
.content-admin :deep(.record-actions button) { min-height: 34px; padding: 0 .65rem; border: 1px solid var(--border-strong); background: transparent; color: var(--text-secondary); cursor: pointer; }
.content-admin :deep(.record-actions button.danger) { color: #c62f3f; }
.content-admin :deep(.empty-state) { padding: 3rem 1rem; color: var(--text-secondary); text-align: center; font-size: .82rem; }
.content-admin :deep(.editor-overlay) { position: fixed; z-index: 90; inset: 0; padding: 1.25rem; display: grid; place-items: center; background: rgba(10, 18, 30, .72); backdrop-filter: blur(7px); }
.content-admin :deep(.editor-sheet) { width: min(680px, 100%); max-height: 92dvh; overflow-y: auto; padding: 1.35rem; display: grid; grid-auto-rows: max-content; gap: 1rem; border: 1px solid var(--border-strong); border-radius: 8px; background: var(--bg-card); box-shadow: 0 24px 72px rgba(0, 0, 0, .28); }
.content-admin :deep(.editor-sheet.wide) { width: min(980px, 100%); }
.content-admin :deep(.editor-heading) { padding-bottom: .9rem; border-bottom: 1px solid var(--border-strong); }
.content-admin :deep(.editor-heading button) { width: 36px; height: 36px; border: 1px solid var(--border-strong); background: transparent; color: var(--text-main); font-size: 1.3rem; cursor: pointer; }
.content-admin :deep(.save-editor) { justify-self: end; min-width: 112px; }
.content-admin :deep(.publish-fields) { padding-top: 1rem; display: grid; grid-template-columns: 160px 120px minmax(0, 1fr); gap: 1rem; align-items: end; border-top: 1px solid var(--border-strong); }
:global(.editor-overlay) { position: fixed; z-index: 90; inset: 0; padding: 1.25rem; display: grid; place-items: center; background: rgba(10, 18, 30, .72); backdrop-filter: blur(7px); }
:global(.editor-sheet) { width: min(680px, 100%); max-height: 92dvh; overflow-y: auto; padding: 1.35rem; display: grid; grid-auto-rows: max-content; gap: 1rem; border: 1px solid var(--border-strong); border-radius: 8px; background: var(--bg-card); box-shadow: 0 24px 72px rgba(0, 0, 0, .28); }
:global(.editor-sheet.wide) { width: min(980px, 100%); }
:global(.editor-heading) { padding-bottom: .9rem; display: flex; align-items: end; justify-content: space-between; gap: 1rem; border-bottom: 1px solid var(--border-strong); }
:global(.editor-heading span) { color: var(--text-muted); font: .64rem ui-monospace, monospace; letter-spacing: .08em; }
:global(.editor-heading h3) { margin: .3rem 0 0; color: var(--text-main); font-size: 1.1rem; }
:global(.editor-heading button) { width: 36px; height: 36px; border: 1px solid var(--border-strong); background: transparent; color: var(--text-main); font-size: 1.3rem; cursor: pointer; }
:global(.editor-sheet label) { display: grid; gap: .4rem; color: var(--text-secondary); font-size: .72rem; }
:global(.editor-sheet input:not([type='checkbox'])), :global(.editor-sheet textarea), :global(.editor-sheet select) { width: 100%; min-height: 40px; padding: .62rem .7rem; border: 1px solid var(--border-strong); border-radius: 6px; background: var(--bg-input); color: var(--text-main); font: inherit; }
:global(.editor-sheet textarea) { line-height: 1.55; resize: vertical; }
:global(.editor-sheet .featured-row label) { display: inline-flex; justify-content: start; align-items: center; gap: .5rem; }
:global(.editor-sheet .featured-row input[type='checkbox']) { width: 18px; min-height: 18px; }
:global(.save-editor) { justify-self: end; min-width: 112px; }
:global(.publish-fields) { padding-top: 1rem; display: grid; grid-template-columns: 160px 120px minmax(0, 1fr); gap: 1rem; align-items: end; border-top: 1px solid var(--border-strong); }
@media (max-width: 860px) { .content-header { align-items: start; flex-direction: column; }.dataset-counts { width: 100%; }.field-grid.three { grid-template-columns: 1fr 1fr; }.publish-fields { grid-template-columns: 1fr 1fr; } }
@media (max-width: 860px) { .content-admin :deep(.publish-fields) { grid-template-columns: 1fr 1fr; } }
@media (max-width: 860px) { :global(.publish-fields) { grid-template-columns: 1fr 1fr; } }
@media (max-width: 620px) { .content-header { padding: 1rem; }.dataset-counts { grid-template-columns: 1fr 1fr; }.dataset-counts span:nth-child(2) { border-right: 0; }.dataset-counts span:nth-child(-n+2) { border-bottom: 1px solid var(--border-strong); }.content-tabs button { min-width: 100px; }.field-grid.two, .field-grid.three, .publish-fields { grid-template-columns: 1fr; }.record-row { grid-template-columns: 10px minmax(0, 1fr); }.record-actions { grid-column: 2; }.editor-overlay { padding: 0; }.editor-sheet, .editor-sheet.wide { width: 100%; min-height: 100dvh; max-height: 100dvh; border-radius: 0; }.save-editor { width: 100%; }.surface-rail { min-height: 44px; }.content-admin :deep(.record-row) { grid-template-columns: 10px minmax(0, 1fr); }.content-admin :deep(.record-actions) { grid-column: 2; }.content-admin :deep(.editor-overlay) { padding: 0; }.content-admin :deep(.editor-sheet), .content-admin :deep(.editor-sheet.wide) { width: 100%; min-height: 100dvh; max-height: 100dvh; border-radius: 0; }.content-admin :deep(.save-editor) { width: 100%; }.content-admin :deep(.surface-rail) { min-height: 44px; }.content-admin :deep(.publish-fields) { grid-template-columns: 1fr; } }
@media (max-width: 620px) { :global(.editor-overlay) { padding: 0; }:global(.editor-overlay .editor-sheet) { width: 100%; min-height: 100dvh; max-height: 100dvh; border-radius: 0; }:global(.editor-overlay .save-editor) { width: 100%; }:global(.editor-overlay .publish-fields) { grid-template-columns: 1fr; } }
@media (prefers-reduced-motion: reduce) { * { scroll-behavior: auto !important; } }
</style>
