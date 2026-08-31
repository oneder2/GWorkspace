import express from 'express'
import { buildPublicWorld, listPublicProjects } from '../services/publicWorld.js'
import { buildResumeResponse, ResumeNotPublishedError } from '../services/resumePublic.js'

const router = express.Router()
const localeFrom = (req) => req.query.locale === 'en' ? 'en' : 'zh'

router.get('/v1/resume', (req, res) => {
  const locale = req.query.locale || null
  const surface = req.query.surface || 'resume_web'
  try {
    const payload = buildResumeResponse({ locale, surface })
    res.set({
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=900',
      'X-Resume-Schema-Version': '1.0.0',
      'Last-Modified': new Date(payload.source.updated_at).toUTCString()
    })
    return res.json(payload)
  } catch (error) {
    res.set('Cache-Control', 'no-store')
    if (error instanceof ResumeNotPublishedError || error.status === 400) {
      return res.status(error.status).json({ error: error.code, message: error.message })
    }
    console.error('Error building public resume:', error)
    return res.status(500).json({ error: 'RESUME_RESPONSE_FAILED', message: 'Failed to build validated resume response' })
  }
})

router.get('/world', (req, res) => {
  try {
    res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=120')
    res.json(buildPublicWorld({ locale: localeFrom(req) }))
  } catch (error) {
    console.error('Error building public world content:', error)
    res.status(500).json({ error: 'Failed to build public world content' })
  }
})

router.get('/projects', (req, res) => {
  try {
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
    res.json(listPublicProjects({ locale: localeFrom(req) }))
  } catch (error) {
    console.error('Error fetching public projects:', error)
    res.status(500).json({ error: 'Failed to fetch public projects' })
  }
})

export default router
