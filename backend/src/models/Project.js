import { getDatabase } from '../config/database.js'

const parseTags = (value) => {
  try {
    const parsed = JSON.parse(value || '[]')
    return Array.isArray(parsed) ? parsed.filter(tag => typeof tag === 'string') : []
  } catch {
    return []
  }
}

const normalizeProject = (project) => project && ({
  ...project,
  title: { zh: project.title_zh, en: project.title_en || project.title_zh },
  summary: { zh: project.summary_zh, en: project.summary_en || project.summary_zh },
  tags: parseTags(project.tags)
})

const readLocalized = (data, key, locale) => (
  data?.[key]?.[locale] ?? data?.[`${key}_${locale}`]
)

export class Project {
  static getAll({ status = 'published' } = {}) {
    const db = getDatabase()
    const where = status ? 'WHERE status = ?' : ''
    const params = status ? [status] : []
    return db.prepare(`SELECT * FROM projects ${where} ORDER BY sort_order ASC, updated_at DESC`).all(...params).map(normalizeProject)
  }

  static getById(id) {
    return normalizeProject(getDatabase().prepare('SELECT * FROM projects WHERE id = ?').get(id))
  }

  static getBySlug(slug) {
    return normalizeProject(getDatabase().prepare('SELECT * FROM projects WHERE slug = ?').get(slug))
  }

  static create(data) {
    const db = getDatabase()
    const now = new Date().toISOString()
    const result = db.prepare(`
      INSERT INTO projects
        (slug, title_zh, title_en, summary_zh, summary_en, url, image_url, tags, status, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      String(data.slug || '').trim(),
      String(readLocalized(data, 'title', 'zh') || '').trim(),
      String(readLocalized(data, 'title', 'en') || '').trim() || null,
      String(readLocalized(data, 'summary', 'zh') || '').trim(),
      String(readLocalized(data, 'summary', 'en') || '').trim() || null,
      String(data.url || '').trim(),
      data.image_url || data.imageUrl || null,
      JSON.stringify(Array.isArray(data.tags) ? data.tags : []),
      data.status === 'draft' ? 'draft' : 'published',
      Number.isFinite(Number(data.sort_order ?? data.sortOrder)) ? Number(data.sort_order ?? data.sortOrder) : 0,
      now,
      now
    )
    return this.getById(result.lastInsertRowid)
  }

  static update(id, data) {
    const current = this.getById(id)
    if (!current) return null

    const fields = []
    const values = []
    const set = (column, value) => { fields.push(`${column} = ?`); values.push(value) }
    const localizedFields = [
      ['title', 'zh'], ['title', 'en'], ['summary', 'zh'], ['summary', 'en']
    ]
    for (const [key, locale] of localizedFields) {
      const value = readLocalized(data, key, locale)
      if (value !== undefined) set(`${key}_${locale}`, String(value).trim() || null)
    }
    if (data.slug !== undefined) set('slug', String(data.slug).trim())
    if (data.url !== undefined) set('url', String(data.url).trim())
    if (data.image_url !== undefined || data.imageUrl !== undefined) set('image_url', data.image_url ?? data.imageUrl ?? null)
    if (data.tags !== undefined) set('tags', JSON.stringify(Array.isArray(data.tags) ? data.tags : []))
    if (data.status !== undefined) set('status', data.status === 'draft' ? 'draft' : 'published')
    if (data.sort_order !== undefined || data.sortOrder !== undefined) set('sort_order', Number(data.sort_order ?? data.sortOrder) || 0)
    set('updated_at', new Date().toISOString())
    values.push(id)
    getDatabase().prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    return this.getById(id)
  }

  static delete(id) {
    return getDatabase().prepare('DELETE FROM projects WHERE id = ?').run(id).changes > 0
  }
}
