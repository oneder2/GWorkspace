import { getDatabase } from '../config/database.js'

const normalizeCapsuleRecord = (capsule) => (
  capsule
    ? {
        ...capsule,
        raw_payload: capsule.raw_payload ? JSON.parse(capsule.raw_payload) : null
      }
    : null
)

export class DailyCapsule {
  static getByDate(capsuleDate) {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM daily_capsules WHERE capsule_date = ?').get(capsuleDate)
    return normalizeCapsuleRecord(row)
  }

  static getLatest() {
    const db = getDatabase()
    const row = db.prepare(`
      SELECT *
      FROM daily_capsules
      ORDER BY capsule_date DESC
      LIMIT 1
    `).get()

    return normalizeCapsuleRecord(row)
  }

  static upsert(data = {}) {
    const db = getDatabase()
    const {
      capsule_date,
      seed_id = null,
      source_text,
      source_label = null,
      source_url = null,
      greeting,
      thesis,
      boundary,
      takeaway,
      provider_mode = 'local-fallback',
      status = 'active',
      raw_payload = null
    } = data

    if (!capsule_date) {
      throw new Error('Capsule date is required')
    }

    const now = new Date().toISOString()
    const existing = db.prepare('SELECT id FROM daily_capsules WHERE capsule_date = ?').get(capsule_date)

    if (existing) {
      db.prepare(`
        UPDATE daily_capsules
        SET
          seed_id = ?,
          source_text = ?,
          source_label = ?,
          source_url = ?,
          greeting = ?,
          thesis = ?,
          boundary = ?,
          takeaway = ?,
          provider_mode = ?,
          status = ?,
          raw_payload = ?,
          updated_at = ?
        WHERE capsule_date = ?
      `).run(
        seed_id,
        source_text,
        source_label,
        source_url,
        greeting,
        thesis,
        boundary,
        takeaway,
        provider_mode,
        status,
        raw_payload ? JSON.stringify(raw_payload) : null,
        now,
        capsule_date
      )
    } else {
      db.prepare(`
        INSERT INTO daily_capsules (
          capsule_date,
          seed_id,
          source_text,
          source_label,
          source_url,
          greeting,
          thesis,
          boundary,
          takeaway,
          provider_mode,
          status,
          raw_payload,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        capsule_date,
        seed_id,
        source_text,
        source_label,
        source_url,
        greeting,
        thesis,
        boundary,
        takeaway,
        provider_mode,
        status,
        raw_payload ? JSON.stringify(raw_payload) : null,
        now,
        now
      )
    }

    return this.getByDate(capsule_date)
  }
}
