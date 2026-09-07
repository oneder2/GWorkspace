import express from 'express'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { Project } from '../models/Project.js'
import { WorldExhibit } from '../models/WorldExhibit.js'
import { GellariaProjectModel } from '../models/GellariaProjectModel.js'
import { Resume, RESUME_SURFACES } from '../models/Resume.js'
import { projectWithWorldModel, refreshProjectWorldModel } from '../services/gellariaModeling.js'

const router = express.Router()
router.use(authenticate)
router.use(requireAdmin)

const sendValidationError = (res, message) => res.status(400).json({ error: message })
const sendRecord = (res, operation, { created = false } = {}) => {
  try {
    const record = operation()
    if (!record) return res.status(404).json({ error: 'Record not found' })
    return res.status(created ? 201 : 200).json(record)
  } catch (error) {
    return sendValidationError(res, error.message)
  }
}

router.get('/resume', (req, res) => res.json({
  profile: Resume.getProfile(),
  contacts: Resume.getContacts(),
  skills: Resume.getSkills(),
  experience: Resume.getTimeline({ section: 'experience' }),
  education: Resume.getTimeline({ section: 'education' }),
  surfaces: RESUME_SURFACES
}))
router.put('/resume/profile', (req, res) => sendRecord(res, () => Resume.updateProfile(req.body || {})))

router.post('/resume/contacts', (req, res) => sendRecord(res, () => Resume.createContact(req.body || {}), { created: true }))
router.put('/resume/contacts/:id', (req, res) => sendRecord(res, () => Resume.updateContact(Number(req.params.id), req.body || {})))
router.delete('/resume/contacts/:id', (req, res) => (
  Resume.deleteContact(Number(req.params.id)) ? res.json({ deleted: true }) : res.status(404).json({ error: 'Contact not found' })
))

router.post('/resume/skills', (req, res) => sendRecord(res, () => Resume.createSkill(req.body || {}), { created: true }))
router.put('/resume/skills/:id', (req, res) => sendRecord(res, () => Resume.updateSkill(Number(req.params.id), req.body || {})))
router.delete('/resume/skills/:id', (req, res) => (
  Resume.deleteSkill(Number(req.params.id)) ? res.json({ deleted: true }) : res.status(404).json({ error: 'Skill group not found' })
))

router.post('/resume/timeline', (req, res) => sendRecord(res, () => Resume.createTimeline(req.body || {}), { created: true }))
router.put('/resume/timeline/:id', (req, res) => sendRecord(res, () => Resume.updateTimeline(Number(req.params.id), req.body || {})))
router.delete('/resume/timeline/:id', (req, res) => (
  Resume.deleteTimeline(Number(req.params.id)) ? res.json({ deleted: true }) : res.status(404).json({ error: 'Timeline entry not found' })
))

router.get('/projects', (req, res) => res.json(Project.getAll({ status: null }).map(projectWithWorldModel)))
router.get('/project-model-jobs', (req, res) => res.json(GellariaProjectModel.listJobs()))
router.post('/projects', async (req, res) => {
  const { slug, url } = req.body || {}
  const title = req.body?.title?.zh ?? req.body?.title_zh
  const summary = req.body?.summary?.zh ?? req.body?.summary_zh
  if (!slug || !url || !title || !summary) return sendValidationError(res, 'slug, url, title.zh and summary.zh are required')
  try {
    const project = Project.create(req.body)
    await refreshProjectWorldModel(project.id)
    return res.status(201).json(projectWithWorldModel(Project.getById(project.id)))
  } catch (error) { return sendValidationError(res, error.message) }
})
router.put('/projects/:id', async (req, res) => {
  try {
    const project = Project.update(Number(req.params.id), req.body || {})
    if (!project) return res.status(404).json({ error: 'Project not found' })
    await refreshProjectWorldModel(project.id)
    return res.json(projectWithWorldModel(Project.getById(project.id)))
  } catch (error) { return sendValidationError(res, error.message) }
})
router.post('/projects/:id/world-model', async (req, res) => {
  try {
    const project = Project.getById(Number(req.params.id))
    if (!project) return res.status(404).json({ error: 'Project not found' })
    const model = await refreshProjectWorldModel(project.id, { force: true })
    if (!model) return sendValidationError(res, 'Project must be published on the gellaria surface')
    return res.json(projectWithWorldModel(Project.getById(project.id)))
  } catch (error) { return sendValidationError(res, error.message) }
})
router.delete('/projects/:id', (req, res) => (
  Project.delete(Number(req.params.id)) ? res.json({ deleted: true }) : res.status(404).json({ error: 'Project not found' })
))

router.get('/world-exhibits', (req, res) => res.json(WorldExhibit.getAll({ status: null })))
router.post('/world-exhibits', (req, res) => {
  const regionId = req.body?.region_id ?? req.body?.regionId
  const sourceType = req.body?.source_type ?? req.body?.sourceType
  const sourceKey = req.body?.source_key ?? req.body?.sourceKey
  if (!regionId || !sourceType || !sourceKey) return sendValidationError(res, 'regionId, sourceType and sourceKey are required')
  try { return res.status(201).json(WorldExhibit.create(req.body)) } catch (error) { return sendValidationError(res, error.message) }
})
router.put('/world-exhibits/:id', (req, res) => {
  try {
    const exhibit = WorldExhibit.update(Number(req.params.id), req.body || {})
    return exhibit ? res.json(exhibit) : res.status(404).json({ error: 'World exhibit not found' })
  } catch (error) { return sendValidationError(res, error.message) }
})
router.delete('/world-exhibits/:id', (req, res) => (
  WorldExhibit.delete(Number(req.params.id)) ? res.json({ deleted: true }) : res.status(404).json({ error: 'World exhibit not found' })
))

export default router
