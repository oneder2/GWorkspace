import { getDatabase } from '../config/database.js'

const parseSpec = (value) => {
  try {
    const parsed = JSON.parse(value || 'null')
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

const normalizeModel = (row) => row && ({
  project_id: row.project_id,
  source_hash: row.source_hash,
  spec: parseSpec(row.spec),
  provider_mode: row.provider_mode,
  revision: row.revision,
  created_at: row.created_at,
  updated_at: row.updated_at
})

const normalizeJob = (row) => row && ({
  ...row,
  error: row.error || null,
  provider_mode: row.provider_mode || null
})

export class GellariaProjectModel {
  static get(projectId) {
    return normalizeModel(getDatabase().prepare(
      'SELECT * FROM gellaria_project_models WHERE project_id = ?'
    ).get(projectId))
  }

  static getMany(projectIds) {
    if (!projectIds.length) return new Map()
    const placeholders = projectIds.map(() => '?').join(', ')
    const rows = getDatabase().prepare(
      `SELECT * FROM gellaria_project_models WHERE project_id IN (${placeholders})`
    ).all(...projectIds)
    return new Map(rows.map(row => [row.project_id, normalizeModel(row)]))
  }

  static createJob(projectId, sourceHash) {
    const now = new Date().toISOString()
    const db = getDatabase()
    db.prepare(`
      UPDATE gellaria_model_jobs
      SET status = 'superseded', completed_at = ?, updated_at = ?
      WHERE project_id = ? AND status IN ('queued', 'running')
    `).run(now, now, projectId)
    const result = db.prepare(`
      INSERT INTO gellaria_model_jobs
        (project_id, source_hash, status, created_at, updated_at)
      VALUES (?, ?, 'queued', ?, ?)
    `).run(projectId, sourceHash, now, now)
    return this.getJob(result.lastInsertRowid)
  }

  static getJob(id) {
    return normalizeJob(getDatabase().prepare('SELECT * FROM gellaria_model_jobs WHERE id = ?').get(id))
  }

  static getLatestJob(projectId) {
    return normalizeJob(getDatabase().prepare(`
      SELECT * FROM gellaria_model_jobs WHERE project_id = ? ORDER BY id DESC LIMIT 1
    `).get(projectId))
  }

  static listJobs({ limit = 50 } = {}) {
    return getDatabase().prepare(`
      SELECT jobs.*, projects.slug, projects.title_zh, projects.title_en
      FROM gellaria_model_jobs jobs
      JOIN projects ON projects.id = jobs.project_id
      ORDER BY jobs.id DESC LIMIT ?
    `).all(Math.max(1, Math.min(Number(limit) || 50, 200))).map(normalizeJob)
  }

  static markRunning(id) {
    const now = new Date().toISOString()
    getDatabase().prepare(`
      UPDATE gellaria_model_jobs SET status = 'running', started_at = ?, updated_at = ? WHERE id = ?
    `).run(now, now, id)
    return this.getJob(id)
  }

  static complete(id, { projectId, sourceHash, spec, providerMode }) {
    const now = new Date().toISOString()
    const db = getDatabase()
    const current = this.get(projectId)
    db.transaction(() => {
      const job = db.prepare('SELECT status FROM gellaria_model_jobs WHERE id = ?').get(id)
      if (job?.status !== 'running') return
      db.prepare(`
        INSERT INTO gellaria_project_models
          (project_id, source_hash, spec, provider_mode, revision, created_at, updated_at)
        VALUES (?, ?, ?, ?, 1, ?, ?)
        ON CONFLICT(project_id) DO UPDATE SET
          source_hash = excluded.source_hash,
          spec = excluded.spec,
          provider_mode = excluded.provider_mode,
          revision = gellaria_project_models.revision + 1,
          updated_at = excluded.updated_at
      `).run(projectId, sourceHash, JSON.stringify(spec), providerMode, current?.created_at || now, now)
      db.prepare(`
        UPDATE gellaria_model_jobs
        SET status = 'completed', provider_mode = ?, completed_at = ?, updated_at = ?
        WHERE id = ? AND status = 'running'
      `).run(providerMode, now, now, id)
    })()
    return this.get(projectId)
  }

  static fail(id, error) {
    const now = new Date().toISOString()
    getDatabase().prepare(`
      UPDATE gellaria_model_jobs
      SET status = 'failed', error = ?, completed_at = ?, updated_at = ? WHERE id = ?
    `).run(String(error || 'Model generation failed').slice(0, 500), now, now, id)
    return this.getJob(id)
  }
}
