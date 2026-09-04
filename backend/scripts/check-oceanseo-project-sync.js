import assert from 'node:assert/strict'
import Database from 'better-sqlite3'
import {
  importOceanseoProjectUpdate,
  listOceanseoSyncProjects,
  validateOceanseoProjectUpdate
} from '../src/services/oceanseoProjectUpdateImport.js'

const db = new Database(':memory:')
db.exec(`
  CREATE TABLE projects (
    id INTEGER PRIMARY KEY,
    public_id TEXT UNIQUE,
    slug TEXT,
    title_zh TEXT,
    title_en TEXT,
    highlights_zh TEXT DEFAULT '[]',
    highlights_en TEXT DEFAULT '[]',
    status TEXT DEFAULT 'published',
    sort_order INTEGER DEFAULT 0,
    updated_at TEXT
  );
  CREATE TABLE oceanseo_project_update_imports (
    id INTEGER PRIMARY KEY,
    update_id TEXT UNIQUE NOT NULL,
    target_project_id TEXT NOT NULL,
    source_scan_id TEXT NOT NULL,
    source_sha256 TEXT NOT NULL,
    imported_at TEXT NOT NULL,
    result_json TEXT NOT NULL
  );
`)
db.prepare(`
  INSERT INTO projects
    (id, public_id, slug, title_zh, title_en, highlights_zh, highlights_en, status, sort_order, updated_at)
  VALUES (1, 'project:synthetic-001', 'synthetic', '合成项目', 'Synthetic project', '[]', '[]', 'published', 1, ?)
`).run('2026-09-01T12:00:00Z')

const payload = {
  schema_version: '1.0.0',
  update_id: '11111111-1111-4111-8111-111111111111',
  source: {
    system: 'Oceanseo',
    scan_id: '22222222-2222-4222-8222-222222222222',
    observed_at: '2026-09-01T12:00:00Z'
  },
  target_project_id: 'project:synthetic-001',
  approved_at: '2026-09-01T13:00:00Z',
  highlight: {
    zh: '完成合成里程碑。',
    en: 'Completed a synthetic milestone.'
  },
  evidence: ['2 commits', '4 changed files']
}

assert.equal(listOceanseoSyncProjects({ db }).length, 1)
assert.equal(importOceanseoProjectUpdate(payload, { db }).status, 'imported')
assert.equal(importOceanseoProjectUpdate(payload, { db }).status, 'already_imported')
assert.deepEqual(JSON.parse(db.prepare('SELECT highlights_zh FROM projects WHERE id = 1').get().highlights_zh), ['完成合成里程碑。'])
assert.equal(db.prepare('SELECT count(*) AS count FROM oceanseo_project_update_imports').get().count, 1)

assert.throws(
  () => validateOceanseoProjectUpdate({ ...payload, schema_version: '2.0.0' }),
  /invalid_project_update/
)
assert.throws(
  () => validateOceanseoProjectUpdate({ ...payload, local_path: '/private/path' }),
  /invalid_project_update/
)
assert.throws(
  () => importOceanseoProjectUpdate({ ...payload, update_id: '33333333-3333-4333-8333-333333333333', target_project_id: 'project:missing' }, { db }),
  /target_project_not_found/
)

db.close()
console.log('Oceanseo project sync checks passed.')
