import express from 'express'
import { analyzeStatement, createBlogSeed, getPublicDailyCapsule } from '../services/aiWorkflow.js'

const router = express.Router()

router.get('/daily-capsule', async (req, res) => {
  try {
    const capsule = await getPublicDailyCapsule({ date: req.query.date })
    res.json(capsule)
  } catch (error) {
    console.error('Error fetching daily capsule:', error)
    res.status(500).json({ error: error.message || 'Failed to fetch daily capsule' })
  }
})

router.post('/analyze', async (req, res) => {
  try {
    const result = await analyzeStatement(req.body || {})
    res.json(result)
  } catch (error) {
    console.error('Error analyzing statement:', error)
    res.status(400).json({ error: error.message || 'Failed to analyze statement' })
  }
})

router.post('/blog-seed', async (req, res) => {
  try {
    const result = await createBlogSeed(req.body || {})
    res.json(result)
  } catch (error) {
    console.error('Error generating blog seed:', error)
    res.status(400).json({ error: error.message || 'Failed to generate blog seed' })
  }
})

export default router
