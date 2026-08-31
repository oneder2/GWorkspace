import { getDatabase } from '../config/database.js'
import { randomUUID } from 'node:crypto'

const parseArray = (value) => {
  if (Array.isArray(value)) return value
  try {
    const parsed = JSON.parse(value || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const parseTags = (value) => parseArray(value).filter(item => typeof item === 'string')
const PROJECT_SURFACES = new Set(['portfolio', 'resume_web', 'resume_pdf', 'gellaria'])

const normalizeSurfaces = (value, fallback = ['portfolio', 'gellaria']) => {
  const surfaces = value === undefined ? fallback : parseTags(value)
  const normalized = [...new Set(surfaces)]
  const invalid = normalized.filter(surface => !PROJECT_SURFACES.has(surface))
  if (invalid.length) throw new Error(`Unsupported surfaces: ${invalid.join(', ')}`)
  return normalized
}

const loadMedia = (ids) => {
  if (!ids.length) return []
  const placeholders = ids.map(() => '?').join(', ')
  const rows = getDatabase().prepare(`SELECT * FROM public_media WHERE public_id IN (${placeholders})`).all(...ids)
  const byId = new Map(rows.map(row => [row.public_id, {
    id: row.public_id,
    url: row.url,
    alt: row.alt_zh || row.alt_en ? { zh: row.alt_zh || row.alt_en, en: row.alt_en || row.alt_zh } : null,
    mime_type: row.mime_type,
    status: row.status,
    width: row.width ?? null,
    height: row.height ?? null
  }]))
  return ids.map(id => byId.get(id)).filter(Boolean)
}

const normalizeProject = (project) => project && ({
  ...project,
  title: { zh: project.title_zh, en: project.title_en || project.title_zh },
  summary: { zh: project.summary_zh, en: project.summary_en || project.summary_zh },
  role: project.role_zh || project.role_en
    ? { zh: project.role_zh || project.role_en, en: project.role_en || project.role_zh }
    : null,
  tags: parseTags(project.tags),
  technologies: parseTags(project.technologies),
  links: parseArray(project.links).filter(link => link && typeof link === 'object'),
  highlights: {
    zh: parseTags(project.highlights_zh),
    en: parseTags(project.highlights_en)
  },
  gallery_media_ids: parseTags(project.gallery_media_ids),
  gallery: loadMedia(parseTags(project.gallery_media_ids)),
  surfaces: parseTags(project.surfaces),
  featured: Boolean(project.featured)
})

const readLocalized = (data, key, locale) => (
  data?.[key]?.[locale] ?? data?.[`${key}_${locale}`]
)

const opaqueId = (kind) => `${kind}:${randomUUID()}`

const inferImageMimeType = (url) => {
  const normalized = String(url || '').toLowerCase()
  if (normalized.includes('.png')) return 'image/png'
  if (normalized.includes('.webp')) return 'image/webp'
  if (normalized.includes('.gif')) return 'image/gif'
  return 'image/jpeg'
}

const syncProjectMedia = (db, project) => {
  if (!project?.image_url) {
    if (project?.public_media_id) {
      db.prepare(`
        UPDATE public_media SET status = 'draft', updated_at = ? WHERE public_id = ?
      `).run(project.updated_at, project.public_media_id)
    }
    return
  }

  const mediaId = project.public_media_id || opaqueId('media')
  if (!project.public_media_id) {
    db.prepare('UPDATE projects SET public_media_id = ? WHERE id = ?').run(mediaId, project.id)
  }

  db.prepare(`
    INSERT INTO public_media
      (public_id, kind, url, mime_type, alt_zh, alt_en, status, sort_order, created_at, updated_at)
    VALUES (?, 'image', ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(public_id) DO UPDATE SET
      url = excluded.url,
      mime_type = excluded.mime_type,
      alt_zh = excluded.alt_zh,
      alt_en = excluded.alt_en,
      status = excluded.status,
      sort_order = excluded.sort_order,
      updated_at = excluded.updated_at
  `).run(
    mediaId,
    project.image_url,
    inferImageMimeType(project.image_url),
    project.title_zh,
    project.title_en || project.title_zh,
    project.status,
    project.sort_order,
    project.created_at,
    project.updated_at
  )
}

const syncProjectGallery = (db, project, galleryInput) => {
  const existingIds = parseTags(project.gallery_media_ids)
  if (galleryInput === undefined) {
    if (existingIds.length) {
      const placeholders = existingIds.map(() => '?').join(', ')
      db.prepare(`UPDATE public_media SET status = ?, updated_at = ? WHERE public_id IN (${placeholders})`)
        .run(project.status, project.updated_at, ...existingIds)
    }
    return
  }

  const nextIds = []
  const gallery = Array.isArray(galleryInput) ? galleryInput : []
  gallery.forEach((item, index) => {
    const source = typeof item === 'string' ? { url: item } : item || {}
    const url = String(source.url || '').trim()
    if (!url) return
    const mediaId = source.id && existingIds.includes(source.id) ? source.id : opaqueId('media')
    nextIds.push(mediaId)
    db.prepare(`
      INSERT INTO public_media
        (public_id, kind, url, mime_type, alt_zh, alt_en, status, sort_order, created_at, updated_at)
      VALUES (?, 'image', ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(public_id) DO UPDATE SET
        url = excluded.url,
        mime_type = excluded.mime_type,
        alt_zh = excluded.alt_zh,
        alt_en = excluded.alt_en,
        status = excluded.status,
        sort_order = excluded.sort_order,
        updated_at = excluded.updated_at
    `).run(
      mediaId, url, source.mime_type || inferImageMimeType(url),
      source.alt?.zh || `${project.title_zh} ${index + 1}`,
      source.alt?.en || `${project.title_en || project.title_zh} ${index + 1}`,
      project.status, index, project.created_at, project.updated_at
    )
  })

  const removedIds = existingIds.filter(id => !nextIds.includes(id))
  if (removedIds.length) {
    const placeholders = removedIds.map(() => '?').join(', ')
    db.prepare(`UPDATE public_media SET status = 'draft', updated_at = ? WHERE public_id IN (${placeholders})`)
      .run(project.updated_at, ...removedIds)
  }
  db.prepare('UPDATE projects SET gallery_media_ids = ? WHERE id = ?').run(JSON.stringify(nextIds), project.id)
}

export class Project {
  static getAll({ status = 'published', surface = null } = {}) {
    const db = getDatabase()
    const clauses = []
    const params = []
    if (status) { clauses.push('status = ?'); params.push(status) }
    if (surface) {
      clauses.push(`EXISTS (
        SELECT 1 FROM json_each(CASE WHEN json_valid(surfaces) THEN surfaces ELSE '[]' END)
        WHERE json_each.value = ?
      )`)
      params.push(surface)
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
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
        (public_id, slug, title_zh, title_en, summary_zh, summary_en, role_zh, role_en,
         start_date, end_date, involvement, technologies, highlights_zh, highlights_en,
         featured, links, url, image_url, tags, status, surfaces, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      opaqueId('project'),
      String(data.slug || '').trim(),
      String(readLocalized(data, 'title', 'zh') || '').trim(),
      String(readLocalized(data, 'title', 'en') || '').trim() || null,
      String(readLocalized(data, 'summary', 'zh') || '').trim(),
      String(readLocalized(data, 'summary', 'en') || '').trim() || null,
      String(readLocalized(data, 'role', 'zh') || '').trim() || null,
      String(readLocalized(data, 'role', 'en') || '').trim() || null,
      String(data.start_date || data.startDate || now.slice(0, 7)).trim(),
      String(data.end_date || data.endDate || '').trim() || null,
      ['creator', 'contributor', 'collaborator'].includes(data.involvement) ? data.involvement : 'creator',
      JSON.stringify(Array.isArray(data.technologies) ? data.technologies : []),
      JSON.stringify(parseTags(data.highlights?.zh ?? data.highlights_zh)),
      JSON.stringify(parseTags(data.highlights?.en ?? data.highlights_en)),
      data.featured ? 1 : 0,
      JSON.stringify(Array.isArray(data.links) ? data.links : []),
      String(data.url || '').trim(),
      data.image_url || data.imageUrl || null,
      JSON.stringify(Array.isArray(data.tags) ? data.tags : []),
      data.status === 'draft' ? 'draft' : 'published',
      JSON.stringify(normalizeSurfaces(data.surfaces)),
      Number.isFinite(Number(data.sort_order ?? data.sortOrder)) ? Number(data.sort_order ?? data.sortOrder) : 0,
      now,
      now
    )
    const created = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid)
    syncProjectMedia(db, created)
    syncProjectGallery(db, created, data.gallery)
    return this.getById(result.lastInsertRowid)
  }

  static update(id, data) {
    const current = this.getById(id)
    if (!current) return null

    const fields = []
    const values = []
    const set = (column, value) => { fields.push(`${column} = ?`); values.push(value) }
    const localizedFields = [
      ['title', 'zh'], ['title', 'en'], ['summary', 'zh'], ['summary', 'en'],
      ['role', 'zh'], ['role', 'en']
    ]
    for (const [key, locale] of localizedFields) {
      const value = readLocalized(data, key, locale)
      if (value !== undefined) set(`${key}_${locale}`, String(value).trim() || null)
    }
    if (data.slug !== undefined) set('slug', String(data.slug).trim())
    if (data.url !== undefined) set('url', String(data.url).trim())
    if (data.image_url !== undefined || data.imageUrl !== undefined) set('image_url', data.image_url ?? data.imageUrl ?? null)
    if (data.tags !== undefined) set('tags', JSON.stringify(Array.isArray(data.tags) ? data.tags : []))
    if (data.technologies !== undefined) set('technologies', JSON.stringify(Array.isArray(data.technologies) ? data.technologies : []))
    if (data.links !== undefined) set('links', JSON.stringify(Array.isArray(data.links) ? data.links : []))
    if (data.highlights !== undefined || data.highlights_zh !== undefined) set('highlights_zh', JSON.stringify(parseTags(data.highlights?.zh ?? data.highlights_zh)))
    if (data.highlights !== undefined || data.highlights_en !== undefined) set('highlights_en', JSON.stringify(parseTags(data.highlights?.en ?? data.highlights_en)))
    if (data.involvement !== undefined) set('involvement', ['creator', 'contributor', 'collaborator'].includes(data.involvement) ? data.involvement : 'creator')
    if (data.surfaces !== undefined) set('surfaces', JSON.stringify(normalizeSurfaces(data.surfaces, current.surfaces)))
    if (data.featured !== undefined) set('featured', data.featured ? 1 : 0)
    if (data.start_date !== undefined || data.startDate !== undefined) set('start_date', data.start_date ?? data.startDate)
    if (data.end_date !== undefined || data.endDate !== undefined) set('end_date', data.end_date ?? data.endDate ?? null)
    if (data.status !== undefined) set('status', data.status === 'draft' ? 'draft' : 'published')
    if (data.sort_order !== undefined || data.sortOrder !== undefined) set('sort_order', Number(data.sort_order ?? data.sortOrder) || 0)
    set('updated_at', new Date().toISOString())
    values.push(id)
    getDatabase().prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    const updated = getDatabase().prepare('SELECT * FROM projects WHERE id = ?').get(id)
    syncProjectMedia(getDatabase(), updated)
    syncProjectGallery(getDatabase(), updated, data.gallery)
    return this.getById(id)
  }

  static delete(id) {
    const db = getDatabase()
    const project = db.prepare('SELECT public_media_id, gallery_media_ids FROM projects WHERE id = ?').get(id)
    const deleted = db.prepare('DELETE FROM projects WHERE id = ?').run(id).changes > 0
    if (deleted && project?.public_media_id) {
      db.prepare(`UPDATE public_media SET status = 'draft', updated_at = ? WHERE public_id = ?`)
        .run(new Date().toISOString(), project.public_media_id)
    }
    const galleryIds = parseTags(project?.gallery_media_ids)
    if (deleted && galleryIds.length) {
      const placeholders = galleryIds.map(() => '?').join(', ')
      db.prepare(`UPDATE public_media SET status = 'draft', updated_at = ? WHERE public_id IN (${placeholders})`)
        .run(new Date().toISOString(), ...galleryIds)
    }
    return deleted
  }
}
