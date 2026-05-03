import { createLocalAnalysis, createLocalBlogSeed, createLocalDailyCapsule } from './aiLocalEngine.js'
import { buildMasterPromptSummary } from './masterPrompt.js'

const DEFAULT_PROVIDER = 'openai-compatible'
const DEFAULT_API_URL = 'https://api.openai.com/v1/chat/completions'
const DEFAULT_MODEL = 'gpt-4.1-mini'
const DEFAULT_TIMEOUT_MS = 12000
const DAILY_GREETING_MIN_LENGTH = 8
const DAILY_GREETING_MAX_LENGTH = 12
const DAILY_THESIS_MAX_LENGTH = 56
const DAILY_BOUNDARY_MAX_LENGTH = 120
const DAILY_TAKEAWAY_MAX_LENGTH = 72

const extractJsonObject = (input) => {
  if (typeof input !== 'string') {
    throw new Error('Model response is empty')
  }

  const trimmed = input.trim()
  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')

  if (firstBrace < 0 || lastBrace < 0 || lastBrace <= firstBrace) {
    throw new Error('Model response does not contain a JSON object')
  }

  return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1))
}

const withTimeout = async (promise, timeoutMs) => {
  let timer = null

  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`AI request timed out after ${timeoutMs}ms`)), timeoutMs)
    })
  ]).finally(() => {
    if (timer) {
      clearTimeout(timer)
    }
  })
}

const normalizeText = (value) => String(value || '').replace(/\s+/g, ' ').trim()

const stripOuterQuotes = (value) => normalizeText(value).replace(/^[“"'「『]+|[”"'」』]+$/g, '').trim()

const ensureTrailingPunctuation = (value, punctuation = '。') => {
  const normalized = stripOuterQuotes(value)
  if (!normalized) return ''
  return /[。！？!?…]$/.test(normalized) ? normalized : `${normalized}${punctuation}`
}

const trimHard = (value, maxLength) => {
  const normalized = stripOuterQuotes(value)
  if (!normalized) return ''
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, Math.max(1, maxLength - 1)).trim()}…`
}

const countChineseChars = (value) => stripOuterQuotes(value).replace(/[^\u4e00-\u9fff]/g, '').length

const removeLeadIn = (value) => (
  stripOuterQuotes(value)
    .replace(/^把修辞拆开[，、]*/, '')
    .replace(/^更稳妥的理解方式是[：:]\s*/, '')
    .replace(/^更稳妥的做法不是[^，。]*[，、]\s*/, '')
    .replace(/^而是/, '')
    .replace(/^这类判断只有在前提足够明确时才有价值[，、]*/, '')
    .trim()
)

export function getAiRuntimeSummary() {
  const provider = (process.env.AI_PROVIDER || DEFAULT_PROVIDER).trim() || DEFAULT_PROVIDER
  const apiKey = (process.env.AI_API_KEY || '').trim()
  const apiUrl = (process.env.AI_API_URL || DEFAULT_API_URL).trim() || DEFAULT_API_URL
  const model = (process.env.AI_MODEL || DEFAULT_MODEL).trim() || DEFAULT_MODEL
  const remoteEnabled = Boolean(apiKey && model && apiUrl)

  return {
    provider,
    api_url: apiUrl,
    model,
    remote_enabled: remoteEnabled,
    provider_mode: remoteEnabled ? `${provider}:${model}` : 'local-fallback'
  }
}

const buildMessages = ({ task, payload, schema }) => {
  const systemPrompt = [
    '你是站点内部的轻量分析引擎。',
    buildMasterPromptSummary(),
    `当前任务：${task}`,
    task === '今日拆句'
      ? [
          '字段职责必须严格区分：',
          '1. greeting 只写短问候或短触发句，使用半白半文言文语气，长度严格控制在 8 到 12 个汉字左右，尽可能保持韵律，不要解释原句，不要承担标题功能。',
          '2. thesis 需要能直接作为首页主标题，要求判断清晰、有表现力，但不要写成论文摘要或过长定义句。',
          '3. boundary 只负责写前提、适用边界和误用风险。',
          '4. takeaway 只负责收束理解，写成一条克制的辅助句，不要重复 thesis。'
        ].join('\n')
      : '',
    '输出要求：只返回一个 JSON 对象，不要 Markdown，不要前后解释，不要额外字段。'
  ].filter(Boolean).join('\n\n')

  const userPrompt = [
    '请根据下面的输入生成结果。',
    `输入：${JSON.stringify(payload, null, 2)}`,
    `期望 JSON 结构：${JSON.stringify(schema, null, 2)}`
  ].join('\n\n')

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]
}

async function requestRemoteJson({ task, payload, schema }) {
  const runtime = getAiRuntimeSummary()

  if (!runtime.remote_enabled) {
    return null
  }

  const timeoutMs = Number.parseInt(process.env.AI_TIMEOUT_MS, 10) || DEFAULT_TIMEOUT_MS
  const response = await withTimeout(fetch(runtime.api_url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.AI_API_KEY}`
    },
    body: JSON.stringify({
      model: runtime.model,
      temperature: 0.5,
      response_format: { type: 'json_object' },
      messages: buildMessages({ task, payload, schema })
    })
  }), timeoutMs)

  if (!response.ok) {
    const errorPayload = await response.text().catch(() => '')
    throw new Error(`Remote AI request failed: ${response.status} ${errorPayload}`.trim())
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  const structured = extractJsonObject(content)

  return {
    data: structured,
    provider_mode: runtime.provider_mode
  }
}

async function runWithFallback({ task, payload, schema, fallbackFactory }) {
  try {
    const remote = await requestRemoteJson({ task, payload, schema })
    if (remote?.data) {
      return remote
    }
  } catch (error) {
    console.warn(`Remote AI request failed for task "${task}", falling back locally:`, error.message)
  }

  return {
    data: fallbackFactory(),
    provider_mode: 'local-fallback'
  }
}

function normalizeDailyCapsulePayload(data = {}, seed = {}) {
  const fallback = createLocalDailyCapsule(seed)
  const sourceText = normalizeText(data.source_text || fallback.source_text)
  const sourceLabel = normalizeText(data.source_label || fallback.source_label)
  const sourceUrl = typeof data.source_url === 'string' && data.source_url.trim().length > 0
    ? data.source_url.trim()
    : (fallback.source_url || null)

  const greetingCandidate = stripOuterQuotes(data.greeting || fallback.greeting)
    .replace(/欢迎回来[，、]*/g, '')
    .replace(/这句话/g, '这一句')
    .replace(/。/g, '')
    .trim()
  const trimmedGreeting = trimHard(greetingCandidate || fallback.greeting, DAILY_GREETING_MAX_LENGTH)
  const greeting = (() => {
    const length = countChineseChars(trimmedGreeting)
    if (length >= DAILY_GREETING_MIN_LENGTH && length <= DAILY_GREETING_MAX_LENGTH) {
      return ensureTrailingPunctuation(trimmedGreeting)
    }

    return ensureTrailingPunctuation(trimHard(fallback.greeting, DAILY_GREETING_MAX_LENGTH))
  })()

  const thesisSource = removeLeadIn(data.thesis || fallback.thesis) || fallback.thesis
  const thesisNormalized = (() => {
    if (/[:：]/.test(thesisSource) && /^这句话/.test(thesisSource)) {
      const suffix = thesisSource.split(/[:：]/).pop()?.trim()
      if (suffix) {
        return suffix
      }
    }

    if (/^这句话/.test(thesisSource)) {
      return fallback.thesis
    }

    return thesisSource
  })()
  const thesis = ensureTrailingPunctuation(trimHard(thesisNormalized, DAILY_THESIS_MAX_LENGTH))

  const boundarySource = stripOuterQuotes(data.boundary || fallback.boundary) || fallback.boundary
  const boundary = ensureTrailingPunctuation(trimHard(boundarySource, DAILY_BOUNDARY_MAX_LENGTH))

  const takeawaySource = removeLeadIn(data.takeaway || fallback.takeaway) || fallback.takeaway
  const takeaway = ensureTrailingPunctuation(trimHard(takeawaySource, DAILY_TAKEAWAY_MAX_LENGTH))

  return {
    source_text: sourceText,
    source_label: sourceLabel,
    source_url: sourceUrl,
    greeting,
    thesis,
    boundary,
    takeaway
  }
}

export function generateAnalysis(payload = {}) {
  return runWithFallback({
    task: '一句话命题解析',
    payload,
    schema: {
      thesis: 'string',
      appeal: 'string',
      boundary: 'string',
      takeaway: 'string'
    },
    fallbackFactory: () => createLocalAnalysis(payload.text || '')
  })
}

export function generateBlogSeed(payload = {}) {
  return runWithFallback({
    task: 'Blog Assistant 2.0',
    payload,
    schema: {
      thesis: 'string',
      angles: ['string', 'string', 'string'],
      title_suggestion: 'string',
      outline_or_closing: 'string'
    },
    fallbackFactory: () => createLocalBlogSeed(payload)
  })
}

export function generateDailyCapsule(seed = {}) {
  return runWithFallback({
    task: '今日拆句',
    payload: seed,
    schema: {
      source_text: 'string',
      source_label: 'string',
      source_url: 'string|null',
      greeting: 'string',
      thesis: 'string',
      boundary: 'string',
      takeaway: 'string'
    },
    fallbackFactory: () => createLocalDailyCapsule(seed)
  }).then((result) => ({
    ...result,
    data: normalizeDailyCapsulePayload(result.data, seed)
  }))
}
