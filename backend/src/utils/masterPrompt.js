import { existsSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PROMPT_PATH = join(__dirname, 'master_prompt.json')

let cachedPrompt = null

const FALLBACK_PROMPT = {
  generation_profile: {
    core_identity: {
      summary: '冷静、克制、强调概念准确性、前提条件、适用边界和现实落点。'
    },
    style_rules: {
      must_do: [
        '直接进入主题',
        '先还原命题，再讨论前提和边界',
        '避免空泛抒情',
        '结论要能落回现实'
      ]
    },
    analysis_framework: {
      core_judgement_dimensions: [
        '句子真正主张什么',
        '哪些前提让它成立',
        '在哪些场景有效',
        '在哪些场景容易误用',
        '现实上的理解价值是什么'
      ]
    },
    topic_positions: []
  }
}

export function getMasterPrompt() {
  if (cachedPrompt) {
    return cachedPrompt
  }

  if (!existsSync(PROMPT_PATH)) {
    cachedPrompt = FALLBACK_PROMPT
    return cachedPrompt
  }

  try {
    cachedPrompt = JSON.parse(readFileSync(PROMPT_PATH, 'utf8'))
  } catch (error) {
    console.warn('Failed to parse master_prompt.json, using fallback prompt:', error.message)
    cachedPrompt = FALLBACK_PROMPT
  }

  return cachedPrompt
}

export function buildMasterPromptSummary() {
  const prompt = getMasterPrompt()
  const profile = prompt?.generation_profile || {}
  const identitySummary = profile.core_identity?.summary || FALLBACK_PROMPT.generation_profile.core_identity.summary
  const mustDo = Array.isArray(profile.style_rules?.must_do)
    ? profile.style_rules.must_do.slice(0, 6)
    : FALLBACK_PROMPT.generation_profile.style_rules.must_do
  const dimensions = Array.isArray(profile.analysis_framework?.core_judgement_dimensions)
    ? profile.analysis_framework.core_judgement_dimensions.slice(0, 6)
    : FALLBACK_PROMPT.generation_profile.analysis_framework.core_judgement_dimensions

  return [
    `人格摘要：${identitySummary}`,
    `必须遵守：${mustDo.join('；')}`,
    `判断维度：${dimensions.join('；')}`,
    '避免寒暄、鸡汤、成功学和空洞抒情。',
    '输出应该克制、具体、结构清晰，并优先给出可落地的理解。'
  ].join('\n')
}
