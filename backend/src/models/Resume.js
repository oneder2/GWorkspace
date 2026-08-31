import { randomUUID } from 'node:crypto'
import { getDatabase } from '../config/database.js'

export const RESUME_SURFACES = ['portfolio', 'resume_web', 'resume_pdf', 'gellaria']
const SURFACE_SET = new Set(RESUME_SURFACES)
const STATUS_SET = new Set(['published', 'draft'])
const CONTACT_TYPES = new Set(['email', 'phone', 'website', 'github', 'linkedin', 'location', 'other'])
const TIMELINE_SECTIONS = new Set(['experience', 'education'])
const EXPERIENCE_KINDS = new Set(['employment', 'education', 'volunteering', 'award', 'other'])

const parseArray = (value) => {
  if (Array.isArray(value)) return value
  try {
    const parsed = JSON.parse(value || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const stringList = (value) => parseArray(value)
  .filter(item => typeof item === 'string')
  .map(item => item.trim())
  .filter(Boolean)

const normalizeSurfaces = (value, fallback = []) => {
  const surfaces = value === undefined ? fallback : stringList(value)
  const normalized = [...new Set(surfaces)]
  const invalid = normalized.filter(surface => !SURFACE_SET.has(surface))
  if (invalid.length) throw new Error(`Unsupported surfaces: ${invalid.join(', ')}`)
  return normalized
}

const normalizeStatus = (value, fallback = 'draft') => {
  const status = value ?? fallback
  if (!STATUS_SET.has(status)) throw new Error(`Unsupported status: ${status}`)
  return status
}

const localized = (row, prefix) => ({
  zh: row?.[`${prefix}_zh`] || '',
  en: row?.[`${prefix}_en`] || row?.[`${prefix}_zh`] || ''
})

const readLocalized = (data, key, locale, fallback = '') => {
  const value = data?.[key]?.[locale] ?? data?.[`${key}_${locale}`]
  return value === undefined ? fallback : String(value || '').trim()
}

const required = (value, field) => {
  const normalized = String(value || '').trim()
  if (!normalized) throw new Error(`${field} is required`)
  return normalized
}

const normalizeContactUrl = (value) => {
  const normalized = required(value, 'contact url')
  const url = new URL(normalized)
  if (!['https:', 'mailto:', 'tel:'].includes(url.protocol)) {
    throw new Error('Contact URL must use https, mailto, or tel')
  }
  return url.toString()
}

const normalizeProfile = (row) => row && ({
  id: row.id,
  public_id: row.public_id,
  name: localized(row, 'name'),
  full_name: localized(row, 'full_name'),
  headline: localized(row, 'headline'),
  location: localized(row, 'location'),
  summary: localized(row, 'summary'),
  avatar_media_id: row.avatar_media_id || null,
  status: row.status,
  surfaces: stringList(row.surfaces),
  settings: {
    default_language: row.default_language,
    pdf: {
      project_limit: row.pdf_project_limit,
      filename: { zh: row.pdf_filename_zh, en: row.pdf_filename_en }
    }
  },
  created_at: row.created_at,
  updated_at: row.updated_at
})

const normalizeContact = (row) => row && ({
  ...row,
  surfaces: stringList(row.surfaces)
})

const normalizeSkill = (row) => row && ({
  ...row,
  name: localized(row, 'name'),
  items: stringList(row.items),
  surfaces: stringList(row.surfaces)
})

const normalizeTimeline = (row) => row && ({
  ...row,
  organization: localized(row, 'organization'),
  title: localized(row, 'title'),
  location: row.location_zh || row.location_en ? localized(row, 'location') : null,
  summary: localized(row, 'summary'),
  highlights: {
    zh: stringList(row.highlights_zh),
    en: stringList(row.highlights_en)
  },
  media_ids: stringList(row.media_ids),
  surfaces: stringList(row.surfaces)
})

const surfaceClause = (surface) => surface
  ? ` AND EXISTS (
      SELECT 1 FROM json_each(CASE WHEN json_valid(surfaces) THEN surfaces ELSE '[]' END)
      WHERE json_each.value = ?
    )`
  : ''

export class Resume {
  static getProfile() {
    return normalizeProfile(getDatabase().prepare('SELECT * FROM resume_profile WHERE id = 1').get())
  }

  static updateProfile(data = {}) {
    const db = getDatabase()
    const current = this.getProfile()
    if (!current) throw new Error('Resume profile is not initialized')
    const now = new Date().toISOString()
    const status = normalizeStatus(data.status, current.status)
    const surfaces = normalizeSurfaces(data.surfaces, current.surfaces)
    const profile = {
      name_zh: readLocalized(data, 'name', 'zh', current.name.zh),
      name_en: readLocalized(data, 'name', 'en', current.name.en),
      full_name_zh: readLocalized(data, 'full_name', 'zh', current.full_name.zh),
      full_name_en: readLocalized(data, 'full_name', 'en', current.full_name.en),
      headline_zh: readLocalized(data, 'headline', 'zh', current.headline.zh),
      headline_en: readLocalized(data, 'headline', 'en', current.headline.en),
      location_zh: readLocalized(data, 'location', 'zh', current.location.zh),
      location_en: readLocalized(data, 'location', 'en', current.location.en),
      summary_zh: readLocalized(data, 'summary', 'zh', current.summary.zh),
      summary_en: readLocalized(data, 'summary', 'en', current.summary.en)
    }
    if (status === 'published') {
      for (const [field, value] of Object.entries(profile)) required(value, field)
      if (!surfaces.length) throw new Error('A published profile requires at least one surface')
    }
    const settings = data.settings || {}
    const defaultLanguage = settings.default_language ?? data.default_language ?? current.settings.default_language
    if (!['en', 'zh'].includes(defaultLanguage)) throw new Error('default_language must be en or zh')
    const projectLimit = Number(settings.pdf?.project_limit ?? data.pdf_project_limit ?? current.settings.pdf.project_limit)
    if (!Number.isInteger(projectLimit) || projectLimit < 1) throw new Error('pdf project limit must be a positive integer')

    db.prepare(`
      UPDATE resume_profile SET
        name_zh = ?, name_en = ?, full_name_zh = ?, full_name_en = ?,
        headline_zh = ?, headline_en = ?, location_zh = ?, location_en = ?,
        summary_zh = ?, summary_en = ?, avatar_media_id = ?, status = ?, surfaces = ?,
        default_language = ?, pdf_project_limit = ?, pdf_filename_zh = ?, pdf_filename_en = ?,
        updated_at = ?
      WHERE id = 1
    `).run(
      profile.name_zh, profile.name_en, profile.full_name_zh, profile.full_name_en,
      profile.headline_zh, profile.headline_en, profile.location_zh, profile.location_en,
      profile.summary_zh, profile.summary_en,
      data.avatar_media_id !== undefined ? data.avatar_media_id || null : current.avatar_media_id,
      status, JSON.stringify(surfaces), defaultLanguage, projectLimit,
      readLocalized(settings.pdf?.filename ? { filename: settings.pdf.filename } : data, 'filename', 'zh', current.settings.pdf.filename.zh),
      readLocalized(settings.pdf?.filename ? { filename: settings.pdf.filename } : data, 'filename', 'en', current.settings.pdf.filename.en),
      now
    )
    return this.getProfile()
  }

  static getContacts({ status = null, surface = null } = {}) {
    const clauses = []
    const params = []
    if (status) { clauses.push('status = ?'); params.push(status) }
    if (surface) { clauses.push(`EXISTS (
      SELECT 1 FROM json_each(CASE WHEN json_valid(surfaces) THEN surfaces ELSE '[]' END)
      WHERE json_each.value = ?
    )`); params.push(surface) }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    return getDatabase().prepare(`SELECT * FROM resume_contacts ${where} ORDER BY sort_order ASC, public_id ASC`).all(...params).map(normalizeContact)
  }

  static createContact(data = {}) {
    const now = new Date().toISOString()
    const type = CONTACT_TYPES.has(data.type) ? data.type : 'other'
    const status = normalizeStatus(data.status)
    const surfaces = normalizeSurfaces(data.surfaces)
    if (status === 'published' && !surfaces.length) throw new Error('A published contact requires at least one surface')
    const result = getDatabase().prepare(`
      INSERT INTO resume_contacts
        (public_id, type, label, value, url, status, surfaces, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `contact:${randomUUID()}`, type, required(data.label, 'label'), required(data.value, 'value'),
      normalizeContactUrl(data.url), status, JSON.stringify(surfaces), Number(data.sort_order) || 0, now, now
    )
    return normalizeContact(getDatabase().prepare('SELECT * FROM resume_contacts WHERE id = ?').get(result.lastInsertRowid))
  }

  static updateContact(id, data = {}) {
    const db = getDatabase()
    const current = normalizeContact(db.prepare('SELECT * FROM resume_contacts WHERE id = ?').get(id))
    if (!current) return null
    const status = normalizeStatus(data.status, current.status)
    const surfaces = normalizeSurfaces(data.surfaces, current.surfaces)
    if (status === 'published' && !surfaces.length) throw new Error('A published contact requires at least one surface')
    db.prepare(`
      UPDATE resume_contacts SET type = ?, label = ?, value = ?, url = ?, status = ?, surfaces = ?,
        sort_order = ?, updated_at = ? WHERE id = ?
    `).run(
      CONTACT_TYPES.has(data.type) ? data.type : current.type,
      required(data.label ?? current.label, 'label'), required(data.value ?? current.value, 'value'),
      normalizeContactUrl(data.url ?? current.url), status, JSON.stringify(surfaces),
      Number(data.sort_order ?? current.sort_order) || 0, new Date().toISOString(), id
    )
    return normalizeContact(db.prepare('SELECT * FROM resume_contacts WHERE id = ?').get(id))
  }

  static deleteContact(id) {
    return getDatabase().prepare('DELETE FROM resume_contacts WHERE id = ?').run(id).changes > 0
  }

  static getSkills({ status = null, surface = null } = {}) {
    const clauses = []
    const params = []
    if (status) { clauses.push('status = ?'); params.push(status) }
    if (surface) { clauses.push(`EXISTS (
      SELECT 1 FROM json_each(CASE WHEN json_valid(surfaces) THEN surfaces ELSE '[]' END)
      WHERE json_each.value = ?
    )`); params.push(surface) }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    return getDatabase().prepare(`SELECT * FROM resume_skills ${where} ORDER BY sort_order ASC, public_id ASC`).all(...params).map(normalizeSkill)
  }

  static createSkill(data = {}) {
    const now = new Date().toISOString()
    const status = normalizeStatus(data.status)
    const surfaces = normalizeSurfaces(data.surfaces)
    const items = stringList(data.items)
    if (!items.length) throw new Error('A skill group requires at least one item')
    if (status === 'published' && !surfaces.length) throw new Error('A published skill group requires at least one surface')
    const result = getDatabase().prepare(`
      INSERT INTO resume_skills
        (public_id, name_zh, name_en, items, status, surfaces, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `skill:${randomUUID()}`, required(readLocalized(data, 'name', 'zh'), 'name.zh'),
      required(readLocalized(data, 'name', 'en'), 'name.en'), JSON.stringify(items), status,
      JSON.stringify(surfaces), Number(data.sort_order) || 0, now, now
    )
    return normalizeSkill(getDatabase().prepare('SELECT * FROM resume_skills WHERE id = ?').get(result.lastInsertRowid))
  }

  static updateSkill(id, data = {}) {
    const db = getDatabase()
    const current = normalizeSkill(db.prepare('SELECT * FROM resume_skills WHERE id = ?').get(id))
    if (!current) return null
    const status = normalizeStatus(data.status, current.status)
    const surfaces = normalizeSurfaces(data.surfaces, current.surfaces)
    const items = data.items === undefined ? current.items : stringList(data.items)
    if (!items.length) throw new Error('A skill group requires at least one item')
    if (status === 'published' && !surfaces.length) throw new Error('A published skill group requires at least one surface')
    db.prepare(`
      UPDATE resume_skills SET name_zh = ?, name_en = ?, items = ?, status = ?, surfaces = ?,
        sort_order = ?, updated_at = ? WHERE id = ?
    `).run(
      required(readLocalized(data, 'name', 'zh', current.name.zh), 'name.zh'),
      required(readLocalized(data, 'name', 'en', current.name.en), 'name.en'),
      JSON.stringify(items), status, JSON.stringify(surfaces), Number(data.sort_order ?? current.sort_order) || 0,
      new Date().toISOString(), id
    )
    return normalizeSkill(db.prepare('SELECT * FROM resume_skills WHERE id = ?').get(id))
  }

  static deleteSkill(id) {
    return getDatabase().prepare('DELETE FROM resume_skills WHERE id = ?').run(id).changes > 0
  }

  static getTimeline({ section = null, status = null, surface = null } = {}) {
    const clauses = []
    const params = []
    if (section) { clauses.push('section = ?'); params.push(section) }
    if (status) { clauses.push('status = ?'); params.push(status) }
    if (surface) { clauses.push(`EXISTS (
      SELECT 1 FROM json_each(CASE WHEN json_valid(surfaces) THEN surfaces ELSE '[]' END)
      WHERE json_each.value = ?
    )`); params.push(surface) }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    return getDatabase().prepare(`SELECT * FROM public_experiences ${where} ORDER BY sort_order ASC, public_id ASC`).all(...params).map(normalizeTimeline)
  }

  static createTimeline(data = {}) {
    const section = TIMELINE_SECTIONS.has(data.section) ? data.section : 'experience'
    const kind = EXPERIENCE_KINDS.has(data.kind) ? data.kind : (section === 'education' ? 'education' : 'employment')
    const status = normalizeStatus(data.status)
    const surfaces = normalizeSurfaces(data.surfaces)
    if (status === 'published' && !surfaces.length) throw new Error('A published timeline entry requires at least one surface')
    const now = new Date().toISOString()
    const result = getDatabase().prepare(`
      INSERT INTO public_experiences
        (public_id, kind, section, organization_zh, organization_en, title_zh, title_en,
         location_zh, location_en, summary_zh, summary_en, highlights_zh, highlights_en,
         start_date, end_date, canonical_url, media_ids, status, surfaces, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `${section}:${randomUUID()}`, kind, section,
      required(readLocalized(data, 'organization', 'zh'), 'organization.zh'),
      required(readLocalized(data, 'organization', 'en'), 'organization.en'),
      required(readLocalized(data, 'title', 'zh'), 'title.zh'),
      required(readLocalized(data, 'title', 'en'), 'title.en'),
      readLocalized(data, 'location', 'zh') || null, readLocalized(data, 'location', 'en') || null,
      required(readLocalized(data, 'summary', 'zh'), 'summary.zh'),
      required(readLocalized(data, 'summary', 'en'), 'summary.en'),
      JSON.stringify(stringList(data.highlights?.zh ?? data.highlights_zh)),
      JSON.stringify(stringList(data.highlights?.en ?? data.highlights_en)),
      required(data.start_date ?? data.start, 'start_date'), data.end_date ?? data.end ?? null,
      data.canonical_url || null, JSON.stringify(stringList(data.media_ids)), status,
      JSON.stringify(surfaces), Number(data.sort_order) || 0, now, now
    )
    return normalizeTimeline(getDatabase().prepare('SELECT * FROM public_experiences WHERE id = ?').get(result.lastInsertRowid))
  }

  static updateTimeline(id, data = {}) {
    const db = getDatabase()
    const current = normalizeTimeline(db.prepare('SELECT * FROM public_experiences WHERE id = ?').get(id))
    if (!current) return null
    const section = TIMELINE_SECTIONS.has(data.section) ? data.section : current.section
    const kind = EXPERIENCE_KINDS.has(data.kind) ? data.kind : current.kind
    const status = normalizeStatus(data.status, current.status)
    const surfaces = normalizeSurfaces(data.surfaces, current.surfaces)
    if (status === 'published' && !surfaces.length) throw new Error('A published timeline entry requires at least one surface')
    db.prepare(`
      UPDATE public_experiences SET
        kind = ?, section = ?, organization_zh = ?, organization_en = ?, title_zh = ?, title_en = ?,
        location_zh = ?, location_en = ?, summary_zh = ?, summary_en = ?, highlights_zh = ?, highlights_en = ?,
        start_date = ?, end_date = ?, canonical_url = ?, media_ids = ?, status = ?, surfaces = ?,
        sort_order = ?, updated_at = ? WHERE id = ?
    `).run(
      kind, section,
      required(readLocalized(data, 'organization', 'zh', current.organization.zh), 'organization.zh'),
      required(readLocalized(data, 'organization', 'en', current.organization.en), 'organization.en'),
      required(readLocalized(data, 'title', 'zh', current.title.zh), 'title.zh'),
      required(readLocalized(data, 'title', 'en', current.title.en), 'title.en'),
      readLocalized(data, 'location', 'zh', current.location?.zh || '') || null,
      readLocalized(data, 'location', 'en', current.location?.en || '') || null,
      required(readLocalized(data, 'summary', 'zh', current.summary.zh), 'summary.zh'),
      required(readLocalized(data, 'summary', 'en', current.summary.en), 'summary.en'),
      JSON.stringify(data.highlights?.zh === undefined ? current.highlights.zh : stringList(data.highlights.zh)),
      JSON.stringify(data.highlights?.en === undefined ? current.highlights.en : stringList(data.highlights.en)),
      required(data.start_date ?? data.start ?? current.start_date, 'start_date'),
      data.end_date !== undefined || data.end !== undefined ? data.end_date ?? data.end ?? null : current.end_date,
      data.canonical_url !== undefined ? data.canonical_url || null : current.canonical_url,
      JSON.stringify(data.media_ids === undefined ? current.media_ids : stringList(data.media_ids)),
      status, JSON.stringify(surfaces), Number(data.sort_order ?? current.sort_order) || 0,
      new Date().toISOString(), id
    )
    return normalizeTimeline(db.prepare('SELECT * FROM public_experiences WHERE id = ?').get(id))
  }

  static deleteTimeline(id) {
    return getDatabase().prepare('DELETE FROM public_experiences WHERE id = ?').run(id).changes > 0
  }

  static profileIsPublishedOn(surface) {
    const profile = this.getProfile()
    return Boolean(profile && profile.status === 'published' && profile.surfaces.includes(surface))
  }
}

export const resumeSurfaceSql = surfaceClause
