import { AiSeed } from '../models/AiSeed.js'
import { DailyCapsule } from '../models/DailyCapsule.js'
import { getTodayDateString, isDateOnlyString } from '../utils/blogDate.js'
import { generateAnalysis, generateBlogSeed, generateDailyCapsule, getAiRuntimeSummary } from '../utils/aiProvider.js'

const MAX_ANALYZE_LENGTH = 280
const MAX_BLOG_INPUT_LENGTH = 6000
const DEFAULT_WHITELIST = [
  'zhihu.com',
  'weibo.com',
  'sspai.com',
  '36kr.com',
  'thepaper.cn',
  'people.com.cn',
  'bilibili.com',
  'x.com',
  'twitter.com',
  'goodreads.com',
  'wikipedia.org'
]

const BOOTSTRAP_SEEDS = [
  '成长不是突然开悟，而是长期修正。',
  '努力的价值不在时长，而在方向和方法。',
  '选择本质上是在信息不完备时承担机会成本。',
  '焦虑通常来自未决事项，而不是事情本身。'
]

const normalizeDate = (value) => {
  if (!value) return getTodayDateString()
  if (!isDateOnlyString(value)) {
    throw new Error('Date must use YYYY-MM-DD format')
  }
  return value
}

const normalizeBulkEntries = (payload = {}) => {
  if (Array.isArray(payload.entries)) {
    return payload.entries
      .map(entry => String(entry || '').trim())
      .filter(Boolean)
  }

  const rawText = typeof payload.raw_text === 'string' ? payload.raw_text : ''
  return rawText
    .split(/\n+/)
    .map(line => line.replace(/^[-*•\d.\s]+/, '').trim())
    .filter(line => line.length >= 6)
}

const normalizeDomain = (value) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null
  }

  try {
    const url = value.includes('://') ? new URL(value) : new URL(`https://${value}`)
    return url.hostname.replace(/^www\./, '').toLowerCase()
  } catch (error) {
    return null
  }
}

const buildSeedPayload = (rawText, overrides = {}, createdBy = null) => ({
  source_text: String(rawText || '').trim(),
  source_label: typeof overrides.source_label === 'string' && overrides.source_label.trim().length > 0
    ? overrides.source_label.trim()
    : 'manual',
  source_url: typeof overrides.source_url === 'string' && overrides.source_url.trim().length > 0
    ? overrides.source_url.trim()
    : null,
  language: typeof overrides.language === 'string' && overrides.language.trim().length > 0
    ? overrides.language.trim()
    : 'zh-CN',
  status: typeof overrides.status === 'string' && overrides.status.trim().length > 0
    ? overrides.status.trim()
    : 'active',
  imported_from: typeof overrides.imported_from === 'string' && overrides.imported_from.trim().length > 0
    ? overrides.imported_from.trim()
    : 'manual',
  notes: typeof overrides.notes === 'string' && overrides.notes.trim().length > 0
    ? overrides.notes.trim()
    : null,
  created_by: createdBy
})

export function getSeedWhitelistDomains() {
  const configured = (process.env.AI_SEED_IMPORT_WHITELIST || '')
    .split(',')
    .map(domain => domain.trim().toLowerCase())
    .filter(Boolean)

  return configured.length > 0 ? configured : DEFAULT_WHITELIST
}

function ensureBootstrapSeeds() {
  if (AiSeed.countActive() > 0) {
    return
  }

  BOOTSTRAP_SEEDS.forEach((sourceText) => {
    if (!AiSeed.existsBySourceText(sourceText)) {
      AiSeed.create(buildSeedPayload(sourceText, {
        source_label: 'system bootstrap',
        imported_from: 'bootstrap'
      }))
    }
  })
}

function chooseSeed(seedId = null) {
  if (seedId) {
    const explicitSeed = AiSeed.getById(Number(seedId))
    if (!explicitSeed) {
      throw new Error('Seed not found')
    }
    return explicitSeed
  }

  ensureBootstrapSeeds()
  const candidates = AiSeed.getCandidatePool(12)
  return candidates[0] || null
}

export async function ensureDailyCapsule(options = {}) {
  const date = normalizeDate(options.date)
  const force = Boolean(options.force)

  if (!force) {
    const existing = DailyCapsule.getByDate(date)
    if (existing) {
      return existing
    }
  }

  const seed = chooseSeed(options.seed_id || null)

  if (!seed) {
    throw new Error('No seed available for daily capsule')
  }

  const generated = await generateDailyCapsule(seed)
  const capsule = DailyCapsule.upsert({
    capsule_date: date,
    seed_id: seed.id,
    source_text: generated.data.source_text,
    source_label: generated.data.source_label,
    source_url: generated.data.source_url,
    greeting: generated.data.greeting,
    thesis: generated.data.thesis,
    boundary: generated.data.boundary,
    takeaway: generated.data.takeaway,
    provider_mode: generated.provider_mode,
    raw_payload: generated.data
  })

  AiSeed.markUsed(seed.id)
  return capsule
}

export async function getPublicDailyCapsule(options = {}) {
  const date = normalizeDate(options.date)
  return ensureDailyCapsule({ date })
}

export async function analyzeStatement(payload = {}) {
  const text = String(payload.text || '').trim()

  if (!text) {
    throw new Error('Text is required')
  }

  if (text.length > MAX_ANALYZE_LENGTH) {
    throw new Error(`Text must be ${MAX_ANALYZE_LENGTH} characters or fewer`)
  }

  const generated = await generateAnalysis({ text })

  return {
    ...generated.data,
    provider_mode: generated.provider_mode
  }
}

export async function createBlogSeed(payload = {}) {
  const mergedText = [
    payload.title,
    payload.excerpt,
    Array.isArray(payload.tags) ? payload.tags.join(', ') : payload.tags,
    payload.text,
    payload.content
  ]
    .filter(Boolean)
    .join('\n')
    .trim()

  if (!mergedText) {
    throw new Error('At least one blog context field is required')
  }

  if (mergedText.length > MAX_BLOG_INPUT_LENGTH) {
    throw new Error(`Blog context must be ${MAX_BLOG_INPUT_LENGTH} characters or fewer`)
  }

  const generated = await generateBlogSeed({
    title: payload.title || '',
    excerpt: payload.excerpt || '',
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    text: payload.text || '',
    content: payload.content || ''
  })

  return {
    ...generated.data,
    provider_mode: generated.provider_mode
  }
}

export function getAdminSeedOverview(options = {}) {
  ensureBootstrapSeeds()

  return {
    seeds: AiSeed.getAll(options),
    summary: AiSeed.getSummary(),
    whitelist_domains: getSeedWhitelistDomains()
  }
}

export function createSeed(data = {}, createdBy = null) {
  const seed = AiSeed.create(buildSeedPayload(data.source_text, data, createdBy))

  return {
    seed,
    summary: AiSeed.getSummary()
  }
}

export function updateSeed(id, updates = {}) {
  const seed = AiSeed.update(Number(id), updates)
  if (!seed) {
    throw new Error('Seed not found')
  }

  return {
    seed,
    summary: AiSeed.getSummary()
  }
}

export function importSeeds(payload = {}, createdBy = null) {
  const sourceUrl = typeof payload.source_url === 'string' && payload.source_url.trim().length > 0
    ? payload.source_url.trim()
    : null
  const sourceDomain = normalizeDomain(sourceUrl)
  const whitelist = getSeedWhitelistDomains()

  if (sourceDomain && !whitelist.includes(sourceDomain)) {
    throw new Error(`Source domain is not in whitelist: ${sourceDomain}`)
  }

  const rawEntries = normalizeBulkEntries(payload)
  const uniqueEntries = [...new Set(rawEntries)]
  const created = []
  const skipped = []

  uniqueEntries.forEach((entry) => {
    if (AiSeed.existsBySourceText(entry)) {
      skipped.push({ source_text: entry, reason: 'duplicate' })
      return
    }

    created.push(AiSeed.create(buildSeedPayload(entry, {
      ...payload,
      imported_from: sourceDomain ? 'whitelist-batch' : 'manual-batch'
    }, createdBy)))
  })

  return {
    created,
    skipped,
    summary: AiSeed.getSummary(),
    whitelist_domains: whitelist
  }
}

export async function getAdminDailyCapsule(options = {}) {
  const date = normalizeDate(options.date)
  const capsule = await ensureDailyCapsule({ date })

  return {
    capsule,
    runtime: getAiRuntimeSummary()
  }
}

export async function refreshDailyCapsule(options = {}) {
  const date = normalizeDate(options.date)
  const capsule = await ensureDailyCapsule({
    date,
    force: true,
    seed_id: options.seed_id || null
  })

  return {
    capsule,
    runtime: getAiRuntimeSummary()
  }
}
