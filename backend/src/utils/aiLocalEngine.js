import { getMasterPrompt } from './masterPrompt.js'
import { normalizeDailyCapsuleSeed } from './aiSeedText.js'

const ABSOLUTE_MARKERS = ['一定', '永远', '必须', '注定', '总会', '总是', '所有', '唯一', '完全']
const DEFAULT_ANALYSIS_TITLE = '先把命题说清楚，再谈结论'
const GENERIC_ANGLES = [
  '先定义核心概念，避免把关键词写成姿态。',
  '把这句话成立依赖的前提条件单独写出来。',
  '补一段适用边界，说明它在什么情况下会失真。'
]

const TOPIC_KEYWORDS = {
  成长: ['成长', '成熟', '进步', '迭代', '修正', '提升'],
  努力: ['努力', '勤奋', '吃苦', '坚持', '投入', '奋斗'],
  失败: ['失败', '挫折', '失误', '犯错', '试错'],
  选择: ['选择', '取舍', '决定', '机会成本', '路径'],
  时间: ['时间', '效率', '优先级', '拖延', '浪费'],
  焦虑: ['焦虑', '不安', '失控', '担心', '未决'],
  痛苦: ['痛苦', '煎熬', '苦难', '难受', '代价'],
  自由: ['自由', '约束', '承担', '责任', '任性'],
  成熟: ['成熟', '圆滑', '后果', '现实', '清醒'],
  接受现实: ['现实', '接受', '局限', '代价', '约束'],
  孤独: ['孤独', '独处', '陪伴', '疏离'],
  沟通: ['沟通', '表达', '理解', '误解', '对话'],
  长期主义: ['长期', '长期主义', '复利', '耐心', '积累'],
  边界感: ['边界', '边界感', '界限', '分寸']
}

const GREETING_TEMPLATES = [
  '且慢定论，先辨其义。',
  '姑缓一断，先观其理。',
  '先明其旨，再议其余。',
  '不妨徐行，先验此句。',
  '且按心火，先析其辞。'
]

const normalizeInput = (value) => String(value || '').replace(/\s+/g, ' ').trim()

const stripOuterQuotes = (value) => normalizeInput(value).replace(/^[“"'「『]+|[”"'」』]+$/g, '').trim()

const ensureTrailingPunctuation = (value, punctuation = '。') => {
  const normalized = stripOuterQuotes(value)
  if (!normalized) return ''
  return /[。！？!?…]$/.test(normalized) ? normalized : `${normalized}${punctuation}`
}

const trimToSentence = (value, maxLength = 100) => {
  const normalized = normalizeInput(value)
  if (!normalized) return ''
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength).trim()}…`
}

const trimHard = (value, maxLength) => {
  const normalized = stripOuterQuotes(value)
  if (!normalized) return ''
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, Math.max(1, maxLength - 1)).trim()}…`
}

const countChineseChars = (value) => stripOuterQuotes(value).replace(/[^\u4e00-\u9fff]/g, '').length

const createSeededIndex = (seedText, modulo) => {
  const hash = Array.from(String(seedText || '')).reduce((total, char) => total + char.charCodeAt(0), 0)
  return modulo > 0 ? hash % modulo : 0
}

const getTopicProfiles = () => {
  const prompt = getMasterPrompt()
  return Array.isArray(prompt?.generation_profile?.topic_positions)
    ? prompt.generation_profile.topic_positions
    : []
}

const detectTopicProfile = (input) => {
  const normalized = normalizeInput(input)
  if (!normalized) return null

  const profiles = getTopicProfiles()
  const scored = profiles
    .map((profile) => {
      const keywords = TOPIC_KEYWORDS[profile.topic] || [profile.topic]
      const score = keywords.reduce((total, keyword) => (
        normalized.includes(keyword) ? total + 1 : total
      ), 0)
      return { profile, score }
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)

  return scored[0]?.profile || null
}

const usesAbsoluteTone = (input) => ABSOLUTE_MARKERS.some(marker => input.includes(marker))

const buildThesis = (input, topicProfile) => {
  if (topicProfile?.position) {
    return `把修辞拆开，这句话更接近在主张：${topicProfile.position}`
  }

  return `把修辞拆开，这句话真正要讨论的不是情绪姿态，而是这条判断在什么条件下成立：${trimToSentence(input, 72)}`
}

const buildAppeal = (input, topicProfile) => {
  if (topicProfile?.topic) {
    return `它打动人的地方在于，把“${topicProfile.topic}”说成了一条看似直接、能快速提供方向感的判断。`
  }

  return `它有吸引力，是因为它把复杂处境压缩成了一句容易记住的话，让人暂时获得了方向感。`
}

const buildBoundary = (input, topicProfile) => {
  const topicBoundary = topicProfile?.preferred_angles?.[0] || '先把前提条件和资源约束写清楚'
  const absoluteNote = usesAbsoluteTone(input)
    ? '尤其不适合作为放之四海皆准的绝对规则。'
    : '如果不区分对象、阶段和成本，它就很容易被误用。'

  return `这类判断只有在前提足够明确时才有价值，例如需要先做到“${topicBoundary}”。离开具体场景，${absoluteNote}`
}

const buildTakeaway = (topicProfile) => {
  if (topicProfile?.topic) {
    return `更稳妥的理解方式是：把“${topicProfile.topic}”看成一个需要前提、反馈和取舍的过程，而不是一句漂亮口号。`
  }

  return '更稳妥的做法不是直接接受这句话，而是先确认它适用于谁、依赖什么条件、能指导什么具体行动。'
}

const buildGreeting = (sourceText, topicProfile) => {
  if (topicProfile?.topic) {
    const candidate = {
      成长: '且缓言成，先看其修。',
      努力: '且缓言勤，先辨其效。',
      失败: '毋急论败，先察其因。',
      选择: '姑缓一择，先计其失。',
      时间: '且惜此刻，先定其序。',
      焦虑: '姑宁心火，先拆其忧。',
      痛苦: '毋急言苦，先辨其源。',
      自由: '且莫言纵，先明其责。',
      成熟: '姑缓言熟，先察其界。'
    }[topicProfile.topic]

    if (candidate) {
      return candidate
    }
  }

  return GREETING_TEMPLATES[createSeededIndex(sourceText, GREETING_TEMPLATES.length)]
}

const buildTitleSuggestion = (title, topicProfile) => {
  const normalizedTitle = normalizeInput(title)
  if (normalizedTitle) {
    return `${normalizedTitle}：把命题拆回现实`
  }

  if (topicProfile?.topic) {
    return `${topicProfile.topic}不是姿态，而是条件判断`
  }

  return DEFAULT_ANALYSIS_TITLE
}

const buildAngles = (topicProfile) => {
  const preferred = Array.isArray(topicProfile?.preferred_angles)
    ? topicProfile.preferred_angles
        .filter(angle => typeof angle === 'string' && angle.trim().length > 0)
        .slice(0, 3)
        .map(angle => `${angle}。`)
    : []

  return preferred.length === 3 ? preferred : GENERIC_ANGLES
}

const buildOutline = (topicProfile) => {
  const topic = topicProfile?.topic || '这个命题'
  return [
    `1. 先把“${topic}”还原成一句可检验的判断。`,
    '2. 用一段写清它成立需要哪些前提。',
    '3. 再补一段它在哪些场景会被误用或失效。',
    '4. 最后用一个现实场景收束，而不是停在口号。'
  ].join('\n')
}

const removeLeadIn = (value) => (
  stripOuterQuotes(value)
    .replace(/^把修辞拆开[，、]*/, '')
    .replace(/^更稳妥的理解方式是[：:]\s*/, '')
    .replace(/^更稳妥的做法不是[^，。]*[，、]\s*/, '')
    .replace(/^而是/, '')
    .replace(/^这类判断只有在前提足够明确时才有价值[，、]*/, '')
    .trim()
)

const convertAnalysisToHeroTitle = (value, fallback) => {
  const cleaned = removeLeadIn(value)
  if (!cleaned) {
    return ensureTrailingPunctuation(fallback)
  }

  if (/[:：]/.test(cleaned) && /^这句话/.test(cleaned)) {
    const suffix = cleaned.split(/[:：]/).pop()?.trim()
    if (suffix) {
      return ensureTrailingPunctuation(trimToSentence(suffix, 42))
    }
  }

  if (/^这句话/.test(cleaned)) {
    return ensureTrailingPunctuation(trimToSentence(fallback, 42))
  }

  return ensureTrailingPunctuation(trimToSentence(cleaned, 42))
}

const sanitizeDailyGreeting = (value, sourceText) => {
  const cleaned = stripOuterQuotes(value)
    .replace(/欢迎回来[，、]*/g, '')
    .replace(/这句话/g, '这一句')
    .replace(/。/g, '')
    .trim()

  const candidate = trimHard(cleaned, 12)
  const charCount = countChineseChars(candidate)
  if (charCount >= 8 && charCount <= 12) {
    return ensureTrailingPunctuation(candidate)
  }

  const fallback = GREETING_TEMPLATES[createSeededIndex(sourceText, GREETING_TEMPLATES.length)]
  return ensureTrailingPunctuation(trimHard(fallback.replace(/。/g, ''), 12))
}

const sanitizeDailyBoundary = (value, fallback) => {
  const cleaned = stripOuterQuotes(value)
  return ensureTrailingPunctuation(trimToSentence(cleaned || fallback, 120))
}

const sanitizeDailyTakeaway = (value, fallback) => {
  const cleaned = removeLeadIn(value)
  const candidate = cleaned || fallback
  return ensureTrailingPunctuation(trimToSentence(candidate, 70))
}

export function createLocalAnalysis(input) {
  const normalized = normalizeInput(input)
  const topicProfile = detectTopicProfile(normalized)

  return {
    thesis: buildThesis(normalized, topicProfile),
    appeal: buildAppeal(normalized, topicProfile),
    boundary: buildBoundary(normalized, topicProfile),
    takeaway: buildTakeaway(topicProfile)
  }
}

export function createLocalBlogSeed(payload = {}) {
  const sourceText = normalizeInput([
    payload.title,
    payload.excerpt,
    payload.tags,
    payload.text,
    payload.content
  ]
    .flat()
    .filter(Boolean)
    .join(' '))

  const topicProfile = detectTopicProfile(sourceText)

  return {
    thesis: topicProfile?.position
      ? `这篇东西最值得成立的核心命题可以收束为：${topicProfile.position}`
      : '先把这篇文章压成一句可检验的判断，再围绕前提、边界和现实落点展开。',
    angles: buildAngles(topicProfile),
    title_suggestion: buildTitleSuggestion(payload.title, topicProfile),
    outline_or_closing: buildOutline(topicProfile)
  }
}

export function createLocalDailyCapsule(seed = {}) {
  const normalizedSeed = normalizeDailyCapsuleSeed(seed)
  const sourceText = normalizeInput(normalizedSeed.source_text || '')
  const analysis = createLocalAnalysis(sourceText)
  const topicProfile = detectTopicProfile(sourceText)
  const thesis = convertAnalysisToHeroTitle(
    topicProfile?.position || analysis.thesis,
    sourceText
  )
  const greeting = sanitizeDailyGreeting(buildGreeting(sourceText, topicProfile), sourceText)
  const boundary = sanitizeDailyBoundary(analysis.boundary, '先把前提、对象和代价写清楚，否则它很容易被误用。')
  const takeaway = sanitizeDailyTakeaway(
    analysis.takeaway,
    '先确认这句话适用于谁、依赖什么条件，再决定是否接受它。'
  )

  return {
    source_text: sourceText,
    source_label: normalizedSeed.source_label || 'manual',
    source_url: normalizedSeed.source_url || null,
    greeting,
    thesis,
    boundary,
    takeaway
  }
}
