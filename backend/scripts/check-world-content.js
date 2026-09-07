import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const temporaryDirectory = mkdtempSync(join(tmpdir(), 'gworkspace-world-content-'))
process.env.DATABASE_PATH = join(temporaryDirectory, 'world-content.db')
process.env.AI_API_KEY = ''

try {
  const { runMigrations } = await import('../src/config/migrations.js')
  const { closeDatabase, getDatabase } = await import('../src/config/database.js')
  const { Blog } = await import('../src/models/Blog.js')
  const { Guestbook } = await import('../src/models/Guestbook.js')
  const { AdminSettings } = await import('../src/models/AdminSettings.js')
  const { Project } = await import('../src/models/Project.js')
  const { WorldExhibit } = await import('../src/models/WorldExhibit.js')
  const { GellariaProjectModel } = await import('../src/models/GellariaProjectModel.js')
  const { backfillProjectWorldModels, refreshProjectWorldModel } = await import('../src/services/gellariaModeling.js')
  const { buildPublicWorld, listPublicProjects } = await import('../src/services/publicWorld.js')

  runMigrations({ logger: null })
  assert.equal(listPublicProjects({ locale: 'zh' }).length, 8)

  const project = Project.create({
    slug: 'world-check-project',
    title: { zh: '契约测试项目', en: 'Contract test project' },
    summary: { zh: '验证项目管理模型。', en: 'Verifies the project model.' },
    url: 'https://example.com/world-check',
    image_url: 'https://example.com/world-check-cover.avif',
    tags: ['Test'],
    status: 'draft'
  })
  const projectCover = getDatabase().prepare('SELECT mime_type FROM public_media WHERE public_id = ?').get(project.public_media_id)
  assert.equal(projectCover.mime_type, 'image/avif')
  assert.equal(Project.update(project.id, { status: 'published', sortOrder: 40 }).status, 'published')
  const generatedModel = await refreshProjectWorldModel(project.id)
  assert.equal(generatedModel.provider_mode, 'local-fallback')
  assert.equal(generatedModel.spec.version, 1)
  assert.ok(generatedModel.spec.seed >= 0)
  assert.equal(GellariaProjectModel.getLatestJob(project.id).status, 'completed')
  const unchangedModel = await refreshProjectWorldModel(project.id)
  assert.equal(unchangedModel.revision, generatedModel.revision)
  await backfillProjectWorldModels()
  const placement = WorldExhibit.create({
    regionId: 'workshop',
    sourceType: 'project',
    sourceKey: 'world-check-project',
    label: { zh: '契约检查', en: 'Contract check' },
    sortOrder: 40
  })
  assert.equal(WorldExhibit.update(placement.id, { sortOrder: 41 }).sort_order, 41)
  AdminSettings.update({ profile_content: { owner: { role: { zh: '世界维护者' } } } })

  Blog.create({
    title: '世界内容测试',
    slug: 'world-content-test',
    genre: 'Engineering',
    content: '这篇记录用于验证文章能够出现在观测站。',
    excerpt: '验证文章能够出现在观测站。',
    tags: ['Gellaria'],
    status: 'published',
    published_at: '2026-08-30'
  })
  Guestbook.create({ author_name: 'Visitor', content: '这条留言应该成为林地中的一段回声。' })

  const world = buildPublicWorld({ locale: 'zh' })
  const expectedProjectExhibits = Math.min(12, Project.getAll({ status: 'published', surface: 'gellaria' }).length)
  assert.equal(world.version, 1)
  assert.equal(world.profile.name, 'Eclospy732')
  assert.equal(world.profile.role, '世界维护者')
  assert.equal(world.regions.find(region => region.id === 'workshop')?.exhibits.length, expectedProjectExhibits)
  assert.ok(world.regions.find(region => region.id === 'workshop')?.exhibits.every(exhibit => exhibit.modelSpec?.version === 1))
  assert.equal(world.regions.find(region => region.id === 'observatory')?.exhibits[0]?.sourceType, 'blog')
  assert.equal(world.regions.find(region => region.id === 'observatory')?.exhibits[0]?.presentation, 'blog-constellation')
  assert.equal(world.regions.find(region => region.id === 'memory-grove')?.exhibits[0]?.sourceType, 'guestbook')
  assert.equal(world.regions.find(region => region.id === 'memory-grove')?.exhibits[0]?.presentation, 'echo-fragment')
  assert.equal(buildPublicWorld({ locale: 'en' }).locale, 'en')

  const concurrencyProject = Project.create({
    slug: 'model-concurrency-check',
    title: { zh: '并发建模检查', en: 'Concurrent modeling check' },
    summary: { zh: '验证过期任务不会覆盖新模型。', en: 'Verifies stale jobs cannot overwrite newer models.' },
    url: 'https://example.com/model-concurrency-check',
    surfaces: ['gellaria'],
    status: 'published'
  })
  const staleJob = GellariaProjectModel.createJob(concurrencyProject.id, 'stale-source')
  GellariaProjectModel.markRunning(staleJob.id)
  const currentJob = GellariaProjectModel.createJob(concurrencyProject.id, 'current-source')
  const staleResult = GellariaProjectModel.complete(staleJob.id, {
    projectId: concurrencyProject.id,
    sourceHash: 'stale-source',
    spec: generatedModel.spec,
    providerMode: 'local-fallback'
  })
  assert.equal(staleResult, undefined)
  assert.equal(GellariaProjectModel.getJob(staleJob.id).status, 'superseded')
  assert.equal(GellariaProjectModel.getLatestJob(concurrencyProject.id).id, currentJob.id)
  assert.equal(GellariaProjectModel.getLatestJob(concurrencyProject.id).status, 'queued')

  closeDatabase()
  console.log('public world content check passed')
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true })
}
