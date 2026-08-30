import express from 'express'
import rateLimit from 'express-rate-limit'
import { analyzeStatement, createBlogSeed, getPublicDailyCapsule } from '../services/aiWorkflow.js'
import { authenticate, optionalAuthenticate, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

const guestAiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 12,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => req.user?.role === 'admin',
  message: { error: 'Guest trial limit reached. Please try again later.' }
})

router.get('/daily-capsule', async (req, res) => {
  try {
    const capsule = await getPublicDailyCapsule({ date: req.query.date })
    res.json(capsule)
  } catch (error) {
    console.error('Error fetching daily capsule:', error)
    res.status(500).json({ error: error.message || 'Failed to fetch daily capsule' })
  }
})

router.post('/analyze', optionalAuthenticate, guestAiLimiter, async (req, res) => {
  try {
    const text = String(req.body?.text || '').trim()
    const maxLength = req.user?.role === 'admin' ? 8000 : 500
    if (!text) return res.status(400).json({ error: 'Text is required' })
    if (text.length > maxLength) return res.status(413).json({ error: `Text must be ${maxLength} characters or fewer` })
    const result = await analyzeStatement(req.body || {})
    res.json(result)
  } catch (error) {
    console.error('Error analyzing statement:', error)
    res.status(400).json({ error: error.message || 'Failed to analyze statement' })
  }
})

router.post('/blog-seed', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await createBlogSeed(req.body || {})
    res.json(result)
  } catch (error) {
    console.error('Error generating blog seed:', error)
    res.status(400).json({ error: error.message || 'Failed to generate blog seed' })
  }
})

export default router
