import { GellariaIdentity } from '../models/GellariaIdentity.js'

export function authenticateGellaria(req, res, next) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
    if (!token) return res.status(401).json({ error: 'GELLARIA_AUTH_REQUIRED' })

    const session = GellariaIdentity.getSession(token)
    if (!session) return res.status(401).json({ error: 'GELLARIA_SESSION_INVALID' })

    req.gellariaToken = token
    req.gellariaUser = session.user
    next()
  } catch (error) {
    console.error('Gellaria authentication error:', error)
    res.status(500).json({ error: 'GELLARIA_AUTH_FAILED' })
  }
}
