import express from 'express'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { WritingStudio } from '../models/WritingStudio.js'

const router = express.Router()
router.use(authenticate)
router.use(requireAdmin)

const handle = (res, action, successStatus = 200) => {
  try {
    return res.status(successStatus).json(action())
  } catch (error) {
    return res.status(error.status || 400).json({ error: error.message })
  }
}

router.get('/projects', (req, res) => handle(res, () => WritingStudio.getProjects(req.user.id)))
router.post('/projects', (req, res) => handle(res, () => WritingStudio.createProject(req.user.id, req.body || {}), 201))
router.get('/projects/:id', (req, res) => handle(res, () => WritingStudio.getProject(Number(req.params.id), req.user.id)))
router.patch('/projects/:id', (req, res) => handle(res, () => WritingStudio.updateProject(Number(req.params.id), req.user.id, req.body || {})))
router.delete('/projects/:id', (req, res) => handle(res, () => ({ deleted: WritingStudio.deleteProject(Number(req.params.id), req.user.id) })))

router.post('/projects/:id/documents', (req, res) => handle(res, () => WritingStudio.createDocument(Number(req.params.id), req.user.id, req.body || {}), 201))
router.put('/projects/:id/chapters/order', (req, res) => handle(res, () => WritingStudio.reorderChapters(Number(req.params.id), req.user.id, req.body?.document_ids)))
router.patch('/documents/:id', (req, res) => handle(res, () => WritingStudio.updateDocument(Number(req.params.id), req.user.id, req.body || {})))
router.delete('/documents/:id', (req, res) => handle(res, () => ({ deleted: WritingStudio.deleteDocument(Number(req.params.id), req.user.id) })))
router.get('/documents/:id/revisions', (req, res) => handle(res, () => WritingStudio.getRevisions(Number(req.params.id), req.user.id)))
router.post('/documents/:id/revisions', (req, res) => handle(res, () => WritingStudio.createRevision(Number(req.params.id), req.user.id, req.body?.reason), 201))

router.post('/projects/:id/entities', (req, res) => handle(res, () => WritingStudio.createEntity(Number(req.params.id), req.user.id, req.body || {}), 201))
router.patch('/entities/:id', (req, res) => handle(res, () => WritingStudio.updateEntity(Number(req.params.id), req.user.id, req.body || {})))
router.delete('/entities/:id', (req, res) => handle(res, () => ({ deleted: WritingStudio.deleteEntity(Number(req.params.id), req.user.id) })))

router.post('/projects/:id/publish', (req, res) => handle(res, () => WritingStudio.publishEssay(Number(req.params.id), req.user.id, req.body || {})))

export default router
