import { getDatabase } from '../config/database.js'

const DEFAULT_LIMIT = 100

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const normalizeDomain = (value) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null
  }

  try {
    const url = value.includes('://') ? new URL(value) : new URL(`https://${value}`)
    return url.hostname.replace(/^www\./, '').toLowerCase()
  } catch (error) {
    return null
  }
}

const normalizeSeedRecord = (seed) => (
  seed
    ? {
        ...seed,
        source_domain: seed.source_domain || normalizeDomain(seed.source_url)
      }
    : null
)

export class AiSeed {
  static getAll(options = {}) {
    const db = getDatabase()
    const {
      status = null,
      search = null,
      limit = DEFAULT_LIMIT,
      offset = 0
    } = options

    const clauses = ['1=1']
    const params = []

    if (status && status !== 'all') {
      clauses.push('status = ?')
      params.push(status)
    }

    if (typeof search === 'string' && search.trim().length > 0) {
      const pattern = `%${search.trim()}%`
      clauses.push('(source_text LIKE ? COLLATE NOCASE OR source_label LIKE ? COLLATE NOCASE OR source_domain LIKE ? COLLATE NOCASE)')
      params.push(pattern, pattern, pattern)
    }

    params.push(parsePositiveInteger(limit, DEFAULT_LIMIT), Math.max(Number.parseInt(offset, 10) || 0, 0))

    const rows = db.prepare(`
      SELECT *
      FROM ai_seeds
      WHERE ${clauses.join(' AND ')}
      ORDER BY
        CASE status
          WHEN 'active' THEN 0
          WHEN 'archived' THEN 1
          ELSE 2
        END ASC,
        CASE WHEN used_at IS NULL THEN 0 ELSE 1 END ASC,
        used_at ASC,
        created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params)

    return rows.map(normalizeSeedRecord)
  }

  static getById(id) {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM ai_seeds WHERE id = ?').get(id)
    return normalizeSeedRecord(row)
  }

  static existsBySourceText(sourceText) {
    const db = getDatabase()
    const row = db.prepare('SELECT id FROM ai_seeds WHERE source_text = ?').get(sourceText)
    return Boolean(row)
  }

  static countActive() {
    const db = getDatabase()
    const row = db.prepare('SELECT COUNT(*) AS count FROM ai_seeds WHERE status = ?').get('active')
    return row?.count || 0
  }

  static getSummary() {
    const db = getDatabase()
    const row = db.prepare(`
      SELECT
        COUNT(*) AS total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) AS active,
        COUNT(CASE WHEN status = 'archived' THEN 1 END) AS archived,
        COUNT(CASE WHEN used_at IS NULL AND status = 'active' THEN 1 END) AS unused_active
      FROM ai_seeds
    `).get()

    return {
      total: row?.total || 0,
      active: row?.active || 0,
      archived: row?.archived || 0,
      unused_active: row?.unused_active || 0
    }
  }

  static create(data = {}) {
    const db = getDatabase()
    const sourceText = typeof data.source_text === 'string' ? data.source_text.trim() : ''

    if (!sourceText) {
      throw new Error('Seed text is required')
    }

    const sourceLabel = typeof data.source_label === 'string' && data.source_label.trim().length > 0
      ? data.source_label.trim()
      : 'manual'
    const sourceUrl = typeof data.source_url === 'string' && data.source_url.trim().length > 0
      ? data.source_url.trim()
      : null
    const sourceDomain = normalizeDomain(sourceUrl || data.source_domain)
    const language = typeof data.language === 'string' && data.language.trim().length > 0
      ? data.language.trim()
      : 'zh-CN'
    const status = typeof data.status === 'string' && data.status.trim().length > 0
      ? data.status.trim()
      : 'active'
    const importedFrom = typeof data.imported_from === 'string' && data.imported_from.trim().length > 0
      ? data.imported_from.trim()
      : 'manual'
    const weight = Math.max(parsePositiveInteger(data.weight, 1), 1)
    const notes = typeof data.notes === 'string' && data.notes.trim().length > 0
      ? data.notes.trim()
      : null
    const parsedCreatedBy = Number.parseInt(data.created_by, 10)
    const createdBy = Number.isFinite(parsedCreatedBy) && parsedCreatedBy > 0 ? parsedCreatedBy : null
    const now = new Date().toISOString()

    const result = db.prepare(`
      INSERT INTO ai_seeds (
        source_text,
        source_label,
        source_url,
        source_domain,
        language,
        status,
        imported_from,
        weight,
        notes,
        created_by,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      sourceText,
      sourceLabel,
      sourceUrl,
      sourceDomain,
      language,
      status,
      importedFrom,
      weight,
      notes,
      createdBy,
      now,
      now
    )

    return this.getById(result.lastInsertRowid)
  }

  static update(id, updates = {}) {
    const db = getDatabase()
    const existing = this.getById(id)
    if (!existing) {
      return null
    }

    const fields = []
    const values = []

    if (updates.status !== undefined) {
      fields.push('status = ?')
      values.push(String(updates.status).trim() || existing.status)
    }

    if (updates.notes !== undefined) {
      fields.push('notes = ?')
      values.push(typeof updates.notes === 'string' && updates.notes.trim().length > 0 ? updates.notes.trim() : null)
    }

    if (updates.source_label !== undefined) {
      fields.push('source_label = ?')
      values.push(String(updates.source_label).trim() || existing.source_label)
    }

    if (updates.source_url !== undefined) {
      const sourceUrl = typeof updates.source_url === 'string' && updates.source_url.trim().length > 0
        ? updates.source_url.trim()
        : null
      fields.push('source_url = ?')
      values.push(sourceUrl)
      fields.push('source_domain = ?')
      values.push(normalizeDomain(sourceUrl))
    }

    fields.push('updated_at = ?')
    values.push(new Date().toISOString())
    values.push(id)

    db.prepare(`
      UPDATE ai_seeds
      SET ${fields.join(', ')}
      WHERE id = ?
    `).run(...values)

    return this.getById(id)
  }

  static markUsed(id) {
    const db = getDatabase()
    db.prepare('UPDATE ai_seeds SET used_at = ?, updated_at = ? WHERE id = ?').run(
      new Date().toISOString(),
      new Date().toISOString(),
      id
    )
  }

  static getCandidatePool(limit = 16) {
    const db = getDatabase()
    const rows = db.prepare(`
      SELECT *
      FROM ai_seeds
      WHERE status = 'active'
      ORDER BY
        CASE WHEN used_at IS NULL THEN 0 ELSE 1 END ASC,
        used_at ASC,
        RANDOM()
      LIMIT ?
    `).all(parsePositiveInteger(limit, 16))

    return rows.map(normalizeSeedRecord)
  }
}
