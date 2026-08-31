import { getDatabase } from '../config/database.js'
import { Project } from '../models/Project.js'
import { Resume, RESUME_SURFACES } from '../models/Resume.js'
import { assertValidResumeResponse, RESUME_SCHEMA_VERSION } from './resumeValidator.js'

const DEFAULT_SITE_URL = 'https://www.gellaronline.cc'
const normalizeBaseUrl = (value) => String(value || DEFAULT_SITE_URL).replace(/\/+$/, '')
const siteUrl = () => normalizeBaseUrl(process.env.PUBLIC_SITE_URL || process.env.SITE_URL)
const absoluteUrl = (value) => value ? new URL(String(value), `${siteUrl()}/`).toString() : null

const timestamp = (value) => {
  const normalized = String(value || '').trim()
  const candidate = /^\d{4}-\d{2}-\d{2}$/.test(normalized)
    ? `${normalized}T00:00:00.000Z`
    : /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(normalized)
      ? `${normalized.replace(' ', 'T')}Z`
      : normalized
  const parsed = new Date(candidate)
  if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid resume timestamp: ${value}`)
  return parsed.toISOString()
}

const mediaRecord = (row) => row && row.status === 'published' ? {
  id: row.public_id,
  url: absoluteUrl(row.url),
  mime_type: row.mime_type,
  alt: row.alt_zh || row.alt_en ? { zh: row.alt_zh || row.alt_en, en: row.alt_en || row.alt_zh } : null,
  width: row.width ?? null,
  height: row.height ?? null
} : null

const mediaById = (id) => id
  ? mediaRecord(getDatabase().prepare('SELECT * FROM public_media WHERE public_id = ?').get(id))
  : null

const localize = (value, locale) => {
  if (!locale) return value
  if (Array.isArray(value)) return value.map(item => localize(item, locale))
  if (value && typeof value === 'object') {
    const keys = Object.keys(value)
    if (keys.length === 2 && keys.includes('zh') && keys.includes('en')) return localize(value[locale], locale)
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, localize(item, locale)]))
  }
  return value
}

const linkObject = (links) => Object.fromEntries(
  links
    .filter(link => ['source', 'demo', 'case_study'].includes(link.kind) && link.url)
    .map(link => [link.kind, absoluteUrl(link.url)])
)

const newest = (values) => values.map(timestamp).reduce((latest, value) => value > latest ? value : latest)

export class ResumeNotPublishedError extends Error {
  constructor(surface) {
    super(`Resume profile is not published on ${surface}`)
    this.code = 'RESUME_NOT_PUBLISHED'
    this.status = 404
  }
}

export const buildResumeResponse = ({ locale = null, surface = 'resume_web', generatedAt = new Date().toISOString() } = {}) => {
  if (locale !== null && !['zh', 'en'].includes(locale)) throw Object.assign(new Error('locale must be zh or en'), { status: 400, code: 'INVALID_RESUME_LOCALE' })
  if (!RESUME_SURFACES.includes(surface)) throw Object.assign(new Error('surface is not supported'), { status: 400, code: 'INVALID_RESUME_SURFACE' })
  if (!Resume.profileIsPublishedOn(surface)) throw new ResumeNotPublishedError(surface)

  const profile = Resume.getProfile()
  const contacts = Resume.getContacts({ status: 'published', surface })
  const skills = Resume.getSkills({ status: 'published', surface })
  const experience = Resume.getTimeline({ section: 'experience', status: 'published', surface })
  const education = Resume.getTimeline({ section: 'education', status: 'published', surface })
  const projects = Project.getAll({ status: 'published', surface })
  const updatedValues = [
    profile.updated_at,
    ...contacts.map(record => record.updated_at),
    ...skills.map(record => record.updated_at),
    ...experience.map(record => record.updated_at),
    ...education.map(record => record.updated_at),
    ...projects.map(record => record.updated_at)
  ]

  const payload = {
    schema_version: RESUME_SCHEMA_VERSION,
    generated_at: timestamp(generatedAt),
    source: {
      system: 'GWorkspace',
      canonical_url: absoluteUrl('/api/public/v1/resume'),
      updated_at: newest(updatedValues)
    },
    locale,
    surface,
    profile: {
      id: profile.public_id,
      name: profile.name,
      full_name: profile.full_name,
      headline: profile.headline,
      location: profile.location,
      summary: profile.summary,
      avatar: mediaById(profile.avatar_media_id),
      contacts: contacts.map(contact => ({
        id: contact.public_id,
        type: contact.type,
        label: contact.label,
        value: contact.value,
        url: contact.url,
        status: 'published',
        surfaces: contact.surfaces,
        updated_at: timestamp(contact.updated_at)
      })),
      status: 'published',
      surfaces: profile.surfaces,
      updated_at: timestamp(profile.updated_at)
    },
    skills: skills.map(skill => ({
      id: skill.public_id,
      name: skill.name,
      items: skill.items,
      status: 'published',
      surfaces: skill.surfaces,
      updated_at: timestamp(skill.updated_at)
    })),
    experience: experience.map(entry => ({
      id: entry.public_id,
      kind: entry.kind,
      organization: entry.organization,
      title: entry.title,
      location: entry.location,
      summary: entry.summary,
      highlights: entry.highlights,
      start: entry.start_date,
      end: entry.end_date || null,
      canonical_url: absoluteUrl(entry.canonical_url),
      status: 'published',
      surfaces: entry.surfaces,
      updated_at: timestamp(entry.updated_at)
    })),
    education: education.map(entry => ({
      id: entry.public_id,
      kind: entry.kind,
      organization: entry.organization,
      title: entry.title,
      location: entry.location,
      summary: entry.summary,
      highlights: entry.highlights,
      start: entry.start_date,
      end: entry.end_date || null,
      canonical_url: absoluteUrl(entry.canonical_url),
      status: 'published',
      surfaces: entry.surfaces,
      updated_at: timestamp(entry.updated_at)
    })),
    projects: projects.map(project => ({
      id: project.public_id,
      slug: project.slug,
      name: project.title,
      summary: project.summary,
      role: project.role,
      involvement: project.involvement,
      start: project.start_date,
      end: project.end_date || null,
      technologies: project.technologies,
      highlights: project.highlights,
      links: linkObject(project.links),
      cover: mediaById(project.public_media_id),
      gallery: project.gallery.filter(media => media.status === 'published').map(media => mediaRecord({
        public_id: media.id,
        url: media.url,
        mime_type: media.mime_type,
        alt_zh: media.alt?.zh,
        alt_en: media.alt?.en,
        width: media.width,
        height: media.height,
        status: media.status
      })),
      featured: project.featured,
      status: 'published',
      surfaces: project.surfaces,
      updated_at: timestamp(project.updated_at)
    })),
    settings: profile.settings
  }

  return assertValidResumeResponse(localize(payload, locale))
}
