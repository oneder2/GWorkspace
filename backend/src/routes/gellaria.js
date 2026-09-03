import express from 'express'
import rateLimit from 'express-rate-limit'
import { authenticate } from '../middleware/auth.js'
import { authenticateGellaria } from '../middleware/gellariaAuth.js'
import { GellariaIdentity } from '../models/GellariaIdentity.js'

const router = express.Router()
const exchangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false
})

const validAppearance = value => (
  value &&
  Number.isInteger(value.palette) && value.palette >= 0 && value.palette <= 4 &&
  Number.isInteger(value.form) && value.form >= 0 && value.form <= 2
)

router.post('/handoff', authenticate, (req, res) => {
  const handoff = GellariaIdentity.createHandoff(req.user.id)
  res.set('Cache-Control', 'no-store')
  res.status(201).json(handoff)
})

router.post('/handoff/exchange', exchangeLimiter, (req, res) => {
  const code = typeof req.body?.code === 'string' ? req.body.code : ''
  if (!/^[A-Za-z0-9_-]{40,80}$/.test(code)) {
    return res.status(400).json({ error: 'GELLARIA_HANDOFF_INVALID' })
  }
  const session = GellariaIdentity.exchangeHandoff(code)
  res.set('Cache-Control', 'no-store')
  if (!session) return res.status(401).json({ error: 'GELLARIA_HANDOFF_EXPIRED' })
  return res.json(session)
})

router.get('/avatar', authenticateGellaria, (req, res) => {
  res.set('Cache-Control', 'private, no-store')
  res.json({
    user: req.gellariaUser,
    appearance: GellariaIdentity.getAvatar(req.gellariaUser.id)
  })
})

router.put('/avatar', authenticateGellaria, (req, res) => {
  if (!validAppearance(req.body)) {
    return res.status(400).json({ error: 'GELLARIA_APPEARANCE_INVALID' })
  }
  const appearance = GellariaIdentity.saveAvatar(req.gellariaUser.id, {
    palette: req.body.palette,
    form: req.body.form
  })
  res.set('Cache-Control', 'private, no-store')
  res.json({ user: req.gellariaUser, appearance })
})

router.delete('/session', authenticateGellaria, (req, res) => {
  GellariaIdentity.revokeSession(req.gellariaToken)
  res.status(204).end()
})

export default router
