import { getDatabase } from '../config/database.js'

const normalizeExhibit = (exhibit) => exhibit && ({
  ...exhibit,
  label: { zh: exhibit.label_zh || '', en: exhibit.label_en || exhibit.label_zh || '' },
  title: { zh: exhibit.title_zh || '', en: exhibit.title_en || exhibit.title_zh || '' },
  summary: { zh: exhibit.summary_zh || '', en: exhibit.summary_en || exhibit.summary_zh || '' }
})

const localized = (data, key, locale) => data?.[key]?.[locale] ?? data?.[`${key}_${locale}`]

export class WorldExhibit {
  static getAll({ status = 'published', regionId = null } = {}) {
    const clauses = []
    const params = []
    if (status) { clauses.push('status = ?'); params.push(status) }
    if (regionId) { clauses.push('region_id = ?'); params.push(regionId) }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    return getDatabase().prepare(`SELECT * FROM world_exhibits ${where} ORDER BY sort_order ASC, updated_at DESC`).all(...params).map(normalizeExhibit)
  }

  static getById(id) {
    return normalizeExhibit(getDatabase().prepare('SELECT * FROM world_exhibits WHERE id = ?').get(id))
  }

  static create(data) {
    const now = new Date().toISOString()
    const result = getDatabase().prepare(`
      INSERT INTO world_exhibits
        (region_id, source_type, source_key, label_zh, label_en, title_zh, title_en, summary_zh, summary_en, href, sort_order, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.region_id ?? data.regionId,
      data.source_type ?? data.sourceType,
      String(data.source_key ?? data.sourceKey ?? '').trim(),
      localized(data, 'label', 'zh') || null,
      localized(data, 'label', 'en') || null,
      localized(data, 'title', 'zh') || null,
      localized(data, 'title', 'en') || null,
      localized(data, 'summary', 'zh') || null,
      localized(data, 'summary', 'en') || null,
      data.href || null,
      Number(data.sort_order ?? data.sortOrder) || 0,
      data.status === 'draft' ? 'draft' : 'published',
      now,
      now
    )
    return this.getById(result.lastInsertRowid)
  }

  static update(id, data) {
    if (!this.getById(id)) return null
    const fields = []
    const values = []
    const set = (column, value) => { fields.push(`${column} = ?`); values.push(value) }
    const aliases = [
      ['region_id', 'regionId'], ['source_type', 'sourceType'], ['source_key', 'sourceKey'],
      ['sort_order', 'sortOrder']
    ]
    for (const [column, alias] of aliases) {
      if (data[column] !== undefined || data[alias] !== undefined) set(column, data[column] ?? data[alias])
    }
    for (const key of ['label', 'title', 'summary']) {
      for (const locale of ['zh', 'en']) {
        const value = localized(data, key, locale)
        if (value !== undefined) set(`${key}_${locale}`, String(value).trim() || null)
      }
    }
    if (data.href !== undefined) set('href', data.href || null)
    if (data.status !== undefined) set('status', data.status === 'draft' ? 'draft' : 'published')
    set('updated_at', new Date().toISOString())
    values.push(id)
    getDatabase().prepare(`UPDATE world_exhibits SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    return this.getById(id)
  }

  static delete(id) {
    return getDatabase().prepare('DELETE FROM world_exhibits WHERE id = ?').run(id).changes > 0
  }
}
