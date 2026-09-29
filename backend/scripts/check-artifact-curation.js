import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const directory = mkdtempSync(join(tmpdir(), 'gworkspace-curation-'))
process.env.DATABASE_PATH = join(directory, 'check.db')
const { getDatabase, closeDatabase } = await import('../src/config/database.js')
try {
  const { runMigrations } = await import('../src/config/migrations.js')
  const { Blog } = await import('../src/models/Blog.js')
  const { Project } = await import('../src/models/Project.js')
  const { User } = await import('../src/models/User.js')
  const { getArtifact, syncArtifact, updateManagedArtifact, managedArtifactDetail } = await import('../src/services/gellariaArtifacts.js')
  const { buildPublicWorld, buildPublicCatalog } = await import('../src/services/publicWorld.js')
  runMigrations({ logger: null }); runMigrations({ logger: null })
  const db = getDatabase()
  const blog = Blog.create({ title: '组件的复用', slug: 'curation-test', genre: 'Code', content: '## 起点\n\n从共享状态开始。\n\n## 组合\n\nComposition API 让组件复用更直接。', excerpt: '', status: 'published' })
  let model = getArtifact('blog', blog.id)
  assert.deepEqual(model.spec.design.narrative.chapters.map(c => c.title), ['起点', '组合'])
  assert.equal(model.spec.design.narrative.phase, 'closed')
  const compact = Blog.create({ title: '紧凑章节', slug: 'compact-chapters', genre: '', excerpt: '', content: '## 一\n第一段\n\n```md\n## 代码内标题\n```\n## 二\n第二段', status: 'published' })
  assert.deepEqual(getArtifact('blog', compact.id).spec.design.narrative.chapters, [{ title: '一', excerpt: '第一段' }, { title: '二', excerpt: '第二段' }])
  for (const [views, phase] of [[1, 'subject'], [10, 'chapters'], [50, 'arguments'], [200, 'connections']]) {
    db.prepare('UPDATE blogs SET views = ? WHERE id = ?').run(views, blog.id); model = syncArtifact('blog', blog.id)
    assert.equal(model.spec.design.narrative.phase, phase)
    assert.equal(model.spec.design.narrative.chapters[1].excerpt, 'Composition API 让组件复用更直接。')
  }
  const saved = updateManagedArtifact(model.id, { revision: model.revision, locked: true, collection: 'archive', overrides: { motif: 'story-mobile', name: '自定模型', rationale: '依据真实章节排列。', colors: ['#113355', '#998877', '#ddeeff'] } })
  assert.equal(saved.locked, true); assert.equal(saved.artifact.spec.design.name, '自定模型')
  Blog.update(blog.id, { content: '## 更新\n\n新的正文。' })
  db.prepare('UPDATE blogs SET views = 2000 WHERE id = ?').run(blog.id)
  assert.equal(syncArtifact('blog', blog.id).revision, saved.artifact.revision)
  assert.ok(!buildPublicWorld().regions.flatMap(r => r.exhibits).some(e => e.artifactId === model.id))
  assert.ok(buildPublicCatalog({ region: 'observatory', collection: 'archive' }).exhibits.some(e => e.artifactId === model.id))
  assert.throws(() => updateManagedArtifact(model.id, { revision: 1, locked: false }), error => error.status === 409)
  assert.throws(() => updateManagedArtifact(model.id, { revision: saved.artifact.revision, overrides: { motif: 'javascript:evil' } }), /未知/)
  assert.throws(() => updateManagedArtifact(model.id, { revision: saved.artifact.revision, overrides: { colors: ['red'] } }), /颜色/)
  const editedFrozen = updateManagedArtifact(model.id, { revision: saved.artifact.revision, locked: true, overrides: { ...saved.overrides, name: '冻结后修改名称' } })
  assert.equal(editedFrozen.artifact.spec.design.name, '冻结后修改名称')
  assert.equal(editedFrozen.artifact.spec.design.level, 4)
  assert.equal(editedFrozen.artifact.spec.design.narrative.chapters[0].title, '起点')
  const relocked = updateManagedArtifact(model.id, { revision: editedFrozen.artifact.revision, locked: true })
  assert.deepEqual(relocked.artifact.spec, editedFrozen.artifact.spec)
  const unlocked = updateManagedArtifact(model.id, { revision: relocked.artifact.revision, locked: false, overrides: {}, collection: 'featured' })
  assert.equal(unlocked.artifact.spec.design.level, 5)
  assert.equal(unlocked.artifact.spec.design.narrative.chapters[0].title, '更新')
  const restored = updateManagedArtifact(model.id, { revision: unlocked.artifact.revision, restoreRevision: saved.artifact.revision })
  assert.equal(restored.locked, true)
  assert.deepEqual(restored.artifact.spec, saved.artifact.spec)
  assert.equal(restored.audit[0].action, 'restore-and-lock')

  db.prepare('UPDATE blogs SET views = 9 WHERE id = ?').run(blog.id)
  const now = Date.now()
  assert.equal(Blog.incrementViews(blog.id, 'same-reader', now).views, 10)
  assert.equal(Blog.incrementViews(blog.id, 'same-reader', now + 1799999).views, 10)
  assert.equal(Blog.incrementViews(blog.id, 'same-reader', now + 1800000).views, 11)
  assert.equal(Blog.incrementViews(blog.id, 'different-reader', now + 1800001).views, 12)

  // All 25 synthetic works remain addressable beyond the old 12-item ceiling.
  const ids = []
  for (let i = 0; i < 25; i++) ids.push(Project.create({ title: { zh: `目录样本 ${i}` }, summary: { zh: '可检索的作品。' }, slug: `catalog-${i}`, url: '/test', surfaces: ['gellaria'], status: 'published' }).id)
  const page = buildPublicCatalog({ region: 'workshop', search: '目录样本' })
  assert.equal(page.total, 25); assert.equal(page.pages, 4)
  const all = Array.from({ length: page.pages }, (_, i) => buildPublicCatalog({ region: 'workshop', search: '目录样本', page: i + 1 }).exhibits).flat()
  assert.equal(new Set(all.map(e => e.id)).size, 25)
  // Catalogue visits have the same factual dossier as the default world,
  // without relying on the resume endpoint or its item limit.
  Project.update(ids[0], { role: { zh: '参与实现', en: 'Contributor' }, involvement: 'contributor', highlights: { zh: ['实现离线写作'], en: ['Offline writing'] }, links: [{ kind: 'source', url: 'https://example.test/source' }], gallery: [{ url: 'https://example.test/screen.png', alt: { zh: '文档截图', en: 'Document screenshot' } }] })
  const dossier = buildPublicCatalog({ region: 'workshop', search: '目录样本 0' }).exhibits[0].details
  assert.equal(dossier.role, '参与实现'); assert.equal(dossier.involvement, 'contributor')
  assert.deepEqual(dossier.highlights, ['实现离线写作']); assert.equal(dossier.links.source, 'https://example.test/source')
  assert.deepEqual(dossier.gallery, [{ url: 'https://example.test/screen.png', alt: '文档截图' }])
  assert.equal(buildPublicCatalog({ region: 'workshop', search: '目录样本 0', locale: 'en' }).exhibits[0].details.role, 'Contributor')
  assert.deepEqual(buildPublicWorld().regions[0].exhibits.find(e => e.sourceKey === 'catalog-0').details, dossier)
  db.prepare("UPDATE public_media SET status = 'draft' WHERE url = ?").run('https://example.test/screen.png')
  assert.deepEqual(buildPublicCatalog({ region: 'workshop', search: '目录样本 0' }).exhibits[0].details.gallery, [])
  Project.update(ids[24], { surfaces: ['resume_web'] })
  assert.equal(buildPublicCatalog({ region: 'workshop', search: '目录样本' }).total, 24)
  Blog.update(blog.id, { status: 'draft' })
  assert.ok(!buildPublicCatalog({ region: 'observatory' }).exhibits.some(e => e.artifactId === model.id))

  const { default: express } = await import('express')
  const { default: adminRoutes } = await import('../src/routes/contentAdmin.js')
  const { default: publicRoutes } = await import('../src/routes/publicContent.js')
  const { default: blogRoutes } = await import('../src/routes/blog.js')
  const app = express(); app.use(express.json()); app.use('/api/admin/content', adminRoutes); app.use('/api/public', publicRoutes); app.use('/api/blogs', blogRoutes)
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve))
  const origin = `http://127.0.0.1:${server.address().port}`
  try {
    assert.equal((await fetch(`${origin}/api/admin/content/artifacts`)).status, 401)
    const tokenFor = role => {
      const id = db.prepare('INSERT INTO users (username,email,password_hash,role) VALUES (?,?,?,?)').run(`curation-${role}`, `${role}@example.test`, 'not-a-login-password', role).lastInsertRowid
      const token = User.generateToken(User.getById(id)); User.saveSession(id, token, new Date(Date.now() + 60000)); return token
    }
    const userToken = tokenFor('user'), adminToken = tokenFor('admin')
    assert.equal((await fetch(`${origin}/api/admin/content/artifacts`, { headers: { Authorization: `Bearer ${userToken}` } })).status, 403)
    const detail = await fetch(`${origin}/api/admin/content/artifacts/${encodeURIComponent(model.id)}`, { headers: { Authorization: `Bearer ${adminToken}` } })
    assert.equal(detail.status, 200); assert.ok((await detail.json()).history.length)
    const invalid = await fetch(`${origin}/api/admin/content/artifacts/${encodeURIComponent(model.id)}`, { method: 'PUT', headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ revision: -1, locked: false }) })
    assert.equal(invalid.status, 409)
    assert.equal((await fetch(`${origin}/api/public/world/catalog?region=private`)).status, 400)
    const countBlog = Blog.create({ title: '去重文章', slug: 'receipt-test', genre: '', excerpt: '', content: '阅读', status: 'published' })
    const reads = await Promise.all(Array.from({ length: 10 }, () => fetch(`${origin}/api/blogs/${countBlog.id}/views`, { method: 'POST' })))
    assert.ok(reads.every(r => r.ok)); assert.equal(Blog.getById(countBlog.id).views, 1)
    assert.equal(db.prepare('SELECT count(*) n FROM blog_read_receipts WHERE blog_id = ?').get(countBlog.id).n, 1)
  } finally { await new Promise(resolve => server.close(resolve)) }
  assert.equal(db.pragma('foreign_key_check').length, 0)
  assert.ok(managedArtifactDetail(model.id).history.length >= 5)
  console.log('Curation checks passed: lock/edit/restore, optimistic conflicts, admin authorization, chapter growth, 30-minute read deduplication, >12 item pagination, archive and publication filtering.')
} finally { closeDatabase(); rmSync(directory, { recursive: true, force: true }) }
