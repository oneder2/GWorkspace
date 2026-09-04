import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'

export const RESUME_SCHEMA_VERSION = '1.0.0'
const __dirname = dirname(fileURLToPath(import.meta.url))
const schema = JSON.parse(readFileSync(join(__dirname, '../../../packages/contracts/resume/v1/schema.json'), 'utf8'))
const ajv = new Ajv2020({ allErrors: true, strict: true })
addFormats(ajv)
const validate = ajv.compile(schema)

export const validateResumeResponse = (payload) => ({
  valid: validate(payload),
  errors: validate.errors || []
})

export const assertValidResumeResponse = (payload) => {
  const result = validateResumeResponse(payload)
  if (!result.valid) {
    const error = new Error('GWorkspace resume response failed contract validation')
    error.code = 'RESUME_VALIDATION_FAILED'
    error.validationErrors = result.errors
    throw error
  }
  return payload
}
