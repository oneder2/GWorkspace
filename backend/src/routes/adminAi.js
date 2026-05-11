import express from 'express'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import {
  createSeed,
  getAdminDailyCapsule,
  getAdminSeedOverview,
  importSeeds,
  refreshDailyCapsule,
  updateSeed
} from '../services/aiWorkflow.js'

const router = express.Router()

router.use(authenticate)
router.use(requireAdmin)

router.get('/seeds', (req, res) => {
  try {
    res.json(getAdminSeedOverview(req.query))
  } catch (error) {
    console.error('Error fetching AI seeds:', error)
    res.status(500).json({ error: error.message || 'Failed to fetch AI seeds' })
  }
})

router.post('/seeds', (req, res) => {
  try {
    res.status(201).json(createSeed(req.body || {}, req.user.id))
  } catch (error) {
    console.error('Error creating AI seed:', error)
    res.status(400).json({ error: error.message || 'Failed to create AI seed' })
  }
})

router.patch('/seeds/:id', (req, res) => {
  try {
    res.json(updateSeed(req.params.id, req.body || {}))
  } catch (error) {
    console.error('Error updating AI seed:', error)
    res.status(400).json({ error: error.message || 'Failed to update AI seed' })
  }
})

router.post('/seeds/import', (req, res) => {
  try {
    res.status(201).json(importSeeds(req.body || {}, req.user.id))
  } catch (error) {
    console.error('Error importing AI seeds:', error)
    res.status(400).json({ error: error.message || 'Failed to import AI seeds' })
  }
})

router.get('/daily-capsule', async (req, res) => {
  try {
    res.json(await getAdminDailyCapsule({ date: req.query.date }))
  } catch (error) {
    console.error('Error fetching admin daily capsule:', error)
    res.status(500).json({ error: error.message || 'Failed to fetch daily capsule' })
  }
})

router.post('/daily-capsule/refresh', async (req, res) => {
  try {
    res.json(await refreshDailyCapsule(req.body || {}))
  } catch (error) {
    console.error('Error refreshing daily capsule:', error)
    res.status(400).json({ error: error.message || 'Failed to refresh daily capsule' })
  }
})

export default router
