import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'

const __dirname = dirname(fileURLToPath(import.meta.url))
const backendRoot = join(__dirname, '..')
const importRoot = join(backendRoot, 'fixtures/resume-import/v1')
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'gworkspace-resume-'))
process.env.DATABASE_PATH = join(temporaryDirectory, 'resume.db')
process.env.PUBLIC_SITE_URL = 'https://www.gellaronline.cc'

let closeDatabase
try {
  const { runMigrations } = await import('../src/config/migrations.js')
  const databaseModule = await import('../src/config/database.js')
  closeDatabase = databaseModule.closeDatabase
  const { getDatabase } = databaseModule
  const { importResumeSource } = await import('../src/services/resumeImport.js')
  const { buildResumeResponse } = await import('../src/services/resumePublic.js')
  const { validateResumeResponse } = await import('../src/services/resumeValidator.js')
  const { validatePublicFacts } = await import('../src/services/publicFactsValidator.js')
  const { buildPublicFacts } = await import('../src/services/publicFacts.js')
  const { Resume } = await import('../src/models/Resume.js')
  const { Project } = await import('../src/models/Project.js')
  const { buildPublicWorld, listPublicProjects } = await import('../src/services/publicWorld.js')
  const publicContentRouter = (await import('../src/routes/publicContent.js')).default

  runMigrations({ logger: null })
  runMigrations({ logger: null })
  const db = getDatabase()
  assert.equal(db.prepare(`SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name LIKE 'resume_%'`).get().count, 4)

  const importOptions = {
    yamlPath: join(importRoot, 'data/resume.yaml'),
    schemaPath: join(importRoot, 'schema/resume.schema.json'),
    copyAssets: false
  }
  const firstImport = importResumeSource(importOptions)
  assert.deepEqual({
    contacts: firstImport.contacts,
    skills: firstImport.skills,
    experience: firstImport.experience,
    education: firstImport.education,
    projects: firstImport.projects
  }, { contacts: 1, skills: 1, experience: 1, education: 1, projects: 1 })
  assert.equal(importResumeSource(importOptions).skipped, true, 'same source hash must be a one-time no-op')
  const forcedImport = importResumeSource({ ...importOptions, force: true })
  assert.equal(forcedImport.skipped, false)
  assert.equal(Resume.getContacts().length, 1, 'forced import must not duplicate contacts')
  assert.equal(Resume.getSkills().length, 1, 'forced import must not duplicate skills')

  const response = buildResumeResponse({ generatedAt: '2026-08-31T12:00:00Z' })
  assert.equal(validateResumeResponse(response).valid, true)
  assert.equal(response.surface, 'resume_web')
  assert.equal(response.profile.name.en, 'Example Owner')
  assert.equal(response.profile.contacts.length, 1)
  assert.equal(response.skills.length, 1)
  assert.equal(response.experience.length, 1)
  assert.equal(response.education.length, 1)
  assert.equal(response.projects.length, 1)
  assert.equal(response.projects[0].involvement, 'creator')
  assert.equal(response.projects[0].links.source, 'https://example.test/source')

  const localized = buildResumeResponse({ locale: 'zh', surface: 'resume_pdf', generatedAt: '2026-08-31T12:00:00Z' })
  assert.equal(validateResumeResponse(localized).valid, true)
  assert.equal(localized.profile.name, '示例站长')
  assert.equal(localized.projects[0].name, '示例项目')
  assert.deepEqual(localized.experience[0].highlights, ['发布版本化 API。'])
  assert.equal(localized.education.length, 0, 'education without resume_pdf surface must be excluded')
  assert.equal(localized.settings.pdf.filename, 'Example-Resume-ZH.pdf')

  const draftContact = Resume.createContact({
    type: 'website', label: 'Private', value: 'Private', url: 'https://private.example.test',
    status: 'draft', surfaces: ['resume_web']
  })
  const webOnlySkill = Resume.createSkill({
    name: { zh: '网页限定', en: 'Web only' }, items: ['Example'], status: 'published', surfaces: ['resume_web']
  })
  Project.create({
    slug: 'draft-resume-project', title: { zh: '草稿', en: 'Draft' }, summary: { zh: '草稿', en: 'Draft' },
    url: '/draft', status: 'draft', surfaces: ['resume_web']
  })
  Project.create({
    slug: 'portfolio-only-project', title: { zh: '作品集', en: 'Portfolio' }, summary: { zh: '作品集', en: 'Portfolio' },
    url: '/portfolio-only', status: 'published', surfaces: ['portfolio']
  })
  const filtered = buildResumeResponse({ generatedAt: '2026-08-31T12:00:00Z' })
  assert.equal(filtered.profile.contacts.some(contact => contact.id === draftContact.public_id), false)
  assert.equal(filtered.skills.some(skill => skill.id === webOnlySkill.public_id), true)
  assert.equal(filtered.projects.some(project => project.slug === 'draft-resume-project'), false)
  assert.equal(filtered.projects.some(project => project.slug === 'portfolio-only-project'), false)

  const publicFacts = buildPublicFacts({ generatedAt: '2026-08-31T12:00:00Z' })
  assert.equal(validatePublicFacts(publicFacts).valid, true, 'frozen public-facts projection must remain valid')
  assert.equal(publicFacts.profile.name.en, 'Example Owner', 'public facts must project the authoritative resume profile')
  const legacyProjects = listPublicProjects({ locale: 'en' })
  assert.deepEqual(Object.keys(legacyProjects[0]), ['id', 'slug', 'title', 'summary', 'url', 'image', 'tags', 'updatedAt'])
  assert.deepEqual(Object.keys(buildPublicWorld({ locale: 'en' })), ['version', 'locale', 'updatedAt', 'profile', 'regions'])

  const example = JSON.parse(readFileSync(join(backendRoot, 'fixtures/resume/v1/response.bilingual.json'), 'utf8'))
  assert.equal(validateResumeResponse(example).valid, true, 'documented example response must validate')

  const app = express()
  app.use('/api/public', publicContentRouter)
  const server = app.listen(0)
  await new Promise(resolve => server.once('listening', resolve))
  try {
    const address = server.address()
    const base = `http://127.0.0.1:${address.port}/api/public/v1/resume`
    const ok = await fetch(`${base}?locale=en`)
    assert.equal(ok.status, 200)
    assert.equal(ok.headers.get('x-resume-schema-version'), '1.0.0')
    assert.match(ok.headers.get('cache-control'), /max-age=300/)
    assert.equal((await ok.json()).profile.name, 'Example Owner')

    const invalidLocale = await fetch(`${base}?locale=fr`)
    assert.equal(invalidLocale.status, 400)
    assert.equal(invalidLocale.headers.get('cache-control'), 'no-store')
    assert.equal((await invalidLocale.json()).error, 'INVALID_RESUME_LOCALE')

    const invalidSurface = await fetch(`${base}?surface=api`)
    assert.equal(invalidSurface.status, 400)
    assert.equal((await invalidSurface.json()).error, 'INVALID_RESUME_SURFACE')
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  }

  Resume.deleteContact(draftContact.id)
  Resume.deleteSkill(webOnlySkill.id)

  const productionSeed = importResumeSource({
    yamlPath: join(backendRoot, 'database/imports/legacy-resume-v1.yaml'),
    schemaPath: join(importRoot, 'schema/resume.schema.json'),
    copyAssets: false
  })
  assert.equal(productionSeed.contacts, 3, 'production migration input must remain importable')
  assert.equal(productionSeed.skills, 3)
  assert.equal(productionSeed.projects, 6)
  assert.equal(productionSeed.avatar_copied, false)
  assert.equal(importResumeSource({
    yamlPath: join(backendRoot, 'database/imports/legacy-resume-v1.yaml'),
    schemaPath: join(importRoot, 'schema/resume.schema.json'),
    copyAssets: false
  }).skipped, true, 'production migration input must remain idempotent')
  console.log('resume authority, import, API, and compatibility checks passed')
} finally {
  if (closeDatabase) closeDatabase()
  rmSync(temporaryDirectory, { recursive: true, force: true })
}
