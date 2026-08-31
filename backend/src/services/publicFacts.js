import { getDatabase } from '../config/database.js'
import { AdminSettings } from '../models/AdminSettings.js'
import { Resume } from '../models/Resume.js'
import { assertValidPublicFacts, PUBLIC_FACTS_SCHEMA_VERSION } from './publicFactsValidator.js'

const DEFAULT_SITE_URL = 'https://www.gellaronline.cc'
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const parseArray = (value) => {
  if (Array.isArray(value)) return value
  try {
    const parsed = JSON.parse(value || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const textList = (value) => parseArray(value)
  .filter(item => typeof item === 'string')
  .map(item => item.trim())
  .filter(Boolean)

const localized = (zh, en = null) => {
  const normalizedZh = String(zh || en || '').trim()
  const normalizedEn = String(en || zh || '').trim()
  return { en: normalizedEn, zh: normalizedZh }
}

const nullableLocalized = (zh, en = null) => (
  String(zh || en || '').trim() ? localized(zh, en) : null
)

const publicFactsPeriod = (value) => /^\d{4}$/.test(String(value || '')) ? `${value}-01` : value

const normalizeBaseUrl = (value) => String(value || DEFAULT_SITE_URL).replace(/\/+$/, '')
const getSiteUrl = () => normalizeBaseUrl(process.env.PUBLIC_SITE_URL || process.env.SITE_URL)

const publicUrl = (value, baseUrl = getSiteUrl()) => {
  if (!value) return null
  const url = new URL(String(value), `${baseUrl}/`)
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`Public fact URL must use HTTP(S): ${value}`)
  }
  return url.toString()
}

const contactUrl = (value) => {
  const url = new URL(String(value))
  if (!['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)) {
    throw new Error(`Public contact URL uses an unsupported scheme: ${value}`)
  }
  return url.toString()
}

const timestamp = (value) => {
  const normalized = String(value || '').trim()
  const candidate = /^\d{4}-\d{2}-\d{2}$/.test(normalized)
    ? `${normalized}T00:00:00.000Z`
    : (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(normalized)
        ? `${normalized.replace(' ', 'T')}Z`
        : normalized)
  const parsed = new Date(candidate)
  if (!candidate || Number.isNaN(parsed.getTime())) {
    throw new Error(`Public fact timestamp is invalid: ${value}`)
  }
  return parsed.toISOString()
}

const newestTimestamp = (values, fallback) => {
  const parsed = values.filter(Boolean).map(timestamp)
  return parsed.length
    ? parsed.reduce((latest, value) => value > latest ? value : latest)
    : fallback
}

const contractSlug = (slug, publicId, prefix) => {
  const normalized = String(slug || '').trim().toLowerCase()
  if (SLUG_PATTERN.test(normalized) && normalized.length <= 128) return normalized
  const suffix = String(publicId).split(':').pop().replace(/[^a-z0-9]/g, '').slice(0, 48)
  return `${prefix}-${suffix}`
}

const contactKind = (href) => {
  if (String(href).startsWith('mailto:')) return 'email'
  if (/github|linkedin|twitter|mastodon|weibo/i.test(String(href))) return 'social'
  return 'website'
}

const normalizedContactId = (value, index) => {
  const normalized = String(value || '').trim().replace(/[^A-Za-z0-9._:-]/g, '-')
  return /^[A-Za-z0-9]/.test(normalized) ? normalized.slice(0, 128) : `contact:${index + 1}`
}

const profileFrom = (settings, mediaIds, updatedAt, resumeProfile = null, resumeContacts = [], resumeSkills = []) => {
  if (resumeProfile?.status === 'published') {
    return {
      id: resumeProfile.public_id,
      visibility: 'public',
      name: resumeProfile.name,
      headline: resumeProfile.headline,
      summary: resumeProfile.summary,
      location: resumeProfile.location,
      contacts: resumeContacts.map(contact => ({
        id: contact.public_id,
        kind: contact.type === 'email' ? 'email' : ['github', 'linkedin'].includes(contact.type) ? 'social' : contact.type === 'website' ? 'website' : 'other',
        label: localized(contact.label),
        value: contact.value,
        url: contactUrl(contact.url)
      })),
      skill_groups: resumeSkills.map(skill => ({ id: skill.public_id, name: skill.name, items: skill.items })),
      avatar_media_id: mediaIds.has(resumeProfile.avatar_media_id) ? resumeProfile.avatar_media_id : null,
      canonical_url: publicUrl(getSiteUrl()),
      updated_at: updatedAt
    }
  }
  const owner = settings?.profile_content?.owner || {}
  const ownerName = owner.name_localized || (typeof owner.name === 'object' ? owner.name : { zh: owner.name, en: owner.name })
  const avatarMediaId = mediaIds.has(owner.avatar_media_id) ? owner.avatar_media_id : null
  const contacts = (Array.isArray(owner.contacts) ? owner.contacts : []).map((contact, index) => ({
    id: normalizedContactId(contact.id, index),
    kind: ['email', 'website', 'social', 'other'].includes(contact.kind) ? contact.kind : contactKind(contact.href),
    label: localized(contact.label_localized?.zh || contact.label, contact.label_localized?.en),
    value: String(contact.value || contact.label || contact.href).trim().slice(0, 320),
    url: contactUrl(contact.href)
  }))
  const skillGroups = (Array.isArray(owner.skill_groups) ? owner.skill_groups : [])
    .map((group, index) => ({
      id: normalizedContactId(group.id || `skill:${index + 1}`, index),
      name: localized(group.name?.zh || group.name, group.name?.en),
      items: textList(group.items)
    }))
    .filter(group => group.items.length > 0)

  return {
    id: 'profile:owner',
    visibility: 'public',
    name: localized(ownerName.zh, ownerName.en),
    headline: localized(owner.role?.zh, owner.role?.en),
    summary: localized(owner.bio?.zh, owner.bio?.en),
    location: settings?.location ? localized(settings.location) : null,
    contacts,
    skill_groups: skillGroups,
    avatar_media_id: avatarMediaId,
    canonical_url: publicUrl(owner.canonical_url || getSiteUrl()),
    updated_at: updatedAt
  }
}

const projectLinks = (project) => {
  const links = [{ kind: 'canonical', url: publicUrl(project.url) }]
  for (const link of parseArray(project.links)) {
    if (!link || typeof link !== 'object' || !link.url) continue
    const kind = ['canonical', 'source', 'demo', 'case_study', 'other'].includes(link.kind) ? link.kind : 'other'
    const url = publicUrl(link.url)
    if (!links.some(existing => existing.kind === kind && existing.url === url)) links.push({ kind, url })
  }
  return links
}

const projectsFrom = (rows, mediaIds) => rows.map(project => ({
  id: project.public_id,
  visibility: 'public',
  slug: contractSlug(project.slug, project.public_id, 'project'),
  name: localized(project.title_zh, project.title_en),
  summary: localized(project.summary_zh, project.summary_en),
  role: nullableLocalized(project.role_zh, project.role_en),
  start_date: project.start_date,
  end_date: project.end_date || null,
  technologies: textList(project.technologies),
  tags: textList(project.tags),
  featured: Boolean(project.featured),
  links: projectLinks(project),
  media_ids: mediaIds.has(project.public_media_id) ? [project.public_media_id] : [],
  updated_at: timestamp(project.updated_at || project.created_at)
}))

const experiencesFrom = (rows, mediaIds) => rows.map(experience => ({
  id: experience.public_id,
  visibility: 'public',
  kind: experience.kind,
  organization: localized(experience.organization_zh, experience.organization_en),
  title: localized(experience.title_zh, experience.title_en),
  location: nullableLocalized(experience.location_zh, experience.location_en),
  summary: localized(experience.summary_zh, experience.summary_en),
  highlights: {
    en: textList(experience.highlights_en),
    zh: textList(experience.highlights_zh)
  },
  start_date: publicFactsPeriod(experience.start_date),
  end_date: experience.end_date ? publicFactsPeriod(experience.end_date) : null,
  canonical_url: publicUrl(experience.canonical_url),
  media_ids: textList(experience.media_ids).filter(id => mediaIds.has(id)),
  updated_at: timestamp(experience.updated_at || experience.created_at)
}))

const articlesFrom = (rows) => rows.map(article => ({
  id: article.public_id,
  visibility: 'public',
  slug: contractSlug(article.slug, article.public_id, 'article'),
  title: localized(article.title),
  summary: localized(article.excerpt),
  body_markdown: localized(article.content),
  tags: textList(article.tags),
  canonical_url: publicUrl(`/blog/${article.id}`),
  media_ids: [],
  published_at: timestamp(article.published_at),
  updated_at: timestamp(article.updated_at || article.created_at)
}))

const mediaFrom = (rows) => rows.map(media => ({
  id: media.public_id,
  visibility: 'public',
  kind: media.kind,
  url: publicUrl(media.url),
  mime_type: media.mime_type,
  alt: nullableLocalized(media.alt_zh, media.alt_en),
  width: media.width ?? null,
  height: media.height ?? null,
  duration_seconds: media.duration_seconds ?? null,
  sha256: media.sha256 || null,
  updated_at: timestamp(media.updated_at || media.created_at)
}))

export const buildPublicFacts = ({ db = getDatabase(), generatedAt = new Date().toISOString() } = {}) => {
  const settings = AdminSettings.get()
  const resumeProfile = Resume.getProfile()
  const resumeContacts = resumeProfile?.status === 'published' ? Resume.getContacts({ status: 'published' }) : []
  const resumeSkills = resumeProfile?.status === 'published' ? Resume.getSkills({ status: 'published' }) : []
  const projectRows = db.prepare(`
    SELECT * FROM projects WHERE status = 'published' ORDER BY sort_order ASC, public_id ASC
  `).all()
  const experienceRows = db.prepare(`
    SELECT * FROM public_experiences WHERE status = 'published' ORDER BY sort_order ASC, public_id ASC
  `).all()
  const articleRows = db.prepare(`
    SELECT * FROM blogs WHERE status = 'published' ORDER BY public_sort_order ASC, public_id ASC
  `).all()
  const mediaRows = db.prepare(`
    SELECT * FROM public_media WHERE status = 'published' ORDER BY sort_order ASC, public_id ASC
  `).all()
  const media = mediaFrom(mediaRows)
  const mediaIds = new Set(media.map(record => record.id))
  const normalizedGeneratedAt = timestamp(generatedAt)
  const sourceUpdatedAt = newestTimestamp([
    settings?.updated_at,
    resumeProfile?.updated_at,
    ...resumeContacts.map(row => row.updated_at),
    ...resumeSkills.map(row => row.updated_at),
    ...projectRows.map(row => row.updated_at || row.created_at),
    ...experienceRows.map(row => row.updated_at || row.created_at),
    ...articleRows.map(row => row.updated_at || row.created_at),
    ...mediaRows.map(row => row.updated_at || row.created_at)
  ], normalizedGeneratedAt)

  return assertValidPublicFacts({
    schema_version: PUBLIC_FACTS_SCHEMA_VERSION,
    generated_at: normalizedGeneratedAt,
    source: {
      system: 'GWorkspace',
      updated_at: sourceUpdatedAt,
      canonical_url: publicUrl(getSiteUrl())
    },
    profile: profileFrom(
      settings,
      mediaIds,
      timestamp(resumeProfile?.status === 'published' ? resumeProfile.updated_at : settings?.updated_at || sourceUpdatedAt),
      resumeProfile,
      resumeContacts,
      resumeSkills
    ),
    projects: projectsFrom(projectRows, mediaIds),
    experiences: experiencesFrom(experienceRows, mediaIds),
    articles: articlesFrom(articleRows),
    media
  })
}
