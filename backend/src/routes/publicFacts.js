import express from 'express'
import { buildPublicFacts } from '../services/publicFacts.js'
import {
  assertSupportedPublicFactsVersion,
  PUBLIC_FACTS_SCHEMA_VERSION,
  UnsupportedPublicFactsVersionError
} from '../services/publicFactsValidator.js'

const router = express.Router()

router.get('/', (req, res) => {
  const requestedVersion = req.query.version || req.get('X-Public-Facts-Version') || '1'

  try {
    assertSupportedPublicFactsVersion(requestedVersion)
    const payload = buildPublicFacts()
    res.set({
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      'X-Public-Facts-Version': PUBLIC_FACTS_SCHEMA_VERSION,
      'Last-Modified': new Date(payload.source.updated_at).toUTCString()
    })
    res.json(payload)
  } catch (error) {
    if (error instanceof UnsupportedPublicFactsVersionError) {
      return res.status(error.status).json({
        error: error.code,
        requested_version: error.requestedVersion,
        supported_major_versions: [1]
      })
    }

    console.error('Error building public facts:', error)
    return res.status(500).json({ error: 'Failed to build validated public facts' })
  }
})

export default router
