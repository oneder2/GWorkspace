import express from 'express'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { Project } from '../models/Project.js'
import { WorldExhibit } from '../models/WorldExhibit.js'

const router = express.Router()
router.use(authenticate)
router.use(requireAdmin)

const sendValidationError = (res, message) => res.status(400).json({ error: message })

router.get('/projects', (req, res) => res.json(Project.getAll({ status: null })))
router.post('/projects', (req, res) => {
  const { slug, url } = req.body || {}
  const title = req.body?.title?.zh ?? req.body?.title_zh
  const summary = req.body?.summary?.zh ?? req.body?.summary_zh
  if (!slug || !url || !title || !summary) return sendValidationError(res, 'slug, url, title.zh and summary.zh are required')
  try { return res.status(201).json(Project.create(req.body)) } catch (error) { return sendValidationError(res, error.message) }
})
router.put('/projects/:id', (req, res) => {
  try {
    const project = Project.update(Number(req.params.id), req.body || {})
    return project ? res.json(project) : res.status(404).json({ error: 'Project not found' })
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
