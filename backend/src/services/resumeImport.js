import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv2020 from 'ajv/dist/2020.js'
import { parse } from 'yaml'
import { getDatabase } from '../config/database.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const workspaceRoot = resolve(__dirname, '../../..')
const ALL_SURFACES = ['portfolio', 'resume_web', 'resume_pdf', 'gellaria']
const RESUME_SURFACES = ['resume_web', 'resume_pdf']

const importedSurfaces = (visibility = [], { project = false } = {}) => {
  const surfaces = []
  if (project) surfaces.push('portfolio', 'gellaria')
  if (visibility.includes('web')) surfaces.push('resume_web')
  if (visibility.includes('pdf')) surfaces.push('resume_pdf')
  return [...new Set(surfaces)]
}

const stableId = (kind, value) => {
  const digest = createHash('sha256').update(`${kind}:${value}`).digest('hex').slice(0, 32)
  return `${kind}:${digest}`
}

const sourceHash = (content) => createHash('sha256').update(content).digest('hex')
const nowIso = () => new Date().toISOString()

const validateUniqueIds = (resume) => {
  for (const collection of ['skills', 'experience', 'education', 'projects']) {
    const ids = resume[collection].map(item => item.id)
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index)
    if (duplicates.length) throw new Error(`Duplicate ${collection} id: ${[...new Set(duplicates)].join(', ')}`)
  }
}

export const loadResumeSource = ({ yamlPath, schemaPath }) => {
  const yamlContent = readFileSync(yamlPath, 'utf8')
  const resume = parse(yamlContent)
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8'))
  const ajv = new Ajv2020({ allErrors: true, strict: true })
  const validate = ajv.compile(schema)
  if (!validate(resume)) {
    const details = validate.errors.map(error => `${error.instancePath || '/'} ${error.message}`).join('; ')
    throw new Error(`Resume source failed schema validation: ${details}`)
  }
  validateUniqueIds(resume)
  return { resume, yamlContent, sha256: sourceHash(yamlContent) }
}

const avatarDetails = ({ resume, yamlPath, copyAssets }) => {
  const avatarRelativePath = resume.profile.avatar
  const sourcePath = resolve(dirname(yamlPath), '..', avatarRelativePath)
  if (copyAssets && !existsSync(sourcePath)) throw new Error(`Resume avatar does not exist: ${sourcePath}`)
  const extension = extname(sourcePath).toLowerCase() || '.jpg'
  const destinationDirectory = join(workspaceRoot, 'public/images/profile')
  const destinationPath = join(destinationDirectory, `resume-avatar${extension}`)
  if (copyAssets) {
    mkdirSync(destinationDirectory, { recursive: true })
    copyFileSync(sourcePath, destinationPath)
  }
  const mimeType = extension === '.png' ? 'image/png' : extension === '.webp' ? 'image/webp' : 'image/jpeg'
  return {
    publicId: 'media:resume-avatar',
    publicUrl: `/images/profile/resume-avatar${extension}`,
    mimeType,
    copied: copyAssets,
    sourcePath,
    destinationPath
  }
}

const upsertProfile = (db, resume, avatar, importedAt) => {
  db.prepare(`
    UPDATE resume_profile SET
      name_zh = ?, name_en = ?, full_name_zh = ?, full_name_en = ?,
      headline_zh = ?, headline_en = ?, location_zh = ?, location_en = ?,
      summary_zh = ?, summary_en = ?, avatar_media_id = ?, status = 'published', surfaces = ?,
      default_language = ?, pdf_project_limit = ?, pdf_filename_zh = ?, pdf_filename_en = ?, updated_at = ?
    WHERE id = 1
  `).run(
    resume.profile.name.zh, resume.profile.name.en,
    resume.profile.full_name.zh, resume.profile.full_name.en,
    resume.profile.headline.zh, resume.profile.headline.en,
    resume.profile.location.zh, resume.profile.location.en,
    resume.profile.summary.zh, resume.profile.summary.en,
    avatar.publicId, JSON.stringify(ALL_SURFACES), resume.settings.default_language,
    resume.settings.pdf.project_limit, resume.settings.pdf.filename.zh, resume.settings.pdf.filename.en,
    importedAt
  )

  db.prepare(`
    INSERT INTO public_media
      (public_id, kind, url, mime_type, alt_zh, alt_en, status, sort_order, created_at, updated_at)
    VALUES (?, 'image', ?, ?, ?, ?, 'published', 0, ?, ?)
    ON CONFLICT(public_id) DO UPDATE SET
      url = excluded.url, mime_type = excluded.mime_type, alt_zh = excluded.alt_zh,
      alt_en = excluded.alt_en, status = 'published', updated_at = excluded.updated_at
  `).run(
    avatar.publicId, avatar.publicUrl, avatar.mimeType,
    `${resume.profile.name.zh} 的头像`, `${resume.profile.name.en} profile portrait`, importedAt, importedAt
  )

  const legacyProfile = {
    owner: {
      name: resume.profile.name.en,
      name_localized: resume.profile.name,
      full_name: resume.profile.full_name,
      role: resume.profile.headline,
      bio: resume.profile.summary,
      location: resume.profile.location,
      responsibilities: { zh: [], en: [] },
      contacts: resume.profile.contacts.map((contact, index) => ({
        id: `${contact.type}-${index + 1}`,
        label: contact.label,
        href: contact.url
      })),
      skill_groups: resume.skills.map(group => ({ id: group.id, name: group.name, items: group.items })),
      avatar_media_id: avatar.publicId,
      canonical_url: 'https://www.gellaronline.cc/'
    }
  }
  db.prepare(`UPDATE admin_settings SET profile_content = ?, location = ?, updated_at = ? WHERE id = 1`)
    .run(JSON.stringify(legacyProfile), resume.profile.location.en, importedAt)
}

const replaceContacts = (db, contacts, importedAt) => {
  db.prepare('DELETE FROM resume_contacts').run()
  const insert = db.prepare(`
    INSERT INTO resume_contacts
      (public_id, type, label, value, url, status, surfaces, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'published', ?, ?, ?, ?)
  `)
  contacts.forEach((contact, index) => insert.run(
    stableId('contact', `${contact.type}:${contact.url}`), contact.type, contact.label,
    contact.value, contact.url, JSON.stringify(RESUME_SURFACES), (index + 1) * 10, importedAt, importedAt
  ))
}

const replaceSkills = (db, skills, importedAt) => {
  db.prepare('DELETE FROM resume_skills').run()
  const insert = db.prepare(`
    INSERT INTO resume_skills
      (public_id, name_zh, name_en, items, status, surfaces, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'published', ?, ?, ?, ?)
  `)
  skills.forEach((skill, index) => insert.run(
    stableId('skill', skill.id), skill.name.zh, skill.name.en, JSON.stringify(skill.items),
    JSON.stringify(RESUME_SURFACES), (index + 1) * 10, importedAt, importedAt
  ))
}

const upsertTimeline = (db, entries, section, importedAt) => {
  const upsert = db.prepare(`
    INSERT INTO public_experiences
      (public_id, kind, section, organization_zh, organization_en, title_zh, title_en,
       location_zh, location_en, summary_zh, summary_en, highlights_zh, highlights_en,
       start_date, end_date, canonical_url, media_ids, status, surfaces, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, '[]', 'published', ?, ?, ?, ?)
    ON CONFLICT(public_id) DO UPDATE SET
      kind = excluded.kind, section = excluded.section, organization_zh = excluded.organization_zh,
      organization_en = excluded.organization_en, title_zh = excluded.title_zh, title_en = excluded.title_en,
      location_zh = excluded.location_zh, location_en = excluded.location_en,
      summary_zh = excluded.summary_zh, summary_en = excluded.summary_en,
      highlights_zh = excluded.highlights_zh, highlights_en = excluded.highlights_en,
      start_date = excluded.start_date, end_date = excluded.end_date, status = 'published',
      surfaces = excluded.surfaces, sort_order = excluded.sort_order, updated_at = excluded.updated_at
  `)
  entries.forEach((entry, index) => upsert.run(
    stableId(section, entry.id), section === 'education' ? 'education' : 'employment', section,
    entry.organization.zh, entry.organization.en, entry.title.zh, entry.title.en,
    entry.location?.zh || null, entry.location?.en || null,
    entry.summary?.zh || entry.title.zh, entry.summary?.en || entry.title.en,
    JSON.stringify(entry.highlights.zh), JSON.stringify(entry.highlights.en),
    entry.start, entry.end, JSON.stringify(importedSurfaces(entry.visibility)), (index + 1) * 10, importedAt, importedAt
  ))
}

const upsertProjects = (db, projects, importedAt) => {
  const findBySlug = db.prepare('SELECT * FROM projects WHERE slug = ?')
  const insert = db.prepare(`
    INSERT INTO projects
      (public_id, slug, title_zh, title_en, summary_zh, summary_en, role_zh, role_en,
       start_date, end_date, involvement, technologies, highlights_zh, highlights_en,
       featured, links, url, image_url, tags, status, surfaces, gallery_media_ids,
       sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, '[]', 'published', ?, '[]', ?, ?, ?)
  `)
  const update = db.prepare(`
    UPDATE projects SET
      title_zh = ?, title_en = ?, summary_zh = ?, summary_en = ?, role_zh = ?, role_en = ?,
      start_date = ?, end_date = ?, involvement = ?, technologies = ?, highlights_zh = ?, highlights_en = ?,
      featured = ?, links = ?, url = ?, status = 'published', surfaces = ?, sort_order = ?, updated_at = ?
    WHERE id = ?
  `)

  let created = 0
  let updated = 0
  projects.forEach((project, index) => {
    const existing = findBySlug.get(project.id)
    const links = Object.entries(project.links).map(([kind, url]) => ({ kind, url }))
    const fallbackUrl = project.links.demo || project.links.source || `/portfolio/${project.id}`
    const role = project.role || null
    const highlights = Array.isArray(project.highlights) ? { zh: [], en: [] } : project.highlights
    const values = [
      project.name.zh, project.name.en, project.summary.zh, project.summary.en,
      role?.zh || null, role?.en || null, project.start, project.end,
      project.involvement || 'creator', JSON.stringify(project.technologies),
      JSON.stringify(highlights.zh), JSON.stringify(highlights.en), project.featured ? 1 : 0,
      JSON.stringify(links), fallbackUrl, JSON.stringify(importedSurfaces(project.visibility, { project: true })), (index + 1) * 10, importedAt
    ]
    if (existing) {
      update.run(...values, existing.id)
      updated += 1
    } else {
      insert.run(
        stableId('project', project.id), project.id,
        project.name.zh, project.name.en, project.summary.zh, project.summary.en,
        role?.zh || null, role?.en || null, project.start, project.end,
        project.involvement || 'creator', JSON.stringify(project.technologies),
        JSON.stringify(highlights.zh), JSON.stringify(highlights.en), project.featured ? 1 : 0,
        JSON.stringify(links), fallbackUrl, JSON.stringify(importedSurfaces(project.visibility, { project: true })), (index + 1) * 10,
        importedAt, importedAt
      )
      created += 1
    }
  })
  return { created, updated }
}

export const importResumeSource = ({
  yamlPath,
  schemaPath,
  db = getDatabase(),
  force = false,
  copyAssets = true
}) => {
  const loaded = loadResumeSource({ yamlPath, schemaPath })
  const previous = db.prepare('SELECT * FROM resume_imports WHERE source_sha256 = ?').get(loaded.sha256)
  if (previous && !force) {
    return { ...JSON.parse(previous.result_json), skipped: true, source_sha256: loaded.sha256, imported_at: previous.imported_at }
  }

  const importedAt = nowIso()
  const avatar = avatarDetails({ resume: loaded.resume, yamlPath, copyAssets })
  const execute = db.transaction(() => {
    upsertProfile(db, loaded.resume, avatar, importedAt)
    replaceContacts(db, loaded.resume.profile.contacts, importedAt)
    replaceSkills(db, loaded.resume.skills, importedAt)
    upsertTimeline(db, loaded.resume.experience, 'experience', importedAt)
    upsertTimeline(db, loaded.resume.education, 'education', importedAt)
    const projectResult = upsertProjects(db, loaded.resume.projects, importedAt)
    const result = {
      skipped: false,
      profile: 1,
      contacts: loaded.resume.profile.contacts.length,
      skills: loaded.resume.skills.length,
      experience: loaded.resume.experience.length,
      education: loaded.resume.education.length,
      projects: loaded.resume.projects.length,
      projects_created: projectResult.created,
      projects_updated: projectResult.updated,
      avatar_copied: avatar.copied,
      avatar_url: avatar.publicUrl
    }
    db.prepare(`
      INSERT INTO resume_imports
        (source_path, source_sha256, source_schema_version, imported_at, result_json)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(source_sha256) DO UPDATE SET imported_at = excluded.imported_at, result_json = excluded.result_json
    `).run(resolve(yamlPath), loaded.sha256, loaded.resume.schema_version, importedAt, JSON.stringify(result))
    return result
  })

  return {
    ...execute(),
    source_sha256: loaded.sha256,
    source_schema_version: loaded.resume.schema_version,
    imported_at: importedAt
  }
}
