import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { getDatabase } from '../config/database.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const schema = JSON.parse(readFileSync(
  join(__dirname, '../../schemas/oceanseo-project-update-draft-v1.json'),
  'utf8'
))
const ajv = new Ajv2020({ allErrors: true, strict: true })
addFormats(ajv)
const validate = ajv.compile(schema)

const parseTextArray = (value) => {
  try {
    const parsed = JSON.parse(value || '[]')
    return Array.isArray(parsed) ? parsed.filter(item => typeof item === 'string') : []
  } catch {
    return []
  }
}

export const validateOceanseoProjectUpdate = (payload) => {
  if (!validate(payload)) {
    const details = validate.errors.map(error => `${error.instancePath || '/'} ${error.message}`).join('; ')
    throw new Error(`invalid_project_update:${details}`)
  }
  return payload
}

export const listOceanseoSyncProjects = ({ db = getDatabase() } = {}) => db.prepare(`
  SELECT public_id, slug, title_zh, title_en, status, updated_at
  FROM projects
  WHERE public_id IS NOT NULL AND trim(public_id) != ''
  ORDER BY status DESC, sort_order ASC, public_id ASC
`).all().map(project => ({
  public_id: project.public_id,
  slug: project.slug,
  title: {
    zh: project.title_zh,
    en: project.title_en || project.title_zh
  },
  status: project.status,
  updated_at: project.updated_at
}))

export const importOceanseoProjectUpdate = (payload, { db = getDatabase() } = {}) => {
  validateOceanseoProjectUpdate(payload)
  const sourceSha256 = createHash('sha256').update(JSON.stringify(payload)).digest('hex')

  return db.transaction(() => {
    const receipt = db.prepare(`
      SELECT result_json FROM oceanseo_project_update_imports WHERE update_id = ?
    `).get(payload.update_id)
    if (receipt) return { ...JSON.parse(receipt.result_json), status: 'already_imported' }

    const project = db.prepare(`
      SELECT id, public_id, highlights_zh, highlights_en
      FROM projects WHERE public_id = ?
    `).get(payload.target_project_id)
    if (!project) throw new Error('target_project_not_found')

    const highlightsZh = parseTextArray(project.highlights_zh)
    const highlightsEn = parseTextArray(project.highlights_en)
    if (!highlightsZh.includes(payload.highlight.zh)) highlightsZh.push(payload.highlight.zh)
    if (!highlightsEn.includes(payload.highlight.en)) highlightsEn.push(payload.highlight.en)

    const importedAt = new Date().toISOString()
    db.prepare(`
      UPDATE projects
      SET highlights_zh = ?, highlights_en = ?, updated_at = ?
      WHERE id = ?
    `).run(JSON.stringify(highlightsZh), JSON.stringify(highlightsEn), importedAt, project.id)

    const result = {
      status: 'imported',
      update_id: payload.update_id,
      target_project_id: project.public_id,
      imported_at: importedAt
    }
    db.prepare(`
      INSERT INTO oceanseo_project_update_imports
        (update_id, target_project_id, source_scan_id, source_sha256, imported_at, result_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      payload.update_id,
      project.public_id,
      payload.source.scan_id,
      sourceSha256,
      importedAt,
      JSON.stringify(result)
    )
    return result
  })()
}
