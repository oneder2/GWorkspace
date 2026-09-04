import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'

const __dirname = dirname(fileURLToPath(import.meta.url))
const backendRoot = join(__dirname, '..')
const fixtureRoot = join(backendRoot, 'fixtures/gworkspace/public-facts/v1')
const contractRoot = join(backendRoot, '../packages/contracts/gworkspace/public-facts/v1')
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'gworkspace-public-facts-'))
process.env.DATABASE_PATH = join(temporaryDirectory, 'public-facts.db')
process.env.PUBLIC_SITE_URL = 'https://example.test'

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))
const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')

const expectedHashes = new Map([
  ['README.md', '5b5f476ac717275a2416027996d9211f26c10dc8292d00006051111a4f82c3f4'],
  ['schema.json', '0b31fdd55aeb8c3f3dda4f057ffcabe4dd6a86ee97f925301fb8d5273569963d'],
  ['dangling-media.invalid.json', '4c4a3055b3df3be8fd81d6fd8ba2bdd9fff3b8b10f06181b54f1669c676fc598'],
  ['minimal.valid.json', '6384c41b780e85e8d0483490cb67e6133c1104d7af27dadec811ae37a292a1a1'],
  ['representative.valid.json', '1a2e5b523d54f1a248fd36620d9a73aee71f5b1eded536f17585df372ca76aa1'],
  ['version.invalid.json', 'e743999ae162d73d793375163b1272b2b0b91381d04f90891f71005a7bf95be5'],
  ['visibility.invalid.json', 'b64f4c455ac1339851d3e52f58ed82ac3af98038c9db1e343e93ce6dd285090d']
])

let closeDatabase

try {
  const validator = await import('../src/services/publicFactsValidator.js')
  const { validatePublicFacts, assertSupportedPublicFactsVersion } = validator

  for (const [file, expectedHash] of expectedHashes) {
    const path = file === 'README.md' || file === 'schema.json'
      ? join(contractRoot, file)
      : join(fixtureRoot, file)
    assert.equal(sha256(path), expectedHash, `${file} must remain byte-identical to the frozen registry artifact`)
  }

  for (const file of ['minimal.valid.json', 'representative.valid.json']) {
    assert.equal(validatePublicFacts(readJson(join(fixtureRoot, file))).valid, true, `${file} must validate`)
  }
  for (const file of ['version.invalid.json', 'visibility.invalid.json', 'dangling-media.invalid.json']) {
    assert.equal(validatePublicFacts(readJson(join(fixtureRoot, file))).valid, false, `${file} must fail validation`)
  }

  const invalidTimestamp = structuredClone(readJson(join(fixtureRoot, 'minimal.valid.json')))
  invalidTimestamp.generated_at = '2026-08-31'
  assert.equal(validatePublicFacts(invalidTimestamp).valid, false, 'date-only generated_at must fail date-time validation')
  assert.equal(assertSupportedPublicFactsVersion('1'), '1.0.0')
  assert.equal(assertSupportedPublicFactsVersion('1.9.3'), '1.0.0')
  assert.throws(() => assertSupportedPublicFactsVersion('2.0.0'), { code: 'UNSUPPORTED_PUBLIC_FACTS_VERSION' })

  const { runMigrations } = await import('../src/config/migrations.js')
  const databaseModule = await import('../src/config/database.js')
  const { getDatabase } = databaseModule
  closeDatabase = databaseModule.closeDatabase
  const { AdminSettings } = await import('../src/models/AdminSettings.js')
  const { Blog } = await import('../src/models/Blog.js')
  const { Project } = await import('../src/models/Project.js')
  const { buildPublicWorld, listPublicProjects } = await import('../src/services/publicWorld.js')
  const { buildPublicFacts } = await import('../src/services/publicFacts.js')
  const publicFactsRouter = (await import('../src/routes/publicFacts.js')).default

  runMigrations({ logger: null })
  const db = getDatabase()
  const idsBeforeSecondMigration = {
    projects: db.prepare('SELECT public_id FROM projects ORDER BY id').all().map(row => row.public_id),
    blogs: db.prepare('SELECT public_id FROM blogs ORDER BY id').all().map(row => row.public_id)
  }
  runMigrations({ logger: null })
  assert.deepEqual(db.prepare('SELECT public_id FROM projects ORDER BY id').all().map(row => row.public_id), idsBeforeSecondMigration.projects)
  assert.deepEqual(db.prepare('SELECT public_id FROM blogs ORDER BY id').all().map(row => row.public_id), idsBeforeSecondMigration.blogs)

  const legacyProjects = listPublicProjects({ locale: 'en' })
  assert.equal(legacyProjects.length, 8)
  assert.deepEqual(Object.keys(legacyProjects[0]), [
    'id', 'slug', 'title', 'summary', 'url', 'image', 'tags', 'role',
    'involvement', 'start', 'end', 'technologies', 'highlights', 'featured', 'updatedAt'
  ])
  assert.equal(legacyProjects[0].slug, 'citeai')
  assert.equal(legacyProjects[0].role, 'Full-Stack Software Engineer')
  assert.ok(legacyProjects[0].highlights.length >= 2)
  const legacyWorld = buildPublicWorld({ locale: 'en' })
  assert.deepEqual(Object.keys(legacyWorld), ['version', 'locale', 'updatedAt', 'profile', 'regions'])
  assert.equal(legacyWorld.version, 1)
  assert.deepEqual(Object.keys(legacyWorld.profile.contacts[0]), ['id', 'label', 'href'])

  AdminSettings.update({
    profile_content: {
      owner: {
        name_localized: { zh: '测试站长', en: 'Test owner' },
        skill_groups: [{
          id: 'skill:web',
          name: { zh: 'Web 开发', en: 'Web development' },
          items: ['Node.js', 'SQLite']
        }]
      }
    }
  })

  const draftProject = Project.create({
    slug: 'private-project',
    title: { zh: '私密项目', en: 'Private project' },
    summary: { zh: '不应公开。', en: 'Must not be public.' },
    url: '/private',
    status: 'draft'
  })
  const project = Project.create({
    slug: 'public-contract-test',
    title: { zh: '公开契约测试', en: 'Public contract test' },
    summary: { zh: '验证提供端。', en: 'Verifies the provider.' },
    role: { zh: '开发者', en: 'Developer' },
    startDate: '2026-08',
    technologies: ['Node.js', 'SQLite'],
    tags: ['Contract'],
    featured: true,
    links: [{ kind: 'source', url: 'https://github.com/example/public-contract-test' }],
    url: '/portfolio/public-contract-test',
    imageUrl: '/images/portfolio/contract-test.webp',
    status: 'published',
    sortOrder: 5
  })
  const stableProjectId = project.public_id
  Project.update(project.id, { slug: 'public-contract-renamed' })
  assert.equal(Project.getById(project.id).public_id, stableProjectId, 'project public ID must survive a slug change')

  Blog.create({
    title: 'Private draft',
    slug: 'private-draft',
    genre: 'Draft',
    content: 'Private writing.',
    excerpt: 'Private writing.',
    tags: ['Private'],
    status: 'draft'
  })
  const article = Blog.create({
    title: '契约文章',
    slug: '契约文章',
    genre: 'Engineering',
    content: 'Only this authoritative text is available.',
    excerpt: 'Provider contract article.',
    tags: ['Architecture'],
    status: 'published',
    published_at: '2026-08-30'
  })
  const stableArticleId = article.public_id
  Blog.update(article.id, { slug: 'renamed-contract-article' })
  assert.equal(Blog.getById(article.id).public_id, stableArticleId, 'article public ID must survive a slug change')

  db.prepare(`
    INSERT INTO public_media
      (public_id, kind, url, mime_type, alt_zh, alt_en, status, sort_order, created_at, updated_at)
    VALUES ('media:experience', 'image', '/images/experience.webp', 'image/webp',
      '经历图片', 'Experience image', 'published', 1, ?, ?)
  `).run('2026-08-29T10:00:00Z', '2026-08-29T10:00:00Z')
  db.prepare(`
    INSERT INTO public_media
      (public_id, kind, url, mime_type, status, sort_order, created_at, updated_at)
    VALUES ('media:private', 'image', '/private.webp', 'image/webp', 'draft', 1, ?, ?)
  `).run('2026-08-29T10:00:00Z', '2026-08-29T10:00:00Z')
  db.prepare(`
    INSERT INTO public_experiences
      (public_id, kind, organization_zh, organization_en, title_zh, title_en,
       summary_zh, summary_en, highlights_zh, highlights_en, start_date, end_date,
       canonical_url, media_ids, status, sort_order, created_at, updated_at)
    VALUES ('experience:public', 'employment', '示例工作室', 'Example Studio', '开发者', 'Developer',
      '构建公开工具。', 'Built public tools.', '["发布版本化接口。"]', '["Published a versioned API."]',
      '2025-01', '2025-12', '/experience/example', '["media:experience","media:private"]',
      'published', 1, ?, ?)
  `).run('2026-08-29T10:00:00Z', '2026-08-29T10:00:00Z')
  db.prepare(`
    INSERT INTO public_experiences
      (public_id, kind, organization_zh, title_zh, summary_zh, start_date, status, sort_order)
    VALUES ('experience:private', 'other', '私密', '私密', '不应公开', '2026-01', 'draft', 0)
  `).run()

  const facts = buildPublicFacts({ generatedAt: '2026-08-31T12:00:00Z' })
  assert.equal(validatePublicFacts(facts).valid, true)
  assert.equal(facts.schema_version, '1.0.0')
  assert.equal(facts.profile.name.en, 'Test owner')
  assert.deepEqual(facts.profile.skill_groups[0].items, ['Node.js', 'SQLite'])
  assert.equal(facts.projects[0].id, stableProjectId, 'explicit sort order must come before the stable ID tie-breaker')
  assert.equal(facts.projects.some(record => record.id === draftProject.public_id), false)
  assert.equal(facts.articles.some(record => record.id === stableArticleId), true)
  assert.equal(facts.articles.some(record => record.title.en === 'Private draft'), false)
  assert.equal(facts.articles.find(record => record.id === stableArticleId).published_at, '2026-08-30T00:00:00.000Z')
  assert.equal(facts.articles.find(record => record.id === stableArticleId).body_markdown.en, 'Only this authoritative text is available.')
  assert.deepEqual(facts.experiences.map(record => record.id), ['experience:public', 'experience:citeai-commercial'])
  assert.equal(facts.experiences[1].title.en, 'Full-Stack Software Engineer (Commercial SaaS)')
  assert.deepEqual(facts.experiences[0].media_ids, ['media:experience'])
  assert.equal(facts.media.some(record => record.id === 'media:private'), false)
  assert(facts.media.every(record => record.url.startsWith('https://example.test/')))
  assert(facts.projects.flatMap(record => record.links).every(link => link.url.startsWith('https://')))

  const app = express()
  app.use('/', publicFactsRouter)
  const server = app.listen(0)
  await new Promise(resolve => server.once('listening', resolve))
  try {
    const address = server.address()
    const supportedResponse = await fetch(`http://127.0.0.1:${address.port}/?version=1`)
    assert.equal(supportedResponse.status, 200)
    assert.equal(supportedResponse.headers.get('x-public-facts-version'), '1.0.0')
    assert.equal((await supportedResponse.json()).schema_version, '1.0.0')

    const unsupportedResponse = await fetch(`http://127.0.0.1:${address.port}/?version=2`)
    assert.equal(unsupportedResponse.status, 406)
    assert.deepEqual(await unsupportedResponse.json(), {
      error: 'UNSUPPORTED_PUBLIC_FACTS_VERSION',
      requested_version: '2',
      supported_major_versions: [1]
    })
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  }

  console.log('public facts contract check passed')
} finally {
  if (closeDatabase) closeDatabase()
  rmSync(temporaryDirectory, { recursive: true, force: true })
}
