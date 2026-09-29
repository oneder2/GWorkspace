import { createHash, randomUUID } from 'node:crypto'
import { getDatabase } from '../config/database.js'
import { ARTIFACT_MOTIFS, ARTIFACT_MOTIF_NAMES, DESIGN_GENERATOR, designArtifact, readingStage } from './artifactDesign.js'

// Only these fixed sources can own an artifact. Slugs are never foreign keys.
const sources = {
  project: { table: 'projects', column: 'project_id' },
  blog: { table: 'blogs', column: 'blog_id' },
  capsule: { table: 'daily_capsules', column: 'capsule_id' },
  placement: { table: 'world_exhibits', column: 'placement_id' }
}
const parse = (value, fallback = []) => { try { return JSON.parse(value) ?? fallback } catch { return fallback } }
const list = value => { const parsed = parse(value); return Array.isArray(parsed) ? parsed.filter(item => typeof item === 'string') : [] }
const plain = value => String(value || '').replace(/<[^>]*>/g, ' ').replace(/[#>*_`\[\]()]/g, ' ').replace(/\s+/g, ' ').trim()
const categories = [
  { form: 'world-diorama', zone: '空间与体验', terms: /gellaria|three\.js|webgl|三维|3d|游戏|空间探索|虚拟世界/gi, motif: '地形、建筑与环绕路径', colors: ['#72afa4', '#cda779', '#cfecdf'] },
  { form: 'research-desk', zone: '知识与推理', terms: /\bai\b|人工智能|大模型|机器学习|检索|引用|学术|research|cite|llm|rag\b/gi, motif: '文献层、检索透镜与证据连线', colors: ['#7b9cbd', '#b9b2d7', '#e1f1ed'] },
  { form: 'network-switch', zone: '连接与系统', terms: /api\b|network|cloud|connect|网络|协作|连接|云服务|分布式|平台/gi, motif: '端口、节点与交换桥', colors: ['#6c999e', '#dca875', '#bbede9'] },
  { form: 'publishing-press', zone: '表达与记录', terms: /writing|blog|content|resume|document|写作|博客|内容|简历|档案|出版|笔记|文档库/gi, motif: '纸卷、字模与输出书页', colors: ['#b79d7b', '#7c91a0', '#f4e2b6'] },
  { form: 'planning-clock', zone: '生活与工具', terms: /计划|日程|时间管理|规划|待办|任务管理|planner|calendar|schedule/gi, motif: '日历刻度、计时盘与任务签', colors: ['#859bac', '#d3b782', '#e7efd6'] },
  { form: 'mobile-companion', zone: '生活与工具', terms: /mobile|flutter|android|ios\b|健康|健身|移动|习惯|运动/gi, motif: '掌上屏幕、刻度与陪伴环', colors: ['#7bb5a0', '#ccb3a0', '#c9f0d6'] },
  { form: 'growth-garden', zone: '生长与发现', terms: /seo\b|oceanseo|搜索优化|增长|生长|植物|生态|自然/gi, motif: '阶梯苗床与生长分枝', colors: ['#879b70', '#c2a66e', '#e2efb5'] },
  { form: 'travel-lantern', zone: '经验与叙事', terms: /旅行|旅途|日记|回忆|生活|故事|小说|文学|随笔|历史|人类|文明|travel|story|poem/gi, motif: '道路、灯笼与展开的叙事书页', colors: ['#c49480', '#9a8fa9', '#f7dfbb'] },
  { form: 'logic-engine', zone: '结构与方法', terms: /算法|工程|技术|编程|代码|架构|设计|思考|哲学|系统|code|design|engineer/gi, motif: '错层齿盘与结构支架', colors: ['#88a3b5', '#bd995f', '#d9e7fa'] }
]

function sourcePayload(kind, row) {
  const chapters = []
  let fence = null
  for (const line of String(row.content || '').split(/\r?\n/)) {
    const block = line.trim()
    if (!block) continue
    const marker = /^(`{3,}|~{3,})/.exec(block)?.[1]
    if (marker) { if (!fence) fence = marker; else if (marker[0] === fence[0] && marker.length >= fence.length) fence = null; continue }
    if (fence) continue
    const heading = /^#{1,6}\s+(.+)/.exec(block)
    if (heading) { chapters.push({ title: plain(heading[1]).slice(0, 80), excerpt: '' }); continue }
    if (!chapters.length) chapters.push({ title: '开篇', excerpt: '' })
    if (!chapters.at(-1).excerpt && !/^!\[/.test(block)) chapters.at(-1).excerpt = plain(block).slice(0, 180)
  }
  return {
    kind,
    title: row.title_zh || row.title || row.greeting || row.source_text || '',
    alternateTitle: row.title_en || '',
    summary: plain(row.summary_zh || row.excerpt || row.thesis || row.summary_en),
    content: plain(row.content || row.source_text),
    tags: [...list(row.tags), ...list(row.technologies)],
    genre: row.genre || '',
    highlights: list(row.highlights_zh),
    role: row.role_zh || '',
    surfaces: list(row.surfaces),
    views: row.views || 0,
    chapters: chapters.slice(0, 6),
    structure: {
      headings: [...String(row.content || '').matchAll(/^#{1,6}\s+(.+)$/gm)].map(match => plain(match[1]).slice(0, 100)).slice(0, 12),
      paragraphs: String(row.content || '').split(/\n\s*\n/).filter(value => value.trim()).length,
      images: (String(row.content || '').match(/!\[[^\]]*\]\(/g) || []).length,
      codeBlocks: Math.floor((String(row.content || '').match(/^```/gm) || []).length / 2)
    },
    featured: Boolean(row.featured)
  }
}

export function createArtifactSpec(payload, stableIdentity) {
  const text = [payload.title, payload.alternateTitle, payload.summary, payload.content, payload.genre, ...payload.tags, ...payload.highlights].join(' ')
  // Highest matched subject wins; generic words cannot mask a specific subject.
  const ranked = categories.map((category, index) => {
    const matches = [...new Set(text.match(category.terms) || [])]
    const titleMatches = [...new Set([payload.title, payload.alternateTitle, payload.genre].join(' ').match(category.terms) || [])]
    return { category, index, matches, score: matches.length + titleMatches.length * 5 }
  }).sort((a, b) => b.score - a.score || a.index - b.index)
  const best = ranked[0]?.matches.length ? ranked[0] : null
  const fallback = { form: 'folio', zone: payload.kind === 'project' ? '作品与原型' : '札记与思想', motif: '装订书脊、层叠页与索引签', colors: ['#bba488', '#809ca9', '#f1dfbc'] }
  const selected = payload.kind === 'capsule' ? { ...fallback, form: 'daily-leaf', zone: '今日赠语', motif: '一张悬起的光页与日轮' } : best?.category || fallback
  const seed = Number.parseInt(createHash('sha256').update(stableIdentity).digest('hex').slice(0, 8), 16) % 100000
  return {
    version: 2, seed, form: selected.form, zone: selected.zone,
    colors: selected.colors,
    proportions: { width: .9 + (seed % 5) * .045, height: .88 + ((seed >>> 3) % 5) * .065, depth: .9 + ((seed >>> 6) % 4) * .04 },
    detail: { count: 3 + (seed % 4), rings: 1 + ((seed >>> 4) % 3) },
    evidence: best?.matches.slice(0, 5).map(term => term.slice(0, 32)) || [],
    caption: `以${selected.motif}转译「${plain(payload.title).slice(0, 72)}」的主题。`,
    featured: payload.featured
  }
}

export function getArtifact(kind, id, db = getDatabase()) {
  const source = sources[kind]
  if (!source) throw new Error('Unknown artifact source')
  const row = db.prepare(`SELECT * FROM gellaria_artifacts WHERE ${source.column} = ?`).get(id)
  return row ? { ...row, spec: parse(row.spec, null) } : null
}

export function syncArtifact(kind, id, db = getDatabase()) {
  return db.transaction(() => syncArtifactInTransaction(kind, id, db))()
}

function syncArtifactInTransaction(kind, id, db) {
  const source = sources[kind]
  if (!source) throw new Error('Unknown artifact source')
  const row = db.prepare(`SELECT * FROM ${source.table} WHERE id = ?`).get(id)
  if (!row) return null
  const visible = kind === 'capsule' ? row.status === 'active' : row.status === 'published'
  if (!visible ||
      (kind === 'placement' && (row.source_type !== 'external' || row.region_id === 'memory-grove'))) return null
  const payload = sourcePayload(kind, row)
  const current = getArtifact(kind, id, db)
  const control = current && db.prepare('SELECT * FROM gellaria_artifact_controls WHERE artifact_id = ?').get(current.id)
  if (control?.locked) return current
  const previousLevel = current?.spec?.design?.level || 0
  const { views, ...contentPayload } = payload
  const level = kind === 'blog' ? Math.max(previousLevel, readingStage(views).level) : 0
  const overrides = parse(control?.overrides, {})
  const sourceHash = createHash('sha256').update(JSON.stringify({ generator: DESIGN_GENERATOR, ...contentPayload, level, overrides })).digest('hex')
  if (current?.source_hash === sourceHash && current.generator === DESIGN_GENERATOR) return current
  const artifactId = current?.id || `artifact:${randomUUID()}`
  const spec = createArtifactSpec(payload, artifactId)
  spec.design = designArtifact(payload, spec.seed, previousLevel)
  if (kind === 'blog' || kind === 'project') spec.caption = spec.design.rationale
  applyOverrides(spec, overrides)
  const now = new Date().toISOString()
  db.prepare(`INSERT INTO gellaria_artifacts (id, ${source.column}, source_hash, spec, generator, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(${source.column}) DO UPDATE SET
    source_hash = excluded.source_hash, spec = excluded.spec,
    revision = gellaria_artifacts.revision + 1, generator = excluded.generator, updated_at = excluded.updated_at`)
    .run(artifactId, id, sourceHash, JSON.stringify(spec), DESIGN_GENERATOR, now, now)
  const result = getArtifact(kind, id, db)
  const reason = !current ? 'created' : current.generator !== DESIGN_GENERATOR ? 'generator' : current.spec.design.tier !== spec.design.tier ? 'tier' : spec.design.level > previousLevel ? 'reading-milestone' : 'content'
  db.prepare(`INSERT INTO gellaria_artifact_events (artifact_id, revision, reason, reading_level, views_at_build, source_hash, spec, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(artifactId, result.revision, reason, kind === 'blog' ? spec.design.level : 0, views, sourceHash, JSON.stringify(spec), now)
  return result
}

export function backfillArtifacts(db = getDatabase()) {
  return db.transaction(() => Object.entries(sources).flatMap(([kind, source]) =>
    db.prepare(`SELECT id FROM ${source.table}`).all().map(row => {
      const model = syncArtifact(kind, row.id, db)
      return model && { kind, sourceId: row.id, id: model.id, revision: model.revision, form: model.spec.form, design: model.spec.design?.name, tier: model.spec.design?.tier, level: model.spec.design?.level }
    }).filter(Boolean)))()
}

export function publicArtifact(kind, id) {
  const artifact = getArtifact(kind, id)
  const controls = artifact && getDatabase().prepare('SELECT collection FROM gellaria_artifact_controls WHERE artifact_id = ?').get(artifact.id)
  return artifact ? { artifactId: artifact.id, artifactSpec: artifact.spec, artifactRevision: artifact.revision, artifactUpdatedAt: artifact.updated_at, collection: controls?.collection || 'auto' } : {}
}

function applyOverrides(spec, overrides) {
  for (const key of ['motif', 'name', 'rationale']) if (overrides[key] !== undefined) spec.design[key] = overrides[key]
  if (overrides.rationale) spec.caption = overrides.rationale
  if (overrides.colors) spec.colors = overrides.colors
  if (overrides.zone) spec.zone = overrides.zone
  return spec
}
function validateOverrides(input) {
  if (!input || Array.isArray(input) || typeof input !== 'object') throw new Error('模型修改必须是对象')
  const limits = { name: 60, rationale: 240, zone: 40 }
  for (const key of Object.keys(input)) {
    if (!['motif', 'name', 'rationale', 'zone', 'colors'].includes(key)) throw new Error(`不支持的模型字段：${key}`)
    if (key === 'motif' && !ARTIFACT_MOTIFS.includes(input[key])) throw new Error('未知模型意象')
    if (limits[key] && (typeof input[key] !== 'string' || !input[key].trim() || input[key].length > limits[key])) throw new Error(`无效字段：${key}`)
    if (key === 'colors' && (!Array.isArray(input.colors) || input.colors.length !== 3 || input.colors.some(c => typeof c !== 'string' || !/^#[0-9a-f]{6}$/i.test(c)))) throw new Error('模型需要三个十六进制颜色')
  }
  return input
}
function artifactSource(artifact) {
  return Object.entries(sources).find(([, source]) => artifact[source.column] !== null)
}
export function listManagedArtifacts(db = getDatabase()) {
  return Object.entries(sources).flatMap(([kind, source]) => {
    if (!['project', 'blog'].includes(kind)) return []
    return db.prepare(`SELECT s.*, a.id AS artifact_id FROM ${source.table} s LEFT JOIN gellaria_artifacts a ON a.${source.column} = s.id ORDER BY s.id DESC`).all().map(row => {
      const artifact = row.artifact_id ? getArtifact(kind, row.id, db) : null
      const control = artifact && db.prepare('SELECT * FROM gellaria_artifact_controls WHERE artifact_id = ?').get(artifact.id)
      return { kind, sourceId: row.id, title: row.title_zh || row.title, sourceStatus: row.status, surfaces: kind === 'project' ? list(row.surfaces) : ['gellaria'], views: row.views || 0, artifact, locked: Boolean(control?.locked), collection: control?.collection || 'auto', overrides: parse(control?.overrides, {}) }
    })
  })
}
export function managedArtifactDetail(id, db = getDatabase()) {
  const record = listManagedArtifacts(db).find(record => record.artifact?.id === id)
  if (!record) return null
  return { ...record, history: db.prepare('SELECT revision, reason, reading_level, views_at_build, spec, created_at FROM gellaria_artifact_events WHERE artifact_id = ? ORDER BY revision DESC LIMIT 100').all(id).map(event => ({ ...event, spec: parse(event.spec, null) })), audit: db.prepare('SELECT action, detail, created_at FROM gellaria_artifact_audit WHERE artifact_id = ? ORDER BY id DESC LIMIT 50').all(id), motifs: ARTIFACT_MOTIFS, motifNames: ARTIFACT_MOTIF_NAMES }
}
export function updateManagedArtifact(id, input, db = getDatabase()) {
  return db.transaction(() => {
    const row = db.prepare('SELECT * FROM gellaria_artifacts WHERE id = ?').get(id)
    if (!row) return null
    if (!Number.isInteger(input.revision) || input.revision !== row.revision) { const error = new Error('模型版本已变化，请刷新后再编辑'); error.status = 409; throw error }
    const [kind, source] = artifactSource(row)
    const sourceRow = db.prepare(`SELECT * FROM ${source.table} WHERE id = ?`).get(row[source.column])
    const current = db.prepare('SELECT * FROM gellaria_artifact_controls WHERE artifact_id = ?').get(id)
    const locked = input.locked ?? Boolean(current?.locked)
    if (typeof locked !== 'boolean') throw new Error('locked 必须是布尔值')
    const collection = input.collection ?? current?.collection ?? 'auto'
    if (!['auto', 'featured', 'archive'].includes(collection)) throw new Error('未知策展分组')
    const overrides = input.overrides === undefined ? parse(current?.overrides, {}) : validateOverrides(input.overrides)
    const now = new Date().toISOString()
    db.prepare(`INSERT INTO gellaria_artifact_controls (artifact_id, locked, collection, overrides, updated_at) VALUES (?, 0, ?, ?, ?)
      ON CONFLICT(artifact_id) DO UPDATE SET locked = 0, collection = excluded.collection, overrides = excluded.overrides, updated_at = excluded.updated_at`).run(id, collection, JSON.stringify(overrides), now)
    if (input.restoreRevision !== undefined) {
      if (!Number.isInteger(input.restoreRevision)) throw new Error('无效历史版本')
      const old = db.prepare('SELECT * FROM gellaria_artifact_events WHERE artifact_id = ? AND revision = ?').get(id, input.restoreRevision)
      if (!old) throw new Error('找不到历史版本')
      db.prepare('UPDATE gellaria_artifacts SET spec = ?, source_hash = ?, revision = revision + 1, updated_at = ? WHERE id = ?').run(old.spec, old.source_hash, now, id)
      db.prepare(`INSERT INTO gellaria_artifact_events (artifact_id, revision, reason, reading_level, views_at_build, source_hash, spec, created_at) VALUES (?, ?, 'content', ?, ?, ?, ?, ?)`).run(id, row.revision + 1, old.reading_level, old.views_at_build, old.source_hash, old.spec, now)
    } else if (input.overrides !== undefined || !locked) {
      // Editing a frozen model must not absorb new source content or reading growth.
      // Unpublished records retain their existing model and can be manually curated.
      if (sourceRow.status !== 'published' && input.overrides && !Object.keys(input.overrides).length) throw new Error('请重新发布内容后恢复自动建模；撤回期间可保留或手动编辑现有模型')
      if ((current?.locked && locked) || sourceRow.status !== 'published') {
        const spec = parse(row.spec, {})
        applyOverrides(spec, overrides)
        db.prepare('UPDATE gellaria_artifacts SET spec = ? WHERE id = ?').run(JSON.stringify(spec), id)
      } else syncArtifact(kind, row[source.column], db)
    }
    // Metadata changes also advance the optimistic revision, preventing two
    // open administrator tabs from silently overwriting a lock or collection.
    const saved = db.prepare('SELECT * FROM gellaria_artifacts WHERE id = ?').get(id)
    if (saved.revision === row.revision) {
      db.prepare('UPDATE gellaria_artifacts SET revision = revision + 1, updated_at = ? WHERE id = ?').run(now, id)
      const spec = parse(saved.spec, {})
      db.prepare(`INSERT INTO gellaria_artifact_events (artifact_id, revision, reason, reading_level, views_at_build, source_hash, spec, created_at) VALUES (?, ?, 'content', ?, ?, ?, ?, ?)`).run(id, saved.revision + 1, kind === 'blog' ? spec.design?.level || 0 : 0, sourceRow.views || 0, saved.source_hash, saved.spec, now)
    }
    db.prepare('UPDATE gellaria_artifact_controls SET locked = ? WHERE artifact_id = ?').run(input.restoreRevision !== undefined || locked ? 1 : 0, id)
    db.prepare('INSERT INTO gellaria_artifact_audit (artifact_id, action, detail, created_at) VALUES (?, ?, ?, ?)').run(id, input.restoreRevision !== undefined ? 'restore-and-lock' : locked ? 'save-and-lock' : 'save', JSON.stringify({ collection, overrides, restoreRevision: input.restoreRevision ?? null, revision: saved.revision === row.revision ? saved.revision + 1 : saved.revision }), now)
    return managedArtifactDetail(id, db)
  })()
}
