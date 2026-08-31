import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'

export const PUBLIC_FACTS_SCHEMA_VERSION = '1.0.0'
export const PUBLIC_FACTS_MAJOR_VERSION = 1

const __dirname = dirname(fileURLToPath(import.meta.url))
const schemaPath = join(__dirname, '../../contracts/gworkspace/public-facts/v1/schema.json')
const schema = JSON.parse(readFileSync(schemaPath, 'utf8'))
const ajv = new Ajv2020({ allErrors: true, strict: true })
addFormats(ajv)
const validateSchema = ajv.compile(schema)
const asArray = (value) => Array.isArray(value) ? value : []

const referenceErrors = (payload) => {
  const errors = []
  const mediaIds = new Set(asArray(payload?.media).filter(record => record && typeof record === 'object').map(record => record.id))
  const collections = [
    ['projects', asArray(payload?.projects)],
    ['experiences', asArray(payload?.experiences)],
    ['articles', asArray(payload?.articles)]
  ]

  if (payload?.profile?.avatar_media_id && !mediaIds.has(payload.profile.avatar_media_id)) {
    errors.push({
      keyword: 'referentialIntegrity',
      instancePath: '/profile/avatar_media_id',
      message: 'must reference a media record in /media'
    })
  }

  for (const [collectionName, records] of collections) {
    records.forEach((record, recordIndex) => {
      if (!record || typeof record !== 'object') return
      record.media_ids?.forEach((mediaId, mediaIndex) => {
        if (!mediaIds.has(mediaId)) {
          errors.push({
            keyword: 'referentialIntegrity',
            instancePath: `/${collectionName}/${recordIndex}/media_ids/${mediaIndex}`,
            message: 'must reference a media record in /media'
          })
        }
      })
    })
  }

  return errors
}

const uniquenessErrors = (payload) => {
  const errors = []
  const collections = [
    ['projects', asArray(payload?.projects)],
    ['experiences', asArray(payload?.experiences)],
    ['articles', asArray(payload?.articles)],
    ['media', asArray(payload?.media)]
  ]

  for (const [collectionName, records] of collections) {
    const ids = new Set()
    records.forEach((record, index) => {
      if (!record || typeof record !== 'object') return
      if (ids.has(record.id)) {
        errors.push({
          keyword: 'uniqueRecordId',
          instancePath: `/${collectionName}/${index}/id`,
          message: `must be unique within ${collectionName}`
        })
      }
      ids.add(record.id)
    })
  }

  for (const collectionName of ['projects', 'articles']) {
    const slugs = new Set()
    ;asArray(payload?.[collectionName]).forEach((record, index) => {
      if (!record || typeof record !== 'object') return
      if (slugs.has(record.slug)) {
        errors.push({
          keyword: 'uniqueSlug',
          instancePath: `/${collectionName}/${index}/slug`,
          message: `must be unique within ${collectionName}`
        })
      }
      slugs.add(record.slug)
    })
  }

  return errors
}

export const validatePublicFacts = (payload) => {
  const schemaValid = validateSchema(payload)
  const errors = [
    ...(schemaValid ? [] : validateSchema.errors || []),
    ...referenceErrors(payload),
    ...uniquenessErrors(payload)
  ]

  return { valid: errors.length === 0, errors }
}

export const assertValidPublicFacts = (payload) => {
  const result = validatePublicFacts(payload)
  if (!result.valid) {
    const error = new Error('GWorkspace public-facts output failed contract validation')
    error.code = 'PUBLIC_FACTS_VALIDATION_FAILED'
    error.validationErrors = result.errors
    throw error
  }
  return payload
}

export class UnsupportedPublicFactsVersionError extends Error {
  constructor(requestedVersion) {
    super(`Unsupported public-facts major version: ${requestedVersion}`)
    this.name = 'UnsupportedPublicFactsVersionError'
    this.code = 'UNSUPPORTED_PUBLIC_FACTS_VERSION'
    this.status = 406
    this.requestedVersion = String(requestedVersion)
  }
}

export const assertSupportedPublicFactsVersion = (requestedVersion = PUBLIC_FACTS_MAJOR_VERSION) => {
  const normalized = String(requestedVersion).trim()
  const match = /^(\d+)(?:\.\d+){0,2}$/.exec(normalized)
  if (!match || Number(match[1]) !== PUBLIC_FACTS_MAJOR_VERSION) {
    throw new UnsupportedPublicFactsVersionError(requestedVersion)
  }
  return PUBLIC_FACTS_SCHEMA_VERSION
}
