import { getDatabase } from '../config/database.js'
import { Blog } from './Blog.js'

const PROJECT_TYPES = new Set(['essay', 'novel'])
const PROJECT_STATUSES = new Set(['active', 'revising', 'completed', 'archived'])
const DOCUMENT_KINDS = new Set(['essay', 'part', 'chapter', 'scene', 'note'])
const DOCUMENT_STATUSES = new Set(['planned', 'drafting', 'revising', 'done'])
const ENTITY_TYPES = new Set(['character', 'location', 'organization', 'object', 'rule'])

const parseJsonList = (value) => {
  try {
    const parsed = JSON.parse(value || '[]')
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []
  } catch {
    return []
  }
}

const normalizeProject = (row) => row && ({ ...row, tags: parseJsonList(row.tags) })
const normalizeEntity = (row) => row && ({ ...row, aliases: parseJsonList(row.aliases) })

const countWords = (content = '') => {
  const normalized = String(content).trim()
  if (!normalized) return 0
  const cjkCount = (normalized.match(/[\u3400-\u9fff]/g) || []).length
  const latinCount = (normalized.replace(/[\u3400-\u9fff]/g, ' ').match(/[\p{L}\p{N}]+/gu) || []).length
  return cjkCount + latinCount
}

const createSlug = (title = '') => {
  const base = String(title)
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'essay'
  return `${base}-${Date.now().toString(36)}`
}

const assertOwnedProject = (projectId, ownerId) => {
  const row = getDatabase().prepare(`
    SELECT p.*, (SELECT status FROM blogs WHERE id = p.blog_id) AS blog_status
    FROM writing_projects p
    WHERE p.id = ? AND p.owner_id = ?
  `).get(projectId, ownerId)
  if (!row) throw Object.assign(new Error('Writing project not found'), { status: 404 })
  return normalizeProject(row)
}

const assertOwnedDocument = (documentId, ownerId) => {
  const row = getDatabase().prepare(`
    SELECT d.*
    FROM writing_documents d
    JOIN writing_projects p ON p.id = d.project_id
    WHERE d.id = ? AND p.owner_id = ?
  `).get(documentId, ownerId)
  if (!row) throw Object.assign(new Error('Writing document not found'), { status: 404 })
  return row
}

export class WritingStudio {
  static countWords(content) {
    return countWords(content)
  }

  static getProjects(ownerId) {
    return getDatabase().prepare(`
      SELECT
        p.*,
        (SELECT status FROM blogs WHERE id = p.blog_id) AS blog_status,
        COUNT(d.id) AS document_count,
        COALESCE(SUM(d.word_count), 0) AS word_count
      FROM writing_projects p
      LEFT JOIN writing_documents d ON d.project_id = p.id
      WHERE p.owner_id = ?
      GROUP BY p.id
      ORDER BY p.updated_at DESC
    `).all(ownerId).map(normalizeProject)
  }

  static getProject(projectId, ownerId) {
    const project = assertOwnedProject(projectId, ownerId)
    const db = getDatabase()
    return {
      ...project,
      documents: db.prepare('SELECT * FROM writing_documents WHERE project_id = ? ORDER BY position ASC, id ASC').all(projectId),
      entities: db.prepare('SELECT * FROM writing_entities WHERE project_id = ? ORDER BY entity_type ASC, name ASC').all(projectId).map(normalizeEntity)
    }
  }

  static createProject(ownerId, data = {}) {
    const type = PROJECT_TYPES.has(data.type) ? data.type : 'essay'
    const title = String(data.title || '').trim() || (type === 'novel' ? '未命名小说' : '未命名杂文')
    const targetWords = Math.max(0, Number.parseInt(data.target_words ?? data.targetWords, 10) || 0)
    const now = new Date().toISOString()
    const db = getDatabase()

    const create = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO writing_projects
          (owner_id, type, title, description, status, target_words, genre, excerpt, tags, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?)
      `).run(
        ownerId,
        type,
        title,
        String(data.description || '').trim(),
        targetWords,
        String(data.genre || '').trim(),
        String(data.excerpt || '').trim(),
        JSON.stringify(Array.isArray(data.tags) ? data.tags : []),
        now,
        now
      )

      const projectId = Number(result.lastInsertRowid)
      const documentTitle = type === 'novel' ? '第一章' : title
      db.prepare(`
        INSERT INTO writing_documents
          (project_id, kind, title, position, status, word_count, created_at, updated_at)
        VALUES (?, ?, ?, 0, 'drafting', 0, ?, ?)
      `).run(projectId, type === 'novel' ? 'chapter' : 'essay', documentTitle, now, now)
      return projectId
    })

    return this.getProject(create(), ownerId)
  }

  static updateProject(projectId, ownerId, data = {}) {
    assertOwnedProject(projectId, ownerId)
    const fields = []
    const values = []
    const set = (column, value) => { fields.push(`${column} = ?`); values.push(value) }

    if (data.title !== undefined) set('title', String(data.title).trim() || '未命名项目')
    if (data.description !== undefined) set('description', String(data.description).trim())
    if (data.outline !== undefined) set('outline', String(data.outline))
    if (data.status !== undefined && PROJECT_STATUSES.has(data.status)) set('status', data.status)
    if (data.target_words !== undefined || data.targetWords !== undefined) set('target_words', Math.max(0, Number.parseInt(data.target_words ?? data.targetWords, 10) || 0))
    if (data.genre !== undefined) set('genre', String(data.genre).trim())
    if (data.excerpt !== undefined) set('excerpt', String(data.excerpt).trim())
    if (data.tags !== undefined) set('tags', JSON.stringify(Array.isArray(data.tags) ? data.tags : []))
    set('updated_at', new Date().toISOString())
    values.push(projectId)
    getDatabase().prepare(`UPDATE writing_projects SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    return this.getProject(projectId, ownerId)
  }

  static deleteProject(projectId, ownerId) {
    assertOwnedProject(projectId, ownerId)
    return getDatabase().prepare('DELETE FROM writing_projects WHERE id = ?').run(projectId).changes > 0
  }

  static createDocument(projectId, ownerId, data = {}) {
    const project = assertOwnedProject(projectId, ownerId)
    const fallbackKind = project.type === 'essay' ? 'essay' : 'chapter'
    const kind = DOCUMENT_KINDS.has(data.kind) ? data.kind : fallbackKind
    const parentId = data.parent_id ?? data.parentId ?? null
    if (parentId !== null) {
      const parent = assertOwnedDocument(Number(parentId), ownerId)
      if (parent.project_id !== Number(projectId)) throw Object.assign(new Error('Parent document belongs to another project'), { status: 400 })
    }
    const db = getDatabase()
    const nextPosition = db.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS value FROM writing_documents WHERE project_id = ? AND parent_id IS ?').get(projectId, parentId).value
    const now = new Date().toISOString()
    const result = db.prepare(`
      INSERT INTO writing_documents
        (project_id, parent_id, kind, title, synopsis, content, position, status, word_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, '', ?, 'drafting', 0, ?, ?)
    `).run(projectId, parentId, kind, String(data.title || '').trim() || '未命名章节', String(data.synopsis || '').trim(), nextPosition, now, now)
    db.prepare('UPDATE writing_projects SET updated_at = ? WHERE id = ?').run(now, projectId)
    return assertOwnedDocument(Number(result.lastInsertRowid), ownerId)
  }

  static updateDocument(documentId, ownerId, data = {}) {
    const current = assertOwnedDocument(documentId, ownerId)
    const fields = []
    const values = []
    const set = (column, value) => { fields.push(`${column} = ?`); values.push(value) }
    if (data.title !== undefined) set('title', String(data.title).trim() || '未命名章节')
    if (data.synopsis !== undefined) set('synopsis', String(data.synopsis))
    if (data.content !== undefined) {
      const content = String(data.content)
      set('content', content)
      set('word_count', countWords(content))
    }
    if (data.status !== undefined && DOCUMENT_STATUSES.has(data.status)) set('status', data.status)
    if (data.position !== undefined) set('position', Math.max(0, Number.parseInt(data.position, 10) || 0))
    set('updated_at', new Date().toISOString())
    values.push(documentId)
    getDatabase().prepare(`UPDATE writing_documents SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    getDatabase().prepare('UPDATE writing_projects SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), current.project_id)
    return assertOwnedDocument(documentId, ownerId)
  }

  static deleteDocument(documentId, ownerId) {
    const current = assertOwnedDocument(documentId, ownerId)
    const db = getDatabase()
    const count = db.prepare('SELECT COUNT(*) AS value FROM writing_documents WHERE project_id = ?').get(current.project_id).value
    if (count <= 1) throw Object.assign(new Error('A writing project must keep at least one document'), { status: 400 })
    return db.transaction(() => {
      const deleted = db.prepare('DELETE FROM writing_documents WHERE id = ?').run(documentId).changes > 0
      const siblings = db.prepare(`
        SELECT id FROM writing_documents
        WHERE project_id = ? AND parent_id IS ?
        ORDER BY position ASC, id ASC
      `).all(current.project_id, current.parent_id)
      const updatePosition = db.prepare('UPDATE writing_documents SET position = ? WHERE id = ?')
      siblings.forEach((document, position) => updatePosition.run(position, document.id))
      db.prepare('UPDATE writing_projects SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), current.project_id)
      return deleted
    })()
  }

  static reorderChapters(projectId, ownerId, documentIds = []) {
    const project = assertOwnedProject(projectId, ownerId)
    if (project.type !== 'novel') throw Object.assign(new Error('Only novel chapters can be reordered'), { status: 400 })

    const ids = Array.isArray(documentIds) ? documentIds.map(Number) : []
    if (ids.some((id) => !Number.isInteger(id)) || new Set(ids).size !== ids.length) {
      throw Object.assign(new Error('Chapter order contains invalid document IDs'), { status: 400 })
    }

    const db = getDatabase()
    const chapters = db.prepare(`
      SELECT id FROM writing_documents
      WHERE project_id = ? AND parent_id IS NULL AND kind = 'chapter'
      ORDER BY position ASC, id ASC
    `).all(projectId)
    const expectedIds = chapters.map((chapter) => chapter.id)
    if (ids.length !== expectedIds.length || ids.some((id) => !expectedIds.includes(id))) {
      throw Object.assign(new Error('Chapter order must include every top-level chapter exactly once'), { status: 400 })
    }

    db.transaction(() => {
      const updatePosition = db.prepare('UPDATE writing_documents SET position = ?, updated_at = ? WHERE id = ?')
      const now = new Date().toISOString()
      ids.forEach((id, position) => updatePosition.run(position, now, id))
      db.prepare('UPDATE writing_projects SET updated_at = ? WHERE id = ?').run(now, projectId)
    })()

    return db.prepare('SELECT * FROM writing_documents WHERE project_id = ? ORDER BY position ASC, id ASC').all(projectId)
  }

  static createRevision(documentId, ownerId, reason = 'manual') {
    const document = assertOwnedDocument(documentId, ownerId)
    const result = getDatabase().prepare(`
      INSERT INTO writing_revisions (document_id, title, content, word_count, reason, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(documentId, document.title, document.content, document.word_count, String(reason || 'manual').slice(0, 80), new Date().toISOString())
    return getDatabase().prepare('SELECT * FROM writing_revisions WHERE id = ?').get(result.lastInsertRowid)
  }

  static getRevisions(documentId, ownerId) {
    assertOwnedDocument(documentId, ownerId)
    return getDatabase().prepare(`
      SELECT id, document_id, title, word_count, reason, created_at
      FROM writing_revisions
      WHERE document_id = ?
      ORDER BY created_at DESC
      LIMIT 30
    `).all(documentId)
  }

  static createEntity(projectId, ownerId, data = {}) {
    assertOwnedProject(projectId, ownerId)
    const entityType = ENTITY_TYPES.has(data.entity_type ?? data.entityType) ? (data.entity_type ?? data.entityType) : 'character'
    const name = String(data.name || '').trim()
    if (!name) throw Object.assign(new Error('Entity name is required'), { status: 400 })
    const now = new Date().toISOString()
    const result = getDatabase().prepare(`
      INSERT INTO writing_entities (project_id, entity_type, name, aliases, summary, details, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(projectId, entityType, name, JSON.stringify(Array.isArray(data.aliases) ? data.aliases : []), String(data.summary || ''), String(data.details || ''), now, now)
    return normalizeEntity(getDatabase().prepare('SELECT * FROM writing_entities WHERE id = ?').get(result.lastInsertRowid))
  }

  static updateEntity(entityId, ownerId, data = {}) {
    const db = getDatabase()
    const current = db.prepare(`
      SELECT e.* FROM writing_entities e
      JOIN writing_projects p ON p.id = e.project_id
      WHERE e.id = ? AND p.owner_id = ?
    `).get(entityId, ownerId)
    if (!current) throw Object.assign(new Error('Writing entity not found'), { status: 404 })
    const fields = []
    const values = []
    const set = (column, value) => { fields.push(`${column} = ?`); values.push(value) }
    if (data.name !== undefined) set('name', String(data.name).trim() || current.name)
    if (data.entity_type !== undefined || data.entityType !== undefined) {
      const type = data.entity_type ?? data.entityType
      if (ENTITY_TYPES.has(type)) set('entity_type', type)
    }
    if (data.aliases !== undefined) set('aliases', JSON.stringify(Array.isArray(data.aliases) ? data.aliases : []))
    if (data.summary !== undefined) set('summary', String(data.summary))
    if (data.details !== undefined) set('details', String(data.details))
    set('updated_at', new Date().toISOString())
    values.push(entityId)
    db.prepare(`UPDATE writing_entities SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    return normalizeEntity(db.prepare('SELECT * FROM writing_entities WHERE id = ?').get(entityId))
  }

  static deleteEntity(entityId, ownerId) {
    const current = getDatabase().prepare(`
      SELECT e.id FROM writing_entities e
      JOIN writing_projects p ON p.id = e.project_id
      WHERE e.id = ? AND p.owner_id = ?
    `).get(entityId, ownerId)
    if (!current) throw Object.assign(new Error('Writing entity not found'), { status: 404 })
    return getDatabase().prepare('DELETE FROM writing_entities WHERE id = ?').run(entityId).changes > 0
  }

  static publishEssay(projectId, ownerId, data = {}) {
    const project = this.getProject(projectId, ownerId)
    if (project.type !== 'essay') throw Object.assign(new Error('Only essay projects can publish to the blog'), { status: 400 })
    const document = project.documents.find((item) => item.kind === 'essay') || project.documents[0]
    const title = String(data.title ?? project.title).trim()
    const content = String(document?.content || '').trim()
    if (!title || !content) throw Object.assign(new Error('Title and content are required before publishing'), { status: 400 })
    const status = data.status === 'published' ? 'published' : 'draft'
    const currentBlog = project.blog_id ? Blog.getById(project.blog_id) : null
    const tags = Array.isArray(data.tags) && data.tags.length ? data.tags : (project.tags.length ? project.tags : ['杂文'])
    const excerpt = String(data.excerpt ?? project.excerpt).trim() || content.replace(/[#>*_`\[\]()]/g, '').slice(0, 180)
    const payload = {
      title,
      slug: currentBlog?.slug || createSlug(title),
      genre: String(data.genre ?? project.genre).trim() || '杂文',
      content,
      excerpt,
      tags,
      status,
      published_at: data.published_at ?? data.publishedAt ?? undefined
    }
    const blog = currentBlog ? Blog.update(currentBlog.id, payload) : Blog.create(payload)
    getDatabase().prepare(`
      UPDATE writing_projects
      SET title = ?, genre = ?, excerpt = ?, tags = ?, blog_id = ?, updated_at = ?
      WHERE id = ?
    `).run(title, payload.genre, excerpt, JSON.stringify(tags), blog.id, new Date().toISOString(), projectId)
    return { project: this.getProject(projectId, ownerId), blog }
  }
}
