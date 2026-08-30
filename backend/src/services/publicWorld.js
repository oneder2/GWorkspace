import { AdminSettings } from '../models/AdminSettings.js'
import { Blog } from '../models/Blog.js'
import { Guestbook } from '../models/Guestbook.js'
import { Project } from '../models/Project.js'
import { WorldExhibit } from '../models/WorldExhibit.js'

const REGION_IDS = ['workshop', 'observatory', 'memory-grove']
const MAX_EXHIBITS_PER_REGION = 6

const localized = (value, locale) => value?.[locale] || value?.zh || value?.en || ''
const summarize = (value, limit = 180) => {
  const plain = String(value || '').replace(/[#>*_`\[\]()]/g, ' ').replace(/\s+/g, ' ').trim()
  return plain.length > limit ? `${plain.slice(0, limit - 1).trim()}…` : plain
}

const projectExhibit = (project, placement, locale) => ({
  id: `project:${project.slug}`,
  sourceType: 'project',
  sourceKey: project.slug,
  label: localized(placement?.label, locale) || (locale === 'en' ? 'Project' : '项目'),
  title: localized(placement?.title, locale) || localized(project.title, locale),
  summary: localized(placement?.summary, locale) || localized(project.summary, locale),
  href: placement?.href || project.url,
  image: project.image_url || null,
  tags: project.tags,
  publishedAt: null
})

const blogExhibit = (blog, placement, locale) => ({
  id: `blog:${blog.slug || blog.id}`,
  sourceType: 'blog',
  sourceKey: blog.slug || String(blog.id),
  label: localized(placement?.label, locale) || (locale === 'en' ? 'Field note' : '观测札记'),
  title: localized(placement?.title, locale) || blog.title,
  summary: localized(placement?.summary, locale) || summarize(blog.excerpt || blog.content),
  href: placement?.href || `/blog/${blog.slug || blog.id}`,
  image: blog.image || null,
  tags: Array.isArray(blog.tags) ? blog.tags : [],
  publishedAt: blog.published_at || blog.created_at || null
})

const guestbookExhibit = (entry, placement, locale) => ({
  id: `guestbook:${entry.id}`,
  sourceType: 'guestbook',
  sourceKey: String(entry.id),
  label: localized(placement?.label, locale) || (locale === 'en' ? 'Visitor echo' : '来访回声'),
  title: localized(placement?.title, locale) || entry.author_name || (locale === 'en' ? 'Anonymous visitor' : '匿名旅人'),
  summary: localized(placement?.summary, locale) || summarize(entry.content),
  href: placement?.href || '/archive#memory-grove',
  image: null,
  tags: [],
  publishedAt: entry.created_at || null
})

const externalExhibit = (placement, locale) => ({
  id: `external:${placement.source_key}`,
  sourceType: 'external',
  sourceKey: placement.source_key,
  label: localized(placement.label, locale) || (locale === 'en' ? 'External record' : '外部记录'),
  title: localized(placement.title, locale),
  summary: localized(placement.summary, locale),
  href: placement.href || null,
  image: null,
  tags: [],
  publishedAt: null
})

function selectProfile(settings, locale) {
  const owner = settings?.profile_content?.owner || {}
  const homepage = settings?.homepage_content || {}
  return {
    name: owner.name || 'Eclospy732',
    role: localized(owner.role, locale),
    bio: localized(owner.bio, locale),
    responsibilities: owner.responsibilities?.[locale] || owner.responsibilities?.zh || [],
    contacts: Array.isArray(owner.contacts) ? owner.contacts : [],
    status: localized(homepage.status, locale),
    slogan: localized(homepage.slogan, locale),
    tasks: homepage.tasks?.[locale] || homepage.tasks?.zh || [],
    location: settings?.location || null,
    timezone: settings?.timezone || null
  }
}

export function buildPublicWorld({ locale = 'zh' } = {}) {
  const language = locale === 'en' ? 'en' : 'zh'
  const settings = AdminSettings.get()
  const projects = Project.getAll({ status: 'published' })
  const blogs = Blog.getAll({ status: 'published', limit: MAX_EXHIBITS_PER_REGION, sortBy: 'published_at', sortOrder: 'desc' })
  const guestbook = Guestbook.getAll({ status: 'approved', limit: MAX_EXHIBITS_PER_REGION, sortOrder: 'desc' })
  const placements = WorldExhibit.getAll({ status: 'published' })
  const projectBySlug = new Map(projects.map(project => [project.slug, project]))
  const blogByKey = new Map(blogs.flatMap(blog => [[String(blog.id), blog], [blog.slug, blog]]).filter(([key]) => key))
  const guestbookById = new Map(guestbook.map(entry => [String(entry.id), entry]))
  const regions = Object.fromEntries(REGION_IDS.map(id => [id, []]))
  const placedSourceIds = new Set()

  for (const placement of placements) {
    let exhibit = null
    const project = projectBySlug.get(placement.source_key)
    const blog = blogByKey.get(placement.source_key)
    const guestbookEntry = guestbookById.get(placement.source_key)
    if (placement.source_type === 'project' && project) exhibit = projectExhibit(project, placement, language)
    if (placement.source_type === 'blog' && blog) exhibit = blogExhibit(blog, placement, language)
    if (placement.source_type === 'guestbook' && guestbookEntry) exhibit = guestbookExhibit(guestbookEntry, placement, language)
    if (placement.source_type === 'external') exhibit = externalExhibit(placement, language)
    if (!exhibit || !exhibit.title || !exhibit.summary) continue
    regions[placement.region_id].push(exhibit)
    placedSourceIds.add(`${placement.source_type}:${placement.source_key}`)
  }

  for (const project of projects) {
    if (regions.workshop.length >= MAX_EXHIBITS_PER_REGION || placedSourceIds.has(`project:${project.slug}`)) continue
    regions.workshop.push(projectExhibit(project, null, language))
  }
  for (const blog of blogs) {
    const keys = [`blog:${blog.slug}`, `blog:${blog.id}`]
    if (regions.observatory.length >= MAX_EXHIBITS_PER_REGION || keys.some(key => placedSourceIds.has(key))) continue
    regions.observatory.push(blogExhibit(blog, null, language))
  }
  for (const entry of guestbook) {
    if (regions['memory-grove'].length >= MAX_EXHIBITS_PER_REGION || placedSourceIds.has(`guestbook:${entry.id}`)) continue
    regions['memory-grove'].push(guestbookExhibit(entry, null, language))
  }

  const timestamps = [settings?.updated_at, ...projects.map(project => project.updated_at), ...blogs.map(blog => blog.updated_at)]
    .filter(Boolean)
    .map(value => new Date(value).getTime())
    .filter(Number.isFinite)

  return {
    version: 1,
    locale: language,
    updatedAt: timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : null,
    profile: selectProfile(settings, language),
    regions: REGION_IDS.map(id => ({ id, exhibits: regions[id].slice(0, MAX_EXHIBITS_PER_REGION) }))
  }
}

export function listPublicProjects({ locale = 'zh' } = {}) {
  const language = locale === 'en' ? 'en' : 'zh'
  return Project.getAll({ status: 'published' }).map(project => ({
    id: project.id,
    slug: project.slug,
    title: localized(project.title, language),
    summary: localized(project.summary, language),
    url: project.url,
    image: project.image_url || null,
    tags: project.tags,
    updatedAt: project.updated_at
  }))
}
