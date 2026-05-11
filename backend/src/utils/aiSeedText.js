const normalizeWhitespace = (value) => (
  String(value || '')
    .replace(/\r/g, '')
    .replace(/\s+/g, ' ')
    .trim()
)

const stripMarkdownLinks = (value) => (
  String(value || '').replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/gi, '$1')
)

export function normalizeSeedSourceText(value) {
  return normalizeWhitespace(stripMarkdownLinks(value))
}

export function splitSeedSourceText(value) {
  const normalized = normalizeSeedSourceText(value)

  if (!normalized) {
    return {
      raw_text: '',
      display_text: '',
      gloss_text: null
    }
  }

  const parts = normalized
    .split(/\s+\/\/\s+/)
    .map(part => normalizeWhitespace(part))
    .filter(Boolean)

  if (parts.length <= 1) {
    return {
      raw_text: normalized,
      display_text: normalized,
      gloss_text: null
    }
  }

  return {
    raw_text: normalized,
    display_text: parts[0],
    gloss_text: normalizeWhitespace(parts.slice(1).join(' / ')) || null
  }
}

export function normalizeDailyCapsuleSeed(seed = {}) {
  const parsed = splitSeedSourceText(seed.source_text || '')

  return {
    ...seed,
    source_text: parsed.display_text,
    source_text_raw: parsed.raw_text,
    source_gloss: parsed.gloss_text
  }
}

export function isDailyCapsuleSeedEligible(seed = {}, options = {}) {
  const { maxSourceLength = 160 } = options
  const normalizedSeed = normalizeDailyCapsuleSeed(seed)

  if (!normalizedSeed.source_text) {
    return false
  }

  if (normalizedSeed.source_text.length > maxSourceLength) {
    return false
  }

  if (/\bhttps?:\/\//i.test(normalizedSeed.source_text)) {
    return false
  }

  return true
}

export function isLocalFallbackFriendlySeed(seed = {}) {
  return /^zh(?:-|$)/i.test(String(seed.language || '').trim())
}
