import express from 'express'
import { buildPublicWorld, listPublicProjects } from '../services/publicWorld.js'

const router = express.Router()
const localeFrom = (req) => req.query.locale === 'en' ? 'en' : 'zh'

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
